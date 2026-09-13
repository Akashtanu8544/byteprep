import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PwaService } from './services/pwaService';

// Initialize PWA Service Worker registration
PwaService.registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

