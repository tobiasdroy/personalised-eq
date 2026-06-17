import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { EQCurve } from './components/EQCurve/EQCurve';
import { EQBandControl } from './components/EQBandControl/EQBandControl';
import { OscillatorControl } from './components/OscillatorControl/OscillatorControl';
import { AudioFilePlayer } from './components/AudioFilePlayer/AudioFilePlayer';
import { ProfileManager } from './components/ProfileManager/ProfileManager';
import { PanicButton } from './components/PanicButton/PanicButton';
import { Footer } from './components/Footer/Footer';
import { SafetyModal } from './components/SafetyModal/SafetyModal';
import { Wizard } from './components/Wizard/Wizard';
import { useTheme } from './hooks/useTheme';
import './styles/globals.css';
import styles from './App.module.css';

function Header({ onToggleTheme, theme }: { onToggleTheme: () => void; theme: string }) {
  const location = useLocation();
  const isWizard = location.pathname === '/wizard';

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>PersonalisedEQ</Link>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link to="/wizard" className={`${styles.navLink} ${isWizard ? styles.navActive : ''}`}>
          Wizard
        </Link>
      </nav>
      <div className={styles.headerRight}>
        <button
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <ProfileManager />
      </div>
    </header>
  );
}

function MainLayout() {
  return (
    <main className={styles.main} id="main-content">
      <EQCurve />
      <EQBandControl />
      <div className={styles.row}>
        <OscillatorControl />
        <AudioFilePlayer />
      </div>
    </main>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [safetyAccepted, setSafetyAccepted] = useState(
    () => localStorage.getItem('eq-safety-accepted') === 'true',
  );

  function handleAccept() {
    localStorage.setItem('eq-safety-accepted', 'true');
    setSafetyAccepted(true);
  }

  return (
    <>
      {!safetyAccepted && <SafetyModal onAccept={handleAccept} />}
      <BrowserRouter>
        <AppProvider safetyAccepted={safetyAccepted}>
          <div className={styles.app} aria-hidden={!safetyAccepted || undefined}>
            <a href="#main-content" className={styles.skipLink}>Skip to main content</a>
            <Header onToggleTheme={toggleTheme} theme={theme} />
            <Routes>
              <Route path="/" element={<MainLayout />} />
              <Route path="/wizard" element={<Wizard />} />
            </Routes>
            <Footer />
            <PanicButton />
          </div>
        </AppProvider>
      </BrowserRouter>
    </>
  );
}
