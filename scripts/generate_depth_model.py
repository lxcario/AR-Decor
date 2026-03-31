from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

MODEL_ID = "depth-anything/Depth-Anything-V2-Small-hf"
GRID_RESOLUTION = 256
TEXTURE_SIZE = 512
LONGEST_SIDE = 1024
GAUSSIAN_RADIUS = 2

_DEPTH_PROCESSOR = None
_DEPTH_MODEL = None
_MODEL_DEVICE = None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate a depth-displaced GLB model from a product image.")
    parser.add_argument("--image", required=True, help="Path to the source image")
    parser.add_argument("--width", required=True, type=float, help="Real-world width in meters")
    parser.add_argument("--height", required=True, type=float, help="Real-world height in meters")
    parser.add_argument("--depth", required=True, type=float, help="Real-world depth in meters")
    parser.add_argument("--depth-multiplier", required=True, type=float, dest="depth_multiplier", help="Depth displacement multiplier")
    parser.add_argument("--output", required=True, help="Output GLB path")
    return parser


def load_runtime_modules():
    import numpy as np
    import torch
    import torch.nn.functional as F
    import trimesh
    from PIL import Image, ImageFilter
    from rembg import remove
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    from trimesh.visual.material import SimpleMaterial
    from trimesh.visual.texture import TextureVisuals

    return {
        "np": np,
        "torch": torch,
        "F": F,
        "trimesh": trimesh,
        "Image": Image,
        "ImageFilter": ImageFilter,
        "remove": remove,
        "AutoImageProcessor": AutoImageProcessor,
        "AutoModelForDepthEstimation": AutoModelForDepthEstimation,
        "SimpleMaterial": SimpleMaterial,
        "TextureVisuals": TextureVisuals,
    }


def resize_longest_side(image, longest_side: int, image_module):
    width, height = image.size
    longest = max(width, height)
    if longest <= longest_side:
        return image

    scale = longest_side / float(longest)
    resized = image.resize(
        (max(1, round(width * scale)), max(1, round(height * scale))),
        image_module.Resampling.LANCZOS,
    )
    return resized


def load_depth_components(device: str, runtime):
    global _DEPTH_PROCESSOR, _DEPTH_MODEL, _MODEL_DEVICE

    if _DEPTH_PROCESSOR is not None and _DEPTH_MODEL is not None and _MODEL_DEVICE == device:
        return _DEPTH_PROCESSOR, _DEPTH_MODEL

    try:
        processor = runtime["AutoImageProcessor"].from_pretrained(MODEL_ID)
        model = runtime["AutoModelForDepthEstimation"].from_pretrained(MODEL_ID)
        model.to(device)
        model.eval()
    except OSError as exc:
        raise RuntimeError("model_download_failed") from exc
    except Exception as exc:
        message = str(exc).lower()
        if any(token in message for token in ("download", "repository", "huggingface", "offline")):
            raise RuntimeError("model_download_failed") from exc
        raise

    _DEPTH_PROCESSOR = processor
    _DEPTH_MODEL = model
    _MODEL_DEVICE = device
    return processor, model


def estimate_depth(rgb_image, runtime):
    np = runtime["np"]
    torch = runtime["torch"]
    F = runtime["F"]

    def run_inference(device: str):
        processor, model = load_depth_components(device, runtime)
        inputs = processor(images=rgb_image, return_tensors="pt")
        inputs = {key: value.to(device) for key, value in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            prediction = outputs.predicted_depth

        prediction = F.interpolate(
            prediction.unsqueeze(1),
            size=(rgb_image.height, rgb_image.width),
            mode="bicubic",
            align_corners=False,
        )
        depth_map = prediction.squeeze().detach().cpu().numpy().astype(np.float32)
        return depth_map

    preferred_device = "cuda" if torch.cuda.is_available() else "cpu"

    try:
        return run_inference(preferred_device)
    except torch.cuda.OutOfMemoryError:
        if preferred_device != "cuda":
            raise
        torch.cuda.empty_cache()
        print("WARN:fell back to CPU")
        return run_inference("cpu")


def normalize_depth(depth_map, alpha_mask, runtime):
    np = runtime["np"]
    Image = runtime["Image"]
    ImageFilter = runtime["ImageFilter"]

    depth_min = float(depth_map.min())
    depth_max = float(depth_map.max())
    denominator = depth_max - depth_min
    if denominator <= 1e-8:
        normalized = np.zeros_like(depth_map, dtype=np.float32)
    else:
        normalized = (depth_map - depth_min) / denominator

    foreground = normalized[alpha_mask > 0.05]
    background = normalized[alpha_mask <= 0.05]
    if foreground.size > 0 and background.size > 0 and float(foreground.mean()) < float(background.mean()):
        normalized = 1.0 - normalized

    normalized = normalized * alpha_mask

    depth_uint8 = (normalized.clip(0.0, 1.0) * 255).astype("uint8")
    blurred = Image.fromarray(depth_uint8, mode="L").filter(ImageFilter.GaussianBlur(radius=GAUSSIAN_RADIUS))
    return np.asarray(blurred, dtype=np.float32) / 255.0


def create_masked_rgb_image(rgb_image, alpha_mask, runtime):
    np = runtime["np"]
    Image = runtime["Image"]

    rgb_array = np.asarray(rgb_image, dtype=np.uint8)
    foreground_mask = alpha_mask >= (128.0 / 255.0)

    if np.any(foreground_mask):
        foreground_pixels = rgb_array[foreground_mask]
        mean_foreground = np.round(foreground_pixels.mean(axis=0)).astype(np.uint8)
    else:
        mean_foreground = np.array([255, 255, 255], dtype=np.uint8)

    masked_rgb = rgb_array.copy()
    masked_rgb[~foreground_mask] = mean_foreground
    return Image.fromarray(masked_rgb, mode="RGB")


def build_faces(grid_size: int, np):
    faces = []
    for row in range(grid_size - 1):
        for col in range(grid_size - 1):
            top_left = row * grid_size + col
            top_right = top_left + 1
            bottom_left = top_left + grid_size
            bottom_right = bottom_left + 1
            faces.append([top_left, top_right, bottom_left])
            faces.append([bottom_left, top_right, bottom_right])
    return np.asarray(faces, dtype=np.int64)


def build_face_mask(alpha_grid, faces, np):
    face_alpha = alpha_grid.reshape(-1)[faces].mean(axis=1)
    return face_alpha >= 0.1


def build_boundary_edges(filtered_faces):
    edge_counts = {}

    for face in filtered_faces:
        oriented_edges = (
            (int(face[0]), int(face[1])),
            (int(face[1]), int(face[2])),
            (int(face[2]), int(face[0])),
        )
        for start, end in oriented_edges:
            key = tuple(sorted((start, end)))
            if key not in edge_counts:
                edge_counts[key] = {
                    "count": 0,
                    "edge": (start, end),
                }
            edge_counts[key]["count"] += 1

    return [
        value["edge"]
        for value in edge_counts.values()
        if value["count"] == 1
    ]


def build_wall_faces(boundary_edges, back_offset: int, np):
    if not boundary_edges:
        return np.empty((0, 3), dtype=np.int64)

    faces = []
    for start, end in boundary_edges:
        back_start = start + back_offset
        back_end = end + back_offset
        faces.append([start, end, back_start])
        faces.append([end, back_end, back_start])
    return np.asarray(faces, dtype=np.int64)


def build_displaced_mesh(rgba_image, normalized_depth, width_m: float, height_m: float, depth_m: float, depth_multiplier: float, runtime):
    np = runtime["np"]
    Image = runtime["Image"]
    trimesh = runtime["trimesh"]
    TextureVisuals = runtime["TextureVisuals"]
    SimpleMaterial = runtime["SimpleMaterial"]
    ColorVisuals = trimesh.visual.ColorVisuals

    depth_strength = max(depth_m, 1e-4) * depth_multiplier

    grid_depth = Image.fromarray((normalized_depth.clip(0.0, 1.0) * 255).astype("uint8"), mode="L").resize(
        (GRID_RESOLUTION, GRID_RESOLUTION),
        Image.Resampling.BILINEAR,
    )
    depth_grid = np.asarray(grid_depth, dtype=np.float32) / 255.0

    alpha_grid_img = rgba_image.getchannel("A").resize((GRID_RESOLUTION, GRID_RESOLUTION), Image.Resampling.BILINEAR)
    alpha_grid = np.asarray(alpha_grid_img, dtype=np.float32) / 255.0
    depth_grid = depth_grid * alpha_grid

    x_values = np.linspace(-width_m / 2.0, width_m / 2.0, GRID_RESOLUTION, dtype=np.float32)
    y_values = np.linspace(0.0, height_m, GRID_RESOLUTION, dtype=np.float32)
    u_values = np.linspace(0.0, 1.0, GRID_RESOLUTION, dtype=np.float32)
    v_values = np.linspace(1.0, 0.0, GRID_RESOLUTION, dtype=np.float32)

    xx, yy = np.meshgrid(x_values, y_values)
    uu, vv = np.meshgrid(u_values, v_values)
    zz = depth_grid * depth_strength

    zz = zz - ((float(zz.min()) + float(zz.max())) / 2.0)
    yy = yy - float(yy.min())

    vertices = np.column_stack((xx.reshape(-1), yy.reshape(-1), zz.reshape(-1))).astype(np.float32)
    uv = np.column_stack((uu.reshape(-1), vv.reshape(-1))).astype(np.float32)
    faces = build_faces(GRID_RESOLUTION, np)
    face_mask = build_face_mask(alpha_grid, faces, np)
    filtered_faces = faces[face_mask]

    if len(filtered_faces) == 0:
        filtered_faces = faces

    boundary_edges = build_boundary_edges(filtered_faces)

    texture_image = rgba_image.resize((TEXTURE_SIZE, TEXTURE_SIZE), Image.Resampling.LANCZOS)
    material = SimpleMaterial(image=texture_image)
    visual = TextureVisuals(uv=uv, material=material)
    front_mesh = trimesh.Trimesh(vertices=vertices, faces=filtered_faces, visual=visual, process=False)

    back_z = float(vertices[:, 2].min()) - 0.01
    back_vertices = vertices.copy()
    back_vertices[:, 2] = back_z
    back_faces = filtered_faces[:, ::-1]
    neutral_face_colors = np.tile(np.array([[214, 209, 201, 255]], dtype=np.uint8), (len(back_faces), 1))
    back_visual = ColorVisuals(face_colors=neutral_face_colors)
    back_mesh = trimesh.Trimesh(vertices=back_vertices, faces=back_faces, visual=back_visual, process=False)

    meshes = [front_mesh, back_mesh]

    if boundary_edges:
        wall_vertices = np.vstack((vertices, back_vertices)).astype(np.float32)
        wall_faces = build_wall_faces(boundary_edges, len(vertices), np)
        wall_face_colors = np.tile(np.array([[200, 194, 184, 255]], dtype=np.uint8), (len(wall_faces), 1))
        wall_visual = ColorVisuals(face_colors=wall_face_colors)
        wall_mesh = trimesh.Trimesh(vertices=wall_vertices, faces=wall_faces, visual=wall_visual, process=False)
        meshes.append(wall_mesh)

    for mesh in meshes:
        if isinstance(mesh, trimesh.Trimesh):
            mesh.fix_normals()
            
    scene = trimesh.Scene(meshes)
    return scene


def export_mesh(mesh, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(output_path)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    runtime = load_runtime_modules()
    Image = runtime["Image"]
    remove = runtime["remove"]
    np = runtime["np"]

    image_path = Path(args.image)
    output_path = Path(args.output)

    rgb_image = Image.open(image_path).convert("RGB")
    rgb_image = resize_longest_side(rgb_image, LONGEST_SIDE, Image)

    rgba_image = remove(rgb_image)
    if not hasattr(rgba_image, "mode"):
        rgba_image = Image.open(io.BytesIO(rgba_image)).convert("RGBA")
    else:
        rgba_image = rgba_image.convert("RGBA")

    alpha_mask = np.asarray(rgba_image.getchannel("A"), dtype=np.float32) / 255.0
    masked_rgb_image = create_masked_rgb_image(rgb_image, alpha_mask, runtime)
    depth_map = estimate_depth(masked_rgb_image, runtime)
    normalized_depth = normalize_depth(depth_map, alpha_mask, runtime)

    mesh = build_displaced_mesh(
        rgba_image=rgba_image,
        normalized_depth=normalized_depth,
        width_m=float(args.width),
        height_m=float(args.height),
        depth_m=float(args.depth),
        depth_multiplier=float(args.depth_multiplier),
        runtime=runtime,
    )
    export_mesh(mesh, output_path)
    print(f"DONE:{output_path}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as exc:
        message = str(exc)
        if message == "model_download_failed":
            print("ERROR:model_download_failed")
        else:
            print(f"ERROR:{message}")
        sys.exit(1)
    except Exception as exc:
        print(f"ERROR:{exc}")
        sys.exit(1)
