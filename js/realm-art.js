/** Optional KayKit visuals. Gameplay keeps its procedural meshes if an asset fails to load. */
const realmArt = {
  pine: 'forest/Tree_2_A_Color1.gltf',
  bareTree: 'forest/Tree_Bare_1_A_Color1.gltf',
  chest: 'dungeon/chest_gold.gltf',
  key: 'dungeon/key.gltf',
  knight: 'skeletons/Skeleton_Warrior.glb',
  scholar: 'skeletons/Skeleton_Rogue.glb'
};

const realmModels = new Map();

function _decodeOfflineGLB(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function applyRealmModel(name, parent, fallback, height, groundOffset = 0) {
  if (!THREE.GLTFLoader) return;
  const assetPath = realmArt[name] || '';
  const offlineKey = assetPath.startsWith('dark-fantasy/') ? assetPath.slice('dark-fantasy/'.length).replace(/\.glb$/i, '') : '';
  const hasOffline = !!(typeof window !== 'undefined' && window.DARK_FANTASY_OFFLINE_GLB && offlineKey && window.DARK_FANTASY_OFFLINE_GLB[offlineKey]);
  if (location.protocol === 'file:' && !hasOffline) return;

  if (!realmModels.has(name)) {
    const loader = new THREE.GLTFLoader();
    const loadPromise = (location.protocol === 'file:' && hasOffline && typeof loader.parse === 'function')
      ? new Promise((resolve, reject) => loader.parse(_decodeOfflineGLB(window.DARK_FANTASY_OFFLINE_GLB[offlineKey]), '', resolve, reject))
      : loader.loadAsync('game-art/' + assetPath);

    realmModels.set(name, loadPromise.then(({scene}) => {
      const bounds = new THREE.Box3().setFromObject(scene);
      const center = bounds.getCenter(new THREE.Vector3());
      scene.position.set(-center.x, -bounds.min.y, -center.z);
      const model = new THREE.Group();
      model.add(scene);
      model.scale.setScalar(height / (bounds.max.y - bounds.min.y));
      model.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          if (obj.geometry) {
            obj.geometry.userData = obj.geometry.userData || {};
            obj.geometry.userData.shared = true;
          }
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => {
            if (m) {
              m.userData = m.userData || {};
              m.userData.shared = true;
            }
          });
        }
      });
      return model;
    }).catch(error => {
      console.warn('Could not load model ' + name, error);
      return null;
    }));
  }
  realmModels.get(name).then(model => {
    if (!model || !parent.parent) return;
    const visual = THREE.SkeletonUtils.clone(model);
    visual.position.y = groundOffset;
    fallback.forEach(mesh => { mesh.visible = false; });
    parent.add(visual);
    parent.userData.realmModel = visual;
  });
}
