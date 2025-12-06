/**
 * White-label branding configuration
 * These are default values that can be overridden by organization settings in Firestore
 */

export const defaultBranding = {
  // App identity
  appName: 'Permit Book',
  companyName: '',
  tagline: 'Aviation Permit Management',
  description: 'Permit management tool for flight departments and charter operations',

  // Logos and icons
  logoUrl: '/icons/icon.svg',
  logoWidth: 40,
  logoHeight: 40,
  faviconUrl: '/icons/icon.svg',
  appleTouchIcon: '/icons/icon-180.png',

  // Theme colors
  primaryColor: '#1e3a5f',      // Navy
  primaryLight: '#2d4a6f',
  primaryDark: '#0f1f33',
  accentColor: '#c9a962',       // Gold
  accentLight: '#d4b87a',
  accentDark: '#a88942',

  // Background colors
  backgroundColor: '#f5f7fa',
  surfaceColor: '#ffffff',
  headerColor: '#1e3a5f',

  // Text colors
  textPrimary: '#1a1a2e',
  textSecondary: '#6c757d',
  textMuted: '#9ca3af',

  // Status colors
  successColor: '#28a745',
  warningColor: '#ffc107',
  dangerColor: '#dc3545',
  infoColor: '#17a2b8',

  // Confidence level colors (for permit data)
  highConfidence: '#28a745',
  mediumConfidence: '#ffc107',
  lowConfidence: '#dc3545',

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  monoFontFamily: '"SF Mono", "Fira Code", Consolas, "Courier New", monospace',

  // Border radius
  borderRadius: '8px',
  borderRadiusSmall: '4px',
  borderRadiusLarge: '12px',

  // Shadows
  shadowSmall: '0 1px 3px rgba(0,0,0,0.1)',
  shadowMedium: '0 4px 6px rgba(0,0,0,0.1)',
  shadowLarge: '0 10px 25px rgba(0,0,0,0.15)',

  // Contact information
  supportEmail: '',
  supportUrl: '',
  supportPhone: '',

  // Footer
  footerText: '',
  showPoweredBy: true,
  copyrightYear: new Date().getFullYear(),

  // Feature flags
  features: {
    routePlanner: true,
    leadTimeCalculator: true,
    fboDirectory: true,
    changelog: true,
    userNotes: true,
    dataOverrides: true,
    pwaInstall: true,
  },

  // Custom CSS (advanced)
  customCSS: '',
};

// Current branding state (can be updated after fetching org settings)
let currentBranding = { ...defaultBranding };

/**
 * Update branding with organization-specific settings
 * @param {Object} orgBranding - Branding settings from Firestore
 */
export function updateBranding(orgBranding) {
  // Deep merge features
  const mergedFeatures = {
    ...defaultBranding.features,
    ...(orgBranding.features || {}),
  };

  currentBranding = {
    ...defaultBranding,
    ...orgBranding,
    features: mergedFeatures,
  };

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
 * Check if a feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} Whether feature is enabled
 */
export function isFeatureEnabled(feature) {
  return currentBranding.features?.[feature] ?? defaultBranding.features?.[feature] ?? true;
}

/**
 * Apply branding colors to CSS custom properties
 */
export function applyBrandingToDOM() {
  const root = document.documentElement;

  // Theme colors
  root.style.setProperty('--primary', currentBranding.primaryColor);
  root.style.setProperty('--primary-light', currentBranding.primaryLight);
  root.style.setProperty('--primary-dark', currentBranding.primaryDark);
  root.style.setProperty('--accent', currentBranding.accentColor);
  root.style.setProperty('--accent-light', currentBranding.accentLight);
  root.style.setProperty('--accent-dark', currentBranding.accentDark);

  // Background colors
  root.style.setProperty('--background', currentBranding.backgroundColor);
  root.style.setProperty('--surface', currentBranding.surfaceColor);
  root.style.setProperty('--header-bg', currentBranding.headerColor);

  // Text colors
  root.style.setProperty('--text-primary', currentBranding.textPrimary);
  root.style.setProperty('--text-secondary', currentBranding.textSecondary);
  root.style.setProperty('--text-muted', currentBranding.textMuted);

  // Status colors
  root.style.setProperty('--success', currentBranding.successColor);
  root.style.setProperty('--warning', currentBranding.warningColor);
  root.style.setProperty('--danger', currentBranding.dangerColor);
  root.style.setProperty('--info', currentBranding.infoColor);

  // Confidence colors
  root.style.setProperty('--confidence-high', currentBranding.highConfidence);
  root.style.setProperty('--confidence-medium', currentBranding.mediumConfidence);
  root.style.setProperty('--confidence-low', currentBranding.lowConfidence);

  // Typography
  root.style.setProperty('--font-family', currentBranding.fontFamily);
  root.style.setProperty('--mono-font', currentBranding.monoFontFamily);

  // Border radius
  root.style.setProperty('--radius', currentBranding.borderRadius);
  root.style.setProperty('--radius-sm', currentBranding.borderRadiusSmall);
  root.style.setProperty('--radius-lg', currentBranding.borderRadiusLarge);

  // Shadows
  root.style.setProperty('--shadow-sm', currentBranding.shadowSmall);
  root.style.setProperty('--shadow-md', currentBranding.shadowMedium);
  root.style.setProperty('--shadow-lg', currentBranding.shadowLarge);

  // Update page title
  document.title = currentBranding.appName;

  // Update meta tags
  updateMetaTags();

  // Apply custom CSS if provided
  if (currentBranding.customCSS) {
    applyCustomCSS(currentBranding.customCSS);
  }
}

/**
 * Update HTML meta tags with branding
 */
function updateMetaTags() {
  // Update description
  let descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    descMeta.content = currentBranding.description;
  }

  // Update theme color
  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.content = currentBranding.primaryColor;
  }

  // Update apple app title
  let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleMeta) {
    appleMeta.content = currentBranding.appName;
  }
}

/**
 * Apply custom CSS
 * @param {string} css - Custom CSS string
 */
function applyCustomCSS(css) {
  let styleEl = document.getElementById('custom-branding-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-branding-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

/**
 * Generate CSS variables string for embedding
 * @returns {string} CSS variables declaration
 */
export function getCSSVariables() {
  return `
    :root {
      --primary: ${currentBranding.primaryColor};
      --primary-light: ${currentBranding.primaryLight};
      --primary-dark: ${currentBranding.primaryDark};
      --accent: ${currentBranding.accentColor};
      --accent-light: ${currentBranding.accentLight};
      --accent-dark: ${currentBranding.accentDark};
      --background: ${currentBranding.backgroundColor};
      --surface: ${currentBranding.surfaceColor};
      --success: ${currentBranding.successColor};
      --warning: ${currentBranding.warningColor};
      --danger: ${currentBranding.dangerColor};
      --info: ${currentBranding.infoColor};
      --font-family: ${currentBranding.fontFamily};
      --radius: ${currentBranding.borderRadius};
    }
  `;
}

/**
 * Load branding from organization data
 * @param {Object} organization - Organization document from Firestore
 */
export async function loadOrganizationBranding(organization) {
  if (!organization || !organization.branding) {
    return;
  }

  updateBranding(organization.branding);
}

export default currentBranding;
