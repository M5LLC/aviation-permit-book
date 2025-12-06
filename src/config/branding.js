/**
 * White-label branding configuration
 * These are default values that can be overridden by organization settings in Firestore
 */

export const defaultBranding = {
  appName: 'Permit Book',
  companyName: '',
  tagline: 'Aviation Permit Management',
  logoUrl: '/icons/logo.svg',
  faviconUrl: '/icons/favicon.ico',

  // Colors
  primaryColor: '#1e3a5f',      // Navy
  primaryLight: '#2d4a6f',
  primaryDark: '#0f1f33',
  accentColor: '#c9a962',       // Gold
  accentLight: '#d4b87a',

  // Status colors
  successColor: '#28a745',
  warningColor: '#ffc107',
  dangerColor: '#dc3545',
  infoColor: '#17a2b8',

  // Confidence level colors
  highConfidence: '#28a745',
  mediumConfidence: '#ffc107',
  lowConfidence: '#dc3545',

  // Contact
  supportEmail: '',
  supportUrl: '',

  // Footer
  footerText: '',
  showPoweredBy: true,
};

// Current branding state (can be updated after fetching org settings)
let currentBranding = { ...defaultBranding };

/**
 * Update branding with organization-specific settings
 * @param {Object} orgBranding - Branding settings from Firestore
 */
export function updateBranding(orgBranding) {
  currentBranding = { ...defaultBranding, ...orgBranding };
  applyBrandingToDOM();
}

/**
 * Get current branding value
 * @param {string} key - Branding property key
 * @returns {any} Branding value
 */
export function getBranding(key) {
  return currentBranding[key] ?? defaultBranding[key];
}

/**
 * Get all current branding settings
 * @returns {Object} Current branding configuration
 */
export function getAllBranding() {
  return { ...currentBranding };
}

/**
 * Apply branding colors to CSS custom properties
 */
export function applyBrandingToDOM() {
  const root = document.documentElement;

  root.style.setProperty('--primary', currentBranding.primaryColor);
  root.style.setProperty('--primary-light', currentBranding.primaryLight);
  root.style.setProperty('--primary-dark', currentBranding.primaryDark);
  root.style.setProperty('--accent', currentBranding.accentColor);
  root.style.setProperty('--accent-light', currentBranding.accentLight);
  root.style.setProperty('--success', currentBranding.successColor);
  root.style.setProperty('--warning', currentBranding.warningColor);
  root.style.setProperty('--danger', currentBranding.dangerColor);
  root.style.setProperty('--info', currentBranding.infoColor);

  // Update page title
  document.title = currentBranding.appName;
}

export default currentBranding;
