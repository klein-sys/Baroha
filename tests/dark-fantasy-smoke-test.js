// Mocked integration test: tests class wrapping and GLB replacement/fallback logic.
// This is NOT a browser rendering test. Usage: node tests/smoke-test.js
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/dark-fantasy-overhaul.js'),'utf8');
class Object3D {
  constructor() {this.parent=null;this.children=[];this.userData={};this.visible=true;this.position={set(x,y,z){this.x=x;this.y=y;this.z=z}};this.scale={set(x,y,z){this.x=x;this.y=y;this.z=z}};}
  add(child){if(child.parent)child.parent.children=child.parent.children.filter(x=>x!==child);child.parent=this;this.children.push(child);}
  clone(){return new Object3D()}
  traverse(fn){fn(this);this.children.forEach(x=>x.traverse(fn))}
}
class Mesh extends Object3D {constructor(){super();this.isMesh=true;this.material={visible:true,clone(){return {visible:this.visible,clone:this.clone}}}}}
class Scene extends Object3D {constructor(){super();this.isScene=true}}
class GLTFLoader {loadAsync(path){return path.includes('missing_asset')?Promise.reject(Error('fake 404')):Promise.resolve({scene:new Object3D()})}}
const THREE={GLTFLoader};
const scene=new Scene();
class RobloxCharacter {
  buildRobloxBody(){
    this.torso=new Mesh();this.head=new Mesh();this.leftArmPivot=new Object3D();this.rightArmPivot=new Object3D();this.leftLegPivot=new Object3D();this.rightLegPivot=new Object3D();this.cape=new Mesh();this.swordMesh=new Object3D();
    this.leftArm=new Mesh();this.rightArm=new Mesh();this.leftLeg=new Mesh();this.rightLeg=new Mesh();
    this.torso.add(new Mesh());this.torso.add(this.cape);this.torso.add(this.head);
    for(const o of [this.leftArmPivot,this.rightArmPivot,this.leftLegPivot,this.rightLegPivot])this.torso.add(o);
    this.leftArmPivot.add(this.leftArm);this.rightArmPivot.add(this.rightArm);this.leftLegPivot.add(this.leftLeg);this.rightLegPivot.add(this.rightLeg);
    this.rightArm.add(this.swordMesh);this.swordMesh.add(new Mesh());scene.add(this.torso);
  }
}
class BossesManager {
  constructor(){this.summonedSkeletons=[];}
  spawnDarkWitch(){const mesh=new Object3D(),body=new Mesh(),magicCircle=new Mesh(),book=new Object3D();mesh.add(body);mesh.add(magicCircle);mesh.add(book);scene.add(mesh);return {mesh,magicCircle,spellbooks:[book]}}
  spawnLich(){const mesh=new Object3D(),body=new Mesh(),staff=new Object3D(),card=new Mesh();mesh.add(body);mesh.add(staff);mesh.add(card);scene.add(mesh);return {mesh,staff,runeCards:[card]}}
  spawnSkeletonWarrior(){const mesh=new Object3D();mesh.add(new Mesh());scene.add(mesh);this.summonedSkeletons.push({mesh})}
  spawnEternalDragon(){const mesh=new Object3D(),head=new Object3D(),wings=new Object3D(),halo=new Mesh();head.add(new Mesh());head.add(halo);
    for(let i=0;i<2;i++){const wing=new Object3D();wing.add(new Mesh());wings.add(wing)}
    mesh.add(new Mesh());mesh.add(head);mesh.add(wings);scene.add(mesh);return {mesh,head,wings,halo}}
}
class PlayerController {
  createViewmodel(){this.swordMesh=new Object3D();this.swordMesh.add(new Mesh());scene.add(this.swordMesh)}
}
class EnemiesManager {
  spawnEnemy(type){const mesh=new Object3D();const body=new Mesh();mesh.add(body);scene.add(mesh);return {mesh,type,body}}
}
class WorldManager {
  constructor(){this.worldObjects=[];this.collectibles=[];}
  spawnGothicPillar(){const mesh=new Mesh();scene.add(mesh);this.worldObjects.push(mesh)}
  spawnTombstone(){const mesh=new Mesh();scene.add(mesh);this.worldObjects.push(mesh)}
  spawnPiecewiseBridge(){const group=new Object3D();for(let k=0;k<3;k++)group.add(new Mesh());scene.add(group);this.worldObjects.push(group)}
  spawnRiftSeal(){const group=new Object3D();for(let k=0;k<6;k++)group.add(new Mesh());scene.add(group);this.worldObjects.push(group)}
  spawnOscillatingPlatform(){const group=new Object3D();for(let k=0;k<2;k++)group.add(new Mesh());scene.add(group);this.worldObjects.push(group)}
}
const win={THREE,game:{renderer:{shadowMap:{enabled:false}}}};
const context=vm.createContext({window:win,THREE,RobloxCharacter,PlayerController,BossesManager,EnemiesManager,WorldManager,realmArt:{pine:'old',knight:'old'},location:{protocol:'http:'},console,Promise,Map,Set});
vm.runInContext(source,context);
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
(async()=>{
  assert.equal(win.DarkFantasyAssets.BASE,'game-art/dark-fantasy/');
  assert.equal(context.realmArt.knight,'dark-fantasy/undead_knight.glb');
  const c=new RobloxCharacter();c.buildRobloxBody();await flush();
  assert.equal(c.torso.material.visible,false,'torso material is hidden but pivot children survive');
  assert.equal(c.rightArm.material.visible,false,'arm geometry hidden, sword pivot kept');
  assert.ok(c.swordMesh.userData.darkFantasyVisual,'new sword attached');
  const pc=new PlayerController();pc.createViewmodel();await flush();
  assert.equal(pc.swordMesh.userData.darkFantasyVisual.scale.x,.60,'first-person sword scaled');
  const en=new EnemiesManager();const e=en.spawnEnemy('imp');await flush();
  assert.equal(e.body.material.visible,false);assert.ok(e.mesh.userData.realmModel);
  const bossManager=new BossesManager();const witch=bossManager.spawnDarkWitch();await flush();
  assert.equal(witch.magicCircle.visible,true);assert.equal(witch.spellbooks[0].visible,true);
  const d=bossManager.spawnEternalDragon();await flush();
  assert.equal(d.halo.visible,true);assert.equal(d.wings.children[0].userData.darkFantasyVisual.scale.x,-1);
  assert.equal(d.wings.children[1].userData.darkFantasyVisual.scale.x,1);
  bossManager.spawnSkeletonWarrior();await flush();assert.ok(bossManager.summonedSkeletons[0].mesh.userData.darkFantasyVisual);
  const w=new WorldManager();w.spawnPiecewiseBridge();await flush();
  assert.equal(w.worldObjects[0].children[0].material.visible,true,'bridge status surface preserved');
  assert.equal(w.worldObjects[0].children[1].material.visible,false,'pedestal replaced');
  assert.equal(w.worldObjects[0].children[2].material.visible,true,'dial remains');
  w.spawnRiftSeal();await flush();
  assert.equal(w.worldObjects[1].children[4].material.visible,true,'interactive ring preserved');
  assert.equal(w.worldObjects[1].children[5].material.visible,true,'interactive crystal preserved');
  w.spawnOscillatingPlatform();await flush();assert.equal(w.worldObjects[2].children[0].material.visible,true);
  // A failure must not hide a procedural fallback.
  const parent=new Object3D(),old=new Mesh();parent.add(old);scene.add(parent);
  await win.DarkFantasyAssets.attach('missing_asset',parent,[old]);
  assert.equal(old.material.visible,true);
  console.log('PASS: class hooks, first-person sword, boss animations, puzzle visuals and missing-asset fallback.');
})().catch(e=>{console.error(e);process.exitCode=1});