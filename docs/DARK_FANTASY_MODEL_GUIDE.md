# Baroha: Dark Fantasy 3D Overhaul (43 original GLB assets)

**Target:** [`klein-sys/Baroha`](https://github.com/klein-sys/Baroha), `main` as inspected 2026-11-10.  **Engine:** Three.js r128, classic `<script>` tags, `GLTFLoader` and `SkeletonUtils`.  **Art:** original geometry with generated, embedded grunge/weave/stone textures and glTF PBR materials. This is a detailed **procedurally built dark-fantasy game-art set**, *not scanned photorealistic art and not a skeletal motion-captured character*.

## Install (no existing JS files need to be replaced)

1. Download and **unzip** the `Baroha_Dark_Fantasy_Overhaul.zip` archive. Its top-level `baroha-dark-fantasy/` folder contains `game-art/`, `js/`, `tools/`, and this guide.
2. Copy everything **inside** `baroha-dark-fantasy/game-art/dark-fantasy/` into `<your-repo>/game-art/dark-fantasy/` (create this directory). The final path for the witch, for instance, must be `<repo>/game-art/dark-fantasy/dark_witch.glb`.
3. Copy `baroha-dark-fantasy/js/dark-fantasy-overhaul.js` into `<repo>/js/dark-fantasy-overhaul.js`.
4. Edit `<repo>/index.html` near the bottom, approximately original lines **1205–1215**. Insert one new classic script tag **after `js/enemies.js` and before `js/game.js`**:

   ```html
   <script src="js/enemies.js"></script>
   <script src="js/dark-fantasy-overhaul.js"></script> <!-- ADD -->
   <script src="js/missions.js"></script>
   ```

   All other script tags and their original order stay intact. `js/realm-art.js`, `js/character.js`, `js/bosses.js`, `js/world.js`, `js/enemies.js`, plus Three.js and vendors must already be loaded. The shipped patch extends their methods; it does **not** replace gameplay classes.
5. **If you installed the earlier `model-pack.js` starter kit, remove `<script src="js/model-pack.js"></script>`** to avoid double attachments. You may leave the old `.glb` files on disk, but they are unused.
6. Optionally copy `model-gallery.html` into `<repo>/model-gallery.html` for a 3D visual browser of all 43 models.
7. Start a local development server from `<repo>` (don't double-click the HTML; `file://` cannot load GLBs):

   ```bash
   python -m http.server 8000
   ```

   Open `http://localhost:8000/` for the game or `http://localhost:8000/model-gallery.html` for the gallery.
8. Open browser developer tools (F12), **Network** tab, filter `.glb`: every requested model should return **200** (not 404). In **Console**, look for `[Dark Fantasy] Overhaul installed`. Use the game developer controls to spawn bosses and change realms.

**Revert:** remove the single `<script src="js/dark-fantasy-overhaul.js"></script>` tag and reload. The original procedural models are then used. Asset files may be left in place.

## Exact integration behavior (confirmed against Baroha source)

| Where | Hook / native mechanism | Replacement(s) | Gameplay/animation preserved |
|---|---|---|---|
| `js/character.js` | `RobloxCharacter.prototype.buildRobloxBody` | Torso, helmet, arms x2, legs x2, cape, runeblade | `leftArmPivot`, `rightArmPivot`, leg pivots, cape flutter, attack animations, camera modes |
| `js/player.js` | `PlayerController.prototype.createViewmodel` | First-person runeblade (60% scale) | Camera-relative first-person weapon attack swings |
| `js/enemies.js` | `EnemiesManager.prototype.spawnEnemy` | Imp, wolf, phantom, mage | Enemy position, combat HP, AI, movement speed, collision, optional bob motion |
| `js/enemies.js` + `js/realm-art.js` | Native `applyRealmModel('knight'/'scholar', ...)` with `realmArt` paths overridden | Undead knight, skeleton scholar | Native model cloning, standard bob, fallback on load failure |
| `js/bosses.js` | `BossesManager.prototype.spawnDarkWitch` | Dark Witch body and attire | Orbiting spellbooks, rotating magic circle |
| `js/bosses.js` | `BossesManager.prototype.spawnLich`, `spawnSkeletonWarrior` | Lich King and summoned skeleton | Animated staff and rune cards, skeleton combat |
| `js/bosses.js` | `BossesManager.prototype.spawnEternalDragon` | Separate dragon body, head, and left/right mirrored wing | Head pivot, flapping wing pivots, spinning halo |
| `js/world.js` + `js/realm-art.js` | `applyRealmModel` remapping | Twisted trees, chests, keys | Native loading and original object transformations |
| `js/world.js` | `spawnGlowingMushroom`, `spawnSpectralBrazier` | Mushroom, brazier | Point lights continue to illuminate |
| `js/world.js` | `spawnCastleGate`, `spawnCryptThrone` | Gothic gate and crypt ring | Unlockable barrier and portal surface kept visible |
| `js/world.js` | `spawnVillageHouse`, `spawnBed`, `spawnTrainingDummy`, `spawnGothicPillar`, `spawnTombstone` | Buildings and furniture | Existing interactions, rotations and registered world objects |
| `js/world.js` | `spawnNPC`, `spawnDimensionalTower`, `spawnAzraelNexus` | Spirit, tower, nexus | NPC interactions, tower activation feedback, boss entry |
| `js/world.js` | `spawnCollectible` | Mana, potion, XP, heart, scroll (chest/key native above) | Pickup type, bob/rotation, inventory updates |
| `js/world.js` | Five calculus world spawners | Rift obelisks, bridge pedestal, leyline shrine, oscillator trim, mana well | Interactive bridge state, core color updates, rotating needle, safe-peak color, mana pool retained |

### Scene scale and placement notes

- **Y is up, +Z faces forward** in these authored models. Units are matched to the *existing* procedural geometry rather than real-world meters.
- Player pieces have local origins intended for `this.torso`, `this.head`, `leftArmPivot`, `rightArmPivot`, leg pivots, `this.cape`, and `this.swordMesh`. They are rigid modular attachments, **not individually skinned bone-rig meshes**.
- The bosses' existing `BossesManager.update` method still animates their dynamic effect/pivot groups; the new body meshes are static within those groups.
- `dragon_wing.glb` is a right wing: the script uses `visual.scale.x = -1` for the left wing, retaining the original wing group rotation.
- For the Tree, Key, Chest, Knight, and Scholar the existing `applyRealmModel` automatically normalizes model height. All other assets use authored scale 1:1, except optional position adjustments in the integration layer.
- Realistic lighting benefits from a physically based renderer, shadows and a coherent terrain texture system. The shipped pack makes material-aware assets, but **does not replace the terrain shader, sound, weather, UI, combat, physics or entire world renderer**.

## Asset inventory (43 GLBs)

**Hero (6):** `hero_torso`, `hero_helmet`, `hero_arm`, `hero_leg`, `hero_cape`, `hero_runeblade`.

**Bosses (5):** `dark_witch`, `lich_king`, `dragon_body`, `dragon_head`, `dragon_wing`.

**Enemies (7):** `forest_imp`, `shadow_wolf`, `skeleton_scholar`, `undead_knight`, `summoned_skeleton`, `dimensional_phantom`, `phantom_mage`.

**World and NPCs (13):** `gothic_tree`, `glow_mushroom`, `castle_gate`, `crypt_gate`, `village_house`, `spectral_brazier`, `gothic_pillar`, `tombstone`, `adventurer_bed`, `training_dummy`, plus `dimensional_tower`, `azrael_nexus`, `npc_spirit`.

**Calculus mechanics (5):** `rift_seal_obelisks`, `piecewise_bridge_pedestal`, `leyline_shrine`, `oscillating_platform`, `mana_well`.

**Loot (7):** `chest`, `key`, `potion`, `mana`, `xp`, `golden_heart`, `scroll`.

(6 + 5 + 7 + 13 + 5 + 7 = 43.)

## Validation and known limitations

- All 43 `.glb` files export successfully through `trimesh`; the build script reloads each file and checks geometry/material counts.
- The integration script passes `node --check` and the included mocked integration smoke tests.
- Because original game runtime/browser behavior has not been executed end-to-end here, test the package in your clone, including realm switching, the Dark Witch's circle, Lich runes, the dragon's wing movement, collectibles, all calculus puzzles, and sleeping/camera modes.
- **No bone skinning or pre-authored motion clips** are embedded in these static GLBs; player movement is inherited from the existing RobloxCharacter pivots. More realistic full-body mocap will require replacing the animation system with a skinned rig and animation mixer.
- Embedded 128×128 tiled PBR base-color textures intentionally trade photorealism for small downloads and reliable use in a browser. Some props may need final scale tuning after a human visual pass within the scene.
- The current game's static browser format is preserved. There is no server-side asset processing, no imports, and no `npm install` needed just to load the pack.

## Rebuild / customize models

The geometry source is `tools/build_models.py`, with named surfaces in `MATS` and model construction methods. To regenerate, install Python dependencies with `python -m pip install trimesh numpy pillow` then run `python tools/build_models.py`. Edit the final file names in `js/dark-fantasy-overhaul.js` if you rename an asset.

A license for original generated assets can be chosen by the repository owner when publishing; no third-party game model meshes are copied into the pack.