import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/quicksand';
import '@fontsource-variable/nunito-sans';
import '../../assets/theme.css';
import App from './app.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
