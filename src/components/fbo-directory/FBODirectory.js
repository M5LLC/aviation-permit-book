/**
 * FBO Directory Component
 * Browse FBOs and ground handlers worldwide
 */

import { getFBOs } from '../../services/firestore.js';

// Component state
let allFBOs = [];
let filteredFBOs = [];
let selectedRegion = 'all';
let selectedType = 'all';
let searchQuery = '';
let expandedAirport = null;

/**
 * Render the FBO Directory
 */
export function renderFBODirectory() {
  setTimeout(initFBODirectory, 100);

  return `
    <div class="fbo-directory">
      <div class="fbo-header">
        <div class="fbo-search-bar">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="fbo-search" class="input"
                   placeholder="Search by airport code, name, FBO, or city...">
          </div>
          <select id="fbo-region-filter" class="select">
            <option value="all">All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Middle East">Middle East</option>
            <option value="Asia Pacific">Asia Pacific</option>
            <option value="Caribbean">Caribbean</option>
            <option value="Central America">Central America</option>
            <option value="South America">South America</option>
            <option value="Africa">Africa</option>
          </select>
          <select id="fbo-type-filter" class="select">
            <option value="all">All Types</option>
            <option value="fbo">FBOs Only</option>
            <option value="handler">Handlers Only</option>
            <option value="both">Full Service</option>
          </select>
        </div>
        <div class="fbo-stats">
          <span id="fbo-count">Loading...</span>
        </div>
      </div>

      <div id="fbo-list" class="fbo-list">
        <div class="loading">Loading FBO directory...</div>
      </div>
    </div>
    ${renderFBOStyles()}
  `;
}

/**
 * Initialize the FBO directory
 */
async function initFBODirectory() {
  try {
    allFBOs = await getFBOs();
    console.log(`Loaded ${allFBOs.length} airport FBO entries`);

    // Calculate total FBOs
    const totalFBOs = allFBOs.reduce((sum, entry) => sum + (entry.fbos?.length || 0), 0);
    updateStats(allFBOs.length, totalFBOs);

    filteredFBOs = [...allFBOs];
    renderFBOList();
  } catch (error) {
    console.error('Error loading FBOs:', error);
    document.getElementById('fbo-list').innerHTML = `
      <div class="error-state">
        <p>Error loading FBO directory. Please try again.</p>
      </div>
    `;
  }

  attachFBOListeners();
}

/**
 * Attach event listeners
 */
function attachFBOListeners() {
  // Search input
  const searchInput = document.getElementById('fbo-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.toLowerCase();
        filterFBOs();
      }, 300);
    });
  }

  // Region filter
  const regionFilter = document.getElementById('fbo-region-filter');
  if (regionFilter) {
    regionFilter.addEventListener('change', (e) => {
      selectedRegion = e.target.value;
      filterFBOs();
    });
  }

  // Type filter
  const typeFilter = document.getElementById('fbo-type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      selectedType = e.target.value;
      filterFBOs();
    });
  }
}

/**
 * Filter FBOs based on search, region, and type
 */
function filterFBOs() {
  filteredFBOs = allFBOs.map(entry => {
    // Clone the entry to avoid mutating original
    const filteredEntry = { ...entry };

    // Filter FBOs by type if type filter is active
    if (selectedType !== 'all') {
      filteredEntry.fbos = (entry.fbos || []).filter(fbo =>
        fbo.type === selectedType || fbo.type === 'both'
      );
    } else {
      filteredEntry.fbos = entry.fbos || [];
    }

    return filteredEntry;
  }).filter(entry => {
    // Region filter
    if (selectedRegion !== 'all' && entry.region !== selectedRegion) {
      return false;
    }

    // Type filter - exclude airports with no matching FBOs
    if (selectedType !== 'all' && entry.fbos.length === 0) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchFields = [
        entry.id,
        entry.airport,
        entry.airportName,
        entry.country,
        ...(entry.fbos || []).map(f => f.name)
      ].map(s => (s || '').toLowerCase());

      if (!searchFields.some(field => field.includes(searchQuery))) {
        return false;
      }
    }

    return true;
  });

  // Update stats
  const totalFBOs = filteredFBOs.reduce((sum, entry) => sum + (entry.fbos?.length || 0), 0);
  updateStats(filteredFBOs.length, totalFBOs);

  renderFBOList();
}

/**
 * Update stats display
 */
function updateStats(airports, fbos) {
  const statsEl = document.getElementById('fbo-count');
  if (statsEl) {
    statsEl.textContent = `${airports} airports, ${fbos} handlers`;
  }
}

/**
 * Render the FBO list
 */
function renderFBOList() {
  const listEl = document.getElementById('fbo-list');

  if (filteredFBOs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>No FBOs found matching your criteria.</p>
      </div>
    `;
    return;
  }

  // Group by region
  const byRegion = {};
  filteredFBOs.forEach(entry => {
    const region = entry.region || 'Other';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(entry);
  });

  // Sort regions
  const regionOrder = [
    'North America', 'Europe', 'Middle East', 'Asia Pacific',
    'Caribbean', 'Central America', 'South America', 'Africa', 'Other'
  ];

  const sortedRegions = Object.keys(byRegion).sort(
    (a, b) => regionOrder.indexOf(a) - regionOrder.indexOf(b)
  );

  listEl.innerHTML = sortedRegions.map(region => `
    <div class="fbo-region-group">
      <h3 class="region-header">${region}</h3>
      <div class="airport-list">
        ${byRegion[region].map(entry => renderAirportCard(entry)).join('')}
      </div>
    </div>
  `).join('');

  // Attach expand handlers
  listEl.querySelectorAll('.airport-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.airport-card');
      const airportCode = card.dataset.airport;

      if (expandedAirport === airportCode) {
        expandedAirport = null;
        card.classList.remove('expanded');
      } else {
        // Collapse previous
        listEl.querySelectorAll('.airport-card.expanded').forEach(c =>
          c.classList.remove('expanded')
        );
        expandedAirport = airportCode;
        card.classList.add('expanded');
      }
    });
  });
}

/**
 * Render an airport card with its FBOs
 */
function renderAirportCard(entry) {
  const fboCount = entry.fbos?.length || 0;
  const isExpanded = expandedAirport === entry.id;

  return `
    <div class="airport-card ${isExpanded ? 'expanded' : ''}" data-airport="${entry.id}">
      <div class="airport-card-header">
        <div class="airport-info">
          <span class="airport-code">${entry.id}</span>
          <span class="airport-name">${entry.airportName}</span>
          <span class="airport-country">${entry.country}</span>
        </div>
        <div class="airport-meta">
          <span class="fbo-badge">${fboCount} handler${fboCount !== 1 ? 's' : ''}</span>
          <span class="expand-icon">${isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      <div class="airport-card-body">
        ${(entry.fbos || []).map(fbo => renderFBOItem(fbo)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single FBO item
 */
function renderFBOItem(fbo) {
  const services = fbo.services || '';
  const typeLabel = {
    'fbo': 'FBO',
    'handler': 'Handler',
    'both': 'Full Service'
  }[fbo.type] || 'Service';

  const typeClass = {
    'fbo': 'type-fbo',
    'handler': 'type-handler',
    'both': 'type-both'
  }[fbo.type] || 'type-fbo';

  const confidenceClass = {
    'high': 'confidence-high',
    'medium': 'confidence-medium',
    'low': 'confidence-low'
  }[fbo.confidence] || 'confidence-medium';

  // Build amenities list
  const amenities = [];
  if (fbo.vipLounge) amenities.push('VIP Lounge');
  if (fbo.crewLounge) amenities.push('Crew Lounge');
  if (fbo.hangar) amenities.push('Hangar');
  if (fbo.customs === 'on-site') amenities.push('On-site Customs');

  return `
    <div class="fbo-item">
      <div class="fbo-header">
        <div class="fbo-name">${fbo.name}</div>
        <div class="fbo-badges">
          <span class="type-badge ${typeClass}">${typeLabel}</span>
          <span class="confidence-badge ${confidenceClass}" title="Contact confidence">${fbo.confidence || 'medium'}</span>
        </div>
      </div>
      <div class="fbo-contact">
        ${fbo.phone ? `
          <a href="tel:${fbo.phone}" class="contact-link">
            <span class="contact-icon">📞</span>
            ${fbo.phone}
          </a>
        ` : ''}
        ${fbo.email ? `
          <a href="mailto:${fbo.email}" class="contact-link">
            <span class="contact-icon">✉️</span>
            ${fbo.email}
          </a>
        ` : ''}
        ${fbo.website ? `
          <a href="${fbo.website}" target="_blank" rel="noopener" class="contact-link">
            <span class="contact-icon">🌐</span>
            Website
          </a>
        ` : ''}
      </div>
      <div class="fbo-details">
        ${fbo.operatingHours ? `
          <span class="detail-item">
            <span class="detail-icon">🕐</span>
            ${fbo.operatingHours}
          </span>
        ` : ''}
        ${fbo.fuel && fbo.fuel.length > 0 ? `
          <span class="detail-item">
            <span class="detail-icon">⛽</span>
            ${fbo.fuel.join(', ')}
          </span>
        ` : ''}
      </div>
      ${amenities.length > 0 ? `
        <div class="fbo-amenities">
          ${amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>
      ` : ''}
      ${services ? `
        <div class="fbo-services">
          <span class="services-text">${services}</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render FBO directory styles
 */
function renderFBOStyles() {
  return `
    <style>
      .fbo-directory {
        min-height: 500px;
      }

      .fbo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        flex-wrap: wrap;
        gap: var(--spacing-md);
      }

      .fbo-search-bar {
        display: flex;
        gap: var(--spacing-md);
        flex: 1;
        max-width: 600px;
      }

      .search-wrapper {
        position: relative;
        flex: 1;
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

      .fbo-stats {
        color: var(--gray-500);
        font-size: 0.9rem;
      }

      .fbo-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .fbo-region-group {
        background: var(--white);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }

      .region-header {
        margin: 0;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--primary);
        color: var(--white);
        font-size: 1rem;
        font-weight: 600;
      }

      .airport-list {
        padding: var(--spacing-sm);
      }

      .airport-card {
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-sm);
        overflow: hidden;
      }

      .airport-card:last-child {
        margin-bottom: 0;
      }

      .airport-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background: var(--gray-50);
        cursor: pointer;
        transition: background 0.2s;
      }

      .airport-card-header:hover {
        background: var(--gray-100);
      }

      .airport-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        flex-wrap: wrap;
      }

      .airport-code {
        font-family: monospace;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--primary);
        background: var(--white);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        border: 1px solid var(--gray-200);
      }

      .airport-name {
        font-weight: 500;
      }

      .airport-country {
        color: var(--gray-500);
        font-size: 0.85rem;
      }

      .airport-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .fbo-badge {
        background: var(--primary);
        color: var(--white);
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .expand-icon {
        color: var(--gray-400);
        font-size: 0.75rem;
      }

      .airport-card-body {
        display: none;
        padding: var(--spacing-md);
        border-top: 1px solid var(--gray-200);
      }

      .airport-card.expanded .airport-card-body {
        display: block;
      }

      .fbo-item {
        padding: var(--spacing-md);
        background: var(--gray-50);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-sm);
      }

      .fbo-item:last-child {
        margin-bottom: 0;
      }

      .fbo-item .fbo-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-sm);
        flex-wrap: wrap;
        gap: var(--spacing-sm);
      }

      .fbo-name {
        font-weight: 600;
        font-size: 1rem;
        color: var(--primary);
        margin: 0;
      }

      .fbo-badges {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;
      }

      .type-badge {
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .type-badge.type-fbo {
        background: #e3f2fd;
        color: #1565c0;
      }

      .type-badge.type-handler {
        background: #fff3e0;
        color: #e65100;
      }

      .type-badge.type-both {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .confidence-badge {
        padding: 0.15rem 0.4rem;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 500;
      }

      .confidence-badge.confidence-high {
        background: rgba(40, 167, 69, 0.15);
        color: #155724;
      }

      .confidence-badge.confidence-medium {
        background: rgba(255, 193, 7, 0.2);
        color: #856404;
      }

      .confidence-badge.confidence-low {
        background: rgba(220, 53, 69, 0.15);
        color: #721c24;
      }

      .fbo-contact {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
      }

      .contact-link {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--gray-700);
        text-decoration: none;
        font-size: 0.85rem;
        transition: color 0.2s;
      }

      .contact-link:hover {
        color: var(--primary);
      }

      .contact-icon {
        font-size: 0.9rem;
      }

      .fbo-details {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
      }

      .detail-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: 0.8rem;
        color: var(--gray-600);
      }

      .detail-icon {
        font-size: 0.85rem;
      }

      .fbo-amenities {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-bottom: var(--spacing-sm);
      }

      .amenity-tag {
        background: var(--primary);
        color: var(--white);
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 500;
      }

      .fbo-services {
        margin-top: var(--spacing-xs);
      }

      .services-text {
        font-size: 0.8rem;
        color: var(--gray-600);
        font-style: italic;
      }

      .service-tag {
        background: var(--white);
        border: 1px solid var(--gray-300);
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.7rem;
        color: var(--gray-600);
      }

      .loading, .empty-state, .error-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--gray-500);
      }

      @media (max-width: 768px) {
        .fbo-search-bar {
          flex-direction: column;
          max-width: 100%;
        }

        .airport-info {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-xs);
        }

        .fbo-contact {
          flex-direction: column;
          gap: var(--spacing-sm);
        }
      }
    </style>
  `;
}
