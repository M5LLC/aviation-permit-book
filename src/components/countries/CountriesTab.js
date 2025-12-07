/**
 * Countries Tab Component
 * Displays permit requirements for countries worldwide
 */

import {
  subscribeToCountries,
  subscribeToCountryOverrides,
  saveCountryNotes,
  saveCountryOverride,
} from '../../services/firestore.js';
import { getCurrentUser } from '../../services/auth.js';

// Component state
let allCountries = [];
let filteredCountries = [];
let countryOverrides = {};
let unsubscribeCountries = null;
let unsubscribeOverrides = null;
let currentFilters = {
  search: '',
  region: '',
  operation: '',
  confidence: '',
};

/**
 * Render the Countries tab
 * @returns {string} HTML string
 */
export function renderCountriesTab() {
  // Start loading data
  setTimeout(initCountriesData, 0);

  return `
    <div class="countries-tab">
      ${renderFilters()}
      ${renderCountriesGrid()}
      ${renderNotesModal()}
      ${renderOverrideModal()}
    </div>
    ${renderCountriesStyles()}
  `;
}

/**
 * Initialize data subscriptions
 */
function initCountriesData() {
  const user = getCurrentUser();

  // Subscribe to countries
  if (unsubscribeCountries) unsubscribeCountries();
  unsubscribeCountries = subscribeToCountries((countries) => {
    allCountries = countries;
    applyFilters();
  });

  // Subscribe to overrides if user has an organization
  if (user?.organizationId) {
    if (unsubscribeOverrides) unsubscribeOverrides();
    unsubscribeOverrides = subscribeToCountryOverrides(user.organizationId, (overrides) => {
      countryOverrides = overrides;
      applyFilters(); // Re-render with override indicators
    });
  }

  // Attach filter event listeners
  attachFilterListeners();
}

/**
 * Clean up subscriptions when leaving tab
 */
export function cleanupCountriesTab() {
  if (unsubscribeCountries) {
    unsubscribeCountries();
    unsubscribeCountries = null;
  }
  if (unsubscribeOverrides) {
    unsubscribeOverrides();
    unsubscribeOverrides = null;
  }
}

/**
 * Attach event listeners to filter controls
 */
function attachFilterListeners() {
  const searchInput = document.getElementById('country-search');
  const regionFilter = document.getElementById('region-filter');
  const operationFilter = document.getElementById('operation-filter');
  const confidenceFilter = document.getElementById('confidence-filter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.toLowerCase();
      applyFilters();
    });
  }

  if (regionFilter) {
    regionFilter.addEventListener('change', (e) => {
      currentFilters.region = e.target.value;
      applyFilters();
    });
  }

  if (operationFilter) {
    operationFilter.addEventListener('change', (e) => {
      currentFilters.operation = e.target.value;
      applyFilters();
    });
  }

  if (confidenceFilter) {
    confidenceFilter.addEventListener('change', (e) => {
      currentFilters.confidence = e.target.value;
      applyFilters();
    });
  }
}

/**
 * Apply filters and re-render grid
 */
function applyFilters() {
  filteredCountries = allCountries.filter(country => {
    // Search filter
    if (currentFilters.search) {
      const search = currentFilters.search;
      const searchMatch =
        country.name?.toLowerCase().includes(search) ||
        country.code?.toLowerCase().includes(search) ||
        country.icaoPrefix?.toLowerCase().includes(search) ||
        country.caa?.toLowerCase().includes(search) ||
        country.airports?.some(a => a.toLowerCase().includes(search));

      if (!searchMatch) return false;
    }

    // Region filter
    if (currentFilters.region && country.region !== currentFilters.region) {
      return false;
    }

    // Confidence filter
    if (currentFilters.confidence) {
      if (currentFilters.confidence === 'high' && country.confidence !== 'high') {
        return false;
      }
      if (currentFilters.confidence === 'medium' &&
          country.confidence !== 'high' && country.confidence !== 'medium') {
        return false;
      }
    }

    return true;
  });

  // Sort by name
  filteredCountries.sort((a, b) => a.name.localeCompare(b.name));

  // Render the grid
  renderCountriesGridContent();
}

/**
 * Render filter controls
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
          <option value="Central America">Central America</option>
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
 * Render countries grid container
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
 * Render countries grid content (called after data loads)
 */
function renderCountriesGridContent() {
  const grid = document.getElementById('countries-grid');
  const countEl = document.getElementById('results-count');

  if (!grid) return;

  if (filteredCountries.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <p>No countries match your filters</p>
        <button class="btn btn-secondary" onclick="document.getElementById('country-search').value=''; document.getElementById('region-filter').value=''; document.getElementById('confidence-filter').value=''; window.dispatchEvent(new Event('resetFilters'));">
          Clear Filters
        </button>
      </div>
    `;
    if (countEl) countEl.textContent = '0 countries';
    return;
  }

  grid.innerHTML = filteredCountries.map(country => renderCountryCard(country)).join('');
  if (countEl) countEl.textContent = `${filteredCountries.length} countries`;

  // Attach card event listeners
  attachCardListeners();
}

/**
 * Attach event listeners to country cards
 */
function attachCardListeners() {
  // Notes buttons
  document.querySelectorAll('[data-action="notes"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.target.dataset.code;
      openNotesModal(code);
    });
  });

  // Override buttons
  document.querySelectorAll('[data-action="override"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.target.dataset.code;
      openOverrideModal(code);
    });
  });

  // Expand buttons
  document.querySelectorAll('.expand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.country-card');
      card.classList.toggle('expanded');
      e.target.textContent = card.classList.contains('expanded') ? '▲ Less' : '▼ More';
    });
  });
}

/**
 * Render a single country card
 */
function renderCountryCard(country) {
  const confidenceClass = {
    high: 'badge-success',
    medium: 'badge-warning',
    low: 'badge-danger',
  }[country.confidence] || 'badge-info';

  const override = countryOverrides[country.code];
  const hasNotes = override?.notes;
  const hasOverrides = override?.overrides && Object.keys(override.overrides).length > 0;

  return `
    <div class="country-card" data-code="${country.code}">
      <div class="country-header">
        <div class="country-title">
          <span class="country-flag">${country.flag || '🏳️'}</span>
          <div>
            <h3 class="country-name">${country.name}</h3>
            <span class="country-meta">${country.icaoPrefix || ''} • ${country.code}</span>
          </div>
        </div>
        <div class="header-badges">
          ${hasNotes ? '<span class="badge badge-info" title="Has notes">📝</span>' : ''}
          ${hasOverrides ? '<span class="badge badge-warning" title="Has overrides">✏️</span>' : ''}
          <span class="badge ${confidenceClass}">${country.confidence || 'unknown'}</span>
        </div>
      </div>
      <div class="country-body">
        ${renderWarnings(country.warnings)}
        ${renderPermitTable(country.permits, override?.overrides)}
        ${hasNotes ? renderNotesDisplay(override.notes) : ''}
      </div>
      <div class="country-footer">
        <span class="source-info">
          Source: ${country.source || 'Verify'} | Updated: ${country.lastVerified || 'N/A'}
        </span>
        <div class="country-actions">
          <button class="btn btn-secondary btn-sm" data-action="notes" data-code="${country.code}">
            ${hasNotes ? '📝 Edit Notes' : '📝 Notes'}
          </button>
          <button class="btn btn-secondary btn-sm" data-action="override" data-code="${country.code}">
            ✏️ Override
          </button>
          <button class="btn btn-secondary btn-sm expand-btn">▼ More</button>
        </div>
      </div>
      <div class="expanded-content">
        ${renderExpandedDetails(country)}
      </div>
    </div>
  `;
}

/**
 * Render permit requirements table
 */
function renderPermitTable(permits, overrides) {
  if (!permits) return '<p class="text-muted">No permit data available</p>';

  const rows = [];
  const types = [
    { key: 'overflight', label: 'Overflight' },
    { key: 'landingPrivate', label: 'Landing (Private)' },
    { key: 'landingCharter', label: 'Landing (Charter)' },
    { key: 'landingCharterFirstTime', label: 'Charter (First-Time)' },
    { key: 'techStop', label: 'Tech Stop' },
  ];

  types.forEach(type => {
    const permit = permits[type.key];
    if (permit) {
      // Check for overrides
      const leadTimeOverride = overrides?.[`${type.key}Lead`]?.value;
      const hasLeadOverride = leadTimeOverride !== undefined;

      const reqBadge = permit.required
        ? '<span class="badge badge-danger">Required</span>'
        : '<span class="badge badge-success">Not Required</span>';

      const leadTime = hasLeadOverride
        ? `<span class="overridden" title="Overridden">${leadTimeOverride} days ✏️</span>`
        : (permit.leadTime ? `${permit.leadTime} days` : '-');

      rows.push(`
        <tr>
          <td>${type.label}</td>
          <td>${reqBadge}</td>
          <td class="lead-time">${leadTime}</td>
          <td class="permit-notes">${permit.notes || '-'}</td>
        </tr>
      `);
    }
  });

  if (rows.length === 0) {
    return '<p class="text-muted">No permit data available</p>';
  }

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
      ${warnings.map(w => {
        const isDanger = w.includes('OFAC') || w.includes('sanctions') ||
                        w.includes('Conflict') || w.includes('CLOSED');
        return `<div class="alert ${isDanger ? 'alert-danger' : 'alert-warning'}">⚠️ ${w}</div>`;
      }).join('')}
    </div>
  `;
}

/**
 * Render user notes display
 */
function renderNotesDisplay(notes) {
  if (!notes) return '';
  return `
    <div class="user-notes">
      <strong>📝 My Notes:</strong>
      <p>${notes}</p>
    </div>
  `;
}

/**
 * Render expanded details section
 */
function renderExpandedDetails(country) {
  const contactConfidenceClass = {
    high: 'badge-success',
    medium: 'badge-warning',
    low: 'badge-danger',
  }[country.caaContactConfidence] || 'badge-info';

  return `
    <div class="expanded-grid">
      <div class="detail-item">
        <label>Civil Aviation Authority</label>
        <span>${country.caa || 'Contact local handler'}</span>
      </div>
      <div class="detail-item">
        <label>CAA Website</label>
        <span>${country.caaWebsite
          ? `<a href="${country.caaWebsite}" target="_blank" rel="noopener">${new URL(country.caaWebsite).hostname}</a>`
          : 'N/A'}</span>
      </div>
      <div class="detail-item">
        <label>CAA Phone</label>
        <span>${country.caaPhone
          ? `<a href="tel:${country.caaPhone}">${country.caaPhone}</a>`
          : 'N/A'}</span>
      </div>
      <div class="detail-item">
        <label>CAA Email</label>
        <span>${country.caaEmail
          ? `<a href="mailto:${country.caaEmail}">${country.caaEmail}</a>`
          : 'N/A'}</span>
      </div>
      ${country.permitPhone || country.permitEmail ? `
      <div class="detail-item">
        <label>Permit Desk Phone</label>
        <span>${country.permitPhone
          ? `<a href="tel:${country.permitPhone}">${country.permitPhone}</a>`
          : 'N/A'}</span>
      </div>
      <div class="detail-item">
        <label>Permit Desk Email</label>
        <span>${country.permitEmail
          ? `<a href="mailto:${country.permitEmail}">${country.permitEmail}</a>`
          : 'N/A'}</span>
      </div>
      ` : ''}
      <div class="detail-item">
        <label>Contact Confidence</label>
        <span class="badge ${contactConfidenceClass}">${country.caaContactConfidence || 'unknown'}</span>
      </div>
      <div class="detail-item">
        <label>Crew Visa</label>
        <span>${country.visaCrew || 'Verify requirements'}</span>
      </div>
      <div class="detail-item">
        <label>Key Airports</label>
        <span>${country.airports?.join(', ') || 'N/A'}</span>
      </div>
      <div class="detail-item full-width">
        <label>Additional Notes</label>
        <span>${country.notes || 'No additional notes'}</span>
      </div>
    </div>
  `;
}

/**
 * Render notes modal
 */
function renderNotesModal() {
  return `
    <div id="notes-modal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Notes for <span id="notes-country-name"></span></h3>
          <button class="modal-close" onclick="closeNotesModal()">&times;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="notes-country-code">
          <div class="form-group">
            <label for="notes-text">Your Notes</label>
            <textarea id="notes-text" class="textarea" rows="6"
                      placeholder="Add your notes about this country's permits..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeNotesModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveNotes()">Save Notes</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render override modal
 */
function renderOverrideModal() {
  return `
    <div id="override-modal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Override Data for <span id="override-country-name"></span></h3>
          <button class="modal-close" onclick="closeOverrideModal()">&times;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="override-country-code">
          <p class="text-muted mb-2">Override lead times with your organization's data:</p>
          <div class="form-group">
            <label for="override-overflight">Overflight Lead Time (days)</label>
            <input type="text" id="override-overflight" class="input" placeholder="e.g., 3-5">
          </div>
          <div class="form-group">
            <label for="override-private">Private Landing Lead Time (days)</label>
            <input type="text" id="override-private" class="input" placeholder="e.g., 5-7">
          </div>
          <div class="form-group">
            <label for="override-charter">Charter Landing Lead Time (days)</label>
            <input type="text" id="override-charter" class="input" placeholder="e.g., 7-10">
          </div>
          <div class="form-group">
            <label for="override-source">Source of Information</label>
            <input type="text" id="override-source" class="input"
                   placeholder="e.g., Handler confirmed Dec 2024">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" onclick="clearOverrides()" style="margin-right: auto;">Clear All</button>
          <button class="btn btn-secondary" onclick="closeOverrideModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveOverrides()">Save Overrides</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Open notes modal
 */
function openNotesModal(countryCode) {
  const country = allCountries.find(c => c.code === countryCode);
  const override = countryOverrides[countryCode];

  document.getElementById('notes-country-code').value = countryCode;
  document.getElementById('notes-country-name').textContent = country?.name || countryCode;
  document.getElementById('notes-text').value = override?.notes || '';

  document.getElementById('notes-modal').classList.add('active');
}

/**
 * Close notes modal
 */
window.closeNotesModal = function() {
  document.getElementById('notes-modal').classList.remove('active');
};

/**
 * Save notes
 */
window.saveNotes = async function() {
  const countryCode = document.getElementById('notes-country-code').value;
  const notes = document.getElementById('notes-text').value.trim();
  const user = getCurrentUser();

  if (!user?.organizationId) {
    alert('You must be part of an organization to save notes.');
    return;
  }

  try {
    await saveCountryNotes(user.organizationId, countryCode, notes);
    closeNotesModal();
  } catch (error) {
    console.error('Error saving notes:', error);
    alert('Failed to save notes. Please try again.');
  }
};

/**
 * Open override modal
 */
function openOverrideModal(countryCode) {
  const country = allCountries.find(c => c.code === countryCode);
  const override = countryOverrides[countryCode];

  document.getElementById('override-country-code').value = countryCode;
  document.getElementById('override-country-name').textContent = country?.name || countryCode;

  // Fill in existing overrides
  document.getElementById('override-overflight').value = override?.overrides?.overflightLead?.value || '';
  document.getElementById('override-private').value = override?.overrides?.landingPrivateLead?.value || '';
  document.getElementById('override-charter').value = override?.overrides?.landingCharterLead?.value || '';
  document.getElementById('override-source').value = override?.overrides?.source?.value || '';

  document.getElementById('override-modal').classList.add('active');
}

/**
 * Close override modal
 */
window.closeOverrideModal = function() {
  document.getElementById('override-modal').classList.remove('active');
};

/**
 * Save overrides
 */
window.saveOverrides = async function() {
  const countryCode = document.getElementById('override-country-code').value;
  const country = allCountries.find(c => c.code === countryCode);
  const user = getCurrentUser();

  if (!user?.organizationId) {
    alert('You must be part of an organization to save overrides.');
    return;
  }

  const overrides = {};
  const timestamp = new Date().toISOString();

  const overflight = document.getElementById('override-overflight').value.trim();
  const privateLead = document.getElementById('override-private').value.trim();
  const charter = document.getElementById('override-charter').value.trim();
  const source = document.getElementById('override-source').value.trim();

  if (overflight) overrides.overflightLead = { value: overflight, updatedAt: timestamp };
  if (privateLead) overrides.landingPrivateLead = { value: privateLead, updatedAt: timestamp };
  if (charter) overrides.landingCharterLead = { value: charter, updatedAt: timestamp };
  if (source) overrides.source = { value: source, updatedAt: timestamp };

  try {
    await saveCountryOverride(
      user.organizationId,
      countryCode,
      overrides,
      country?._version || 1
    );
    closeOverrideModal();
  } catch (error) {
    console.error('Error saving overrides:', error);
    alert('Failed to save overrides. Please try again.');
  }
};

/**
 * Clear all overrides for a country
 */
window.clearOverrides = async function() {
  if (!confirm('Clear all overrides for this country?')) return;

  const countryCode = document.getElementById('override-country-code').value;
  const user = getCurrentUser();

  if (!user?.organizationId) return;

  try {
    await saveCountryOverride(user.organizationId, countryCode, {}, 1);
    closeOverrideModal();
  } catch (error) {
    console.error('Error clearing overrides:', error);
    alert('Failed to clear overrides. Please try again.');
  }
};

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
        position: sticky;
        top: 70px;
        z-index: 50;
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
        min-width: 140px;
      }

      .results-count {
        color: var(--gray-600);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .countries-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
        gap: var(--spacing-lg);
      }

      .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--spacing-xxl);
        color: var(--gray-500);
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

      .header-badges {
        display: flex;
        gap: var(--spacing-xs);
        align-items: center;
      }

      /* Enhanced confidence badges for dark header */
      .header-badges .badge {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.3rem 0.6rem;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(4px);
      }

      .header-badges .badge-success {
        background: rgba(40, 167, 69, 0.9);
        color: #fff;
        border-color: rgba(40, 167, 69, 0.5);
        box-shadow: 0 0 8px rgba(40, 167, 69, 0.4);
      }

      .header-badges .badge-warning {
        background: rgba(255, 193, 7, 0.95);
        color: #1a1a1a;
        border-color: rgba(255, 193, 7, 0.6);
        box-shadow: 0 0 8px rgba(255, 193, 7, 0.4);
      }

      .header-badges .badge-danger {
        background: rgba(220, 53, 69, 0.9);
        color: #fff;
        border-color: rgba(220, 53, 69, 0.5);
        box-shadow: 0 0 8px rgba(220, 53, 69, 0.4);
      }

      .header-badges .badge-info {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .country-body {
        padding: var(--spacing-lg);
      }

      .permit-table {
        font-size: 0.85rem;
        width: 100%;
      }

      .permit-table th {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .permit-table .lead-time {
        font-weight: 600;
      }

      .permit-table .permit-notes {
        font-size: 0.75rem;
        color: var(--gray-600);
        max-width: 150px;
      }

      .overridden {
        color: var(--warning);
        font-style: italic;
      }

      .warnings {
        margin-bottom: var(--spacing-md);
      }

      .warnings .alert {
        font-size: 0.85rem;
        margin-bottom: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
      }

      .user-notes {
        margin-top: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--info);
        background: rgba(23, 162, 184, 0.1);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--info);
      }

      .user-notes strong {
        color: var(--info);
        display: block;
        margin-bottom: var(--spacing-xs);
      }

      .user-notes p {
        margin: 0;
        font-size: 0.875rem;
        white-space: pre-wrap;
      }

      .country-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--gray-50);
        border-top: 1px solid var(--gray-200);
      }

      .source-info {
        font-size: 0.7rem;
        color: var(--gray-500);
      }

      .country-actions {
        display: flex;
        gap: var(--spacing-xs);
      }

      .expanded-content {
        display: none;
        padding: var(--spacing-lg);
        background: var(--gray-50);
        border-top: 1px solid var(--gray-200);
      }

      .country-card.expanded .expanded-content {
        display: block;
      }

      .expanded-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .detail-item.full-width {
        grid-column: 1 / -1;
      }

      .detail-item label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--gray-500);
      }

      .detail-item span {
        font-size: 0.875rem;
      }

      .detail-item a {
        word-break: break-all;
      }

      .textarea {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: 0.875rem;
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-md);
        resize: vertical;
        font-family: inherit;
      }

      .textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
      }

      @media (max-width: 768px) {
        .countries-grid {
          grid-template-columns: 1fr;
        }

        .filters-bar {
          flex-direction: column;
          align-items: stretch;
          position: static;
        }

        .filter-controls {
          flex-direction: column;
        }

        .filter-controls .select {
          width: 100%;
        }

        .country-footer {
          flex-direction: column;
          align-items: flex-start;
        }

        .expanded-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
}
