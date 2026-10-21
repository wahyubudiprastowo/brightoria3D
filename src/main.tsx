import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './ErrorBoundary';
import './styles.css';

// --- Modul dekoratif tanpa UI mandiri ---
import './game/kidsUi';
import './game/juice3d';

let guestModulesPromise: Promise<void> | null = null;
let authenticatedModulesPromise: Promise<void> | null = null;

function loadGuestModules(): Promise<void> {
  if (guestModulesPromise) return guestModulesPromise;

  guestModulesPromise = (async () => {
    // Latihan dan Ekspedisi adalah bagian dari pengalaman coba gratis.
    await import('./game/DailyPractice');
    await import('./game/expedition/ExpeditionLauncher');
    await import('./game/uiPolish');
    await import('./theme/brandHeader');
    await import('./theme/railButtons');
    await import('./theme/uiRefine');
  })().catch((error) => {
    guestModulesPromise = null;
    console.error('[Brightoria] Modul Mode Tamu gagal dimuat:', error);
  });

  return guestModulesPromise;
}

function loadAuthenticatedModules(): Promise<void> {
  if (authenticatedModulesPromise) return authenticatedModulesPromise;

  authenticatedModulesPromise = (async () => {
    await loadGuestModules();
    // Modul identitas, insight orang tua, dan pendamping akun tetap dimuat
    // hanya sesudah sesi pemain terverifikasi.
    await import('./game/CharacterPicker');
    await import('./game/ParentInsight');
    await import('./ai/AiCompanion');
    await import('./theme/playerBadge');
  })().catch((error) => {
    authenticatedModulesPromise = null;
    console.error('[Brightoria] Modul pemain gagal dimuat:', error);
  });

  return authenticatedModulesPromise;
}

window.addEventListener('brightoria:guest-ready', () => {
  void loadGuestModules();
});

window.addEventListener('brightoria:player-authenticated', () => {
  void loadAuthenticatedModules();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
