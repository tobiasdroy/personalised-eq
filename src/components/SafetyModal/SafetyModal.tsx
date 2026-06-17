import { useState, useRef, useEffect } from 'react';
import styles from './SafetyModal.module.css';

interface Props {
  onAccept?: () => void;
  onClose?: () => void;
  mode?: 'gate' | 'review';
}

export function SafetyModal({ onAccept, onClose, mode = 'gate' }: Props) {
  const [checked, setChecked] = useState(false);
  const isReview = mode === 'review';
  const modalRef = useRef<HTMLDivElement>(null);
  const headingId = 'safety-modal-heading';

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, input[type="checkbox"], a[href], [tabindex="0"]',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, []);

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog" aria-labelledby={headingId}>
      <div className={styles.modal} ref={modalRef}>
        <h1 id={headingId} className={styles.heading}>Before you start</h1>

        <div className={styles.body}>
          <p className={styles.intro}>
            This tool plays pure sine tones across the full frequency range. Because of how
            human hearing works, some frequencies can sound much louder than others — so it's
            worth taking a moment to set up carefully.
          </p>

          <div className={styles.actionCard}>
            <p className={styles.actionTitle}>Turn your volume down first</p>
            <p className={styles.actionText}>
              Start with your hardware volume at its lowest setting, then raise it slowly once
              you're in the app. Stop immediately if you feel any discomfort or ringing.
            </p>
          </div>

          <ul className={styles.points}>
            <li>This tool is for personal use only — you use it at your own risk</li>
            <li>The developer is not liable for hearing damage or hardware damage</li>
            <li>It's not a substitute for professional audiological advice</li>
            <li>This tool is intended for adults (18+)</li>
          </ul>
        </div>

        <div className={styles.footer}>
          {isReview ? (
            <button className={styles.acceptBtn} onClick={onClose} aria-label="Close safety notice">
              Close
            </button>
          ) : (
            <>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  aria-label="I understand and want to continue"
                />
                <span>I understand and want to continue</span>
              </label>
              <button
                className={styles.acceptBtn}
                onClick={onAccept}
                disabled={!checked}
                aria-disabled={!checked}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
