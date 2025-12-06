/**
 * PWA Service
 * Handles PWA detection, install prompts, and read-only mode
 */

// Check if running as installed PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

// Check if device is mobile
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
}

// Check if app is in read-only mode (PWA on mobile)
export function isReadOnlyMode() {
  return isPWA() && isMobile();
}

// Check if app is offline
export function isOffline() {
  return !navigator.onLine;
}

// Get PWA install prompt (stored by index.html)
export function getInstallPrompt() {
  return window.pwaInstallPrompt;
}

// Show install prompt
export async function showInstallPrompt() {
  const prompt = getInstallPrompt();
  if (!prompt) return false;

  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  window.pwaInstallPrompt = null;

  return outcome === 'accepted';
}

// Check if install prompt is available
export function canInstall() {
  return !!getInstallPrompt();
}

// Subscribe to online/offline changes
export function subscribeToConnectivity(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Subscribe to PWA display mode changes
export function subscribeToDisplayMode(callback) {
  const mediaQuery = window.matchMedia('(display-mode: standalone)');

  const handleChange = (e) => callback(e.matches);
  mediaQuery.addEventListener('change', handleChange);

  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

// Get cached data freshness info
export function getCacheInfo() {
  const lastSync = localStorage.getItem('permitbook_last_sync');
  return {
    lastSync: lastSync ? new Date(lastSync) : null,
    isStale: lastSync ? (Date.now() - new Date(lastSync).getTime()) > 24 * 60 * 60 * 1000 : true,
  };
}

// Update last sync timestamp
export function updateLastSync() {
  localStorage.setItem('permitbook_last_sync', new Date().toISOString());
}

// Request persistent storage (for PWA)
export async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Persistent storage: ${isPersisted ? 'granted' : 'denied'}`);
    return isPersisted;
  }
  return false;
}

// Get storage estimate
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentUsed: Math.round((estimate.usage / estimate.quota) * 100),
    };
  }
  return null;
}

/**
 * Render PWA-specific UI elements
 */
export function renderPWABanner() {
  if (!isReadOnlyMode()) return '';

  return `
    <div class="pwa-mode-banner">
      <span class="pwa-icon">📱</span>
      <span class="pwa-text">Read-only mode - Use desktop for editing</span>
    </div>
  `;
}

export function renderInstallPrompt() {
  if (isPWA() || !canInstall()) return '';

  return `
    <div class="install-prompt" id="install-prompt">
      <div class="install-content">
        <span class="install-icon">📲</span>
        <span class="install-text">Install Permit Book for quick access</span>
      </div>
      <div class="install-actions">
        <button class="btn btn-sm btn-primary" id="install-btn">Install</button>
        <button class="btn btn-sm btn-outline" id="dismiss-install">Dismiss</button>
      </div>
    </div>
  `;
}

export function attachInstallPromptHandlers() {
  const installBtn = document.getElementById('install-btn');
  const dismissBtn = document.getElementById('dismiss-install');
  const promptEl = document.getElementById('install-prompt');

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      const accepted = await showInstallPrompt();
      if (accepted && promptEl) {
        promptEl.remove();
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      if (promptEl) {
        promptEl.remove();
        localStorage.setItem('permitbook_install_dismissed', 'true');
      }
    });
  }
}

// Should show install prompt (not dismissed recently)
export function shouldShowInstallPrompt() {
  if (isPWA() || !canInstall()) return false;

  const dismissed = localStorage.getItem('permitbook_install_dismissed');
  if (!dismissed) return true;

  // Show again after 7 days
  const dismissedAt = new Date(dismissed);
  return (Date.now() - dismissedAt.getTime()) > 7 * 24 * 60 * 60 * 1000;
}

/**
 * PWA Styles
 */
export function getPWAStyles() {
  return `
    .pwa-mode-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #1e3a5f, #2c5282);
      color: white;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.85rem;
      z-index: 1000;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
    }

    .pwa-icon {
      font-size: 1rem;
    }

    .install-prompt {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 1001;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .install-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .install-icon {
      font-size: 1.5rem;
    }

    .install-text {
      flex: 1;
      font-weight: 500;
    }

    .install-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    /* Offline indicator */
    body.offline .offline-banner {
      display: block !important;
    }

    .offline-banner {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc3545;
      color: white;
      padding: 8px 16px;
      text-align: center;
      font-size: 0.85rem;
      z-index: 9999;
    }

    /* Disable edit buttons in read-only mode */
    body.pwa-readonly .btn-edit,
    body.pwa-readonly .edit-action,
    body.pwa-readonly [data-action="edit"],
    body.pwa-readonly .override-btn,
    body.pwa-readonly .notes-btn {
      opacity: 0.5;
      pointer-events: none;
    }

    body.pwa-readonly .btn-edit::after,
    body.pwa-readonly .edit-action::after {
      content: " (Desktop only)";
      font-size: 0.75em;
    }
  `;
}

// Initialize PWA mode
export function initPWAMode() {
  if (isReadOnlyMode()) {
    document.body.classList.add('pwa-readonly');
  }

  if (isOffline()) {
    document.body.classList.add('offline');
  }

  // Add PWA styles
  const styleEl = document.createElement('style');
  styleEl.textContent = getPWAStyles();
  document.head.appendChild(styleEl);
}
