/**
 * NightDrift // Main Game Controller & Camera Loop
 */

class GameEngine {
  constructor() {
    this.container = document.getElementById('game-canvas');
    this.screenMenu = document.getElementById('screen-menu');
    this.screenGameover = document.getElementById('screen-gameover');
    this.hud = document.getElementById('hud');

    // UI Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudDistance = document.getElementById('hud-distance');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudGear = document.getElementById('hud-gear');
    this.nitroFill = document.getElementById('nitro-fill');
    this.nitroPct = document.getElementById('nitro-pct');
    this.driftBar = document.getElementById('drift-bar-container');
    this.driftMultText = document.getElementById('drift-mult');
    this.driftProgress = document.getElementById('drift-progress');
    this.alertBox = document.getElementById('hud-alert-box');
    this.alertText = document.getElementById('hud-alert-text');

    // Game Over stats
    this.goScore = document.getElementById('go-score');
    this.goDistance = document.getElementById('go-distance');
    this.goDrift = document.getElementById('go-drift');
    this.goBest = document.getElementById('go-best');

    // State
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
    this.score = 0;
    this.distance = 0; // in meters
    this.driftScore = 0;
    this.maxDriftScore = 0;
    this.driftMultiplier = 1.0;
    this.driftDuration = 0;
    this.bestScore = parseInt(localStorage.getItem('nightdrift_best') || '0', 10);

    // Inputs
    this.inputs = {
      steer: 0,
      drift: false,
      boost: false
    };

    // Camera shake
    this.shakeIntensity = 0;

    this.init();
  }

  init() {
    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0d0f14, 0.005);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 800);
    this.camera.position.set(0, 3.8, 7.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0d0f14, 1);
    this.container.appendChild(this.renderer.domElement);

    // 2. Night Lighting
    const hemiLight = new THREE.HemisphereLight(0x334155, 0x0f172a, 0.6);
    this.scene.add(hemiLight);

    const moonLight = new THREE.DirectionalLight(0x94a3b8, 0.7);
    moonLight.position.set(20, 50, -40);
    this.scene.add(moonLight);

    // 3. Audio & Subsystems
    this.sound = new SoundSystem();
    this.player = new PlayerCar(this.scene);
    this.world = new WorldManager(this.scene);

    // 4. Input & UI Bindings
    this.setupInputs();
    this.setupUI();

    // 5. Window Resize
    window.addEventListener('resize', () => this.onResize());

    // 6. Game Loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupInputs() {
    const keys = {};

    window.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      if (this.state === 'MENU' && (e.code === 'Enter' || e.code === 'Space')) {
        this.startGame();
      } else if (this.state === 'GAMEOVER' && (e.code === 'Enter' || e.code === 'Space')) {
        this.restartGame();
      } else if (e.code === 'KeyM') {
        this.sound.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });

    this.pollKeys = () => {
      let steer = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) steer -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) steer += 1;

      this.inputs.steer = steer;
      this.inputs.drift = (keys['Space'] || keys['KeyS'] || keys['ArrowDown']);
      this.inputs.boost = (keys['KeyW'] || keys['ShiftLeft'] || keys['ShiftRight'] || keys['ArrowUp']);
    };

    // Touch controls for mobile
    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');
    const btnDrift = document.getElementById('touch-drift');
    const btnBoost = document.getElementById('touch-boost');

    const bindTouch = (elem, onPress, onRelease) => {
      if (!elem) return;
      elem.addEventListener('touchstart', (e) => { e.preventDefault(); onPress(); }, { passive: false });
      elem.addEventListener('touchend', (e) => { e.preventDefault(); onRelease(); }, { passive: false });
    };

    bindTouch(btnLeft, () => { this.inputs.steer = -1; }, () => { this.inputs.steer = 0; });
    bindTouch(btnRight, () => { this.inputs.steer = 1; }, () => { this.inputs.steer = 0; });
    bindTouch(btnDrift, () => { this.inputs.drift = true; }, () => { this.inputs.drift = false; });
    bindTouch(btnBoost, () => { this.inputs.boost = true; }, () => { this.inputs.boost = false; });
  }

  setupUI() {
    // Start button
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-retry').addEventListener('click', () => this.restartGame());

    // Radio Mute
    document.getElementById('btn-radio-toggle').addEventListener('click', () => {
      const active = this.sound.toggleMute();
      document.getElementById('btn-radio-toggle').textContent = active ? '🔊' : '🔇';
    });

    // Car Selection
    const carOpts = document.querySelectorAll('.car-opt');
    carOpts.forEach((opt) => {
      opt.addEventListener('click', () => {
        carOpts.forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        const carType = opt.dataset.car;
        this.player.setCarTheme(carType);
      });
    });
  }

  async startGame() {
    await this.sound.init();
    this.screenMenu.classList.remove('active');
    this.state = 'PLAYING';
  }

  restartGame() {
    this.screenGameover.classList.remove('active');
    this.score = 0;
    this.distance = 0;
    this.driftScore = 0;
    this.driftMultiplier = 1.0;
    this.player.speed = 0;
    this.player.position.set(0, 0, 0);
    this.player.nitro = 100;
    this.world.reset();
    this.state = 'PLAYING';
  }

  triggerAlert(text, type) {
    this.alertText.textContent = text;
    this.alertBox.className = `hud-center-alert show ${type}`;
    setTimeout(() => {
      this.alertBox.classList.remove('show');
    }, 1200);
  }

  onNearMiss() {
    this.sound.playNearMiss();
    const bonus = 500 * Math.round(this.driftMultiplier);
    this.score += bonus;
    this.triggerAlert(`CLOSE CALL +${bonus}`, 'near-miss');
    this.shakeIntensity = 0.3;
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.sound.playCrash();
    this.shakeIntensity = 1.5;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('nightdrift_best', this.bestScore.toString());
    }

    this.goScore.textContent = this.score.toLocaleString();
    this.goDistance.textContent = `${(this.distance / 1000).toFixed(1)} km`;
    this.goDrift.textContent = `${Math.round(this.maxDriftScore)} pts`;
    this.goBest.textContent = this.bestScore.toLocaleString();

    setTimeout(() => {
      this.screenGameover.classList.add('active');
    }, 800);
  }

  updateCamera(dt) {
    // Third-person smooth chase camera
    const targetX = this.player.position.x * 0.7;
    const targetY = 3.4;
    const targetZ = this.player.position.z + 7.2;

    this.camera.position.x += (targetX - this.camera.position.x) * dt * 8;
    this.camera.position.y += (targetY - this.camera.position.y) * dt * 8;
    this.camera.position.z = targetZ;

    // Look slightly ahead of car
    const lookTarget = new THREE.Vector3(
      this.player.position.x * 0.4,
      1.2,
      this.player.position.z - 25
    );

    // Apply Camera Shake
    if (this.shakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 3.0);
    }

    this.camera.lookAt(lookTarget);

    // Dynamic FOV for high speed / nitro sensation
    const targetFOV = this.player.isBoosting ? 65 : 55;
    this.camera.fov += (targetFOV - this.camera.fov) * dt * 4;
    this.camera.updateProjectionMatrix();
  }

  updateHUD() {
    const spd = Math.round(this.player.speed);
    this.hudSpeed.textContent = spd;
    this.hudScore.textContent = this.score.toLocaleString();
    this.hudDistance.innerHTML = `${(this.distance / 1000).toFixed(1)} <small>km</small>`;

    // Gear logic
    let gear = 1;
    if (spd > 180) gear = 5;
    else if (spd > 140) gear = 4;
    else if (spd > 95) gear = 3;
    else if (spd > 50) gear = 2;
    this.hudGear.textContent = gear;

    // Nitro gauge
    const nitroPct = Math.round(this.player.nitro);
    this.nitroFill.style.width = `${nitroPct}%`;
    this.nitroPct.textContent = `${nitroPct}%`;

    // Drift UI
    if (this.player.isDrifting) {
      this.driftBar.classList.add('active');
      this.driftMultText.textContent = `x${this.driftMultiplier.toFixed(1)}`;
      const progress = ((this.driftMultiplier - 1.0) / 4.0) * 100;
      this.driftProgress.style.width = `${progress}%`;
    } else {
      this.driftBar.classList.remove('active');
    }
  }

  loop(currentTime) {
    requestAnimationFrame(this.loop);

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.pollKeys();

      // Update Player
      this.player.update(dt, this.inputs);

      // Distance & Score increment
      const speedMs = this.player.speed / 3.6;
      this.distance += speedMs * dt;
      this.score += Math.round(speedMs * dt * 1.5);

      // Drift Score Multiplier
      if (this.player.isDrifting) {
        this.driftDuration += dt;
        this.driftMultiplier = Math.min(5.0, 1.0 + this.driftDuration * 1.2);
        const driftPoints = Math.round(dt * 120 * this.driftMultiplier);
        this.driftScore += driftPoints;
        this.score += driftPoints;
        this.maxDriftScore = Math.max(this.maxDriftScore, this.driftScore);
      } else {
        this.driftDuration = 0;
        this.driftMultiplier = 1.0;
        this.driftScore = 0;
      }

      // Update World (Traffic & Road)
      this.world.update(
        dt,
        this.player.speed,
        this.player.position,
        this.player.isDrifting,
        () => this.onNearMiss()
      );

      // Update Audio
      this.sound.updateEngine(this.player.speed, this.player.isBoosting);
      this.sound.updateSkid(this.player.driftIntensity);

      // Check Collision with Traffic
      if (this.world.checkCollision(this.player.position)) {
        this.gameOver();
      }

      this.updateHUD();
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  new GameEngine();
});
