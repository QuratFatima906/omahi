import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../assets/theme.css';
import App from './app.tsx';

// Stamped before React renders so the (blocking) stylesheet paints the
// dark-aware surface immediately — no white flash on dark-theme tabs.
document.documentElement.dataset.surface = 'newtab';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
