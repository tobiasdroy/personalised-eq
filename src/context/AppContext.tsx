import { createContext, useContext, type ReactNode } from 'react';
import type { RefObject } from 'react';
import type { EQBand, EQProfile } from '../types';
import type { AudioEngine } from '../audio/AudioEngine';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useEQBands } from '../hooks/useEQBands';

interface AppContextValue {
  engineRef: RefObject<AudioEngine | null>;
  isEngineReady: boolean;
  initEngine: () => Promise<void>;
  panic: () => void;
  bands: EQBand[];
  preampGain: number;
  addBand: () => void;
  removeBand: (id: string) => void;
  updateBand: (id: string, patch: Partial<EQBand>) => void;
  loadProfile: (profile: EQProfile) => void;
  setPreampGain: (gain: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, safetyAccepted }: { children: ReactNode; safetyAccepted: boolean }) {
  const { engineRef, isReady, initEngine, panic } = useAudioEngine(safetyAccepted);
  const { bands, preampGain, addBand, removeBand, updateBand, loadProfile, setPreampGain } =
    useEQBands(engineRef);

  return (
    <AppContext.Provider
      value={{
        engineRef,
        isEngineReady: isReady,
        initEngine,
        panic,
        bands,
        preampGain,
        addBand,
        removeBand,
        updateBand,
        loadProfile,
        setPreampGain,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
