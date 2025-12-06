/**
 * Aviation Permit Book - Main Entry Point
 */

import './styles/main.css';
import { applyBrandingToDOM } from './config/branding.js';
import { initAuth, onAuthStateChange } from './services/auth.js';
import { renderApp } from './App.js';

// Initialize application
async function init() {
  console.log('Initializing Aviation Permit Book...');

  // Apply default branding
  applyBrandingToDOM();

  // Initialize Firebase Auth
  initAuth();

  // Listen for auth state changes
  onAuthStateChange((user) => {
    if (user) {
      console.log('User signed in:', user.email);
      renderApp(true);
    } else {
      console.log('User signed out');
      renderApp(false);
    }
  });

  // Register service worker for PWA (production only)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Detect PWA mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
             || window.navigator.standalone;

  if (isPWA) {
    document.body.classList.add('pwa-mode');
    console.log('Running in PWA mode');
  }

  // Offline detection
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

function updateOnlineStatus() {
  const banner = document.getElementById('offline-banner');
  if (banner) {
    banner.classList.toggle('visible', !navigator.onLine);
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
