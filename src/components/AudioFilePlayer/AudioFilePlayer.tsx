import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import styles from './AudioFilePlayer.module.css';

export function AudioFilePlayer() {
  const { engineRef, initEngine, isEngineReady } = useAppContext();
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

  return (
    <section className={styles.container} aria-label="Audio file player">
      <div className={styles.header}>
        <span className={styles.title}>Audio File</span>
      </div>

      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${fileName ? styles.hasFile : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label={fileName ? `Loaded: ${fileName}. Click to load a different file` : 'Upload audio file — click or drag and drop'}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className={styles.fileInput}
          onChange={handleFileInput}
          aria-hidden="true"
          tabIndex={-1}
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
            aria-label={isPlaying ? 'Stop audio file' : 'Play audio file'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>
      )}
    </section>
  );
}
