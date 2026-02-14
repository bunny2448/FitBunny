
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Service Worker for Offline Access
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isSubfolder = window.location.pathname.includes('/FitBunny');
    const swPath = isSubfolder ? '/FitBunny/sw.js' : './sw.js';
    navigator.serviceWorker.register(swPath).catch(() => {});
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
