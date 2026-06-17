import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { AudioEngine } from '../audio/AudioEngine';
import type { SweepConfig } from '../types';
import { xToFreq } from '../audio/frequencyMath';

const SVG_WIDTH = 1; // dummy — we derive freq from progress ratio

export function useSweep(engineRef: RefObject<AudioEngine | null>) {
  const [isSweeping, setIsSweeping] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(30);

  const tick = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const elapsed = engine.getCurrentTime() - startTimeRef.current;
    const p = Math.min(elapsed / durationRef.current, 1);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setIsSweeping(false);
    }
  }, [engineRef]);

  const startSweep = useCallback(
    (config: SweepConfig) => {
      const engine = engineRef.current;
      if (!engine) return;
      durationRef.current = config.duration;
      startTimeRef.current = engine.getCurrentTime();
      engine.startSweep(config);
      setIsSweeping(true);
      setProgress(0);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    },
    [engineRef, tick],
  );

  const stopSweep = useCallback(() => {
    engineRef.current?.stopSweep();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsSweeping(false);
  }, [engineRef]);

  // Derive current frequency from progress for display
  const currentFreq = xToFreq(progress * SVG_WIDTH, SVG_WIDTH);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { isSweeping, progress, currentFreq, startSweep, stopSweep };
}
