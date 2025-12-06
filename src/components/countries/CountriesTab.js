/**
 * Countries Tab Component
 * Displays permit requirements for countries worldwide
 */

// Placeholder - will be connected to Firestore
const placeholderCountries = [
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America', confidence: 'high' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', confidence: 'high' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', region: 'Middle East', confidence: 'high' },
];

/**
 * Render the Countries tab
 * @returns {string} HTML string
 */
export function renderCountriesTab() {
  return `
    <div class="countries-tab">
      ${renderFilters()}
      ${renderCountriesGrid()}
    </div>
    ${renderCountriesStyles()}
  `;
}

/**
 * Render search and filter controls
 */
function renderFilters() {
  return `
    <div class="filters-bar">
      <div class="search-box">
        <input type="text" id="country-search" class="input"
               placeholder="Search countries, ICAO codes, or airports...">
      </div>
      <div class="filter-controls">
        <select id="region-filter" class="select">
          <option value="">All Regions</option>
          <option value="Europe">Europe</option>
          <option value="North America">North America</option>
          <option value="South America">South America</option>
          <option value="Asia">Asia</option>
          <option value="Middle East">Middle East</option>
          <option value="Africa">Africa</option>
          <option value="Caribbean">Caribbean</option>
          <option value="Oceania">Oceania</option>
        </select>
        <select id="operation-filter" class="select">
          <option value="">All Operations</option>
          <option value="private">Private</option>
          <option value="charter">Charter</option>
        </select>
        <select id="confidence-filter" class="select">
          <option value="">All Confidence</option>
          <option value="high">High Only</option>
          <option value="medium">Medium+</option>
        </select>
      </div>
      <div class="results-count">
        <span id="results-count">Loading...</span>
      </div>
    </div>
  `;
}

/**
 * Render countries grid (placeholder)
 */
function renderCountriesGrid() {
  return `
    <div id="countries-grid" class="countries-grid">
      <div class="loading">
        <div class="spinner"></div>
        <p class="mt-2">Loading countries...</p>
      </div>
    </div>
  `;
}

/**
 * Render a single country card
 * @param {Object} country - Country data
 */
export function renderCountryCard(country) {
  const confidenceClass = {
    high: 'badge-success',
    medium: 'badge-warning',
    low: 'badge-danger',
  }[country.confidence] || 'badge-info';

  return `
    <div class="country-card" data-code="${country.code}">
      <div class="country-header">
        <div class="country-title">
          <span class="country-flag">${country.flag}</span>
          <div>
            <h3 class="country-name">${country.name}</h3>
            <span class="country-meta">${country.icaoPrefix || ''} • ${country.code}</span>
          </div>
        </div>
        <span class="badge ${confidenceClass}">${country.confidence}</span>
      </div>
      <div class="country-body">
        ${renderPermitTable(country.permits)}
        ${renderWarnings(country.warnings)}
      </div>
      <div class="country-footer">
        <span class="source-info">Source: ${country.source || 'Verify'} | Updated: ${country.lastVerified || 'N/A'}</span>
        <div class="country-actions">
          <button class="btn btn-secondary btn-sm" data-action="notes" data-code="${country.code}">
            Notes
          </button>
          <button class="btn btn-secondary btn-sm" data-action="override" data-code="${country.code}">
            Override
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render permit requirements table
 */
function renderPermitTable(permits) {
  if (!permits) return '<p class="text-muted">No permit data available</p>';

  const rows = [];
  const types = [
    { key: 'overflight', label: 'Overflight' },
    { key: 'landingPrivate', label: 'Landing (Private)' },
    { key: 'landingCharter', label: 'Landing (Charter)' },
  ];

  types.forEach(type => {
    const permit = permits[type.key];
    if (permit) {
      const reqBadge = permit.required
        ? '<span class="badge badge-danger">Required</span>'
        : '<span class="badge badge-success">Not Required</span>';
      const leadTime = permit.leadTime ? `${permit.leadTime} days` : '-';

      rows.push(`
        <tr>
          <td>${type.label}</td>
          <td>${reqBadge}</td>
          <td class="lead-time">${leadTime}</td>
          <td class="notes">${permit.notes || '-'}</td>
        </tr>
      `);
    }
  });

  return `
    <table class="permit-table table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Required</th>
          <th>Lead Time</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>
  `;
}

/**
 * Render warning banners
 */
function renderWarnings(warnings) {
  if (!warnings || warnings.length === 0) return '';

  return `
    <div class="warnings">
      ${warnings.map(w => `
        <div class="alert alert-warning">⚠️ ${w}</div>
      `).join('')}
    </div>
  `;
}

/**
 * Render countries tab styles
 */
function renderCountriesStyles() {
  return `
    <style>
      .countries-tab {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .filters-bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-md);
        align-items: center;
        padding: var(--spacing-md);
        background: var(--white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .search-box {
        flex: 1;
        min-width: 250px;
      }

      .filter-controls {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .filter-controls .select {
        min-width: 150px;
      }

      .results-count {
        color: var(--gray-600);
        font-size: 0.875rem;
      }

      .countries-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: var(--spacing-lg);
      }

      .country-card {
        background: var(--white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        overflow: hidden;
        transition: box-shadow var(--transition-fast);
      }

      .country-card:hover {
        box-shadow: var(--shadow-lg);
      }

      .country-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--primary);
        color: var(--white);
      }

      .country-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .country-flag {
        font-size: 2rem;
      }

      .country-name {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .country-meta {
        font-size: 0.8rem;
        opacity: 0.8;
      }

      .country-body {
        padding: var(--spacing-lg);
      }

      .permit-table {
        font-size: 0.875rem;
      }

      .permit-table .lead-time {
        font-weight: 500;
      }

      .permit-table .notes {
        font-size: 0.8rem;
        color: var(--gray-600);
        max-width: 200px;
      }

      .warnings {
        margin-top: var(--spacing-md);
      }

      .warnings .alert {
        font-size: 0.875rem;
        margin-bottom: var(--spacing-sm);
      }

      .country-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--gray-50);
        border-top: 1px solid var(--gray-200);
      }

      .source-info {
        font-size: 0.75rem;
        color: var(--gray-500);
      }

      .country-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      @media (max-width: 768px) {
        .countries-grid {
          grid-template-columns: 1fr;
        }

        .filters-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-controls {
          flex-direction: column;
        }

        .filter-controls .select {
          width: 100%;
        }
      }
    </style>
  `;
}
