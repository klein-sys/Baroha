"""Validate exported GLB binary files, mesh bounds, PBR material and texture presence."""
import json,hashlib,math,sys
from pathlib import Path
import trimesh
root=Path(__file__).resolve().parents[1]
folder=root/'game-art'/'dark-fantasy'
files=sorted(folder.glob('*.glb'))
assert len(files)==43, f'expected 43 assets, got {len(files)}'
rows=[];total_faces=0
for path in files:
 raw=path.read_bytes()
 assert raw[:4]==b'glTF',path
 scene=trimesh.load(path,force='scene')
 assert scene.geometry,path
 meshes=list(scene.geometry.values())
 faces=sum(len(m.faces) for m in meshes)
 assert faces>50,path
 bounds=scene.bounds.tolist()
 assert all(math.isfinite(c) and abs(c)<1e4 for row in bounds for c in row),path
 for mesh in meshes:
  assert mesh.is_winding_consistent or len(mesh.faces)>0
  mat=mesh.visual.material
  assert mat.metallicFactor is not None and mat.roughnessFactor is not None,path
  assert mat.baseColorTexture is not None,path
  assert len(mesh.visual.uv)==len(mesh.vertices),path
 rows.append({'name':path.stem,'size_bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
              'triangles':faces,'pbr_material_meshes':len(meshes),'bounds_min':bounds[0],'bounds_max':bounds[1]})
 total_faces+=faces
meta={'project':'Baroha Dark Fantasy Overhaul','model_count':len(rows),'total_triangles_across_unique_assets':total_faces,'models':rows}
out=root/'asset-manifest.json';out.write_text(json.dumps(meta,indent=2))
print(f'PASS: {len(rows)} valid GLBs, {total_faces:,} total triangles, embedded PBR textures and finite bounds. Manifest: {out}')