/**
 * NightDrift // 3D Sports Car Model & Arcade Vehicle Physics
 */

class PlayerCar {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Physics parameters
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0; // current speed in km/h
    this.maxSpeed = 210;
    this.boostMaxSpeed = 265;
    this.acceleration = 65;
    this.deceleration = 40;
    this.brakeForce = 90;
    this.turnSpeed = 2.4;
    this.lateralVelocity = 0;
    this.driftAngle = 0;
    this.targetDriftAngle = 0;

    // Drift state
    this.isDrifting = false;
    this.driftIntensity = 0;

    // Boost state
    this.nitro = 100;
    this.isBoosting = false;

    // Materials
    this.bodyMaterial = null;
    this.glassMaterial = null;
    this.taillightMaterial = null;

    // Wheels for rotation
    this.wheels = [];

    this.buildCar();
    this.scene.add(this.mesh);
  }

  buildCar() {
    // Car Body Material (Clean gloss finish)
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2
    });

    this.bodySecondary = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.6,
      metalness: 0.1
    });

    this.glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75
    });

    // 1. Lower Chassis (Base)
    const lowerGeo = new THREE.BoxGeometry(2.0, 0.45, 4.2);
    const lowerMesh = new THREE.Mesh(lowerGeo, this.bodySecondary);
    lowerMesh.position.y = 0.45;
    this.mesh.add(lowerMesh);

    // 2. Main Hood & Trunk Body
    const bodyGeo = new THREE.BoxGeometry(1.95, 0.5, 4.0);
    this.mainBodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    this.mainBodyMesh.position.y = 0.8;
    this.mesh.add(this.mainBodyMesh);

    // 3. Cabin (Roof & Windows)
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.55, 2.0);
    const cabinMesh = new THREE.Mesh(cabinGeo, this.glassMaterial);
    cabinMesh.position.set(0, 1.25, -0.2);
    this.mesh.add(cabinMesh);

    // Roof panel
    const roofGeo = new THREE.BoxGeometry(1.65, 0.08, 1.9);
    const roofMesh = new THREE.Mesh(roofGeo, this.bodyMaterial);
    roofMesh.position.set(0, 1.54, -0.2);
    this.mesh.add(roofMesh);

    // 4. Rear Spoiler (Wing)
    const wingStands = new THREE.BoxGeometry(0.08, 0.3, 0.15);
    const leftStand = new THREE.Mesh(wingStands, this.bodySecondary);
    leftStand.position.set(-0.7, 1.15, 1.8);
    const rightStand = new THREE.Mesh(wingStands, this.bodySecondary);
    rightStand.position.set(0.7, 1.15, 1.8);
    this.mesh.add(leftStand);
    this.mesh.add(rightStand);

    const wingBlade = new THREE.BoxGeometry(1.85, 0.06, 0.4);
    const wingMesh = new THREE.Mesh(wingBlade, this.bodySecondary);
    wingMesh.position.set(0, 1.32, 1.8);
    this.mesh.add(wingMesh);

    // 5. Headlights & Light Cones
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);

    const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
    hlLeft.position.set(-0.72, 0.75, -2.02);
    const hlRight = new THREE.Mesh(hlGeo, headlightMat);
    hlRight.position.set(0.72, 0.75, -2.02);
    this.mesh.add(hlLeft);
    this.mesh.add(hlRight);

    // Headlight Beams casting forward onto road
    this.leftSpot = new THREE.SpotLight(0xfffae0, 2.5, 55, Math.PI / 6, 0.4, 1.2);
    this.leftSpot.position.set(-0.72, 0.8, -2.0);
    this.leftSpot.target.position.set(-0.72, 0, -35);
    this.mesh.add(this.leftSpot);
    this.mesh.add(this.leftSpot.target);

    this.rightSpot = new THREE.SpotLight(0xfffae0, 2.5, 55, Math.PI / 6, 0.4, 1.2);
    this.rightSpot.position.set(0.72, 0.8, -2.0);
    this.rightSpot.target.position.set(0.72, 0, -35);
    this.mesh.add(this.rightSpot);
    this.mesh.add(this.rightSpot.target);

    // 6. Taillights
    this.taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tlGeo = new THREE.BoxGeometry(0.45, 0.12, 0.1);

    const tlLeft = new THREE.Mesh(tlGeo, this.taillightMaterial);
    tlLeft.position.set(-0.7, 0.8, 2.02);
    const tlRight = new THREE.Mesh(tlGeo, this.taillightMaterial);
    tlRight.position.set(0.7, 0.8, 2.02);
    this.mesh.add(tlLeft);
    this.mesh.add(tlRight);

    // 7. 4 Sport Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 });

    const wheelPositions = [
      { x: -1.0, y: 0.4, z: -1.3 }, // Front Left
      { x: 1.0, y: 0.4, z: -1.3 },  // Front Right
      { x: -1.0, y: 0.4, z: 1.3 },  // Rear Left
      { x: 1.0, y: 0.4, z: 1.3 }   // Rear Right
    ];

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.32, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      this.mesh.add(wheelGroup);
      this.wheels.push(wheelGroup);
    });
  }

  setCarTheme(type) {
    if (type === 'panda') {
      this.bodyMaterial.color.setHex(0xf8fafc);
      this.bodySecondary.color.setHex(0x111111);
    } else if (type === 'midnight') {
      this.bodyMaterial.color.setHex(0x1e3a8a);
      this.bodySecondary.color.setHex(0x0f172a);
    } else if (type === 'cherry') {
      this.bodyMaterial.color.setHex(0xdc2626);
      this.bodySecondary.color.setHex(0x18181b);
    } else if (type === 'gunmetal') {
      this.bodyMaterial.color.setHex(0x475569);
      this.bodySecondary.color.setHex(0x09090b);
    }
  }

  update(dt, input) {
    // Acceleration & Speed
    const maxSpd = this.isBoosting ? this.boostMaxSpeed : this.maxSpeed;

    if (input.boost && this.nitro > 0) {
      this.isBoosting = true;
      this.nitro = Math.max(0, this.nitro - dt * 28);
      this.speed = Math.min(maxSpd, this.speed + this.acceleration * 1.8 * dt);
    } else {
      this.isBoosting = false;
      // Passive nitro refill when not boosting
      this.nitro = Math.min(100, this.nitro + dt * 6);
      this.speed = Math.min(maxSpd, this.speed + this.acceleration * dt);
    }

    // Handbrake / Drift
    this.isDrifting = (input.drift && this.speed > 50 && Math.abs(input.steer) > 0.1);

    if (this.isDrifting) {
      this.driftIntensity = Math.min(1.0, this.driftIntensity + dt * 3.5);
      // Lateral slide angle
      this.targetDriftAngle = -input.steer * 0.45;
      // Slight speed bleed during heavy drift
      this.speed = Math.max(70, this.speed - this.deceleration * 0.6 * dt);
      this.taillightMaterial.color.setHex(0xff2222);
    } else {
      this.driftIntensity = Math.max(0, this.driftIntensity - dt * 4.0);
      this.targetDriftAngle = 0;
      this.taillightMaterial.color.setHex(0x991b1b);
    }

    // Smooth drift angle transition
    this.driftAngle += (this.targetDriftAngle - this.driftAngle) * Math.min(1, dt * 10);

    // Lateral Steering with slip
    const effectiveTurnSpeed = this.isDrifting ? this.turnSpeed * 1.5 : this.turnSpeed;
    const lateralDir = input.steer * effectiveTurnSpeed * (this.speed / 100);
    this.lateralVelocity += (lateralDir - this.lateralVelocity) * Math.min(1, dt * 8);

    this.position.x += this.lateralVelocity * dt * 12;

    // Clamp within 4-lane expressway boundaries (-8.5m to +8.5m)
    this.position.x = Math.max(-8.2, Math.min(8.2, this.position.x));

    // Apply mesh orientation: drift angle + slight steer tilt
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = 0;
    this.mesh.position.z = this.position.z;

    this.mesh.rotation.y = this.driftAngle;
    this.mesh.rotation.z = -this.lateralVelocity * 0.03; // Body roll into turns

    // Rotate wheels
    const wheelRotSpeed = (this.speed / 3.6) / 0.4 * dt;
    this.wheels.forEach((w) => {
      w.children[0].rotation.x += wheelRotSpeed;
      w.children[1].rotation.x += wheelRotSpeed;
    });

    // Steer front wheels
    this.wheels[0].rotation.y = input.steer * 0.35;
    this.wheels[1].rotation.y = input.steer * 0.35;
  }
}

window.PlayerCar = PlayerCar;
