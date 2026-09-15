/**
 * NightDrift // Expressway Environment, Traffic System & Particles
 */

class WorldManager {
  constructor(scene) {
    this.scene = scene;

    // Road segments
    this.roadWidth = 19;
    this.roadLength = 600;
    this.roadSegments = [];
    this.stripes = [];
    this.lampPosts = [];

    // Traffic
    this.trafficCars = [];
    this.trafficSpawnTimer = 0;
    this.trafficInterval = 1.2; // spawn every ~1.2s

    // Particles (Tire Smoke)
    this.smokeParticles = [];
    this.smokePool = [];

    this.initEnvironment();
  }

  initEnvironment() {
    // 1. Asphalt Road Surface
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.85,
      metalness: 0.1
    });

    for (let i = 0; i < 2; i++) {
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.z = -i * this.roadLength;
      this.scene.add(road);
      this.roadSegments.push(road);
    }

    // 2. Roadside Barriers (Guardrails)
    const railGeo = new THREE.BoxGeometry(0.5, 0.8, this.roadLength);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 });

    for (let i = 0; i < 2; i++) {
      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(-this.roadWidth / 2 - 0.25, 0.4, -i * this.roadLength);
      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(this.roadWidth / 2 + 0.25, 0.4, -i * this.roadLength);

      this.scene.add(leftRail);
      this.scene.add(rightRail);
      this.roadSegments.push(leftRail, rightRail);
    }

    // 3. Lane Markings (Dashed White Lines)
    const stripeGeo = new THREE.PlaneGeometry(0.2, 5);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const laneXs = [-4.5, 0, 4.5];

    for (let z = -this.roadLength; z <= 50; z += 12) {
      laneXs.forEach((lx) => {
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(lx, 0.02, z);
        this.scene.add(stripe);
        this.stripes.push(stripe);
      });
    }

    // 4. Highway Lampposts with Overhead Lights
    for (let z = -this.roadLength; z <= 50; z += 45) {
      this.createLampPost(-this.roadWidth / 2 - 1.2, z, true);
      this.createLampPost(this.roadWidth / 2 + 1.2, z, false);
    }

    // 5. Tokyo Expressway Skyline Silhouettes
    this.buildCitySkyline();

    // 6. Pre-allocate Tire Smoke Particle Pool
    this.initSmokePool();
  }

  createLampPost(x, z, isLeft) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 9, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 4.5;
    group.add(pole);

    // Arm reaching over road
    const armGeo = new THREE.BoxGeometry(2.5, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(isLeft ? 1.2 : -1.2, 8.8, 0);
    group.add(arm);

    // Lamp Bulb Glow
    const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff0b5 });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(isLeft ? 2.3 : -2.3, 8.6, 0);
    group.add(bulb);

    this.scene.add(group);
    this.lampPosts.push(group);
  }

  buildCitySkyline() {
    const buildingMat = new THREE.MeshBasicMaterial({ color: 0x0a0d14 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // Left and Right distant buildings
    for (let i = 0; i < 35; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? -50 - Math.random() * 80 : 50 + Math.random() * 80;
      const z = -Math.random() * 500;
      const w = 18 + Math.random() * 25;
      const h = 40 + Math.random() * 90;
      const d = 18 + Math.random() * 25;

      const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat);
      building.position.set(x, h / 2 - 10, z);
      this.scene.add(building);

      // Random window clusters
      if (Math.random() > 0.4) {
        const winCluster = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, h * 0.5), windowMat);
        winCluster.position.set(x + (isLeft ? w / 2 + 0.1 : -w / 2 - 0.1), h / 2, z);
        winCluster.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        this.scene.add(winCluster);
      }
    }
  }

  initSmokePool() {
    const smokeGeo = new THREE.SphereGeometry(0.3, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.5
    });

    for (let i = 0; i < 80; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({
        mesh: p,
        life: 0,
        maxLife: 0.6,
        vel: new THREE.Vector3()
      });
    }
  }

  emitSmoke(pos, driftIntensity) {
    if (driftIntensity < 0.2) return;

    for (let i = 0; i < 2; i++) {
      const p = this.smokePool.find((item) => !item.mesh.visible);
      if (p) {
        p.mesh.visible = true;
        p.life = 0;
        p.maxLife = 0.4 + Math.random() * 0.3;
        p.mesh.scale.setScalar(0.4 + Math.random() * 0.5);
        p.mesh.position.set(
          pos.x + (Math.random() - 0.5) * 1.2,
          0.3,
          pos.z + 1.8 + Math.random() * 0.5
        );
        p.vel.set((Math.random() - 0.5) * 2, 0.8 + Math.random(), 3 + Math.random() * 5);
      }
    }
  }

  spawnTrafficCar() {
    const lanes = [-6.5, -2.2, 2.2, 6.5];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];

    // Random civilian vehicle type (Sedan, Compact, Wagon)
    const colors = [0x334155, 0x1e293b, 0x64748b, 0x0f172a, 0x991b1b, 0xf8fafc];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const carGroup = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 4.2), bodyMat);
    body.position.y = 0.6;
    carGroup.add(body);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    roof.position.set(0, 1.2, -0.2);
    carGroup.add(roof);

    // Taillights (Red)
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.1), tlMat);
    tlLeft.position.set(-0.65, 0.65, 2.12);
    const tlRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.1), tlMat);
    tlRight.position.set(0.65, 0.65, 2.12);
    carGroup.add(tlLeft, tlRight);

    // Position far ahead on expressway
    carGroup.position.set(lane, 0, -220 - Math.random() * 80);

    // Civilian cruising speed (85 - 120 km/h)
    const speed = 85 + Math.random() * 35;

    this.scene.add(carGroup);
    this.trafficCars.push({
      mesh: carGroup,
      speed: speed,
      passed: false
    });
  }

  update(dt, playerSpeed, playerPos, playerDrifting, onNearMiss) {
    const moveZ = (playerSpeed / 3.6) * dt;

    // 1. Scroll Lane Stripes
    this.stripes.forEach((stripe) => {
      stripe.position.z += moveZ;
      if (stripe.position.z > 30) {
        stripe.position.z -= this.roadLength;
      }
    });

    // 2. Scroll Highway Lampposts
    this.lampPosts.forEach((post) => {
      post.position.z += moveZ;
      if (post.position.z > 30) {
        post.position.z -= this.roadLength;
      }
    });

    // 3. Update & Spawn Traffic
    this.trafficSpawnTimer += dt;
    if (this.trafficSpawnTimer >= this.trafficInterval) {
      this.trafficSpawnTimer = 0;
      this.spawnTrafficCar();
    }

    for (let i = this.trafficCars.length - 1; i >= 0; i--) {
      const traffic = this.trafficCars[i];
      // Relative movement: moves toward player if player is faster
      const relSpeed = (playerSpeed - traffic.speed) / 3.6;
      traffic.mesh.position.z += relSpeed * dt;

      // Check Near Miss (Close overtake without crashing)
      if (!traffic.passed && traffic.mesh.position.z > playerPos.z - 2 && traffic.mesh.position.z < playerPos.z + 2) {
        const lateralDist = Math.abs(traffic.mesh.position.x - playerPos.x);
        if (lateralDist < 2.6 && lateralDist > 1.4) {
          traffic.passed = true;
          onNearMiss();
        }
      }

      // Despawn when far behind
      if (traffic.mesh.position.z > 40) {
        this.scene.remove(traffic.mesh);
        this.trafficCars.splice(i, 1);
      }
    }

    // 4. Update Tire Smoke Particles
    if (playerDrifting) {
      this.emitSmoke(playerPos, 1.0);
    }

    this.smokePool.forEach((p) => {
      if (p.mesh.visible) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.vel, dt);
          p.mesh.scale.addScalar(dt * 0.8);
          p.mesh.material.opacity = (1 - p.life / p.maxLife) * 0.5;
        }
      }
    });
  }

  checkCollision(playerPos) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(playerPos.x, 0.8, playerPos.z),
      new THREE.Vector3(1.8, 1.0, 3.8)
    );

    for (let i = 0; i < this.trafficCars.length; i++) {
      const traffic = this.trafficCars[i];
      const trafficBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(traffic.mesh.position.x, 0.8, traffic.mesh.position.z),
        new THREE.Vector3(1.8, 1.0, 3.8)
      );

      if (playerBox.intersectsBox(trafficBox)) {
        return true;
      }
    }
    return false;
  }

  reset() {
    this.trafficCars.forEach((t) => this.scene.remove(t.mesh));
    this.trafficCars = [];
    this.smokePool.forEach((p) => (p.mesh.visible = false));
  }
}

window.WorldManager = WorldManager;
