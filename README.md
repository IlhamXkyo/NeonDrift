# NeonDrift

A retro arcade highway driving and drifting mini-game built with HTML5 Canvas.

Navigate a stylized midnight highway, dodge oncoming civilian traffic, initiate drifts to accumulate combo points, and maintain high speeds without crashing.

## Features

- **Pseudo-3D Highway Engine**: Custom projection math rendering curving road segments and vanishing point horizons.
- **Drift Mechanics**: Counter-steering physics that calculates drift angle and grants score multiplier bonuses.
- **Procedural Synthesizer Audio**: Web Audio API generating engine acceleration tones, tire screech frequencies, and synthwave background arpeggios without external audio assets.
- **Responsive Controls**: Fully playable on desktop keyboards and mobile touchscreens.

## How to Play

Open `index.html` in your web browser.

### Desktop Controls

- `Arrow Up` or `W`: Accelerate
- `Arrow Down` or `S`: Brake / Reverse
- `Arrow Left` or `A`: Steer Left
- `Arrow Right` or `D`: Steer Right
- `Spacebar`: Handbrake (initiate drift)
- `R`: Restart game after crash

## Tech Stack

- Vanilla JavaScript
- HTML5 Canvas
- Web Audio API

## License

MIT License. See LICENSE file for details.
