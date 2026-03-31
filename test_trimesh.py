import trimesh
import numpy as np
from PIL import Image

mesh1 = trimesh.creation.box()
img = Image.new('RGB', (10, 10), 'red')
mesh1_visual = trimesh.visual.TextureVisuals(uv=np.zeros((len(mesh1.vertices), 2)), material=trimesh.visual.material.SimpleMaterial(image=img))
mesh1.visual = mesh1_visual

mesh2 = trimesh.creation.box()
mesh2_visual = trimesh.visual.ColorVisuals(face_colors=np.tile([255, 0, 0, 255], (len(mesh2.faces), 1)))
mesh2.visual = mesh2_visual

combined = trimesh.util.concatenate([mesh1, mesh2])
print('Combined visuals type:', type(combined.visual))
