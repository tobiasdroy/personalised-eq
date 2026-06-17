import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import styles from './PanicButton.module.css';

export function PanicButton() {
  const { panic } = useAppContext();

  // Spacebar shortcut — only fires when no interactive element is focused
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      panic();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panic]);

  return (
    <button
      className={styles.btn}
      onClick={panic}
      aria-label="Emergency stop — stop all audio immediately"
      aria-keyshortcuts="Space"
      title="Stop all audio (Space)"
    >
      <span className={styles.icon} aria-hidden="true">■</span>
      STOP
    </button>
  );
}
