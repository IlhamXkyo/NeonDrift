# 🏎️ NIGHT DRIFT // 首都高 Midnight Expressway

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Engine-Three.js_r128-black.svg)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Sound-Procedural_Web_Audio-amber.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> **Night Drift** is a 3D arcade highway drifting and traffic dodging game inspired by Japanese expressway street racing (*Wangan Midnight*, *Initial D*, and 90s arcade racers). Built with vanilla modern JavaScript, Three.js, and pure procedural Web Audio synthesis.

---

## 🕹️ Controls

| Control | Action |
| :--- | :--- |
| **`A` / `D`** or **`←` / `→`** | Steer Left / Right |
| **`SPACE`** or **`S` / `↓`** | Handbrake Drift & Power Slide |
| **`W`** or **`SHIFT`** | Nitrous Boost (NOS) |
| **`M`** | Mute / Unmute In-Car Radio |
| **Mobile / Touch** | On-screen steering pads and Drift/NOS buttons |

---

## 🌟 Game Features

- **Arcade Drift Physics**: Slide sideways into corners with tire smoke, weight transfer body roll, and a multiplier scaling from `x1.0` up to `x5.0`.
- **Traffic Dodging & Close Calls**: Weave through civilian expressway traffic. Overtaking cars within inches triggers the **"CLOSE CALL +500"** bonus.
- **100% Procedural Audio Engine**:
  - Sports car engine audio with real-time RPM pitch bend and gear shifts.
  - Resonant tire screech sound synthesis that scales with drift angle.
  - In-car FM 88.4 late-night lo-fi cassette groove synthesized in real-time.
- **Machine Selection**:
  - **AE-86**: Classic Panda White/Black
  - **R-34**: Midnight Blue
  - **FD-7**: Crimson Red
  - **S-15**: Gunmetal Grey
- **Authentic Sports Instrument Cluster**:
  - Real-time digital speedometer, gear indicator, and nitrous gauge.
  - Persistent high score saved to `localStorage`.

---

## 🚀 Quick Run Locally

No build tools or npm dependencies are required:

```bash
git clone https://github.com/IlhamXkyo/NeonDrift.git
cd NeonDrift

# Run local web server with Python:
python -m http.server 8080

# Or with Node:
npx serve
```

Open `http://localhost:8080` in your web browser.

---

## 🌐 Deploy to GitHub Pages

1. Go to repository **Settings** > **Pages**.
2. Set **Source** to `Deploy from a branch`.
3. Select `main` branch and `/ (root)`.
4. Click **Save**. The game will be live at:
   `https://ilhamxkyo.github.io/NeonDrift/`

---

## 📜 License

MIT License. See `LICENSE` for details.

Crafted by [IlhamXkyo](https://github.com/IlhamXkyo).
