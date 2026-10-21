import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './ErrorBoundary';
import './styles.css';

// --- Modul dekoratif tanpa UI mandiri ---
import './game/kidsUi';
import './game/juice3d';

let authenticatedModulesLoaded = false;

async function loadAuthenticatedModules() {
  if (authenticatedModulesLoaded) return;
  authenticatedModulesLoaded = true;

  try {
    // Modul-modul ini membuat tombol/panel langsung di document.body. Muat
    // hanya setelah sesi pemain terverifikasi agar layar login dan admin
    // tidak tertutup UI permainan lama.
    await import('./game/CharacterPicker');
    await import('./game/ParentInsight');
    await import('./game/DailyPractice');
    await import('./game/expedition/ExpeditionLauncher');
    await import('./ai/AiCompanion');
    await import('./game/uiPolish');
    await import('./theme/brandHeader');
    await import('./theme/playerBadge');
    await import('./theme/railButtons');
    await import('./theme/uiRefine'); // PALING AKHIR: menang bila ada tumpang tindih
  } catch (error) {
    authenticatedModulesLoaded = false;
    console.error('[Brightoria] Modul pemain gagal dimuat:', error);
  }
}

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
