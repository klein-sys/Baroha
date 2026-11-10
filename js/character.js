/**
 * MATHBOUND – LEGENDS OF THE THREE BOSSES
 * Playable Third-Person Roblox Character Model, Animation Rig, and Orbit Camera
 */

class RobloxCharacter {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Movement & World Position
    this.position = new THREE.Vector3(0, 1.0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0; // facing angle

    // Third-person Camera Parameters
    this.cameraDistance = 4.8;
    this.cameraPitch = 0.25; // vertical orbit angle (radians)
    this.cameraYaw = 0.0;    // horizontal orbit angle (radians)
    this.cameraTarget = new THREE.Vector3();
    this.cameraOffset = new THREE.Vector3(0, -0.2, 0);
    this._desiredCamPos = new THREE.Vector3();

    // Animation & State Machine
    this.animState = 'idle'; // 'idle', 'walking', 'running', 'sprinting', 'jumping', 'attacking', 'heavy_attack', 'hurt', 'victory', 'sleeping'
    this.animTime = 0;
    this.isAttacking = false;
    this.attackProgress = 0;
    this.attackType = 'basic'; // 'basic' or 'heavy'

    // Camera Mode: default is Roblox Third-Person, togglable to First-Person with V
    this.cameraMode = 'third_person';

    // Root Group
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    // Build the 3D Roblox Blocky Body
    this.buildRobloxBody();
    this.mesh.traverse(obj => {
      if (obj.isMesh) obj.castShadow = true;
    });

    // Key shortcut for camera toggle
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyV') {
        this.toggleCameraMode();
      }
    });
  }

  buildRobloxBody() {
    // --- 1. TORSO ---
    const torsoGeom = new THREE.BoxGeometry(0.85, 1.05, 0.45);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f2e, // Dark adventurer tunic
      roughness: 0.6,
      metalness: 0.2
    });
    this.torso = new THREE.Mesh(torsoGeom, torsoMat);
    this.torso.position.y = 1.05;
    this.mesh.add(this.torso);

    // Gold trim belt
    const beltGeom = new THREE.BoxGeometry(0.88, 0.14, 0.48);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7 });
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.y = -0.42;
    this.torso.add(belt);

    // Black Cloak / Cape
    const capeGeom = new THREE.PlaneGeometry(0.8, 1.1);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      side: THREE.DoubleSide,
      roughness: 0.9
    });
    this.cape = new THREE.Mesh(capeGeom, capeMat);
    this.cape.position.set(0, -0.05, -0.25);
    this.cape.rotation.x = 0.08;
    this.torso.add(this.cape);

    // --- 2. HEAD & HAIR ---
    const headGeom = new THREE.BoxGeometry(0.58, 0.58, 0.58);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffd1b3, // Roblox skin tone
      roughness: 0.7
    });
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.set(0, 0.84, 0);
    this.torso.add(this.head);

    // Black Anime Spiky Hair
    const hairGroup = new THREE.Group();
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.8 });

    // Top hair block
    const hairTopGeom = new THREE.BoxGeometry(0.64, 0.25, 0.64);
    const hairTop = new THREE.Mesh(hairTopGeom, hairMat);
    hairTop.position.y = 0.22;
    hairGroup.add(hairTop);

    // Spikes
    for (let i = 0; i < 5; i++) {
      const spikeGeom = new THREE.ConeGeometry(0.12, 0.28, 4);
      const spike = new THREE.Mesh(spikeGeom, hairMat);
      spike.position.set((i - 2) * 0.12, 0.38, 0.1 - Math.abs(i - 2) * 0.05);
      spike.rotation.x = -0.2;
      hairGroup.add(spike);
    }
    this.head.add(hairGroup);

    // Face features (Eyes)
    const eyeGeom = new THREE.PlaneGeometry(0.1, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a24 });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.14, 0.02, 0.3);
    this.head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.14, 0.02, 0.3);
    this.head.add(eyeR);

    // --- 3. ARMS (Left & Right with Shoulder Pivots) ---
    const armGeom = new THREE.BoxGeometry(0.38, 0.95, 0.38);
    // Offset geometry so rotation pivots from shoulder
    armGeom.translate(0, -0.42, 0);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x242436, roughness: 0.6 });

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.64, 0.45, 0);
    this.leftArm = new THREE.Mesh(armGeom, armMat);
    this.leftArmPivot.add(this.leftArm);
    this.torso.add(this.leftArmPivot);

    // Right Arm Pivot (Weapon Arm)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.64, 0.45, 0);
    this.rightArm = new THREE.Mesh(armGeom, armMat);
    this.rightArmPivot.add(this.rightArm);
    this.torso.add(this.rightArmPivot);

    // --- 4. LEGS (Left & Right with Hip Pivots) ---
    const legGeom = new THREE.BoxGeometry(0.4, 0.95, 0.42);
    legGeom.translate(0, -0.45, 0);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.7 });

    // Left Leg Pivot
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.22, -0.52, 0);
    this.leftLeg = new THREE.Mesh(legGeom, legMat);
    this.leftLegPivot.add(this.leftLeg);
    this.torso.add(this.leftLegPivot);

    // Right Leg Pivot
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.22, -0.52, 0);
    this.rightLeg = new THREE.Mesh(legGeom, legMat);
    this.rightLegPivot.add(this.rightLeg);
    this.torso.add(this.rightLegPivot);

    // --- 5. RUNEBLADE / GOLDEN DRAGON SWORD ---
    this.swordMesh = this.buildGreatsword();
    // Attach sword to right arm hand socket
    this.swordMesh.position.set(0, -0.85, 0.2);
    this.swordMesh.rotation.set(-Math.PI / 2, 0, 0);
    this.rightArm.add(this.swordMesh);
  }

  buildGreatsword() {
    const sword = new THREE.Group();

    // Blade
    const bladeGeom = new THREE.BoxGeometry(0.08, 1.25, 0.02);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffa200,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.2
    });
    const blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.position.y = 0.65;
    sword.add(blade);

    // Golden Crossguard
    const guardGeom = new THREE.BoxGeometry(0.36, 0.06, 0.08);
    const guardMat = new THREE.MeshStandardMaterial({ color: 0xb58900, metalness: 0.8 });
    const guard = new THREE.Mesh(guardGeom, guardMat);
    guard.position.y = 0.04;
    sword.add(guard);

    // Hilt Grip
    const hiltGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 });
    const hilt = new THREE.Mesh(hiltGeom, hiltMat);
    hilt.position.y = -0.1;
    sword.add(hilt);

    // Pommel Gem
    const pommelGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const pommelMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const pommel = new THREE.Mesh(pommelGeom, pommelMat);
    pommel.position.y = -0.24;
    sword.add(pommel);

    return sword;
  }

  setAnimationState(state) {
    if (this.animState === state) return;
    this.animState = state;
    this.animTime = 0;
  }

  triggerAttack(type = 'basic') {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackProgress = 0;
    this.attackType = type;
    this.animState = 'attacking';

    if (window.soundEngine) {
      window.soundEngine.playSwordSlash();
    }
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'third_person' ? 'first_person' : 'third_person';
    const btn = document.getElementById('btn-cam-toggle');
    if (btn) {
      btn.innerText = this.cameraMode === 'third_person' ? '🎥 3RD PERSON [V]' : '🎥 1ST PERSON [V]';
    }
    if (window.interfaceManager) {
      window.interfaceManager.showToast(`Camera switched to ${this.cameraMode === 'third_person' ? '3rd Person' : '1st Person'}`, 'info');
    }
    if (window.game && window.game.player) {
      if (this.cameraMode === 'first_person') {
        this.mesh.visible = false;
        if (window.game.player.viewmodelRoot) window.game.player.viewmodelRoot.visible = true;
      } else {
        this.mesh.visible = true;
        if (window.game.player.viewmodelRoot) window.game.player.viewmodelRoot.visible = false;
      }
    }
  }

  update(delta, playerController) {
    this.animTime += delta;

    // Synchronize position from playerController
    this.position.copy(playerController.position);
    // Snap character feet to ground (playerController.position.y is eye-height at terrainHeight + 1.8)
    // Character feet bottom is at -0.4 relative to mesh origin, so mesh at (y - 1.4) puts feet precisely on ground.
    this.mesh.position.set(this.position.x, this.position.y - 1.4, this.position.z);

    // Update facing rotation to match movement / camera
    if (playerController.velocity.lengthSq() > 0.1) {
      // Rotate character to face movement direction
      const moveAngle = Math.atan2(playerController.velocity.x, playerController.velocity.z);
      this.rotationY = moveAngle;
    }
    this.mesh.rotation.y = this.rotationY;
    if (this.animState !== 'sleeping') {
      this.mesh.rotation.x = 0;
      this.mesh.rotation.z = 0;
    }

    // Determine animation state
    const isMoving = playerController.velocity.lengthSq() > 0.5;
    const isSprinting = playerController.keys.sprint && isMoving;
    const isGrounded = playerController.isGrounded;

    if (this.animState === 'sleeping') {
      this.updateSleepAnimation();
    } else if (this.isAttacking) {
      this.updateAttackAnimation(delta);
    } else if (!isGrounded) {
      this.setAnimationState('jumping');
      this.updateJumpAnimation(delta);
    } else if (isSprinting) {
      this.setAnimationState('sprinting');
      this.updateWalkAnimation(delta, 14.0);
    } else if (isMoving) {
      this.setAnimationState('walking');
      this.updateWalkAnimation(delta, 8.0);
    } else {
      this.setAnimationState('idle');
      this.updateIdleAnimation(delta);
    }

    // Update Camera
    if (this.cameraMode === 'third_person') {
      this.mesh.visible = true;
      if (playerController.viewmodelRoot) playerController.viewmodelRoot.visible = false;
      this.updateThirdPersonCamera(delta, playerController);
    } else {
      this.mesh.visible = false;
      if (playerController.viewmodelRoot) playerController.viewmodelRoot.visible = true;
    }
  }

  updateIdleAnimation(delta) {
    const t = this.animTime * 2.5;

    // Gentle torso breathing
    this.torso.position.y = 1.05 + Math.sin(t) * 0.02;

    // Relaxed arms
    this.leftArmPivot.rotation.x = Math.sin(t) * 0.05;
    this.leftArmPivot.rotation.z = -0.08;
    this.rightArmPivot.rotation.x = -Math.sin(t) * 0.05;
    this.rightArmPivot.rotation.z = 0.08;

    // Standing legs
    this.leftLegPivot.rotation.x = 0;
    this.rightLegPivot.rotation.x = 0;

    // Cape subtle flutter
    this.cape.rotation.x = 0.08 + Math.sin(t * 1.5) * 0.04;
  }

  updateWalkAnimation(delta, speed) {
    const frequency = speed * 0.9;
    const legAngle = Math.sin(this.animTime * frequency) * 0.65;
    const armAngle = -Math.sin(this.animTime * frequency) * 0.55;

    // Legs swing in opposition
    this.leftLegPivot.rotation.x = legAngle;
    this.rightLegPivot.rotation.x = -legAngle;

    // Arms swing opposite to legs
    this.leftArmPivot.rotation.x = armAngle;
    this.rightArmPivot.rotation.x = -armAngle;

    // Torso gentle bob
    this.torso.position.y = 1.05 + Math.abs(Math.sin(this.animTime * frequency)) * 0.08;

    // Cape flutters back with speed
    this.cape.rotation.x = 0.25 + Math.abs(legAngle) * 0.2;
  }

  updateJumpAnimation(delta) {
    // Both legs spread back slightly
    this.leftLegPivot.rotation.x = -0.4;
    this.rightLegPivot.rotation.x = 0.3;

    // Arms raised
    this.leftArmPivot.rotation.x = -0.8;
    this.rightArmPivot.rotation.x = -0.8;

    // Cape flaps up
    this.cape.rotation.x = 0.5;
  }

  updateAttackAnimation(delta) {
    const duration = this.attackType === 'heavy' ? 0.45 : 0.32;
    this.attackProgress += delta / duration;

    if (this.attackProgress < 0.3) {
      // Wind up: raise sword up & right
      const t = this.attackProgress / 0.3;
      this.rightArmPivot.rotation.set(-0.8 - t * 0.6, 0.4, 0.2);
    } else if (this.attackProgress < 0.75) {
      // Slash forward and across!
      const t = (this.attackProgress - 0.3) / 0.45;
      this.rightArmPivot.rotation.set(-1.4 + t * 2.2, -0.6 - t * 0.8, -0.2);
    } else if (this.attackProgress < 1.0) {
      // Recovery
      const t = (this.attackProgress - 0.75) / 0.25;
      this.rightArmPivot.rotation.set(0.8 - t * 0.8, -1.4 + t * 1.4, 0);
    } else {
      this.isAttacking = false;
      this.attackProgress = 0;
      this.animState = 'idle';
    }
  }

  updateSleepAnimation() {
    // Lie horizontally on bed relative to floor/ground height
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = (this.position.y - 1.8) + 0.92;
    this.leftArmPivot.rotation.set(0, 0, 0);
    this.rightArmPivot.rotation.set(0, 0, 0);
    this.leftLegPivot.rotation.set(0, 0, 0);
    this.rightLegPivot.rotation.set(0, 0, 0);
  }

  // =========================================================================
  // THIRD-PERSON ORBIT CAMERA (WITH WALL / TERRAIN OCCLUSION CLIPPING)
  // =========================================================================
  updateThirdPersonCamera(delta, playerController) {
    // Target position is character upper torso
    this.cameraTarget.copy(this.position).add(this.cameraOffset);

    // Calculate camera position based on orbit angles (yaw and pitch from player)
    this.cameraYaw = playerController.yaw;
    this.cameraPitch = Math.max(-0.25, Math.min(1.1, playerController.pitch));

    const cx = this.cameraTarget.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const cy = this.cameraTarget.y + Math.sin(this.cameraPitch) * this.cameraDistance;
    const cz = this.cameraTarget.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    this._desiredCamPos.set(cx, cy, cz);

    // Prevent camera from clipping through house walls, closed doors, pillars, or below terrain
    if (window.game && window.game.world && window.game.world.clipCameraRay) {
      window.game.world.clipCameraRay(this.cameraTarget, this._desiredCamPos, 0.32);
    }

    this.camera.position.copy(this._desiredCamPos);
    this.camera.lookAt(this.cameraTarget);
  }
}

window.RobloxCharacter = RobloxCharacter;
