from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

TEXTURE_SIZE = 512


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate a flat-plane GLB model from a product image.")
    parser.add_argument("--image", required=True, help="Path to the source image")
    parser.add_argument("--width", required=True, type=float, help="Real-world width in meters")
    parser.add_argument("--height", required=True, type=float, help="Real-world height in meters")
    parser.add_argument("--depth", required=True, type=float, help="Real-world depth in meters")
    parser.add_argument("--depth-multiplier", required=True, type=float, dest="depth_multiplier", help="Unused for flat-plane generation")
    parser.add_argument("--placement", required=True, choices=("floor", "wall"), help="Placement mode")
    parser.add_argument("--output", required=True, help="Output GLB path")
    return parser


def load_runtime_modules():
    import numpy as np
    import trimesh
    from PIL import Image
    from rembg import remove
    from trimesh.visual.material import SimpleMaterial
    from trimesh.visual.texture import TextureVisuals

    return {
        "np": np,
        "trimesh": trimesh,
        "Image": Image,
        "remove": remove,
        "SimpleMaterial": SimpleMaterial,
        "TextureVisuals": TextureVisuals,
    }


def build_plane(width_m: float, secondary_m: float, placement: str, texture_image, runtime):
    np = runtime["np"]
    trimesh = runtime["trimesh"]
    TextureVisuals = runtime["TextureVisuals"]
    SimpleMaterial = runtime["SimpleMaterial"]

    if placement == "floor":
        vertices = np.array(
            [
                [-width_m / 2.0, 0.0, 0.0],
                [width_m / 2.0, 0.0, 0.0],
                [-width_m / 2.0, 0.0, secondary_m],
                [width_m / 2.0, 0.0, secondary_m],
            ],
            dtype=np.float32,
        )
        vertices[:, 2] -= (float(vertices[:, 2].min()) + float(vertices[:, 2].max())) / 2.0
    else:
        vertices = np.array(
            [
                [0.0, 0.0, 0.0],
                [width_m, 0.0, 0.0],
                [0.0, secondary_m, 0.0],
                [width_m, secondary_m, 0.0],
            ],
            dtype=np.float32,
        )
        vertices[:, 0] -= float(vertices[:, 0].min())
        vertices[:, 1] -= (float(vertices[:, 1].min()) + float(vertices[:, 1].max())) / 2.0

    if placement == "floor":
        faces = np.array([[0, 2, 1], [1, 2, 3]], dtype=np.int64)
    else:
        # Wall faces must face +Z (CCW)
        faces = np.array([[0, 1, 2], [1, 3, 2]], dtype=np.int64)

    uv = np.array([[0.0, 1.0], [1.0, 1.0], [0.0, 0.0], [1.0, 0.0]], dtype=np.float32)
    material = SimpleMaterial(image=texture_image)
    visual = TextureVisuals(uv=uv, material=material)
    return trimesh.Trimesh(vertices=vertices, faces=faces, visual=visual, process=False)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    runtime = load_runtime_modules()
    Image = runtime["Image"]
    remove = runtime["remove"]

    image_path = Path(args.image)
    output_path = Path(args.output)

    image = Image.open(image_path).convert("RGB")
    rgba_image = remove(image)
    if hasattr(rgba_image, "mode"):
        rgba_image = rgba_image.convert("RGBA")
    else:
        rgba_image = Image.open(io.BytesIO(rgba_image)).convert("RGBA")

    texture_image = rgba_image.resize((TEXTURE_SIZE, TEXTURE_SIZE), Image.Resampling.LANCZOS)
    secondary_dimension = float(args.depth) if args.placement == "floor" else float(args.height)
    mesh = build_plane(float(args.width), secondary_dimension, args.placement, texture_image, runtime)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(output_path)
    print(f"DONE:{output_path}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR:{exc}")
        sys.exit(1)

