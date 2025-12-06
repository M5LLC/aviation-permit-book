/**
 * Header Component
 */

import { getBranding } from '../../config/branding.js';

/**
 * Render the application header
 * @param {Object} user - Current user object
 * @returns {string} HTML string
 */
export function renderHeader(user) {
  const appName = getBranding('appName');
  const logoUrl = getBranding('logoUrl');

  return `
    <header class="header">
      <div class="header-container">
        <div class="header-brand">
          <img src="${logoUrl}" alt="${appName}" class="header-logo" onerror="this.style.display='none'">
          <h1 class="header-title">${appName}</h1>
        </div>
        <div class="header-user">
          <span class="user-name">${user?.displayName || user?.email || 'User'}</span>
          ${user?.role === 'admin' ? '<span class="badge badge-info">Admin</span>' : ''}
          <button id="sign-out-btn" class="btn btn-secondary btn-sm">
            Sign Out
          </button>
        </div>
      </div>
    </header>
    <style>
      .header {
        background: var(--primary);
        color: var(--white);
        padding: var(--spacing-md) var(--spacing-lg);
        box-shadow: var(--shadow-md);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-container {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .header-brand {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .header-logo {
        height: 36px;
        width: auto;
      }

      .header-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .header-user {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .user-name {
        font-size: 0.875rem;
        opacity: 0.9;
      }

      .btn-sm {
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
      }

      .main-content {
        padding: var(--spacing-lg);
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
      }
    </style>
  `;
}
