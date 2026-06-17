import { useRef, useState, useEffect, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

// `enabled` is false until the user accepts the safety disclaimer.
// No AudioContext is created until then, satisfying the gatekeeper requirement.
export function useAudioEngine(enabled: boolean) {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
      engineRef.current.init();
      setIsReady(true);
    }
  }, [enabled]);

  async function initEngine(): Promise<void> {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
      engineRef.current.init();
      setIsReady(true);
    }
    await engineRef.current.resumeContext();
  }

  const panic = useCallback(() => {
    engineRef.current?.panic();
  }, []);

  return { engineRef, isReady, initEngine, panic };
}
