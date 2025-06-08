
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Placeholder, Tailwind is loaded via CDN. This file can be empty or removed if no global styles beyond Tailwind are needed.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
