/**
 * Aviation Permit Book - Main App Component
 */

import { getBranding } from './config/branding.js';
import { getCurrentUser, signOut } from './services/auth.js';
import { renderLoginPage, attachFormHandlers } from './components/auth/LoginPage.js';
import { renderHeader, attachHeaderHandlers } from './components/layout/Header.js';
import { renderCountriesTab } from './components/countries/CountriesTab.js';
import { renderRoutePlanner } from './components/route-planner/RoutePlanner.js';
import { renderLeadTimeCalculator } from './components/lead-time/LeadTimeCalculator.js';
import { renderFBODirectory } from './components/fbo-directory/FBODirectory.js';
import { renderAirportsTab } from './components/airports/AirportsTab.js';
import { renderReference } from './components/reference/ReferenceTab.js';
import { renderAdminDashboard } from './components/admin/AdminDashboard.js';
import {
  isPWA,
  isReadOnlyMode,
  renderInstallPrompt,
  attachInstallPromptHandlers,
  shouldShowInstallPrompt,
} from './services/pwa.js';

// App state
const state = {
  currentTab: 'countries',
  isAuthenticated: false,
  user: null,
};

/**
 * Render the main application
 * @param {boolean} isAuthenticated - Whether user is authenticated
 */
export function renderApp(isAuthenticated) {
  state.isAuthenticated = isAuthenticated;
  state.user = getCurrentUser();

  const app = document.getElementById('app');

  if (!isAuthenticated) {
    app.innerHTML = renderLoginPage();
    attachLoginHandlers();
    return;
  }

  app.innerHTML = `
    ${renderHeader(state.user)}
    <main class="main-content">
      <div class="container">
        ${renderTabs()}
        <div id="tab-content">
          ${renderTabContent()}
        </div>
      </div>
    </main>
    ${renderOfflineBanner()}
    ${isReadOnlyMode() ? renderPWAIndicator() : ''}
    ${shouldShowInstallPrompt() ? renderInstallPrompt() : ''}
  `;

  attachAppHandlers();
  attachHeaderHandlers(switchTab);

  // Attach PWA install prompt handlers
  if (shouldShowInstallPrompt()) {
    attachInstallPromptHandlers();
  }
}

/**
 * Render tab navigation - Simplified with fewer tabs
 */
function renderTabs() {
  const tabs = [
    { id: 'countries', label: 'Countries', icon: '🌍' },
    { id: 'airports', label: 'Airports', icon: '🛬' },
    { id: 'routeplanner', label: 'Route Planner', icon: '✈️' },
    { id: 'leadtime', label: 'Lead Time', icon: '📅' },
    { id: 'fbos', label: 'FBOs', icon: '🏢' },
    { id: 'reference', label: 'Reference', icon: '📚' },
  ];

  return `
    <nav class="tabs" role="tablist">
      ${tabs.map(tab => `
        <button
          class="tab-btn ${state.currentTab === tab.id ? 'active' : ''}"
          data-tab="${tab.id}"
          role="tab"
          aria-selected="${state.currentTab === tab.id}"
        >
          <span class="tab-icon">${tab.icon}</span>
          <span class="tab-label">${tab.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

/**
 * Render current tab content
 */
function renderTabContent() {
  switch (state.currentTab) {
    case 'countries':
      return renderCountriesTab();
    case 'airports':
      return renderAirportsTab();
    case 'routeplanner':
      return renderRoutePlanner();
    case 'leadtime':
      return renderLeadTimeCalculator();
    case 'fbos':
      return renderFBODirectory();
    case 'reference':
      return renderReference();
    case 'admin':
      return renderAdminDashboard();
    default:
      return '<p>Tab not found</p>';
  }
}

function renderOfflineBanner() {
  return `
    <div id="offline-banner" class="offline-banner">
      You are offline. Some features may be unavailable.
    </div>
  `;
}

function renderPWAIndicator() {
  return `
    <div class="pwa-indicator">
      Read-only mode (PWA)
    </div>
  `;
}


/**
 * Attach event handlers for login page
 */
function attachLoginHandlers() {
  // Attach form handlers after DOM is updated
  attachFormHandlers();
}

/**
 * Attach event handlers for main app
 */
function attachAppHandlers() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.dataset.tab;
      switchTab(tabId);
    });
  });
}

/**
 * Switch to a different tab
 * @param {string} tabId - Tab identifier
 */
export function switchTab(tabId) {
  state.currentTab = tabId;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  // Update tab content
  const contentEl = document.getElementById('tab-content');
  if (contentEl) {
    contentEl.innerHTML = renderTabContent();
  }
}
