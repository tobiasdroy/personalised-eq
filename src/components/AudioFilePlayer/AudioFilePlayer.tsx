import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import styles from './AudioFilePlayer.module.css';

export function AudioFilePlayer() {
  const { engineRef, initEngine, isEngineReady } = useAppContext();
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [eqEnabled, setEQEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isEngineReady) await initEngine();
      const engine = engineRef.current!;
      const buffer = await file.arrayBuffer();
      await engine.loadFile(buffer);
      setFileName(file.name);
      setIsPlaying(false);
    },
    [engineRef, initEngine, isEngineReady],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handlePlayStop = useCallback(async () => {
    if (!isEngineReady) await initEngine();
    const engine = engineRef.current!;
    if (!engine.hasAudioFile()) return;
    if (isPlaying) {
      engine.stopFile();
      setIsPlaying(false);
    } else {
      await engine.startFile();
      setIsPlaying(true);
    }
  }, [isEngineReady, initEngine, engineRef, isPlaying]);

  const handleEQToggle = useCallback(() => {
    const next = !eqEnabled;
    setEQEnabled(next);
    engineRef.current?.setFileEQEnabled(next);
  }, [eqEnabled, engineRef]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Audio File</span>
        {fileName && (
          <button
            className={`${styles.eqToggle} ${eqEnabled ? styles.eqOn : styles.eqOff}`}
            onClick={handleEQToggle}
          >
            EQ {eqEnabled ? 'On' : 'Bypassed'}
          </button>
        )}
      </div>

      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${fileName ? styles.hasFile : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className={styles.fileInput}
          onChange={handleFileInput}
        />
        {fileName ? (
          <span className={styles.fileName}>{fileName}</span>
        ) : (
          <span className={styles.dropHint}>Drop audio file or click to browse</span>
        )}
      </div>

      {fileName && (
        <div className={styles.playControls}>
          <button
            className={`${styles.playBtn} ${isPlaying ? styles.active : ''}`}
            onClick={handlePlayStop}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          <p className={styles.eqHint}>
            Toggle EQ on/off to compare with and without your profile.
          </p>
        </div>
      )}
    </div>
  );
}
