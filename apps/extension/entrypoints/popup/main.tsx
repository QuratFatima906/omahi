import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../assets/extension.css';
import App from './app.tsx';

// Stamped before React renders so the (blocking) stylesheet paints the
// dark-aware field immediately — no white flash on dark-theme popups.
document.documentElement.dataset.surface = 'popup';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
