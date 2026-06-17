# PersonalisedEQ

A web-based tool for creating a personalised equaliser profile based on your HRTF (Head-Related Transfer Function). Sweep a sine oscillator across the audible frequency range, identify where your hearing peaks and dips, and correct them with a parametric EQ until the response sounds flat to you. Verify the result by toggling your profile on and off against an audio file.

All processing is done client-side via the Web Audio API — no server, no latency.

## Features

- **Sine oscillator** — sweep 20 Hz to 20 kHz manually or via auto-sweep (10 / 30 / 60 s)
- **Parametric EQ** — 5 bands by default, expandable to 10; peak, low shelf, and high shelf filter types per band
- **Live EQ curve** — SVG frequency response computed in real time; drag handles to adjust frequency and gain directly on the curve
- **Audio file player** — upload any audio file and toggle your EQ profile on/off to compare
- **Import / Export** — standard APO Equalizer `.txt` format, compatible with most system-level EQ tools
- **Wizard** *(coming soon)* — a guided step-by-step flow for beginners

## Tech stack

- [Vite](https://vitejs.dev) + [React](https://react.dev) + TypeScript
- Web Audio API (no audio libraries)
- React Router
- CSS Modules

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Usage

1. Click **Play** to start the sine oscillator
2. Drag the frequency slider or use **Auto Sweep** to move through the spectrum
3. Where you hear a peak (louder than expected), add a negative gain correction on that band. Where you hear a trough, add positive gain.
4. Adjust until the oscillator sounds perceptually flat across the range
5. Upload an audio file and toggle **EQ On / Bypassed** to hear the difference
6. **Export Profile** to save your settings as a `.txt` file

## APO format

Profiles are saved in the EqualizerAPO text format:

```
Preamp: -3.0 dB
Filter 1: ON PK Fc 1000 Hz Gain 3.5 dB Q 1.41
Filter 2: ON LSC Fc 80 Hz Gain -2.0 dB Q 0.71
Filter 3: ON HSC Fc 10000 Hz Gain 1.5 dB Q 0.71
```

## License

MIT
