/** Hand-authored models for the buried wardworks. +Z is forward and +Y is up. */
const WardArt = (() => {
  const surface = (color, roughness = 0.82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const glow = color => new THREE.MeshBasicMaterial({ color });
  const mesh = (parent, geometry, material, x = 0, y = 0, z = 0) => {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    parent.add(part);
    return part;
  };
  let sphere;
  const rounded = (parent, material, x, y, z, sx, sy, sz) => {
    if (!sphere) {
      sphere = new THREE.SphereGeometry(1, 16, 12);
      sphere.userData.shared = true;
    }
    const part = mesh(parent, sphere, material, x, y, z);
    part.scale.set(sx, sy, sz);
    return part;
  };
  const link = (parent, material, from, to, startRadius, endRadius) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a);
    const center = a.clone().lerp(b, 0.5);
    const part = mesh(parent, new THREE.CylinderGeometry(endRadius, startRadius, direction.length(), 14),
      material, center.x, center.y, center.z);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return part;
  };
  const splitRing = (parent, radius, material, x, y, z) => [0, Math.PI].map(turn => {
    const ring = mesh(parent, new THREE.TorusGeometry(radius, radius * 0.105, 8, 23, Math.PI - 0.2), material, x, y, z);
    ring.rotation.z = turn + 0.1;
    return ring;
  });
  const group = (parent, x = 0, y = 0, z = 0) => {
    const result = new THREE.Group();
    result.position.set(x, y, z);
    parent.add(result);
    return result;
  };
  const shroud = (parent, material, y, height, top, bottom, depth) => {
    const fabric = mesh(parent, new THREE.CylinderGeometry(top, bottom, height, 24, 3, true), material, 0, y);
    fabric.scale.z = depth;
    return fabric;
  };
  const clear = parent => {
    const resources = new Set();
    for (const child of [...parent.children]) {
      child.traverse(part => {
        if (part.geometry && !part.geometry.userData.shared) resources.add(part.geometry);
        if (part.material) resources.add(part.material);
      });
      parent.remove(child);
    }
    resources.forEach(resource => resource.dispose());
  };

  function blade(parent, length) {
    const steel = surface(0x687f83, 0.35, 0.76);
    const copper = surface(0xae724b, 0.42, 0.64);
    const leather = surface(0x26232d);
    const profile = new THREE.Shape();
    profile.moveTo(-0.055, 0.08);
    profile.lineTo(-0.046, length - 0.16);
    profile.lineTo(0, length);
    profile.lineTo(0.046, length - 0.16);
    profile.lineTo(0.055, 0.08);
    const edge = mesh(parent, new THREE.ExtrudeGeometry(profile, {
      depth: 0.017, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.009, bevelSegments: 1, steps: 1
    }), steel);
    edge.position.z = -0.008;
    link(parent, copper, [-0.145, 0.095, 0], [0.145, 0.095, 0], 0.025, 0.025);
    link(parent, leather, [0, -0.14, 0], [0, 0.08, 0], 0.026, 0.029);
    rounded(parent, copper, 0, -0.143, 0, 0.034, 0.035, 0.034);
    splitRing(parent, 0.037, glow(0x96e3c9), 0, 0.14, 0.025);
  }

  function wardrunner(hero) {
    const coat = surface(0x283746);
    const steel = surface(0x48575b, 0.45, 0.63);
    const copper = surface(0xa56c44, 0.47, 0.63);
    const leather = surface(0x2b262a);
    const visor = surface(0x151c25, 0.38, 0.44);
    const recolor = (part, geometry, material) => {
      part.geometry.dispose();
      part.material.dispose();
      part.geometry = geometry;
      part.material = material;
    };
    recolor(hero.torso, new THREE.CylinderGeometry(0.49, 0.37, 1.03, 18), coat);
    hero.torso.geometry.scale(1, 1, 0.63);
    const lapel = shroud(hero.torso, coat, -0.54, 0.59, 0.38, 0.57, 0.72);
    lapel.material.side = THREE.DoubleSide;
    rounded(hero.torso, steel, 0, 0.18, 0.18, 0.39, 0.33, 0.17);
    splitRing(hero.torso, 0.105, copper, 0, 0.2, 0.36);
    clear(hero.head);
    recolor(hero.head, new THREE.SphereGeometry(0.325, 20, 15), steel);
    hero.head.geometry.scale(0.95, 1.15, 1);
    rounded(hero.head, visor, 0, 0.055, 0.245, 0.25, 0.104, 0.085);
    rounded(hero.head, glow(0xadd6c7), 0, 0.058, 0.322, 0.176, 0.018, 0.014);
    rounded(hero.head, copper, 0, -0.14, 0.22, 0.187, 0.11, 0.095);
    for (const [pivot, arm] of [[hero.leftArmPivot, hero.leftArm], [hero.rightArmPivot, hero.rightArm]]) {
      const sleeve = new THREE.CylinderGeometry(0.175, 0.135, 0.85, 16);
      sleeve.translate(0, -0.36, 0);
      recolor(arm, sleeve, coat);
      rounded(pivot, steel, 0, -0.035, 0.02, 0.245, 0.169, 0.21);
      rounded(pivot, leather, 0, -0.78, 0.02, 0.137, 0.15, 0.13);
      rounded(pivot, copper, 0, -0.65, 0.02, 0.14, 0.068, 0.14);
    }
    for (const [pivot, leg] of [[hero.leftLegPivot, hero.leftLeg], [hero.rightLegPivot, hero.rightLeg]]) {
      const boot = new THREE.CylinderGeometry(0.177, 0.142, 0.91, 16);
      boot.translate(0, -0.44, 0);
      recolor(leg, boot, leather);
      rounded(pivot, steel, 0, -0.54, 0.09, 0.15, 0.2, 0.1);
      rounded(pivot, leather, 0, -0.865, 0.09, 0.158, 0.124, 0.22);
    }
    hero.cape.material.color.setHex(0x232c3a);
    clear(hero.swordMesh);
    blade(hero.swordMesh, 1.34);
    hero.mesh.userData.wardrunner = true;
  }

  function viewmodel(player) {
    clear(player.swordMesh);
    blade(player.swordMesh, 0.49);
    rounded(player.swordMesh, surface(0x302a30), 0, -0.04, 0.01, 0.063, 0.092, 0.073);
    clear(player.manaOrbMesh);
    const glove = surface(0x303b4a);
    rounded(player.manaOrbMesh, glove, 0, -0.062, 0, 0.071, 0.082, 0.056);
    rounded(player.manaOrbMesh, surface(0xa76e48, 0.5, 0.6), 0, -0.12, 0.015, 0.077, 0.04, 0.061);
    rounded(player.manaOrbMesh, glow(0x99d7c5), 0, 0.027, 0, 0.026, 0.029, 0.026);
    splitRing(player.manaOrbMesh, 0.051, glow(0xc9b087), 0, 0.03, 0.004);
    player.swordMesh.userData.wardrunner = true;
  }

  function robedFace(parent, tint, height, scale, mask = false) {
    const skin = surface(tint, mask ? 0.52 : 0.88, mask ? 0.34 : 0);
    const shade = surface(0x252331);
    const face = group(parent, 0, height, 0.08);
    face.scale.setScalar(scale);
    rounded(face, skin, 0, 0, 0, 0.32, 0.4, 0.29);
    rounded(face, skin, 0, -0.16, 0.1, 0.23, 0.21, 0.21);
    rounded(face, skin, 0, -0.055, 0.283, 0.073, 0.105, 0.085);
    for (const x of [-0.126, 0.126]) {
      rounded(face, shade, x, 0.07, 0.258, 0.083, 0.044, 0.047);
      rounded(face, glow(mask ? 0xb9e7d4 : 0xedd8aa), x, 0.063, 0.3, 0.025, 0.018, 0.014);
    }
    return face;
  }

  function mentor(parent) {
    clear(parent);
    const indigo = surface(0x343657);
    indigo.side = THREE.DoubleSide;
    const cloth = surface(0x5a536e);
    const bronze = surface(0xb07b4f, 0.43, 0.56);
    const leather = surface(0x4c3730);
    shroud(parent, indigo, 0.76, 1.52, 0.36, 0.57, 0.78);
    rounded(parent, indigo, 0, 1.38, 0, 0.46, 0.42, 0.32);
    shroud(parent, cloth, 1.36, 0.38, 0.27, 0.58, 0.73);
    const head = robedFace(parent, 0xc29a79, 1.94, 0.85);
    const beard = surface(0xc8c2bb, 0.96);
    rounded(head, beard, 0, -0.29, 0.16, 0.246, 0.36, 0.18);
    rounded(head, beard, -0.18, -0.18, 0.17, 0.111, 0.2, 0.095);
    rounded(head, beard, 0.18, -0.18, 0.17, 0.111, 0.2, 0.095);
    rounded(head, indigo, 0, 0.24, -0.065, 0.39, 0.33, 0.31);
    splitRing(parent, 0.095, bronze, -0.2, 1.41, 0.33);
    const arm = group(parent, 0.36, 1.48, 0.055);
    link(arm, indigo, [0, 0, 0], [0.19, -0.43, 0.13], 0.15, 0.11);
    rounded(arm, surface(0xc29a79), 0.19, -0.42, 0.14, 0.089, 0.105, 0.075);
    const staff = group(arm, 0.2, -0.43, 0.17);
    link(staff, leather, [0, -1.03, 0], [0, 1.11, 0], 0.045, 0.063);
    const rings = splitRing(staff, 0.2, bronze, 0, 1.18, 0);
    rounded(staff, glow(0xace6cc), 0, 1.18, 0, 0.085, 0.126, 0.081);
    link(parent, indigo, [-0.36, 1.46, 0], [-0.5, 1.04, 0.08], 0.15, 0.11);
    return { arm, rings };
  }

  function creature(parent, type) {
    const root = group(parent);
    const bronze = surface(0xa17b59, 0.49, 0.55);
    const iron = surface(0x535b64, 0.53, 0.61);
    const bone = surface(0xc1b297);
    const textile = surface(type === 'mage' ? 0x423e60 : 0x382f3e);
    textile.side = THREE.DoubleSide;
    const limbs = [];
    let charge;
    if (type === 'wolf') {
      const fur = surface(0x39414b);
      const muzzle = surface(0x292d37);
      rounded(root, fur, 0, 0.7, -0.14, 0.33, 0.38, 0.69);
      rounded(root, fur, 0, 0.74, 0.35, 0.37, 0.38, 0.43);
      const head = group(root, 0, 0.87, 0.62);
      rounded(head, fur, 0, 0.07, 0.06, 0.247, 0.256, 0.28);
      rounded(head, muzzle, 0, -0.04, 0.3, 0.15, 0.14, 0.23);
      for (const side of [-1, 1]) {
        link(head, fur, [side * 0.16, 0.19, 0.04], [side * 0.24, 0.47, -0.02], 0.11, 0.012);
        rounded(head, glow(0xd9ae76), side * 0.17, 0.09, 0.245, 0.04, 0.027, 0.026);
        for (const z of [-0.49, 0.34]) {
          const leg = group(root, side * 0.23, 0.59, z);
          const bend = z < 0 ? -0.16 : 0.03;
          link(leg, fur, [0, 0, 0], [0, -0.3, bend], 0.128, 0.079);
          link(leg, muzzle, [0, -0.3, bend], [0, -0.53, 0.04], 0.078, 0.051);
          rounded(leg, muzzle, 0, -0.54, 0.075, 0.079, 0.054, 0.113);
          limbs.push(leg);
        }
      }
      link(root, fur, [0, 0.75, -0.63], [0, 0.56, -1.19], 0.14, 0.021);
    } else if (type === 'imp') {
      const hide = surface(0x6d4a4a);
      rounded(root, hide, 0, 0.62, 0, 0.34, 0.34, 0.28);
      const head = robedFace(root, 0x8f6656, 1.13, 0.87, true);
      for (const side of [-1, 1]) {
        link(head, bone, [side * 0.22, 0.17, 0], [side * 0.37, 0.43, -0.09], 0.098, 0.009);
        const arm = group(root, side * 0.26, 0.82, 0);
        link(arm, hide, [0, 0, 0], [side * 0.17, -0.29, 0.09], 0.12, 0.093);
        link(arm, hide, [side * 0.17, -0.29, 0.09], [side * 0.12, -0.53, 0.23], 0.093, 0.07);
        rounded(arm, hide, side * 0.12, -0.52, 0.24, 0.102, 0.09, 0.11);
        limbs.push(arm);
        link(root, hide, [side * 0.15, 0.48, -0.06], [side * 0.23, 0.1, 0.11], 0.119, 0.09);
        rounded(root, hide, side * 0.23, 0.085, 0.15, 0.117, 0.075, 0.155);
      }
      charge = rounded(root, glow(0xffb273), 0, 0.56, 0.52, 0.11, 0.11, 0.11);
    } else {
      const spectral = type === 'phantom' || type === 'mage';
      const plated = type === 'knight';
      const torso = plated ? iron : textile;
      if (spectral || type === 'scholar') shroud(root, textile, 0.65, 1.25, 0.31, 0.44, 0.68);
      rounded(root, torso, 0, 1.04, 0, plated ? 0.44 : 0.33, 0.44, 0.27);
      const face = robedFace(root, spectral ? 0x849baf : 0xbdb19c, 1.61, plated ? 0.92 : 0.78, spectral || plated);
      if (plated) rounded(face, iron, 0, 0.26, -0.03, 0.34, 0.226, 0.29);
      if (spectral) rounded(face, textile, 0, 0.22, -0.075, 0.38, 0.29, 0.32);
      for (const side of [-1, 1]) {
        const arm = group(root, side * 0.31, 1.21, 0);
        rounded(arm, plated ? iron : textile, 0, 0, 0, plated ? 0.205 : 0.144, 0.141, 0.144);
        link(arm, spectral ? textile : bone, [0, 0, 0], [side * 0.06, -0.48, 0.12], 0.081, 0.054);
        limbs.push(arm);
        if (!spectral) {
          link(root, plated ? iron : bone, [side * 0.16, 0.84, 0], [side * 0.19, 0.08, 0.07], 0.112, 0.069);
          rounded(root, plated ? iron : bone, side * 0.19, 0.065, 0.11, 0.12, 0.068, 0.147);
        }
      }
      if (plated) {
        rounded(limbs[0], iron, -0.155, -0.35, 0.24, 0.31, 0.49, 0.075);
        splitRing(limbs[0], 0.127, bronze, -0.155, -0.35, 0.32);
      }
      if (type === 'summoned' || plated) {
        const sword = group(limbs[1], 0.025, -0.48, 0.135);
        sword.rotation.x = -0.55;
        blade(sword, 0.62);
      } else {
        const staff = group(limbs[1], 0.08, -0.44, 0.14);
        link(staff, bronze, [0, -0.61, 0], [0, 1.02, 0], 0.039, 0.053);
        splitRing(staff, 0.17, bronze, 0, 1.04, 0);
        charge = rounded(staff, glow(spectral ? 0xb4a9ff : 0xa9d9c3), 0, 1.04, 0, 0.078, 0.11, 0.078);
      }
    }
    root.userData.limbs = limbs;
    root.userData.charge = charge;
    if (charge) charge.visible = false;
    parent.userData.wardVisual = root;
    return root;
  }

  function animateCreature(root, time, pose) {
    if (!root) return;
    root.rotation.x = pose === 'windup' ? -0.18 : pose === 'strike' ? 0.17 : 0;
    root.position.y = pose === 'moving' ? Math.abs(Math.sin(time * 10)) * 0.055 : 0;
    root.userData.limbs.forEach((limb, index) => {
      limb.rotation.x = pose === 'moving' ? Math.sin(time * 10 + (index === 1 || index === 2 ? Math.PI : 0)) * 0.37
        : pose === 'windup' ? -0.44 : pose === 'strike' ? -0.89 : 0;
    });
    const charge = root.userData.charge;
    if (charge) charge.visible = pose === 'windup' || pose === 'strike';
  }

  function guardian(parent, kind) {
    const bronze = surface(0xa37852, 0.46, 0.68);
    const violet = kind === 'witch';
    const fabric = surface(violet ? 0x44354f : 0x47373e);
    fabric.side = THREE.DoubleSide;
    shroud(parent, fabric, 0.93, 2.84, 0.51, violet ? 1.02 : 0.91, 0.69);
    rounded(parent, fabric, 0, 1.82, 0, violet ? 0.61 : 0.79, 0.62, 0.39);
    const face = robedFace(parent, violet ? 0xc4a9a0 : 0xbeb5a1, 2.73, 1.48, !violet);
    if (violet) {
      rounded(face, surface(0x423e57), 0, 0.2, -0.1, 0.49, 0.38, 0.41);
      for (const x of [-0.31, 0.31]) rounded(face, surface(0xa9a6b6), x, -0.17, 0, 0.108, 0.53, 0.17);
    } else {
      splitRing(face, 0.4, bronze, 0, 0.39, 0.067);
      rounded(face, bronze, 0, -0.23, 0.13, 0.26, 0.1, 0.19);
    }
    splitRing(parent, 0.21, bronze, 0, 1.91, 0.393);
    for (const side of [-1, 1]) {
      rounded(parent, violet ? fabric : bronze, side * 0.57, 2.11, 0, 0.32, 0.24, 0.33);
      link(parent, fabric, [side * 0.66, 2.07, 0], [side * 0.95, 1.39, 0.31], 0.22, 0.129);
      rounded(parent, surface(0xc2aa9b), side * 0.96, 1.34, 0.35, 0.125, 0.14, 0.1);
    }
  }

  function taperedBody(parent, material, controls, radii, width = 1) {
    const curve = new THREE.CatmullRomCurve3(controls.map(point => new THREE.Vector3(...point)));
    const lengthSegments = 24;
    const sides = 14;
    const geometry = new THREE.TubeGeometry(curve, lengthSegments, 1, sides, false);
    const positions = geometry.getAttribute('position');
    for (let row = 0; row <= lengthSegments; row++) {
      const progress = row / lengthSegments;
      const point = curve.getPointAt(progress);
      const profile = progress * (radii.length - 1);
      const index = Math.min(Math.floor(profile), radii.length - 2);
      const radius = THREE.MathUtils.lerp(radii[index], radii[index + 1], profile - index);
      for (let side = 0; side <= sides; side++) {
        const vertex = row * (sides + 1) + side;
        positions.setXYZ(vertex,
          point.x + (positions.getX(vertex) - point.x) * radius * width,
          point.y + (positions.getY(vertex) - point.y) * radius,
          point.z + (positions.getZ(vertex) - point.z) * radius);
      }
    }
    geometry.computeVertexNormals();
    return mesh(parent, geometry, material);
  }

  function dragon(parent) {
    const hide = surface(0x3d393e, 0.67, 0.16);
    const belly = surface(0x6b5144, 0.75);
    const plate = surface(0x927452, 0.49, 0.54);
    const horn = surface(0xc0ac86);
    const eye = glow(0xffba63);
    const membrane = surface(0x563b49, 0.78);
    membrane.side = THREE.DoubleSide;
    rounded(parent, hide, 0, -0.12, -0.28, 1.32, 1.05, 2.24);
    rounded(parent, belly, 0, -0.39, 0.56, 1.04, 0.75, 1.42);
    taperedBody(parent, hide, [[0, -0.09, 0.65], [0, 0.18, 1.29], [0, 0.7, 1.9],
      [0, 1.36, 2.35], [0, 1.57, 3.18]], [1.06, 0.83, 0.6, 0.46, 0.38]);
    for (const [index, z] of [1.43, 1.77, 2.06, 2.3, 2.59, 2.93].entries()) {
      const plateWidth = 0.67 - index * 0.065;
      const throat = rounded(parent, belly, 0, 0.01 + index * 0.2, z + 0.39, plateWidth, 0.125, 0.21);
      throat.rotation.x = -0.51;
    }
    const head = group(parent, 0, 1.56, 3.21);
    rounded(head, hide, 0, 0.065, 0.15, 0.65, 0.49, 0.77);
    rounded(head, hide, 0, -0.09, 0.78, 0.46, 0.255, 0.72);
    rounded(head, belly, 0, -0.31, 0.74, 0.44, 0.148, 0.69);
    rounded(head, surface(0x271f20), 0, -0.22, 0.97, 0.45, 0.042, 0.48);
    for (const side of [-1, 1]) {
      rounded(head, surface(0x261e20), side * 0.18, 0.025, 1.377, 0.074, 0.051, 0.07);
      for (const z of [0.73, 0.96, 1.17]) {
        link(head, horn, [side * (1.51 - z) * 0.28 + side * 0.206, -0.205, z],
          [side * (1.51 - z) * 0.25 + side * 0.205, -0.368, z + 0.025], 0.056, 0.01);
      }
    }
    const halo = group(head, 0, 0.54, -0.43);
    splitRing(halo, 0.72, plate, 0, 0, 0);
    for (const side of [-1, 1]) {
      rounded(head, eye, side * 0.518, 0.19, 0.535, 0.099, 0.077, 0.132);
      rounded(head, plate, side * 0.48, 0.288, 0.41, 0.17, 0.11, 0.316);
      link(head, horn, [side * 0.43, 0.41, -0.2], [side * 0.7, 0.79, -0.69], 0.161, 0.085);
      link(head, horn, [side * 0.7, 0.79, -0.69], [side * 0.86, 1.04, -1.05], 0.086, 0.014);
      for (const z of [-1.32, 1.1]) {
        const knee = [side * 1.12, -1.19, z + 0.12];
        link(parent, hide, [side * 0.78, -0.27, z], knee, 0.43, 0.23);
        link(parent, hide, knee, [side * 1.31, -2.15, z + 0.29], 0.23, 0.14);
        rounded(parent, hide, side * 1.31, -2.25, z + 0.34, 0.29, 0.18, 0.36);
        for (const toe of [-0.15, 0, 0.15]) {
          link(parent, horn, [side * 1.31 + toe, -2.28, z + 0.5],
            [side * 1.31 + toe, -2.38, z + 0.78], 0.072, 0.012);
        }
      }
    }
    const tail = [[0, -0.14, -1.59], [0.08, -0.37, -2.65], [0.36, -0.56, -3.58], [0.77, -0.49, -4.48], [1.09, -0.37, -5.27], [1.45, -0.19, -5.93]];
    taperedBody(parent, hide, tail, [0.66, 0.51, 0.36, 0.23, 0.12, 0.018], 0.89);
    for (let index = 0; index < 7; index++) {
      const z = 1.14 - index * 0.68;
      link(parent, plate, [0, z > -1.5 ? 0.89 : 0.16, z], [0, z > -1.5 ? 1.31 : 0.46, z - 0.3], 0.16, 0.012);
    }
    const wings = group(parent);
    for (const side of [-1, 1]) {
      const wing = group(wings, side * 0.96, 0.76, -0.44);
      const shoulder = [0, 0, 0];
      const wrist = [side * 2.65, 1.36, -0.46];
      const tips = [[side * 5.55, 1.82, -1.19], [side * 4.72, 0.89, -2.61], [side * 3.51, 0.13, -3.38], [side * 1.91, -0.35, -2.98], [side * 0.18, -0.39, -1.72]];
      link(wing, hide, shoulder, wrist, 0.31, 0.13);
      const positions = [];
      for (let i = 0; i < tips.length; i++) {
        link(wing, i === 0 ? hide : plate, wrist, tips[i], i === 0 ? 0.124 : 0.078, 0.022);
        if (i > 0) {
          const previous = tips[i - 1];
          const tip = tips[i];
          const fold = previous.map((value, axis) => (value + tip[axis] + wrist[axis]) / 3);
          fold[1] -= 0.14;
          positions.push(...wrist, ...previous, ...fold, ...previous, ...tip, ...fold, ...tip, ...wrist, ...fold);
        }
      }
      positions.push(...shoulder, ...wrist, ...tips[tips.length - 1]);
      const skin = new THREE.BufferGeometry();
      skin.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      skin.computeVertexNormals();
      mesh(wing, skin, membrane);
    }
    return { head, halo, wings };
  }

  return { wardrunner, viewmodel, mentor, creature, animateCreature, guardian, dragon, clear };
})();
