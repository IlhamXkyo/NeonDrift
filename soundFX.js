/**
 * NightDrift // Procedural Web Audio Sound FX & In-Car Radio
 * 100% real-time synthesized audio — zero external mp3s.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;

    // Engine sound nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.engineGain = null;

    // Tire screech nodes
    this.skidSource = null;
    this.skidFilter = null;
    this.skidGain = null;

    // Lo-fi radio nodes
    this.radioInterval = null;
    this.radioGain = null;

    // Musical scale for night drive groove (A Minor / C Major)
    // Low, mellow jazz-chords for late night highway cruising
    this.chords = [
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [196.00, 246.94, 293.66, 349.23]  // G7
    ];
    this.chordStep = 0;
  }

  async init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Setup Engine Synth
    this.setupEngine();

    // Setup Tire Skid Synth
    this.setupTireSkid();

    // Setup Radio
    this.setupRadio();
  }

  setupEngine() {
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Dual sawtooth oscillators for aggressive sport engine rumble
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  setupTireSkid() {
    // Generate 2 seconds of white noise buffer for screech
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.skidSource = this.ctx.createBufferSource();
    this.skidSource.buffer = noiseBuffer;
    this.skidSource.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.skidSource.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.masterGain);

    this.skidSource.start();
  }

  setupRadio() {
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.radioGain.connect(this.masterGain);

    // Play periodic smooth lo-fi rhythm in car radio
    const stepBeat = () => {
      if (!this.ctx || this.isMuted) return;

      const now = this.ctx.currentTime;
      // Kick drum
      this.playKick(now);

      // Hi-hat
      setTimeout(() => this.playHiHat(now + 0.25), 250);
      setTimeout(() => this.playHiHat(now + 0.5), 500);
      setTimeout(() => this.playHiHat(now + 0.75), 750);

      // Warm Electric Piano / Synth Chord every 2 beats
      this.playChord(this.chords[this.chordStep], now);
      this.chordStep = (this.chordStep + 1) % this.chords.length;

      this.radioInterval = setTimeout(stepBeat, 1000);
    };

    stepBeat();
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.15);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  playHiHat(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);
    gain.gain.setValueAtTime(0.025, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  playChord(frequencies, time) {
    frequencies.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.035, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);
      osc.connect(gain);
      gain.connect(this.radioGain);
      osc.start(time);
      osc.stop(time + 1.9);
    });
  }

  updateEngine(speedKmh, isBoosting) {
    if (!this.ctx || this.isMuted) return;

    // Calculate simulated RPM based on speed and gears
    const speedRatio = Math.min(speedKmh / 240, 1.0);
    const baseFreq = 40 + speedRatio * 85 + (isBoosting ? 25 : 0);
    const filterCutoff = 180 + speedRatio * 900 + (isBoosting ? 300 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);
  }

  updateSkid(intensity) {
    if (!this.ctx || this.isMuted) return;
    const targetGain = Math.min(intensity * 0.22, 0.25);
    this.skidGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  playNearMiss() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  playTurboBlowOff() {
    if (!this.ctx || this.isMuted) return;
    // Characteristic turbo flutter sound
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playCrash() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep crunch impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  toggleMute() {
    if (!this.ctx) return false;
    this.isMuted = !this.isMuted;
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    return !this.isMuted;
  }
}

window.SoundSystem = SoundSystem;
