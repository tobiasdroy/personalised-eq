import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  buildCombinedPath,
  buildBandPath,
  freqToX,
  dBToY,
  xToFreq,
  yToDb,
  GRID_FREQUENCIES,
  GRID_DB,
  formatFrequency,
} from '../../audio/frequencyMath';
import type { EQBand } from '../../types';
import styles from './EQCurve.module.css';

const SVG_HEIGHT = 280;

interface DragState {
  id: string;
  startX: number;
  startY: number;
  startFreq: number;
  startGain: number;
}

export function EQCurve() {
  const { bands, updateBand, engineRef } = useAppContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(800);
  const [combinedPath, setCombinedPath] = useState('');
  const [bandPaths, setBandPaths] = useState<string[]>([]);
  const dragRef = useRef<DragState | null>(null);

  // Observe SVG width
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Recompute paths whenever bands or width changes
  useEffect(() => {
    const filterNodes = engineRef.current?.getFilterNodes() ?? [];
    if (filterNodes.length === 0) {
      setCombinedPath('');
      setBandPaths([]);
      return;
    }
    setCombinedPath(buildCombinedPath(filterNodes, width, SVG_HEIGHT));
    setBandPaths(filterNodes.map((n) => buildBandPath(n, width, SVG_HEIGHT)));
  }, [bands, width, engineRef]);

  // Draggable handles
  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>, band: EQBand) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        id: band.id,
        startX: e.clientX,
        startY: e.clientY,
        startFreq: band.frequency,
        startGain: band.gain,
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const newFreq = Math.max(20, Math.min(20000, xToFreq(relX, width)));
      const newGain = Math.max(-24, Math.min(24, yToDb(relY, SVG_HEIGHT)));
      updateBand(drag.id, { frequency: Math.round(newFreq), gain: parseFloat(newGain.toFixed(1)) });
    },
    [width, updateBand],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${width} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Grid */}
        <g className={styles.grid}>
          {GRID_FREQUENCIES.map((freq) => {
            const x = freqToX(freq, width);
            return (
              <g key={freq}>
                <line x1={x} y1={0} x2={x} y2={SVG_HEIGHT} />
                <text x={x} y={SVG_HEIGHT - 6} textAnchor="middle">
                  {formatFrequency(freq)}
                </text>
              </g>
            );
          })}
          {GRID_DB.map((db) => {
            const y = dBToY(db, SVG_HEIGHT);
            return (
              <g key={db}>
                <line
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  className={db === 0 ? styles.zeroLine : undefined}
                />
                <text x={4} y={y - 3} className={styles.dbLabel}>
                  {db > 0 ? `+${db}` : db}dB
                </text>
              </g>
            );
          })}
        </g>

        {/* Per-band curves (dimmed) */}
        {bandPaths.map((d, i) => (
          <path key={i} d={d} className={styles.bandCurve} />
        ))}

        {/* Combined curve */}
        {combinedPath && (
          <>
            {/* Glow layer */}
            <path d={combinedPath} className={styles.curveGlow} />
            {/* Main curve */}
            <path d={combinedPath} className={styles.curve} />
          </>
        )}

        {/* Draggable handles */}
        {bands.map((band) => {
          const x = freqToX(band.frequency, width);
          const y = dBToY(band.gain, SVG_HEIGHT);
          return (
            <g key={band.id}>
              {/* Hit area */}
              <circle
                cx={x}
                cy={y}
                r={16}
                className={styles.handleHit}
                onPointerDown={(e) => onPointerDown(e, band)}
              />
              {/* Visual dot */}
              <circle cx={x} cy={y} r={5} className={styles.handle} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
