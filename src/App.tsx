import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { EQCurve } from './components/EQCurve/EQCurve';
import { EQBandControl } from './components/EQBandControl/EQBandControl';
import { OscillatorControl } from './components/OscillatorControl/OscillatorControl';
import { AudioFilePlayer } from './components/AudioFilePlayer/AudioFilePlayer';
import { ProfileManager } from './components/ProfileManager/ProfileManager';
import { Wizard } from './components/Wizard/Wizard';
import './styles/globals.css';
import styles from './App.module.css';

function Header() {
  const location = useLocation();
  const isWizard = location.pathname === '/wizard';

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>PersonalisedEQ</Link>
      <nav className={styles.nav}>
        <Link to="/wizard" className={`${styles.navLink} ${isWizard ? styles.navActive : ''}`}>
          Wizard
        </Link>
      </nav>
      <ProfileManager />
    </header>
  );
}

function MainLayout() {
  return (
    <main className={styles.main}>
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
  return (
    <BrowserRouter>
      <AppProvider>
        <div className={styles.app}>
          <Header />
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/wizard" element={<Wizard />} />
          </Routes>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
