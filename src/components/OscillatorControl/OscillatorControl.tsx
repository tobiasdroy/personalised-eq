import { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useSweep } from '../../hooks/useSweep';
import { formatFrequency } from '../../audio/frequencyMath';
import styles from './OscillatorControl.module.css';

const LOG_MIN = Math.log10(20);
const LOG_MAX = Math.log10(20000);
const SWEEP_DURATIONS = [10, 30, 60] as const;

function sliderToFreq(value: number): number {
  return Math.pow(10, LOG_MIN + (value / 1000) * (LOG_MAX - LOG_MIN));
}

function freqToSlider(freq: number): number {
  return ((Math.log10(freq) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000;
}

export function OscillatorControl() {
  const { engineRef, initEngine, isEngineReady } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(1000);
  const [sweepDuration, setSweepDuration] = useState<number>(30);
  const { isSweeping, progress, startSweep, stopSweep } = useSweep(engineRef);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const freq = sliderToFreq(parseFloat(e.target.value));
      setFrequency(freq);
      if (isPlaying && engineRef.current) {
        engineRef.current.setOscillatorFrequency(freq);
      }
    },
    [isPlaying, engineRef],
  );

  const handlePlayStop = useCallback(async () => {
    if (!isEngineReady) await initEngine();
    const engine = engineRef.current!;
    if (isPlaying) {
      if (isSweeping) stopSweep();
      engine.stopOscillator();
      setIsPlaying(false);
    } else {
      await engine.startOscillator(frequency);
      setIsPlaying(true);
    }
  }, [isEngineReady, initEngine, engineRef, isPlaying, isSweeping, stopSweep, frequency]);

  const handleSweep = useCallback(async () => {
    if (!isEngineReady) await initEngine();
    const engine = engineRef.current!;
    if (isSweeping) {
      stopSweep();
      return;
    }
    if (!isPlaying) {
      await engine.startOscillator(20);
      setIsPlaying(true);
    }
    startSweep({ startFreq: 20, endFreq: 20000, duration: sweepDuration });
  }, [isEngineReady, initEngine, engineRef, isSweeping, isPlaying, startSweep, stopSweep, sweepDuration]);

  // During sweep, mirror the sweep frequency in state
  const displayFreq = isSweeping
    ? Math.pow(10, LOG_MIN + progress * (LOG_MAX - LOG_MIN))
    : frequency;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Oscillator</span>
        <span className={styles.freqDisplay}>{formatFrequency(displayFreq)} Hz</span>
      </div>

      <div className={styles.sliderWrap}>
        <span className={styles.rangeLabel}>20 Hz</span>
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={1000}
          step={1}
          value={isSweeping ? freqToSlider(displayFreq) : freqToSlider(frequency)}
          onChange={handleSliderChange}
          disabled={isSweeping}
        />
        <span className={styles.rangeLabel}>20k Hz</span>
      </div>

      {isSweeping && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar} style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <div className={styles.controls}>
        <button
          className={`${styles.playBtn} ${isPlaying ? styles.active : ''}`}
          onClick={handlePlayStop}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>

        <div className={styles.sweepSection}>
          <div className={styles.durationPicker}>
            {SWEEP_DURATIONS.map((d) => (
              <button
                key={d}
                className={`${styles.durationBtn} ${sweepDuration === d ? styles.durationActive : ''}`}
                onClick={() => setSweepDuration(d)}
                disabled={isSweeping}
              >
                {d}s
              </button>
            ))}
          </div>
          <button
            className={`${styles.sweepBtn} ${isSweeping ? styles.active : ''}`}
            onClick={handleSweep}
          >
            {isSweeping ? 'Stop Sweep' : 'Auto Sweep'}
          </button>
        </div>
      </div>
    </div>
  );
}
