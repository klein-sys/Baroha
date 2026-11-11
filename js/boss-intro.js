const bossReveals = [
  ['Morgathia', 'Keeper of Broken Limits', 'Watch the bright edge of her ring. Its center is safe.', 0xb48cff, 'ring'],
  ['Vorthak', 'The Undead King', 'His staff strikes first. Move back, then strike while he recovers.', 0x9fe0bd, 'slam'],
  ['The Harmonic Sentinel', 'Warden of the Celestial Depths', 'The beam slows at its turning point before sweeping back.', 0x99d1ff, 'beam'],
  ['Azrael', 'The Eternal Dragon', 'His shadow marks the dive lane. Move sideways before he passes.', 0xffc986, 'dive']
];

class BossIntroduction {
  constructor(game) {
    this.game = game;
    this.overlay = document.getElementById('boss-intro');
    this.skip = document.getElementById('boss-intro-skip');
    this.skip.addEventListener('click', () => this.finish(true));
    window.addEventListener('keydown', event => {
      if (!this.active) return;
      if (event.key === 'Escape' || event.code === 'KeyK') {
        event.preventDefault();
        this.finish(true);
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        this.skip.focus();
      }
      event.stopImmediatePropagation();
    }, true);
  }

  start(floor, boss) {
    const [name, title, cue, color, shape] = bossReveals[floor - 1];
    const state = this.game.world.dungeonProgress[floor];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = state.introSeen ? 1.5 : reducedMotion ? 5 : 7.2;
    const geometry = shape === 'ring' ? new THREE.RingGeometry(3.15, 4.85, 48)
      : shape === 'slam' ? new THREE.RingGeometry(0.5, 0.7, 40)
      : new THREE.PlaneGeometry(3.7, 25);
    const marker = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
    }));
    marker.rotation.x = -Math.PI / 2;
    const origin = boss.position.clone();
    marker.position.set(origin.x, 0.08, origin.z);
    this.game.scene.add(marker);
    const camera = this.game.camera.clone();
    const look = origin.clone().add(new THREE.Vector3(0, floor === 4 ? 3.5 : 1.7, 0));
    const starts = [[4, 3, 8], [-5, 1.5, 9], [7, 6, 6], [-9, 7, 9]];
    const ends = [[-3, 2, 6], [2, 2.5, 7], [-4, 4, 7], [6, 4, 8]];
    const start = origin.clone().add(new THREE.Vector3(...starts[floor - 1]));
    const end = origin.clone().add(new THREE.Vector3(...ends[floor - 1]));
    const books = (boss.spellbooks || []).map(book => ({ book, position: book.position.clone(), yaw: book.rotation.y }));
    const props = shape === 'slam'
      ? [boss.staff, ...this.game.bosses.summonedSkeletons.map(skeleton => skeleton.mesh)]
      : shape === 'dive' ? boss.wings.children : [];
    const poses = props.map(mesh => ({ mesh, position: mesh.position.clone(), rotation: mesh.rotation.clone() }));
    this.active = { state, origin, look, start, end, marker, shape, boss, books, poses, duration, reducedMotion, time: 0, camera, color };
    if (!state.introSeen) window.soundEngine?.playDungeonCue(floor, 'reveal');
    this.game.player.resetInput();
    this.game.player.velocity.set(0, 0, 0);
    window.interfaceManager?.hideInteractPrompt();
    window.interfaceManager?.hideCalculusTelemetry();
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('boss-intro-name').textContent = name;
    document.getElementById('boss-intro-title').textContent = title;
    document.getElementById('boss-intro-cue').textContent = cue;
    this.overlay.hidden = false;
    this.skip.focus({ preventScroll: true });
    this.update(0);
  }

  update(delta) {
    const shot = this.active;
    if (!shot) return;
    shot.time += delta;
    const progress = Math.min(1, shot.time / shot.duration);
    const reveal = Math.min(1, Math.max(0, (progress - 0.23) / 0.18));
    const t = progress * progress * (3 - 2 * progress);
    shot.camera.aspect = this.game.camera.aspect;
    shot.camera.updateProjectionMatrix();
    shot.camera.position.copy(shot.start);
    if (!shot.reducedMotion) shot.camera.position.lerp(shot.end, t);
    shot.camera.lookAt(shot.look);
    shot.marker.material.opacity = reveal * (shot.reducedMotion ? 0.55 : 0.42 + Math.sin(t * Math.PI) * 0.26);
    if (!shot.reducedMotion && !shot.state.introSeen) {
      for (const [index, { book, position, yaw }] of shot.books.entries()) {
        const angle = index * Math.PI / 2 + t * Math.PI * 1.4;
        book.position.set(Math.cos(angle) * 2.6, position.y - (1 - reveal) * 1.3 + Math.sin(angle * 2) * 0.22, Math.sin(angle) * 2.6);
        book.rotation.y = yaw + t * Math.PI;
      }
      shot.boss.position.y = shot.origin.y + (shot.shape === 'dive' ? (1 - t) * 2.5
        : shot.shape === 'slam' ? -(1 - reveal) * 0.9 : shot.shape === 'beam' ? -(1 - reveal) * 1.25 : 0);
      if (shot.shape === 'slam') {
        const [staff, ...skeletons] = shot.poses;
        staff.mesh.rotation.x = staff.rotation.x - Math.sin(Math.PI * reveal) * 0.52;
        skeletons.forEach(({ mesh, position }, index) => {
          mesh.position.y = position.y - (1 - Math.max(0, reveal - 0.1 * index)) * 0.7;
        });
        shot.marker.scale.setScalar(1 + reveal * 6);
      }
      if (shot.shape === 'beam') shot.marker.position.x = shot.origin.x + Math.sin(t * Math.PI * 2) * 5;
      if (shot.shape === 'dive') {
        shot.marker.position.z = shot.origin.z + (0.5 - t) * 5;
        shot.marker.material.color.setHex(progress < 0.35 ? 0x262034 : shot.color);
        shot.boss.position.z = shot.origin.z - (1 - t) * 4;
        shot.poses.forEach(({ mesh, rotation }, index) => {
          mesh.rotation.z = rotation.z + Math.sin(progress * Math.PI * 4) * (index === 0 ? -0.27 : 0.27);
        });
      }
    }
    this.game.world.setArenaReveal?.(shot.state.introSeen ? 1 : reveal, shot.state.introSeen ? 1 : progress);
    if (progress === 1) this.finish(false);
  }

  cancel() {
    if (!this.active) return;
    const { marker, boss, origin, books, poses } = this.active;
    for (const { mesh, position, rotation } of poses) {
      mesh.position.copy(position);
      mesh.rotation.copy(rotation);
    }
    boss.position.copy(origin);
    for (const { book, position, yaw } of books) {
      book.position.copy(position);
      book.rotation.y = yaw;
    }
    this.active = null;
    this.game.scene.remove(marker);
    marker.geometry.dispose();
    marker.material.dispose();
    this.game.world.setArenaReveal?.(1);
    this.overlay.hidden = true;
    this.skip.blur();
  }

  finish(recapture) {
    if (!this.active) return;
    this.active.state.introSeen = true;
    this.cancel();
    this.game.player.resetInput();
    this.game.autoSaveProgress();
    if (recapture) this.game.requestMouseLook();
  }
}
