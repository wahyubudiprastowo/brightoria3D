import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './ErrorBoundary';
import './styles.css';

// --- Modul self-mounting ---
import './game/kidsUi';
import './game/juice3d';
import './game/CharacterPicker';
import './game/ParentInsight';
import './game/DailyPractice';
import './game/expedition/ExpeditionLauncher';
import './ai/AiCompanion';
import './game/uiPolish';
import './theme/brandHeader';
import './theme/playerBadge';
import './theme/railButtons';
import './theme/uiRefine'; // PALING AKHIR: menang bila ada tumpang tindih

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
