/**
 * Changelog Component
 * Display data update history
 */

import { getChangelog, getCountries } from '../../services/firestore.js';

// Component state
let changelogEntries = [];
let countries = {};
let selectedFilter = 'all';

/**
 * Render the Changelog tab
 */
export function renderChangelog() {
  setTimeout(initChangelog, 100);

  return `
    <div class="changelog">
      <div class="changelog-header">
        <h2>Data Changelog</h2>
        <p class="text-muted">Track updates to permit requirements and country data</p>
      </div>

      <div class="changelog-controls">
        <select id="changelog-filter" class="select">
          <option value="all">All Changes</option>
          <option value="permit">Permit Updates</option>
          <option value="leadtime">Lead Time Changes</option>
          <option value="requirement">New Requirements</option>
          <option value="warning">Warnings/Alerts</option>
        </select>
        <div class="changelog-stats">
          <span id="changelog-count">Loading...</span>
        </div>
      </div>

      <div id="changelog-list" class="changelog-list">
        <div class="loading">Loading changelog...</div>
      </div>
    </div>
    ${renderChangelogStyles()}
  `;
}

/**
 * Initialize the changelog
 */
export async function initChangelog() {
  try {
    // Load countries for name lookup
    const countriesData = await getCountries();
    countries = {};
    countriesData.forEach(c => {
      countries[c.code] = c;
    });

    // Load changelog
    changelogEntries = await getChangelog(100);
    console.log(`Loaded ${changelogEntries.length} changelog entries`);

    updateStats();
    renderChangelogList();
  } catch (error) {
    console.error('Error loading changelog:', error);
    document.getElementById('changelog-list').innerHTML = `
      <div class="error-state">
        <p>Error loading changelog. Please try again.</p>
      </div>
    `;
  }

  attachChangelogListeners();
}

/**
 * Attach event listeners
 */
function attachChangelogListeners() {
  const filterSelect = document.getElementById('changelog-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      selectedFilter = e.target.value;
      renderChangelogList();
    });
  }
}

/**
 * Update stats display
 */
function updateStats() {
  const statsEl = document.getElementById('changelog-count');
  if (statsEl) {
    const uniqueCountries = new Set(changelogEntries.map(e => e.country)).size;
    statsEl.textContent = `${changelogEntries.length} updates across ${uniqueCountries} countries`;
  }
}

/**
 * Render the changelog list
 */
function renderChangelogList() {
  const listEl = document.getElementById('changelog-list');

  // Filter entries
  let filtered = changelogEntries;
  if (selectedFilter !== 'all') {
    filtered = changelogEntries.filter(entry => {
      const type = (entry.changeType || '').toLowerCase();
      switch (selectedFilter) {
        case 'permit':
          return type.includes('permit') || type.includes('required');
        case 'leadtime':
          return type.includes('lead') || type.includes('time');
        case 'requirement':
          return type.includes('new') || type.includes('added');
        case 'warning':
          return type.includes('warning') || type.includes('alert') || type.includes('sanction');
        default:
          return true;
      }
    });
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>No changelog entries found for this filter.</p>
      </div>
    `;
    return;
  }

  // Group by month/year
  const byMonth = {};
  filtered.forEach(entry => {
    const date = parseDate(entry.date);
    const monthKey = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 'Unknown';
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(entry);
  });

  // Sort months descending
  const sortedMonths = Object.keys(byMonth).sort().reverse();

  listEl.innerHTML = sortedMonths.map(monthKey => {
    const monthLabel = formatMonthKey(monthKey);
    const entries = byMonth[monthKey];

    return `
      <div class="changelog-month">
        <h3 class="month-header">${monthLabel}</h3>
        <div class="month-entries">
          ${entries.map(entry => renderChangelogEntry(entry)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render a single changelog entry
 */
function renderChangelogEntry(entry) {
  const country = countries[entry.country] || { name: entry.country, flag: '🏳️' };
  const date = parseDate(entry.date);
  const dateStr = date ? formatDate(date) : entry.date;
  const typeClass = getChangeTypeClass(entry.changeType);

  return `
    <div class="changelog-entry">
      <div class="entry-date">${dateStr}</div>
      <div class="entry-content">
        <div class="entry-header">
          <span class="entry-country">
            <span class="flag">${country.flag}</span>
            ${country.name}
          </span>
          <span class="entry-type ${typeClass}">${entry.changeType || 'Update'}</span>
        </div>
        <div class="entry-description">${entry.description}</div>
        ${entry.source ? `
          <div class="entry-source">
            <span class="source-label">Source:</span> ${entry.source}
          </div>
        ` : ''}
        ${entry.verifiedBy ? `
          <div class="entry-verified">
            Verified by ${entry.verifiedBy}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Parse date string
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Handle various formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,           // 2024-01-15
    /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/,     // January 15, 2024
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,     // 01/15/2024
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else if (format === formats[1]) {
        return new Date(dateStr);
      } else if (format === formats[2]) {
        return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
      }
    }
  }

  return new Date(dateStr);
}

/**
 * Format date for display
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format month key to display label
 */
function formatMonthKey(monthKey) {
  if (monthKey === 'Unknown') return 'Unknown Date';

  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Get CSS class for change type
 */
function getChangeTypeClass(type) {
  if (!type) return '';

  const typeLower = type.toLowerCase();
  if (typeLower.includes('warning') || typeLower.includes('alert') || typeLower.includes('sanction')) {
    return 'type-warning';
  }
  if (typeLower.includes('new') || typeLower.includes('added')) {
    return 'type-new';
  }
  if (typeLower.includes('removed') || typeLower.includes('lifted')) {
    return 'type-removed';
  }
  return 'type-update';
}

/**
 * Render changelog styles
 */
function renderChangelogStyles() {
  return `
    <style>
      .changelog {
        max-width: 900px;
        margin: 0 auto;
      }

      .changelog-header {
        margin-bottom: var(--spacing-lg);
      }

      .changelog-header h2 {
        margin: 0 0 var(--spacing-xs);
      }

      .changelog-header p {
        margin: 0;
      }

      .changelog-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--gray-200);
      }

      .changelog-stats {
        color: var(--gray-500);
        font-size: 0.9rem;
      }

      .changelog-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .changelog-month {
        background: var(--white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }

      .month-header {
        margin: 0;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--gray-100);
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-700);
        border-bottom: 1px solid var(--gray-200);
      }

      .month-entries {
        padding: var(--spacing-md);
      }

      .changelog-entry {
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--gray-100);
      }

      .changelog-entry:last-child {
        border-bottom: none;
      }

      .entry-date {
        font-size: 0.85rem;
        color: var(--gray-500);
        text-align: right;
        padding-top: 2px;
      }

      .entry-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .entry-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        flex-wrap: wrap;
      }

      .entry-country {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-weight: 500;
      }

      .entry-country .flag {
        font-size: 1.2rem;
      }

      .entry-type {
        font-size: 0.7rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        text-transform: uppercase;
        font-weight: 500;
      }

      .entry-type.type-update {
        background: var(--gray-200);
        color: var(--gray-700);
      }

      .entry-type.type-warning {
        background: rgba(220, 53, 69, 0.15);
        color: #721c24;
      }

      .entry-type.type-new {
        background: rgba(40, 167, 69, 0.15);
        color: #155724;
      }

      .entry-type.type-removed {
        background: rgba(23, 162, 184, 0.15);
        color: #0c5460;
      }

      .entry-description {
        color: var(--gray-700);
        line-height: 1.5;
      }

      .entry-source {
        font-size: 0.8rem;
        color: var(--gray-500);
      }

      .source-label {
        font-weight: 500;
      }

      .entry-verified {
        font-size: 0.75rem;
        color: var(--gray-400);
        font-style: italic;
      }

      .loading, .empty-state, .error-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--gray-500);
      }

      @media (max-width: 600px) {
        .changelog-entry {
          grid-template-columns: 1fr;
          gap: var(--spacing-sm);
        }

        .entry-date {
          text-align: left;
          padding-top: 0;
        }

        .changelog-controls {
          flex-direction: column;
          align-items: stretch;
          gap: var(--spacing-sm);
        }
      }
    </style>
  `;
}
