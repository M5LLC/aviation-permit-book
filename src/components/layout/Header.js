/**
 * Header Component
 */

import { getBranding } from '../../config/branding.js';
import { signOut } from '../../services/auth.js';

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
          <div class="user-menu-container">
            <button id="user-menu-btn" class="user-menu-btn" aria-haspopup="true" aria-expanded="false">
              <span class="user-avatar">${getUserInitials(user)}</span>
              <span class="user-name">${user?.displayName || user?.email || 'User'}</span>
              ${user?.role === 'admin' ? '<span class="badge badge-admin">Admin</span>' : ''}
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div id="user-menu-dropdown" class="user-menu-dropdown">
              <div class="menu-header">
                <span class="menu-email">${user?.email || ''}</span>
              </div>
              <div class="menu-items">
                <button class="menu-item" data-action="profile">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile
                </button>
                <button class="menu-item" data-action="settings">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Settings
                </button>
                ${user?.role === 'admin' ? `
                <button class="menu-item" data-action="admin">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Admin Dashboard
                </button>
                ` : ''}
              </div>
              <div class="menu-footer">
                <button class="menu-item menu-item-danger" data-action="signout">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    ${renderHeaderStyles()}
  `;
}

/**
 * Get user initials for avatar
 */
function getUserInitials(user) {
  if (user?.displayName) {
    return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (user?.email) {
    return user.email[0].toUpperCase();
  }
  return 'U';
}

/**
 * Attach header event handlers
 */
export function attachHeaderHandlers(switchTabFn) {
  const menuBtn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-menu-dropdown');

  if (menuBtn && dropdown) {
    // Toggle dropdown
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      dropdown.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', !isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Handle menu item clicks
    dropdown.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const action = e.currentTarget.dataset.action;
        dropdown.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');

        switch (action) {
          case 'profile':
            // TODO: Open profile modal
            alert('Profile settings coming soon!');
            break;
          case 'settings':
            // TODO: Open settings modal
            alert('Settings coming soon!');
            break;
          case 'admin':
            if (switchTabFn) switchTabFn('admin');
            break;
          case 'signout':
            await signOut();
            break;
        }
      });
    });
  }
}

/**
 * Header styles
 */
function renderHeaderStyles() {
  return `
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

      /* User Menu */
      .user-menu-container {
        position: relative;
      }

      .user-menu-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-md);
        padding: var(--spacing-xs) var(--spacing-md);
        color: var(--white);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .user-menu-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        background: var(--accent);
        color: var(--primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.85rem;
      }

      .user-name {
        font-size: 0.875rem;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .badge-admin {
        background: var(--accent);
        color: var(--primary);
        font-size: 0.65rem;
        padding: 0.15rem 0.4rem;
        border-radius: 999px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .chevron-icon {
        transition: transform 0.2s ease;
      }

      .user-menu-btn[aria-expanded="true"] .chevron-icon {
        transform: rotate(180deg);
      }

      /* Dropdown */
      .user-menu-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 220px;
        background: var(--white);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
        z-index: 200;
        overflow: hidden;
      }

      .user-menu-dropdown.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .menu-header {
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-100);
      }

      .menu-email {
        font-size: 0.8rem;
        color: var(--gray-600);
      }

      .menu-items {
        padding: var(--spacing-xs) 0;
      }

      .menu-footer {
        padding: var(--spacing-xs) 0;
        border-top: 1px solid var(--gray-200);
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        background: none;
        border: none;
        color: var(--gray-700);
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.15s ease;
        text-align: left;
      }

      .menu-item:hover {
        background: var(--gray-100);
      }

      .menu-item svg {
        color: var(--gray-500);
      }

      .menu-item-danger {
        color: var(--danger);
      }

      .menu-item-danger:hover {
        background: rgba(220, 53, 69, 0.1);
      }

      .menu-item-danger svg {
        color: var(--danger);
      }

      .main-content {
        padding: var(--spacing-lg);
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
      }

      @media (max-width: 600px) {
        .user-name {
          display: none;
        }

        .badge-admin {
          display: none;
        }
      }
    </style>
  `;
}
