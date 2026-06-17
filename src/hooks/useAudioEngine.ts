import { useRef, useState, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Init nodes eagerly so the EQ curve is visible before first user gesture.
  // getFrequencyResponse works on a suspended AudioContext.
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
      engineRef.current.init();
      setIsReady(true);
    }
  }, []);

  // Called before first audio playback to resume the AudioContext.
  async function initEngine(): Promise<void> {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
      engineRef.current.init();
      setIsReady(true);
    }
    await engineRef.current.resumeContext();
  }

  return { engineRef, isReady, initEngine };
}
