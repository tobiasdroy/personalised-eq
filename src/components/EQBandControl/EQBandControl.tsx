import { useAppContext } from '../../context/AppContext';
import type { EQBand, FilterType } from '../../types';
import styles from './EQBandControl.module.css';

const FILTER_LABELS: Record<FilterType, string> = { PK: 'Peak', LSC: 'Low Shelf', HSC: 'High Shelf' };
const FILTER_TYPES: FilterType[] = ['PK', 'LSC', 'HSC'];

function BandRow({ band, index, showRemove }: { band: EQBand; index: number; showRemove: boolean }) {
  const { updateBand, removeBand } = useAppContext();

  return (
    <div className={`${styles.row} ${!band.enabled ? styles.disabled : ''}`}>
      <button
        className={`${styles.enableToggle} ${band.enabled ? styles.enabled : ''}`}
        onClick={() => updateBand(band.id, { enabled: !band.enabled })}
        title={band.enabled ? 'Disable band' : 'Enable band'}
      >
        {index + 1}
      </button>

      <div className={styles.typeSelect}>
        {FILTER_TYPES.map((t) => (
          <button
            key={t}
            className={`${styles.typeBtn} ${band.type === t ? styles.typeActive : ''}`}
            onClick={() => updateBand(band.id, { type: t })}
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
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBand(band.id, { frequency: Math.max(20, Math.min(20000, v)) });
          }}
        />
        <span className={styles.paramUnit}>Hz</span>
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
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBand(band.id, { gain: Math.max(-24, Math.min(24, v)) });
          }}
        />
        <span className={styles.paramUnit}>dB</span>
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
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBand(band.id, { q: Math.max(0.1, Math.min(10, v)) });
          }}
        />
      </label>

      {showRemove ? (
        <button className={styles.removeBtn} onClick={() => removeBand(band.id)} title="Remove band">
          ×
        </button>
      ) : (
        <div className={styles.removePlaceholder} />
      )}
    </div>
  );
}

export function EQBandControl() {
  const { bands, addBand } = useAppContext();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>EQ Bands</span>
        <button
          className={styles.addBtn}
          onClick={addBand}
          disabled={bands.length >= 10}
          title="Add band"
        >
          + Add Band
        </button>
      </div>
      <div className={styles.bands}>
        {bands.map((band, i) => (
          <BandRow key={band.id} band={band} index={i} showRemove={bands.length > 1} />
        ))}
      </div>
      <p className={styles.hint}>
        {bands.length}/10 bands · Drag handles on the curve to adjust frequency and gain
      </p>
    </div>
  );
}
