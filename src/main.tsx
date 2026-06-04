import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/app/AppErrorBoundary.tsx';
import { initGlitchTip } from './lib/glitchtip.ts';
import './index.css';

initGlitchTip();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
