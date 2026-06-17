import { useAppContext } from '../../context/AppContext';
import type { EQBand, FilterType } from '../../types';
import styles from './EQBandControl.module.css';

const FILTER_LABELS: Record<FilterType, string> = { PK: 'Peak', LSC: 'Low Shelf', HSC: 'High Shelf' };
const FILTER_TYPES: FilterType[] = ['PK', 'LSC', 'HSC'];

function BandRow({ band, index, showRemove }: { band: EQBand; index: number; showRemove: boolean }) {
  const { updateBand, removeBand } = useAppContext();
  const n = index + 1;

  return (
    <div className={`${styles.row} ${!band.enabled ? styles.disabled : ''}`} role="group" aria-label={`EQ band ${n}`}>
      <button
        className={`${styles.enableToggle} ${band.enabled ? styles.enabled : ''}`}
        onClick={() => updateBand(band.id, { enabled: !band.enabled })}
        aria-label={`Band ${n}: ${band.enabled ? 'enabled, click to disable' : 'disabled, click to enable'}`}
        aria-pressed={band.enabled}
      >
        {n}
      </button>

      <div className={styles.typeSelect} role="group" aria-label={`Band ${n} filter type`}>
        {FILTER_TYPES.map((t) => (
          <button
            key={t}
            className={`${styles.typeBtn} ${band.type === t ? styles.typeActive : ''}`}
            onClick={() => updateBand(band.id, { type: t })}
            aria-label={`Set band ${n} to ${FILTER_LABELS[t]}`}
            aria-pressed={band.type === t}
          >
            {t}
          </button>
        ))}
      </div>

      <label className={styles.paramLabel}>
        <span className={styles.paramName}>Freq</span>
        <input
          type="number"
          className={styles.paramInput}
          value={band.frequency}
          min={20}
          max={20000}
          step={1}
          aria-label={`Band ${n} frequency in Hz`}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBand(band.id, { frequency: Math.max(20, Math.min(20000, v)) });
          }}
        />
        <span className={styles.paramUnit} aria-hidden="true">Hz</span>
      </label>

      <label className={styles.paramLabel}>
        <span className={styles.paramName}>Gain</span>
        <input
          type="number"
          className={styles.paramInput}
          value={band.gain}
          min={-24}
          max={24}
          step={0.1}
          aria-label={`Band ${n} gain in decibels`}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBand(band.id, { gain: Math.max(-24, Math.min(24, v)) });
          }}
        />
        <span className={styles.paramUnit} aria-hidden="true">dB</span>
      </label>

      <label className={styles.paramLabel}>
        <span className={styles.paramName}>Q</span>
        <input
          type="number"
          className={styles.paramInput}
          value={band.q}
          min={0.1}
          max={10}
          step={0.01}
          aria-label={`Band ${n} Q factor (bandwidth)`}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBand(band.id, { q: Math.max(0.1, Math.min(10, v)) });
          }}
        />
      </label>

      {showRemove ? (
        <button
          className={styles.removeBtn}
          onClick={() => removeBand(band.id)}
          aria-label={`Remove band ${n}`}
        >
          ×
        </button>
      ) : (
        <div className={styles.removePlaceholder} aria-hidden="true" />
      )}
    </div>
  );
}

export function EQBandControl() {
  const { bands, addBand } = useAppContext();

  return (
    <section className={styles.container} aria-label="Parametric EQ bands">
      <div className={styles.header}>
        <span className={styles.title} id="eq-bands-heading">EQ Bands</span>
        <button
          className={styles.addBtn}
          onClick={addBand}
          disabled={bands.length >= 10}
          aria-label={`Add EQ band (${bands.length} of 10 in use)`}
        >
          + Add Band
        </button>
      </div>
      <div className={styles.bands} role="list" aria-labelledby="eq-bands-heading">
        {bands.map((band, i) => (
          <div key={band.id} role="listitem">
            <BandRow band={band} index={i} showRemove={bands.length > 1} />
          </div>
        ))}
      </div>
      <p className={styles.hint} aria-live="polite">
        {bands.length}/10 bands · Drag handles on the curve, or use arrow keys when a handle is focused
      </p>
    </section>
  );
}
