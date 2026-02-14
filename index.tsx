
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Improved Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const basePath = window.location.pathname.includes('/FitBunny') ? '/FitBunny/' : './';
    navigator.serviceWorker.register(`${basePath}sw.js`).catch(err => {
      console.warn('Service Worker registration skipped:', err);
    });
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
