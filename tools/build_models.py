"""Baroha Dark Fantasy: original procedural GLB assets (Y-up, +Z forward).
Generate all assets with `python tools/build_models.py` from any cwd.
Requirements: trimesh>=4, numpy. Materials: glTF 2.0 PBR metallic-roughness.
Geometry is original procedurally generated game-art, not a scanned realistic character.
"""
import math, random
from pathlib import Path
from PIL import Image
import numpy as np
import trimesh as tm
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

OUT=Path(__file__).resolve().parents[1]/'game-art'/'dark-fantasy'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(42)
# (RGB hex, roughness, metallic, RGB emissive)
MATS={
 'iron':('#272e37',.34,.91,None), 'steel':('#637080',.27,.93,None), 'blackiron':('#111822',.37,.90,None),
 'silver':('#adb1bd',.29,.83,None),'pewter':('#657078',.67,.58,None),
 'gold':('#ac8750',.34,.78,None),'brightgold':('#e5b96b',.24,.85,None),
 'bronze':('#735645',.48,.79,None), 'rust':('#704337',.82,.30,None),
 'leather':('#2d2220',.94,.02,None), 'brown':('#534033',.94,.01,None),
 'darkcloth':('#17121e',1,.0,None), 'wine':('#3c1727',.96,.02,None),
 'purple':('#382342',.95,.01,None),'violet':('#5b386e',.82,.03,None),
 'flesh':('#735c65',.94,.0,None), 'bone':('#c5baa6',.9,.0,None),
 'stone':('#3c4246',.95,.0,None),'stone2':('#55585b',.9,.0,None),
 'moss':('#34463d',1,.0,None),'wood':('#322a25',.97,.0,None),
 'bark':('#211e21',1,.0,None),'foliage':('#222e2b',1,.0,None),
 'dragon':('#57473a',.64,.56,None),'dragonplate':('#ad8a54',.36,.79,None),
 'membrane':('#44313b',.94,.0,None),
 'wolf':('#252b31',.98,.0,None),'fur':('#50515a',.97,.0,None),
 'imp':('#473445',.96,.0,None),
 'glowviolet':('#bd59ff',.45,.05,'#7f2bb0'),
 'glowcyan':('#5feadf',.35,.02,'#187c77'),
 'glowred':('#ff6c55',.36,.03,'#971d19'),
 'glowgold':('#f5cf72',.4,.25,'#846221'),
 'eye':('#edcdb3',.8,.0,None),
}
def rgb(h):
 s=h.strip('#');return [int(s[i:i+2],16)/255 for i in (0,2,4)]

# Seamless procedural surface micro-variation. Grunge for aged steel, leather grain,
# masonry pitting, bark striations and woven cloth. Colors remain PBR-tinted.
TEXTURE_CACHE = {}
def surface_texture(mat):
 if mat in TEXTURE_CACHE: return TEXTURE_CACHE[mat]
 n=128
 seed=sum((i+1)*ord(x) for i,x in enumerate(mat))
 g=np.random.default_rng(seed)
 noise=g.normal(0,1,(n,n))
 blur=(noise+np.roll(noise,1,axis=0)+np.roll(noise,-1,axis=0)+np.roll(noise,1,axis=1)+np.roll(noise,-1,axis=1))/5
 y,x=np.mgrid[:n,:n]
 grain=np.sin((x if mat in ['wood','bark','leather','fur'] else y)*.40 + blur*2)
 weave=np.cos(x*.80)*np.cos(y*.80) if mat in ['darkcloth','purple','wine'] else 0
 val=212+blur*17+grain*10+weave*5
 if mat in ['iron','steel','blackiron','silver','bronze','gold','brightgold','rust','dragonplate']:
  scratches=((x+y*0.06+g.random((n,n))*.7)%37 < .52)*(-46)
  val+=scratches
 if mat in ['stone','stone2','bark','moss']:
  val+=(g.random((n,n))<.04)*(-49)
 if mat in ['glowviolet','glowcyan','glowred','glowgold']:
  val=232+blur*8
 a=np.uint8(np.clip(val,100,255))
 img=Image.fromarray(np.stack([a,a,a],axis=2),'RGB')
 TEXTURE_CACHE[mat]=img
 return img

def poly(pts, faces=None, both=False):
 pts=np.asarray(pts,float)
 if faces is None: faces=[[0,k,k+1] for k in range(1,len(pts)-1)]
 if both: faces+= [list(reversed(f)) for f in faces]
 return tm.Trimesh(vertices=pts,faces=faces,process=False)

def loft(rings, N=14):
 """Rings: (y, xRadius, zRadius, xCenter, zCenter), capped elliptical loft."""
 v=[]
 for y,rx,rz,cx,cz in rings:
  for k in range(N):
   a=2*math.pi*k/N;v.append([cx+rx*math.cos(a), y, cz+rz*math.sin(a)])
 f=[]
 for i in range(len(rings)-1):
  for k in range(N):
   a=i*N+k;b=i*N+(k+1)%N;c=(i+1)*N+(k+1)%N;d=(i+1)*N+k
   f.extend([[a,b,c],[a,c,d]])
 v.extend([[rings[0][3],rings[0][0],rings[0][4]],[rings[-1][3],rings[-1][0],rings[-1][4]]]);lo=len(v)-2
 for k in range(N): f.append([lo,(k+1)%N,k]);f.append([lo+1,(len(rings)-1)*N+k,(len(rings)-1)*N+(k+1)%N])
 return poly(v,f)

def rodmesh(a,b,r,segments=9,r2=None):
 a=np.asarray(a,float);b=np.asarray(b,float);v=b-a
 h=np.linalg.norm(v)
 if h<1e-4:return tm.creation.icosphere(subdivisions=1,radius=r)
 if r2 is None:
  m=tm.creation.cylinder(radius=r,height=h,sections=segments)
 else:
  m=tm.creation.cone(radius=max(r,r2),height=h,sections=segments)
  # Truly tapered cone uses its broad end only; small taper defined by custom rings below
  v1,v2=tm.geometry.align_vectors([0,0,1],v), None
  if r2>0:
   pts=[]
   for z,rad in [(0,r),(h,r2)]:
    for i in range(segments):
     th=2*math.pi*i/segments;pts.append([math.cos(th)*rad,math.sin(th)*rad,z])
   faces=[]
   for i in range(segments):
    j=(i+1)%segments; faces.extend([[i,j,segments+j],[i,segments+j,segments+i]])
   faces.extend([[0,j,i] for i,j in []])
   m=poly(pts,faces)
   m.apply_transform(v1);m.apply_translation(a);return m
 m.apply_transform(tm.geometry.align_vectors([0,0,1],v));m.apply_translation((a+b)/2 if r2 is None else a)
 return m

class Art:
 def __init__(self,name):self.name=name;self.groups={};self.parts=0
 def add(self,mesh,mat):
  if mesh is None:return
  self.groups.setdefault(mat,[]).append(mesh);self.parts+=1
 def box(self,m,p,e):
  a=tm.creation.box(extents=e);a.apply_translation(p);self.add(a,m)
 def sphere(self,m,p,s,detail=1):
  a=tm.creation.icosphere(subdivisions=detail,radius=1.0);a.apply_scale(s);a.apply_translation(p);self.add(a,m)
 def cone(self,m,base,tip,r,sections=9):
  a=np.asarray(base,float);b=np.asarray(tip,float);v=b-a
  if np.linalg.norm(v)<1e-5:return
  mesh=tm.creation.cone(radius=r,height=np.linalg.norm(v),sections=sections)
  mesh.apply_transform(tm.geometry.align_vectors([0,0,1],v));mesh.apply_translation(a);self.add(mesh,m)
 def rod(self,m,a,b,r=.06,sections=9):self.add(rodmesh(a,b,r,sections),m)
 def taper(self,m,a,b,r,r2=.01,sections=10):self.add(rodmesh(a,b,r,sections,r2),m)
 def plate(self,m,pts,both=True):self.add(poly(pts,both=both),m)
 def body(self,m,rings,N=14):self.add(loft(rings,N),m)
 def ring(self,m,center,r=.6,tube=.04,plane='xy',segments=28):
  pts=[]
  for i in range(segments):
   a=2*math.pi*i/segments
   if plane=='xy':p=(center[0]+r*math.cos(a),center[1]+r*math.sin(a),center[2])
   elif plane=='xz':p=(center[0]+r*math.cos(a),center[1],center[2]+r*math.sin(a))
   else:p=(center[0],center[1]+r*math.sin(a),center[2]+r*math.cos(a))
   pts.append(p)
  for i in range(segments): self.rod(m,pts[i],pts[(i+1)%segments],tube,6)
 def chain(self,m,points,r=.025):
  for p,q in zip(points[:-1],points[1:]):self.rod(m,p,q,r,7)
 def studs(self,m,positions,r=.045):
  for p in positions:self.sphere(m,p,(r,r,r),0)
 def save(self):
  sc=tm.Scene()
  # One glTF mesh per material to keep GPU draw calls manageable.
  for mat,meshes in self.groups.items():
   combined=tm.util.concatenate(meshes)
   he,rough,metal,emissive=MATS[mat];
   material=PBRMaterial(name=mat,baseColorFactor=rgb(he)+[1.0],metallicFactor=metal,roughnessFactor=rough,
                        emissiveFactor=rgb(emissive) if emissive else [0,0,0],
                        baseColorTexture=surface_texture(mat),doubleSided=True)
   # Lightweight planar projections keep the hand-authored surface pattern small and tileable.
   uv=np.mod(combined.vertices[:,[0,1]]*.63 + combined.vertices[:,[2,2]]*.13, 1.0)
   combined.visual=TextureVisuals(uv=uv,material=material)
   sc.add_geometry(combined,geom_name=mat,node_name=mat)
  out=OUT/(self.name+'.glb');sc.export(out,file_type='glb')
  verify=tm.load(out,force='scene')
  if len(verify.geometry)!=len(self.groups):raise ValueError('export geometry mismatch: '+self.name)
  assert out.stat().st_size>200
  print(f'{self.name:24s} | {out.stat().st_size:7,d} bytes | {sum(len(m.faces) for ms in self.groups.values() for m in ms):6,d} tris | {self.parts:3d} pieces | {len(self.groups):2d} mats')
  return out

def armor_torso():
 a=Art('hero_torso');a.body('blackiron',[(-.53,.28,.20,0,0),(-.37,.40,.28,0,0),(.13,.39,.26,0,0),(.49,.47,.31,0,0),(.56,.28,.22,0,0)])
 a.body('leather',[(-.59,.40,.27,0,0),(-.48,.42,.30,0,0),(-.34,.39,.28,0,0)])
 # overlapping embossed cuirass plates
 for s in (-1,1):
  a.plate('steel',[(0,.39,.335),(s*.35,.42,.18),(s*.40,.02,.25),(s*.16,-.15,.38)])
  a.plate('iron',[(s*.15,-.09,.37),(s*.39,.01,.27),(s*.33,-.33,.26),(0,-.35,.34)])
  a.cone('gold',(s*.38,.47,.13),(s*.55,.49,.04),.13)
  for y in (-.33,-.19,0,.21):a.studs('bronze',[(s*.34,y,.30)])
  a.rod('gold',(s*.12,.38,.35),(s*.30,-.34,.32),.025)
 a.sphere('glowviolet',(0,.05,.39),(.12,.17,.046),1)
 a.ring('gold',(0,.05,.39),.15,.018)
 a.box('bronze',(0,-.43,.31),(.27,.17,.12))
 for s in (-1,1):
  a.plate('darkcloth',[(s*.3,-.52,-.13),(s*.58,-1.05,-.1),(s*.42,-1.09,.19),(s*.25,-.53,.19)])
 a.save()

def helmet():
 a=Art('hero_helmet');a.sphere('iron',(0,.02,0),(.34,.35,.35),2)
 a.plate('blackiron',[(-.28,.09,.2),(.28,.09,.2),(.32,-.20,.19),(0,-.31,.35),(-.32,-.20,.19)])
 for s in (-1,1):
  a.plate('steel',[(s*.06,.18,.34),(s*.3,.19,.20),(s*.27,-.12,.30),(s*.08,-.12,.38)])
  a.plate('blackiron',[(s*.04,.06,.394),(s*.22,.06,.34),(s*.18,.0,.39),(s*.06,.00,.42)])
  a.cone('gold',(s*.21,.20,-.13),(s*.48,.54,-.18),.11,9)
  a.sphere('glowcyan',(s*.13,.055,.412),(.055,.027,.026),1)
 a.rod('bronze',(0,-.30,.36),(0,.42,.31),.035)
 a.cone('brightgold',(0,.32,-.02),(0,.69,-.06),.12)
 a.save()

def arm():
 a=Art('hero_arm');a.body('leather',[(-.99,.12,.13,0,0),(-.65,.13,.14,0,0),(-.25,.16,.16,0,0),(.03,.20,.20,0,0)],12)
 a.sphere('steel',(0,-.13,0),(.29,.26,.31),1)
 for s in (-1,1):a.cone('iron',(s*.16,-.10,-.06),(s*.39,-.43,-.10),.12)
 a.body('iron',[(-.71,.15,.16,0,0),(-.60,.18,.17,0,0),(-.24,.18,.19,0,0)],12)
 for y in (-.52,-.37):a.ring('bronze',(0,y,0),.18,.020,plane='xz')
 a.sphere('leather',(0,-.90,.04),(.155,.14,.17),1)
 for s in (-1,1):a.cone('gold',(s*.07,-.85,.14),(s*.08,-1.03,.19),.07)
 a.save()

def leg():
 a=Art('hero_leg');a.body('leather',[(-.96,.14,.18,0,0),(-.70,.17,.19,0,0),(-.31,.17,.19,0,0),(0,.19,.20,0,0)],14)
 a.sphere('iron',(0,-.27,.03),(.19,.15,.20),1)
 a.body('steel',[(-.83,.18,.22,0,.05),(-.68,.21,.25,0,.05),(-.46,.18,.20,0,.04)],12)
 a.plate('blackiron',[(-.2,-.81,.17),(.2,-.81,.17),(.21,-.54,.24),(0,-.43,.28),(-.21,-.54,.24)])
 a.sphere('blackiron',(0,-.90,.17),(.24,.14,.34),1)
 a.box('bronze',(0,-.79,.35),(.30,.04,.07))
 a.save()

def cape():
 a=Art('hero_cape')
 # Origin at the center of existing cape plane (torso local y=-.05). Extends backward (-Z)
 for s in (-1,1):
  pts=[(0,.45,0),(s*.36,.45,0),(s*.53,-.47,-.18),(s*.23,-.59,-.25),(0,-.38,-.28)]
  a.plate('darkcloth',pts)
  a.chain('bronze',[(s*.31,.41,.02),(s*.43,.11,-.03),(s*.47,-.30,-.15)],.012)
  a.plate('wine',[(s*.25,.31,-.04),(s*.43,.20,-.09),(s*.42,-.31,-.16),(s*.21,-.42,-.25)])
 a.sphere('gold',(0,.42,.04),(.10,.08,.035),1)
 a.save()

def sword():
 a=Art('hero_runeblade')
 # local origin is sword hand pivot; +Y blade, -Y grip
 a.rod('leather',(0,-.36,0),(0,.11,0),.075,12)
 for y in np.linspace(-.3,.0,8):a.ring('bronze',(0,y,0),.078,.013,plane='xz')
 a.sphere('glowviolet',(0,-.41,0),(.13,.13,.11),1)
 a.rod('gold',(-.40,.12,0),(.40,.12,0),.095,12)
 for s in (-1,1):a.cone('gold',(s*.36,.12,0),(s*.52,.32,0),.10)
 a.plate('steel',[(-.14,.20,.04),(.14,.20,.04),(.13,1.03,.025),(0,1.33,.0),(-.13,1.03,.025)])
 a.plate('silver',[(-.13,.20,-.04),(.13,.20,-.04),(.13,1.03,-.025),(0,1.33,0),(-.13,1.03,-.025)])
 a.rod('blackiron',(0,.25,.062),(0,1.04,.048),.019)
 for j in range(5):
  y=.42+j*.14
  a.plate('glowviolet',[(-.055,y,.067),(0,y+.055,.067),(.055,y,.067),(0,y-.055,.067)])
 a.save()

def imp():
 a=Art('forest_imp')
 a.sphere('imp',(0,.96,0),(.42,.48,.34),2);a.sphere('flesh',(0,1.62,.04),(.49,.43,.40),2)
 a.sphere('leather',(0,1.66,.365),(.36,.22,.13),1)
 for s in (-1,1):
  a.sphere('glowviolet',(s*.20,1.69,.466),(.09,.07,.03),1)
  a.cone('bone',(s*.25,1.95,-.04),(s*.55,2.50,-.18),.17)
  a.sphere('imp',(s*.51,1.03,.06),(.19,.34,.20),1)
  for j in (-1,0,1):a.cone('bone',(s*(.52+j*.10),.75,.18),(s*(.53+j*.12),.53,.40),.052)
  a.sphere('imp',(s*.23,.46,.04),(.20,.37,.21),1)
  a.sphere('blackiron',(s*.23,.15,.23),(.21,.14,.29),1)
  a.plate('membrane',[(s*.25,1.44,-.26),(s*1.24,2.10,-.35),(s*1.12,.70,-.46),(s*.68,1.05,-.42)])
  a.chain('bone',[(s*.25,1.44,-.26),(s*1.24,2.10,-.35),(s*1.12,.70,-.46)],.028)
 a.sphere('glowviolet',(0,1.08,.36),(.14,.17,.06),1)
 a.save()

def wolf():
 a=Art('shadow_wolf');a.sphere('wolf',(0,1.00,0),(.50,.48,1.04),2)
 a.sphere('fur',(0,1.27,.68),(.49,.49,.57),2)
 a.sphere('wolf',(0,1.47,1.11),(.37,.32,.42),2)
 a.sphere('blackiron',(0,1.22,1.48),(.27,.19,.46),1)
 a.sphere('leather',(0,1.27,1.90),(.16,.09,.11),1)
 for s in (-1,1):
  a.cone('wolf',(s*.24,1.67,1.08),(s*.43,2.15,1.05),.18)
  a.sphere('glowred',(s*.23,1.50,1.38),(.055,.044,.023),1)
  for z in (-.59,.66):
   a.taper('fur',(s*.37,.86,z),(s*.43,.18,z+.16),.20,.10)
   a.sphere('blackiron',(s*.43,.16,z+.27),(.23,.14,.28),1)
  for z in (-.55,-.08,.39):a.cone('fur',(s*.30,1.41,z),(s*.45,1.84,z-.15),.17)
 a.cone('fur',(0,1.20,-.78),(0,1.82,-1.89),.28)
 for z in (-.6,-.2,.2,.6):a.cone('blackiron',(0,1.40,z),(0,1.73,z-.13),.16)
 a.save()

def skeleton(mtype):
 a=Art(mtype);scholar=(mtype=='skeleton_scholar'); knight=(mtype=='undead_knight'); summon=(mtype=='summoned_skeleton')
 if scholar:
  a.body('purple',[(.06,.55,.39,0,0),(.33,.46,.29,0,0),(1.56,.36,.29,0,0)],12)
 elif knight:
  a.body('iron',[(.08,.34,.23,0,0),(.32,.40,.31,0,0),(1.55,.43,.27,0,0)],12)
 else:a.body('bone',[(.48,.18,.16,0,0),(.71,.28,.20,0,0),(1.44,.27,.20,0,0)],12)
 a.sphere('bone',(0,1.82,.04),(.30,.32,.29),2)
 a.box('blackiron',(0,1.81,.32),(.39,.17,.06))
 for s in (-1,1):
  a.sphere('glowred' if not scholar else 'glowcyan',(s*.125,1.83,.355),(.060,.055,.024),1)
  a.rod('bone',(s*.43,1.35,0),(s*.57,.64,.06),.13)
  a.rod('bone',(s*.18,.52,0),(s*.20,.10,.04),.16)
  if knight:
   a.sphere('steel',(s*.43,1.31,0),(.29,.22,.29),1)
   a.plate('gold',[(s*.08,1.45,.31),(s*.38,1.42,.25),(s*.34,.73,.29),(0,.72,.33)])
  elif scholar:
   a.plate('darkcloth',[(s*.18,1.30,-.25),(s*.67,1.1,-.23),(s*.64,.14,-.35),(s*.22,.10,-.33)])
 if knight or summon:
  a.rod('iron',(.59,.36,.15),(.59,1.81,.15),.07)
  a.plate('steel',[(.43,1.08,.13),(.74,1.08,.13),(.70,1.98,.13),(.58,2.16,.13),(.48,1.98,.13)])
 if scholar:
  a.box('leather',(-.63,.80,.30),(.54,.65,.14))
  a.plate('gold',[(-.68,.92,.38),(-.56,1.11,.38),(-.44,.92,.38),(-.56,.74,.38)])
  a.cone('gold',(0,2.10,0),(0,2.53,-.12),.14)
 if knight:
  a.cone('iron',(0,2.03,0),(0,2.49,-.05),.19)
  a.box('blackiron',(-.65,1.09,.24),(.17,.85,.60))
 a.save()

def phantom(mage=False):
 a=Art('phantom_mage' if mage else 'dimensional_phantom')
 a.body('darkcloth' if mage else 'purple',[(.13,.03,.10,0,0),(.32,.52,.37,0,0),(1.60,.42,.31,0,0)],14)
 a.sphere('purple' if mage else 'violet',(0,1.54,0),(.49,.44,.35),1)
 a.sphere('darkcloth',(0,2.01,.03),(.42,.43,.36),2)
 a.sphere('blackiron',(0,2.02,.34),(.31,.29,.08),1)
 if mage:a.sphere('bone',(0,2.05,.41),(.18,.23,.07),1)
 for s in (-1,1):
  a.sphere('glowcyan' if not mage else 'glowred',(s*.13,2.08,.415),(.065,.047,.03),1)
  a.cone('wine' if mage else 'purple',(s*.38,1.52,0),(s*.94,.58,.09),.24)
  a.plate('darkcloth',[(s*.30,1.4,-.22),(s*.72,1.22,-.19),(s*.89,.30,-.32),(s*.42,.38,-.35)])
  a.cone('bone',(s*.83,.69,.16),(s*1.08,.43,.28),.085)
 if mage:
  a.rod('wood',(.96,.13,.12),(1.04,2.80,.16),.08)
  a.sphere('glowred',(1.04,2.94,.16),(.27,.27,.23),1)
  for s in (-1,1):a.cone('gold',(1.04+s*.15,2.91,.12),(1.04+s*.43,3.17,.10),.10)
 else:
  a.sphere('glowviolet',(0,1.21,.38),(.14,.14,.05),1)
  for k in range(6):
   th=k*math.pi/3;a.sphere('glowcyan',(.73*math.cos(th),1.35+.35*math.sin(th),.18),(.07,.14,.08),0)
 a.save()

def witch():
 a=Art('dark_witch')
 a.body('darkcloth',[(-.45,1.15,.92,0,0),(-.23,1.26,.91,0,0),(.70,.72,.50,0,0),(1.66,.54,.42,0,0),(1.91,.39,.30,0,0)],18)
 for s in (-1,1):
  a.plate('wine',[(s*.35,1.46,.31),(s*.58,.82,.42),(s*.98,-.36,.45),(s*.35,-.37,.55)])
  a.rod('gold',(s*.52,1.44,.31),(s*.86,-.34,.48),.023)
  a.sphere('iron',(s*.62,1.65,.05),(.33,.23,.34),1)
  a.rod('darkcloth',(s*.62,1.48,.06),(s*.83,.47,.17),.24)
  a.sphere('bone',(s*.85,.43,.20),(.14,.17,.17),1)
 a.sphere('flesh',(0,2.31,.04),(.31,.40,.31),2)
 a.sphere('darkcloth',(0,2.61,-.05),(.45,.32,.41),1)
 a.body('darkcloth',[(2.50,.77,.61,0,0),(2.56,.90,.72,0,0),(2.71,.48,.40,0,-.12),(3.74,.02,.02,0,-.26)],16)
 for s in (-1,1):
  a.cone('silver',(s*.31,2.47,-.18),(s*.48,1.17,-.31),.09)
  a.sphere('glowviolet',(s*.15,2.33,.32),(.063,.044,.02),1)
 a.sphere('glowviolet',(0,1.47,.49),(.24,.23,.06),1)
 a.ring('bronze',(0,1.47,.49),.25,.023)
 a.save()

def lich():
 a=Art('lich_king');a.body('wine',[(-.40,1.05,.67,0,0),(-.22,1.12,.68,0,0),(.78,.68,.45,0,0),(1.71,.48,.33,0,0)],16)
 a.body('blackiron',[(.63,.48,.34,0,0),(1.18,.53,.35,0,0),(1.77,.48,.31,0,0)],14)
 for s in (-1,1):
  a.sphere('iron',(s*.58,1.48,0),(.32,.24,.31),1)
  a.cone('steel',(s*.67,1.54,0),(s*.98,1.99,-.16),.17)
  a.rod('bone',(s*.58,1.34,.01),(s*.78,.48,.15),.18)
  a.sphere('bone',(s*.80,.45,.16),(.15,.15,.16),1)
  a.plate('rust',[(s*.36,.76,.40),(s*.73,.63,.30),(s*.86,-.39,.42),(s*.26,-.37,.47)])
 a.sphere('bone',(0,2.14,.08),(.41,.44,.34),2)
 for s in (-1,1):
  a.sphere('glowred',(s*.17,2.18,.407),(.09,.065,.025),1)
  a.rod('bone',(s*.15,1.90,.36),(s*.15,2.01,.41),.04)
  a.cone('gold',(s*.26,2.49,-.02),(s*.35,2.93,-.03),.13)
 a.cone('bronze',(0,2.51,0),(0,3.25,-.08),.18)
 a.sphere('glowred',(0,1.06,.43),(.23,.25,.07),1)
 for k in range(7):
  a.rod('gold',(-.38,1.65-k*.12,.34),(.38,1.65-k*.12,.34),.024)
 a.save()

def dragon():
 b=Art('dragon_body')
 b.sphere('dragon',(0,.0,.1),(3.13,2.72,4.10),2)
 b.sphere('dragonplate',(0,1.65,2.60),(2.30,1.9,2.9),2)
 # armored spinal plates + ridge of jagged peaks
 for z in np.linspace(-3.2,3.55,14):
  y=1.4+.55*math.cos(z*.45)
  b.cone('dragonplate',(0,y,z),(0,y+.95+(z+3)*.045,z-.37),.55)
  for s in (-1,1):b.sphere('gold',(s*2.25,-.3,z),(.33,.13,.22),0)
 for s in (-1,1):
  b.sphere('dragonplate',(s*2.25,-1.48,2.14),(.97,1.35,.95),1)
  b.taper('dragon',(s*2.45,-1.7,2.25),(s*2.66,-4.45,3.2),.69,.39)
  for k in (-1,0,1):b.cone('bone',(s*2.66+k*.25,-4.22,3.45),(s*2.68+k*.28,-4.59,4.22),.16)
  b.sphere('iron',(s*1.85,1.95,-.4),(.77,.65,1.12),1)
 b.taper('dragon',(0,.28,-3.3),(0,.0,-7.5),1.32,.28)
 for z in np.linspace(-4,-7,7):b.cone('dragonplate',(0,.33,z),(0,1.15-(abs(z)+1)*.035,z-.3),.38)
 b.save()
 h=Art('dragon_head')
 h.sphere('dragon',(0,.25,.0),(1.48,1.34,1.65),2)
 h.sphere('dragonplate',(0,-.19,1.60),(1.21,.72,2.02),1)
 h.sphere('bone',(0,-.64,2.40),(1.04,.28,1.31),1)
 for s in (-1,1):
  h.sphere('glowgold',(s*.83,.32,1.00),(.24,.13,.05),1)
  h.cone('dragonplate',(s*1.04,.88,-.36),(s*1.86,3.17,-1.2),.48)
  h.cone('bone',(s*.75,-.39,2.36),(s*1.25,-.90,3.26),.14)
  for k in range(4):h.cone('dragonplate',(s*1.20,.75,-.9+k*.45),(s*1.50,1.47,-1.12+k*.49),.26)
 for x in (-.6,0,.6):h.cone('bronze',(x,.45,3.14),(x,.71,3.58),.12)
 h.save()
 w=Art('dragon_wing')
 # Right wing geometry (mirror X in JS for left wing). Pivot at (0,0,0); spread +X, rearward -Z
 outline=[(0,.0,0),(1.7,1.72,-.6),(3.7,3.3,-1.25),(5.6,3.95,-1.8),(7.25,3.2,-2.1),(9.2,1.8,-2.5),(8.1,-.20,-1.9),(6.55,-1.35,-1.1),(4.3,-2.6,-.56),(2.3,-1.75,-.25)]
 root=outline[0]
 for k in range(1,len(outline)-1):w.plate('membrane',[root,outline[k],outline[k+1]])
 for q in [outline[3],outline[4],outline[5],outline[7],outline[8]]:
  w.chain('dragonplate',[root,(q[0]*.42,q[1]*.6,q[2]*.5),q],.16)
  w.cone('bone',q,(q[0]+.4,q[1]+(.7 if q[1]>0 else -.5),q[2]-.1),.12)
 w.chain('gold',[outline[1],outline[2],outline[3],outline[4],outline[5]],.08)
 w.save()

def tree():
 a=Art('gothic_tree');a.body('bark',[(0,.61,.54,0,0),(.7,.52,.48,0,0),(2.5,.41,.36,.17,-.13),(4.3,.28,.22,-.2,-.32),(5.4,.21,.18,-.45,-.5),(6.1,.07,.08,-.5,-.5)],12)
 for k in range(8):
  th=2*math.pi*k/8;start=(.28*math.cos(th),2.9+.32*(k%3),.27*math.sin(th))
  end=(2.8*math.cos(th)+.25,5.3+(k%3)*.5,2.7*math.sin(th)-.2)
  a.chain('bark',[start,(end[0]*.65,4.4,end[2]*.5),end],.11)
  if k%2==0:a.sphere('foliage',end,(.9,.55,.85),1)
 for k in range(9):
  th=2*math.pi*k/9;a.cone('bark',(.18*math.cos(th),.4,.14*math.sin(th)),(1.2*math.cos(th),.03,1.23*math.sin(th)),.15)
 a.save()

def mushroom():
 a=Art('glow_mushroom');a.body('bone',[(0,.07,.06,0,0),(.18,.075,.075,0,0),(.43,.055,.055,0,0)],12)
 a.body('glowcyan',[(.42,.09,.09,0,0),(.49,.37,.35,0,0),(.60,.40,.38,0,0),(.75,.16,.16,0,0)],14)
 for k in range(12):
  th=k*math.pi/6;a.sphere('glowcyan',(.30*math.cos(th),.54,.3*math.sin(th)),(.033,.022,.032),0)
 a.save()

def gate():
 a=Art('castle_gate');
 for s in (-1,1):
  a.body('stone',[(0,.97,.91,s*4,0),(.5,1.05,1.,s*4,0),(8.4,1.08,1.08,s*4,0)],10)
  for y in np.arange(.7,8.5,1.25):
   a.ring('stone2',(s*4,y,0),.99,.05,plane='xz')
   a.studs('rust',[(s*4+(-.74 if s<0 else .74),y,.92)],.075)
  a.cone('bronze',(s*4,8.7,0),(s*4,10.4,0),.85)
 a.box('stone',(0,8.80,0),(9.6,1.18,2.0))
 for x in np.arange(-3.7,4,.95):a.box('stone2',(x,9.50,0),(.65,.70,2.08))
 a.rod('gold',(-3.1,7.8,1.07),(3.1,7.8,1.07),.055)
 a.ring('glowviolet',(0,4.30,1.12),2.4,.06,'xy')
 a.save()

def crypt():
 a=Art('crypt_gate')
 a.ring('iron',(0,4.5,0),4.45,.25,'xy');a.ring('glowcyan',(0,4.5,.03),3.96,.075,'xy')
 for k in range(12):
  th=2*math.pi*k/12
  x=4.48*math.cos(th);y=4.5+4.48*math.sin(th)
  a.sphere('stone',(x,y,0),(.37,.4,.43),1)
  a.cone('bronze',(x,y,.1),(x*1.09,4.5+(y-4.5)*1.10,.15),.21)
 a.save()

def house():
 a=Art('village_house');a.box('stone',(0,2.03,0),(6.3,4.05,5.5))
 for s in (-1,1):
  a.plate('wood',[(-3.55 if s==-1 else 0,4.0,-3.35),(0 if s==-1 else 3.55,4.0,-3.35),(0 if s==-1 else 3.55,6.2,0),(-3.55 if s==-1 else 0,6.2,0)])
 # proper roof planes
 a.plate('wood',[(-3.8,4.02,-3.15),(0,6.12,-3.15),(0,6.12,3.15),(-3.8,4.02,3.15)])
 a.plate('wood',[(3.8,4.02,-3.15),(0,6.12,-3.15),(0,6.12,3.15),(3.8,4.02,3.15)])
 a.box('blackiron',(0,1.35,2.83),(1.42,2.64,.16))
 for s in (-1,1):
  a.box('wood',(s*2.2,2.13,2.81),(1.06,1.18,.16))
  a.rod('gold',(s*2.20,1.57,2.94),(s*2.2,2.71,2.94),.038)
 for z in (-2.7,2.7):
  for x in (-3.0,3.0):a.box('wood',(x,2.05,z),(.20,4.1,.20))
 a.cone('blackiron',(0,5.98,0),(0,7.0,0),.35)
 a.save()

def brazier():
 a=Art('spectral_brazier')
 a.body('iron',[(0,.37,.35,0,0),(.30,.42,.42,0,0),(1.18,.25,.25,0,0),(1.46,.73,.73,0,0),(1.62,.57,.57,0,0)],12)
 a.ring('bronze',(0,1.5,0),.56,.045,plane='xz')
 for k in range(8):
  th=math.pi*2*k/8;xy=(.55*math.cos(th),.55*math.sin(th))
  a.cone('iron',(xy[0],1.55,xy[1]),(xy[0]*1.2,1.97,xy[1]*1.2),.12)
 for p in ((0,1.74,0),(.2,1.86,.06),(-.16,1.90,-.1)):
  a.cone('glowcyan',p,(p[0]+.06,p[1]+.62,p[2]),.24)
 a.save()

def dummy():
 a=Art('training_dummy');a.rod('wood',(0,0,0),(0,2.4,0),.16)
 a.rod('wood',(-.92,1.57,0),(.92,1.57,0),.13)
 a.sphere('leather',(0,1.43,0),(.45,.60,.29),1)
 a.sphere('wood',(0,2.28,0),(.33,.35,.31),1)
 for s in (-1,1):a.rod('brown',(s*.82,1.55,0),(s*.92,1.06,0),.08)
 for j in range(4):a.ring('bronze',(0,.96+j*.22,0),.39,.014,'xz')
 a.save()

def tower():
 a=Art('dimensional_tower')
 a.body('stone',[(0,1.5,1.5,0,0),(.35,1.7,1.7,0,0),(2.6,1.18,1.18,0,0),(8.65,.36,.36,0,0),(9.03,.12,.12,0,0)],4)
 for h in (1.2,2.8,5.2,7.6):a.ring('gold',(0,h,0),1.52*(1-h/10),.055,'xz',12)
 for s in (-1,1):a.chain('glowviolet',[(s*.18,2.2,.68),(s*.16,4.3,.56),(s*.13,6.5,.42)],.048)
 a.sphere('glowgold',(0,9.36,0),(.59,.78,.59),1)
 a.save()

def nexus():
 a=Art('azrael_nexus');a.sphere('blackiron',(0,6,0),(3.25,3.25,3.25),1)
 for plane in ('xy','xz','yz'):
  a.ring('glowred',(0,6,0),3.9,.11,plane)
  a.ring('gold',(0,6,0),2.78,.07,plane)
 for k in range(12):
  th=math.pi*2*k/12;a.cone('iron',(2.5*math.cos(th),6+2.5*math.sin(th),.3),(4.4*math.cos(th),6+4.4*math.sin(th),.6),.24)
 a.sphere('glowviolet',(0,6,3.28),(.56,.58,.35),1)
 a.save()

def npc():
 a=Art('npc_spirit');a.body('purple',[(0,.51,.41,0,0),(.23,.72,.53,0,0),(1.67,.45,.31,0,0)],14)
 a.sphere('darkcloth',(0,1.92,.01),(.39,.41,.35),1)
 a.sphere('glowgold',(0,1.95,.31),(.24,.24,.09),1)
 for s in (-1,1):
  a.rod('purple',(s*.40,1.42,.0),(s*.65,.59,.08),.18)
  a.rod('gold',(s*.32,1.51,.35),(s*.45,.88,.44),.03)
 a.sphere('glowcyan',(0,1.12,.43),(.14,.2,.09),1)
 a.save()

def collectible(name):
 a=Art(name)
 if name=='chest':
  a.box('wood',(0,.38,0),(1.09,.66,.82))
  a.box('iron',(0,.74,0),(1.16,.19,.89))
  for s in (-1,1):
   a.box('bronze',(s*.4,.44,0),(.09,.72,.86))
  a.box('gold',(0,.47,.45),(.19,.17,.06))
  a.sphere('glowgold',(0,.48,.5),(.045,.048,.035),1)
 elif name=='key':
  a.ring('brightgold',(0,.25,0),.23,.06,'xy')
  a.rod('gold',(0,.06,0),(0,-.43,0),.08)
  a.box('brightgold',(.11,-.36,0),(.20,.08,.1))
  a.box('brightgold',(.1,-.50,0),(.18,.08,.10))
 elif name=='potion':
  a.body('pewter',[(0,.15,.15,0,0),(.13,.22,.22,0,0),(.52,.22,.22,0,0),(.71,.11,.11,0,0)],12)
  a.body('glowred',[(.14,.19,.19,0,0),(.27,.21,.21,0,0),(.43,.18,.18,0,0)],12)
  a.box('wood',(0,.78,0),(.17,.15,.17))
 elif name in ('mana','xp','golden_heart'):
  glow={'mana':'glowcyan','xp':'glowgold','golden_heart':'glowred'}[name]
  a.sphere(glow,(0,0,0),(.30,.37,.26),1)
  for s in (-1,1):a.cone('gold',(s*.13,0,0),(s*.35,.05,0),.09)
 elif name=='scroll':
  a.box('bone',(0,0,0),(.57,.12,.38))
  a.rod('wood',(-.3,0,-.22),(.3,0,-.22),.09)
  a.rod('wood',(-.3,0,.22),(.3,0,.22),.09)
  for k in range(3):a.rod('glowviolet',(-.20,.075,-.12+k*.10),(.2,.075,-.12+k*.10),.014)
 a.save()

if __name__=='__main__':
 for fn in [armor_torso,helmet,arm,leg,cape,sword,imp,wolf,lambda:skeleton('skeleton_scholar'),lambda:skeleton('undead_knight'),lambda:skeleton('summoned_skeleton'),lambda:phantom(False),lambda:phantom(True),witch,lich,dragon,tree,mushroom,gate,crypt,house,brazier,dummy,tower,nexus,npc]:fn()
 for name in ['chest','key','potion','mana','xp','golden_heart','scroll']:collectible(name)
 print('TOTAL:',len(list(OUT.glob('*.glb'))),'GLB assets')

def gothic_pillar():
 a=Art('gothic_pillar');a.body('stone',[(0,.85,.80,0,0),(.65,.92,.86,0,0),(1.1,.70,.68,0,0),(6.95,.68,.66,0,0),(7.55,.92,.91,0,0),(8.10,.81,.80,0,0)],12)
 for h in (.65,1.05,7.0,7.6):a.ring('stone2',(0,h,0),.85,.07,'xz')
 for s in (-1,1):
  a.chain('bronze',[(s*.73,1.24,.48),(s*.7,3.65,.53),(s*.73,6.82,.48)],.034)
  a.cone('stone2',(s*.83,7.94,0),(s*.93,8.43,0),.15)
 a.save()

def tombstone():
 a=Art('tombstone');a.box('stone',(0,.50,0),(.84,1.05,.27));a.sphere('stone',(0,1.03,0),(.42,.37,.14),1)
 a.box('stone2',(0,.10,0),(1.03,.19,.40))
 a.rod('bronze',(0,.45,.17),(0,.96,.17),.034)
 a.rod('bronze',(-.17,.72,.17),(.17,.72,.17),.032)
 a.sphere('moss',(-.28,.18,.15),(.20,.09,.08),1)
 a.save()

def bed():
 a=Art('adventurer_bed');a.box('wood',(0,.25,0),(1.6,.38,2.8))
 a.box('leather',(0,.52,0),(1.5,.25,2.6))
 a.box('wine',(0,.66,.36),(1.51,.11,1.6))
 a.box('bone',(0,.70,-.96),(1.07,.23,.51))
 for s in (-1,1):
  for z in (-1.28,1.28):a.rod('wood',(s*.72,0,z),(s*.72,.94,z),.12)
 a.save()

if __name__=='__main__':
 for fn in [gothic_pillar,tombstone,bed]:fn()
 print('GRAND TOTAL:',len(list(OUT.glob('*.glb'))),'GLB assets')

def rift():
 a=Art('rift_seal_obelisks')
 for k in range(4):
  th=k*math.pi/2;x=2.2*math.cos(th);z=2.2*math.sin(th)
  a.body('stone',[(0,.52,.52,x,z),(.45,.57,.57,x,z),(2.91,.24,.24,x,z),(3.8,.03,.03,x,z)],5)
  a.chain('glowviolet',[(x-.22,.55,z+.52),(x-.17,1.45,z+.37),(x-.07,2.45,z+.25)],.05)
  a.cone('bronze',(x,3.12,z),(x,4.04,z),.17)
 a.ring('bronze',(0,.17,0),2.75,.12,'xz')
 a.save()

def bridge():
 a=Art('piecewise_bridge_pedestal')
 x=-3.5
 a.body('stone',[(0,.83,.70,x,0),(.23,.85,.72,x,0),(1.4,.49,.44,x,0),(1.81,.68,.59,x,0)],12)
 a.ring('gold',(x,1.78,0),.64,.065,'xz')
 for k in range(8):
  th=2*math.pi*k/8;a.cone('bronze',(x+.61*math.cos(th),1.8,.56*math.sin(th)),(x+.66*math.cos(th),2.05,.58*math.sin(th)),.09)
 a.save()

def leyline():
 a=Art('leyline_shrine')
 a.body('stone',[(0,1.9,1.9,0,0),(.26,2.04,2.04,0,0),(.86,1.62,1.62,0,0),(1.14,1.64,1.64,0,0)],16)
 a.ring('gold',(0,1.15,0),1.60,.06,'xz')
 a.ring('glowcyan',(0,1.17,0),1.12,.035,'xz')
 for th in np.linspace(0,2*math.pi,9)[:-1]:
  a.cone('bronze',(1.53*math.cos(th),1.19,1.53*math.sin(th)),(1.82*math.cos(th),1.56,1.82*math.sin(th)),.09)
 a.save()

def platform():
 a=Art('oscillating_platform')
 a.ring('gold',(0,-.09,0),2.22,.13,'xz',36)
 a.ring('iron',(0,.26,0),2.24,.06,'xz',36)
 for k in range(12):
  th=2*math.pi*k/12;x=2.17*math.cos(th);z=2.17*math.sin(th)
  a.box('steel',(x,.04,z),(.18,.38,.16))
 a.save()

def mana_well():
 a=Art('mana_well')
 a.body('stone',[(0,2.25,2.25,0,0),(.18,2.37,2.37,0,0),(.52,2.18,2.18,0,0),(.75,2.06,2.06,0,0)],18)
 a.ring('bronze',(0,.72,0),2.04,.055,'xz',36)
 for k in range(8):
  th=k*math.pi/4;a.sphere('glowcyan',(1.87*math.cos(th),.76,1.87*math.sin(th)),(.10,.07,.12),1)
 a.save()

if __name__=='__main__':
 for fn in [rift,bridge,leyline,platform,mana_well]:fn()
 print('FINAL TOTAL:',len(list(OUT.glob('*.glb'))),'GLB assets')