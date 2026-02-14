
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Service Worker for Offline Access
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isSubfolder = window.location.pathname.includes('/FitBunny');
    const swPath = isSubfolder ? '/FitBunny/sw.js' : './sw.js';
    
    navigator.serviceWorker.register(swPath).then(reg => {
      // Reload page when a new service worker takes over
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            window.location.reload();
          }
        });
      });
    }).catch(() => {});
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
