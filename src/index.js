/**
 * Aviation Permit Book - Main Entry Point
 */

import './styles/main.css';
import { applyBrandingToDOM } from './config/branding.js';
import { initAuth, onAuthStateChange } from './services/auth.js';
import { renderApp } from './App.js';
import { initPWAMode, isReadOnlyMode, isPWA, updateLastSync } from './services/pwa.js';

// Initialize application
async function init() {
  console.log('Initializing Aviation Permit Book...');

  // Initialize PWA mode (adds styles, detects read-only mode)
  initPWAMode();

  // Apply default branding
  applyBrandingToDOM();

  // Initialize Firebase Auth
  initAuth();

  // Listen for auth state changes
  onAuthStateChange((user) => {
    // Hide loading screen
    hideLoadingScreen();

    if (user) {
      console.log('User signed in:', user.email);
      renderApp(true);
      updateLastSync(); // Track last successful data sync
    } else {
      console.log('User signed out');
      renderApp(false);
    }
  });

  // Log PWA status
  if (isPWA()) {
    console.log('Running in PWA mode');
    if (isReadOnlyMode()) {
      console.log('Read-only mode enabled (mobile PWA)');
    }
  }
}

/**
 * Hide the loading screen
 */
function hideLoadingScreen() {
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    loadingEl.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      loadingEl.remove();
    }, 300);
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Handle app visibility changes (for data refresh)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // App became visible - could trigger data refresh here
    console.log('App became visible');
  }
});
