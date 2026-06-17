import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import styles from './AudioFilePlayer.module.css';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioFilePlayer() {
  const { engineRef, initEngine, isEngineReady } = useAppContext();
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPlayingRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isScrubbingRef.current = isScrubbing; }, [isScrubbing]);

  // rAF loop: update scrubber and detect natural track end
  useEffect(() => {
    if (!fileName) return;
    const tick = () => {
      const engine = engineRef.current;
      if (engine && !isScrubbingRef.current) {
        const pos = Math.min(engine.getFilePosition(), engine.getFileDuration());
        setCurrentTime(pos);
        if (isPlayingRef.current && !engine.getIsFilePlaying()) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [fileName, engineRef]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isEngineReady) await initEngine();
      const engine = engineRef.current!;
      const buffer = await file.arrayBuffer();
      await engine.loadFile(buffer);
      setFileName(file.name);
      setDuration(engine.getFileDuration());
      setCurrentTime(0);
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
      e.target.value = '';
    },
    [loadFile],
  );

  const handlePlayPause = useCallback(async () => {
    if (!isEngineReady) await initEngine();
    const engine = engineRef.current!;
    if (!engine.hasAudioFile()) return;

    if (isPlaying) {
      engine.pauseFile();
      setIsPlaying(false);
    } else {
      await engine.startFile(engine.getFilePosition(), () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      setIsPlaying(true);
    }
  }, [isEngineReady, initEngine, engineRef, isPlaying]);

  const handleScrubStart = useCallback(() => {
    setIsScrubbing(true);
    setScrubValue(engineRef.current?.getFilePosition() ?? 0);
  }, [engineRef]);

  const handleScrubChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubValue(parseFloat(e.target.value));
  }, []);

  const handleScrubEnd = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = parseFloat(e.target.value);
    setIsScrubbing(false);
    setCurrentTime(pos);
    await engineRef.current?.seekFile(pos);
    if (engineRef.current?.getIsFilePlaying()) setIsPlaying(true);
  }, [engineRef]);

  const scrubberValue = isScrubbing ? scrubValue : currentTime;

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
        <div className={styles.transport}>
          <button
            className={`${styles.playBtn} ${isPlaying ? styles.active : ''}`}
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause audio file' : 'Play audio file'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className={styles.scrubberWrap}>
            <input
              type="range"
              className={styles.scrubber}
              min={0}
              max={duration || 1}
              step={0.01}
              value={scrubberValue}
              aria-label="Playback position"
              aria-valuetext={`${formatTime(scrubberValue)} of ${formatTime(duration)}`}
              onPointerDown={handleScrubStart}
              onChange={handleScrubChange}
              onPointerUp={handleScrubEnd as unknown as React.PointerEventHandler}
            />
          </div>

          <span className={styles.time} aria-live="off">
            {formatTime(scrubberValue)} / {formatTime(duration)}
          </span>
        </div>
      )}
    </section>
  );
}
