/**
 * Airports Tab Component
 * Browse airports with customs, slot, curfew, and AOE information
 */

import { getAirports } from '../../services/firestore.js';

// Component state
let allAirports = [];
let filteredAirports = [];
let selectedRegion = 'all';
let selectedSlotLevel = 'all';
let selectedType = 'all';
let searchQuery = '';
let showCustoms24hr = false;
let showNoCurfew = false;

/**
 * Render the Airports tab
 */
export function renderAirportsTab() {
  setTimeout(initAirportsTab, 100);

  return `
    <div class="airports-tab">
      <div class="airports-header">
        <h2>Airport Directory</h2>
        <p class="text-muted">Comprehensive airport information including customs, slots, and curfews</p>
      </div>

      <div class="airports-filters">
        <div class="filter-row">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="airport-search" class="input"
                   placeholder="Search by ICAO code, name, or city...">
          </div>
          <select id="airport-region-filter" class="select">
            <option value="all">All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Middle East">Middle East</option>
            <option value="Asia Pacific">Asia Pacific</option>
            <option value="Caribbean">Caribbean</option>
            <option value="South America">South America</option>
            <option value="Africa">Africa</option>
            <option value="Oceania">Oceania</option>
          </select>
          <select id="airport-slot-filter" class="select">
            <option value="all">All Slot Levels</option>
            <option value="3">Level 3 (Coordinated)</option>
            <option value="2">Level 2 (Facilitated)</option>
            <option value="1">Level 1 (Non-coordinated)</option>
          </select>
          <select id="airport-type-filter" class="select">
            <option value="all">All Types</option>
            <option value="international">International Hub</option>
            <option value="ga">GA/Business Aviation</option>
            <option value="regional">Regional</option>
          </select>
        </div>
        <div class="filter-row checkboxes">
          <label class="checkbox-label">
            <input type="checkbox" id="customs-24hr-filter">
            <span>24hr Customs</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="no-curfew-filter">
            <span>No Curfew</span>
          </label>
        </div>
        <div class="airports-stats">
          <span id="airports-count">Loading...</span>
        </div>
      </div>

      <div id="airports-grid" class="airports-grid">
        <div class="loading">Loading airports...</div>
      </div>
    </div>
    ${renderAirportsStyles()}
  `;
}

/**
 * Initialize the airports tab
 */
async function initAirportsTab() {
  try {
    allAirports = await getAirports();
    console.log(`Loaded ${allAirports.length} airports`);

    updateStats();
    filteredAirports = [...allAirports];
    renderAirportsList();
  } catch (error) {
    console.error('Error loading airports:', error);
    document.getElementById('airports-grid').innerHTML = `
      <div class="error-state">
        <p>Error loading airports. Please try again.</p>
      </div>
    `;
  }

  attachAirportsListeners();
}

/**
 * Attach event listeners
 */
function attachAirportsListeners() {
  // Search input
  const searchInput = document.getElementById('airport-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.toLowerCase();
        filterAirports();
      }, 300);
    });
  }

  // Region filter
  const regionFilter = document.getElementById('airport-region-filter');
  if (regionFilter) {
    regionFilter.addEventListener('change', (e) => {
      selectedRegion = e.target.value;
      filterAirports();
    });
  }

  // Slot level filter
  const slotFilter = document.getElementById('airport-slot-filter');
  if (slotFilter) {
    slotFilter.addEventListener('change', (e) => {
      selectedSlotLevel = e.target.value;
      filterAirports();
    });
  }

  // Type filter
  const typeFilter = document.getElementById('airport-type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      selectedType = e.target.value;
      filterAirports();
    });
  }

  // Customs 24hr checkbox
  const customs24hr = document.getElementById('customs-24hr-filter');
  if (customs24hr) {
    customs24hr.addEventListener('change', (e) => {
      showCustoms24hr = e.target.checked;
      filterAirports();
    });
  }

  // No curfew checkbox
  const noCurfew = document.getElementById('no-curfew-filter');
  if (noCurfew) {
    noCurfew.addEventListener('change', (e) => {
      showNoCurfew = e.target.checked;
      filterAirports();
    });
  }
}

/**
 * Filter airports based on criteria
 */
function filterAirports() {
  filteredAirports = allAirports.filter(airport => {
    // Region filter
    if (selectedRegion !== 'all' && airport.region !== selectedRegion) {
      return false;
    }

    // Slot level filter
    if (selectedSlotLevel !== 'all' && airport.slotLevel !== parseInt(selectedSlotLevel)) {
      return false;
    }

    // Type filter
    if (selectedType !== 'all' && airport.type !== selectedType) {
      return false;
    }

    // Customs 24hr filter
    if (showCustoms24hr && airport.customs?.hours !== '24/7') {
      return false;
    }

    // No curfew filter
    if (showNoCurfew && airport.curfew?.hasCurfew) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchFields = [
        airport.code,
        airport.name,
        airport.city,
        airport.country
      ].map(s => (s || '').toLowerCase());

      if (!searchFields.some(field => field.includes(searchQuery))) {
        return false;
      }
    }

    return true;
  });

  updateStats();
  renderAirportsList();
}

/**
 * Update stats display
 */
function updateStats() {
  const statsEl = document.getElementById('airports-count');
  if (statsEl) {
    const total = allAirports.length;
    const filtered = filteredAirports.length;
    statsEl.textContent = filtered === total
      ? `${total} airports`
      : `${filtered} of ${total} airports`;
  }
}

/**
 * Render the airports list
 */
function renderAirportsList() {
  const grid = document.getElementById('airports-grid');

  if (filteredAirports.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No airports found matching your criteria.</p>
      </div>
    `;
    return;
  }

  // Sort by code
  filteredAirports.sort((a, b) => a.code.localeCompare(b.code));

  grid.innerHTML = filteredAirports.map(airport => renderAirportCard(airport)).join('');
}

/**
 * Render a single airport card
 */
function renderAirportCard(airport) {
  const slotBadge = getSlotBadge(airport.slotLevel);
  const typeBadge = getTypeBadge(airport.type);

  const curfewText = airport.curfew?.hasCurfew
    ? `<span class="curfew-yes">Curfew: ${airport.curfew.hours}</span>`
    : '<span class="curfew-no">No Curfew</span>';

  const customsText = airport.customs?.available
    ? `<span class="customs-yes">Customs: ${airport.customs.hours}</span>`
    : '<span class="customs-no">No Customs</span>';

  const aoeBadge = airport.aoe
    ? '<span class="aoe-badge">AOE</span>'
    : '';

  return `
    <div class="airport-card">
      <div class="airport-card-header">
        <div class="airport-main">
          <span class="airport-code">${airport.code}</span>
          <div class="airport-info">
            <span class="airport-name">${airport.name}</span>
            <span class="airport-location">${airport.city}, ${airport.country}</span>
          </div>
        </div>
        <div class="airport-badges">
          ${slotBadge}
          ${typeBadge}
          ${aoeBadge}
        </div>
      </div>
      <div class="airport-card-body">
        <div class="airport-details">
          <div class="detail-row">
            <span class="detail-label">Customs:</span>
            ${customsText}
          </div>
          <div class="detail-row">
            <span class="detail-label">Curfew:</span>
            ${curfewText}
          </div>
          ${airport.slotLevel >= 2 ? `
          <div class="detail-row">
            <span class="detail-label">Slots:</span>
            <span>${airport.slotCoordinator || 'Contact handler'}</span>
          </div>
          ` : ''}
          ${airport.customs?.advanceNotice ? `
          <div class="detail-row">
            <span class="detail-label">Notice:</span>
            <span>${airport.customs.advanceNotice}</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Get slot level badge HTML
 */
function getSlotBadge(level) {
  const badges = {
    3: '<span class="slot-badge slot-3" title="Level 3 - Coordinated">L3</span>',
    2: '<span class="slot-badge slot-2" title="Level 2 - Facilitated">L2</span>',
    1: '<span class="slot-badge slot-1" title="Level 1 - Non-coordinated">L1</span>',
  };
  return badges[level] || badges[1];
}

/**
 * Get airport type badge HTML
 */
function getTypeBadge(type) {
  const badges = {
    'international': '<span class="type-badge type-intl">Hub</span>',
    'ga': '<span class="type-badge type-ga">GA</span>',
    'regional': '<span class="type-badge type-reg">Reg</span>',
  };
  return badges[type] || '';
}

/**
 * Render component styles
 */
function renderAirportsStyles() {
  return `
    <style>
      .airports-tab {
        max-width: 1200px;
        margin: 0 auto;
      }

      .airports-header {
        margin-bottom: var(--spacing-lg);
      }

      .airports-header h2 {
        margin: 0 0 var(--spacing-xs);
        color: var(--primary);
      }

      .airports-filters {
        background: var(--white);
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--spacing-lg);
      }

      .filter-row {
        display: flex;
        gap: var(--spacing-md);
        flex-wrap: wrap;
        margin-bottom: var(--spacing-md);
      }

      .filter-row:last-child {
        margin-bottom: 0;
      }

      .filter-row.checkboxes {
        align-items: center;
      }

      .search-wrapper {
        position: relative;
        flex: 1;
        min-width: 200px;
      }

      .search-wrapper .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.5;
      }

      .search-wrapper .input {
        padding-left: 40px;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        cursor: pointer;
        font-size: 0.9rem;
        color: var(--gray-700);
      }

      .checkbox-label input {
        cursor: pointer;
      }

      .airports-stats {
        text-align: right;
        color: var(--gray-500);
        font-size: 0.9rem;
      }

      .airports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--spacing-md);
      }

      .airport-card {
        background: var(--white);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
        transition: box-shadow 0.2s;
      }

      .airport-card:hover {
        box-shadow: var(--shadow-md);
      }

      .airport-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--spacing-md);
        background: var(--gray-50);
        border-bottom: 1px solid var(--gray-200);
      }

      .airport-main {
        display: flex;
        gap: var(--spacing-md);
        align-items: flex-start;
      }

      .airport-code {
        font-family: monospace;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--primary);
        background: var(--white);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        border: 2px solid var(--primary);
      }

      .airport-info {
        display: flex;
        flex-direction: column;
      }

      .airport-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--gray-800);
      }

      .airport-location {
        font-size: 0.8rem;
        color: var(--gray-500);
      }

      .airport-badges {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;
      }

      .slot-badge {
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.7rem;
        font-weight: 700;
      }

      .slot-badge.slot-3 {
        background: #dc3545;
        color: white;
      }

      .slot-badge.slot-2 {
        background: #ffc107;
        color: #212529;
      }

      .slot-badge.slot-1 {
        background: #28a745;
        color: white;
      }

      .type-badge {
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .type-badge.type-intl {
        background: #6f42c1;
        color: white;
      }

      .type-badge.type-ga {
        background: #17a2b8;
        color: white;
      }

      .type-badge.type-reg {
        background: var(--gray-400);
        color: white;
      }

      .aoe-badge {
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.65rem;
        font-weight: 600;
        background: #007bff;
        color: white;
      }

      .airport-card-body {
        padding: var(--spacing-md);
      }

      .airport-details {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .detail-row {
        display: flex;
        gap: var(--spacing-sm);
        font-size: 0.85rem;
      }

      .detail-label {
        font-weight: 500;
        color: var(--gray-600);
        min-width: 70px;
      }

      .customs-yes {
        color: #28a745;
      }

      .customs-no {
        color: var(--gray-500);
      }

      .curfew-yes {
        color: #dc3545;
      }

      .curfew-no {
        color: #28a745;
      }

      .loading, .empty-state, .error-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--gray-500);
        grid-column: 1 / -1;
      }

      @media (max-width: 768px) {
        .filter-row {
          flex-direction: column;
        }

        .search-wrapper {
          min-width: 100%;
        }

        .airports-grid {
          grid-template-columns: 1fr;
        }

        .airport-card-header {
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .airport-badges {
          align-self: flex-start;
        }
      }
    </style>
  `;
}
