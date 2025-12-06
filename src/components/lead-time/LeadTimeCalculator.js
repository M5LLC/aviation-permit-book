/**
 * Lead Time Calculator Component
 * Calculate permit application deadlines based on departure date
 */

import { getCountries } from '../../services/firestore.js';

// Component state
let countries = [];
let selectedCountries = [];

/**
 * Render the Lead Time Calculator
 */
export function renderLeadTimeCalculator() {
  setTimeout(initLeadTimeCalculator, 100);

  return `
    <div class="lead-time-calculator">
      <div class="lead-time-layout">
        <div class="lead-time-form card">
          <div class="card-header">
            <h3>Lead Time Calculator</h3>
            <p class="text-muted">Calculate permit application deadlines</p>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label for="departure-date">Departure Date</label>
              <input type="date" id="departure-date" class="input"
                     min="${getMinDate()}" value="${getDefaultDate()}">
            </div>

            <div class="form-group">
              <label for="operation-type-lt">Operation Type</label>
              <select id="operation-type-lt" class="select">
                <option value="private">Private (Part 91)</option>
                <option value="charter">Charter (Part 135)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Countries Requiring Permits</label>
              <div class="country-search-wrapper">
                <input type="text" id="country-search" class="input"
                       placeholder="Search countries..." autocomplete="off">
                <div id="country-results" class="country-results"></div>
              </div>
              <div id="selected-countries" class="selected-countries">
                <p class="text-muted text-sm">No countries selected</p>
              </div>
            </div>

            <button id="calculate-lead-time-btn" class="btn btn-primary btn-full">
              Calculate Deadlines
            </button>

            <div class="quick-add mt-2">
              <span class="text-muted text-sm">Quick add:</span>
              <button class="btn-link" data-codes="RU,CN,IN">Russia, China, India</button>
              <button class="btn-link" data-codes="CU,KP,IR">Cuba, N.Korea, Iran</button>
            </div>
          </div>
        </div>

        <div class="lead-time-results">
          <div id="lead-time-output" class="card" style="display: none;">
            <div class="card-header">
              <h3>Permit Deadlines</h3>
            </div>
            <div class="card-body">
              <div id="deadline-timeline"></div>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header">
              <h3>Lead Time Reference</h3>
            </div>
            <div class="card-body">
              <p class="text-muted text-sm mb-2">
                Lead times are counted in business days before departure.
                Add extra time for weekends, holidays, and any revisions.
              </p>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Lead Time</th>
                    <th>Typical Countries</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="badge badge-success">2-3 days</span></td>
                    <td>UK, France, Germany, most EU</td>
                  </tr>
                  <tr>
                    <td><span class="badge badge-warning">5-7 days</span></td>
                    <td>Middle East, South America</td>
                  </tr>
                  <tr>
                    <td><span class="badge badge-danger">10+ days</span></td>
                    <td>Russia, China, India, Algeria</td>
                  </tr>
                  <tr>
                    <td><span class="badge badge-dark">Variable</span></td>
                    <td>Restricted/sanctioned countries</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${renderLeadTimeStyles()}
  `;
}

/**
 * Initialize the calculator
 */
async function initLeadTimeCalculator() {
  try {
    const countriesData = await getCountries();
    countries = countriesData.filter(c =>
      c.permits?.overflight?.required ||
      c.permits?.landingPrivate?.required ||
      c.permits?.landingCharter?.required
    ).sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Loaded ${countries.length} countries with permit requirements`);
  } catch (error) {
    console.error('Error loading countries:', error);
  }

  selectedCountries = [];
  attachLeadTimeListeners();
}

/**
 * Attach event listeners
 */
function attachLeadTimeListeners() {
  // Country search
  const searchInput = document.getElementById('country-search');
  if (searchInput) {
    searchInput.addEventListener('input', handleCountrySearch);
    searchInput.addEventListener('focus', handleCountrySearch);
  }

  // Close results on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.country-search-wrapper')) {
      const results = document.getElementById('country-results');
      if (results) results.innerHTML = '';
    }
  });

  // Calculate button
  const calcBtn = document.getElementById('calculate-lead-time-btn');
  if (calcBtn) {
    calcBtn.addEventListener('click', calculateDeadlines);
  }

  // Quick add buttons
  document.querySelectorAll('.quick-add .btn-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const codes = btn.dataset.codes.split(',');
      codes.forEach(code => {
        const country = countries.find(c => c.code === code.trim());
        if (country && !selectedCountries.find(c => c.code === country.code)) {
          selectedCountries.push(country);
        }
      });
      updateSelectedCountries();
    });
  });
}

/**
 * Handle country search
 */
function handleCountrySearch(e) {
  const query = e.target.value.toLowerCase();
  const resultsEl = document.getElementById('country-results');

  if (!query || query.length < 1) {
    resultsEl.innerHTML = '';
    return;
  }

  const matches = countries.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.code.toLowerCase().includes(query)
  ).filter(c => !selectedCountries.find(s => s.code === c.code))
   .slice(0, 8);

  if (matches.length === 0) {
    resultsEl.innerHTML = '<div class="country-result-item no-results">No matching countries</div>';
    return;
  }

  resultsEl.innerHTML = matches.map(c => `
    <div class="country-result-item" data-code="${c.code}">
      <span class="flag">${c.flag || '🏳️'}</span>
      <span class="name">${c.name}</span>
      <span class="lead-badge">${getCountryLeadTime(c)}</span>
    </div>
  `).join('');

  // Attach click handlers
  resultsEl.querySelectorAll('.country-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.dataset.code;
      const country = countries.find(c => c.code === code);
      if (country) {
        selectedCountries.push(country);
        updateSelectedCountries();
        document.getElementById('country-search').value = '';
        resultsEl.innerHTML = '';
      }
    });
  });
}

/**
 * Get lead time for a country
 */
function getCountryLeadTime(country) {
  const opType = document.getElementById('operation-type-lt')?.value || 'private';

  if (opType === 'charter') {
    return country.permits?.landingCharter?.leadTime ||
           country.permits?.overflight?.leadTime ||
           'Verify';
  }

  return country.permits?.landingPrivate?.leadTime ||
         country.permits?.overflight?.leadTime ||
         'Verify';
}

/**
 * Update selected countries display
 */
function updateSelectedCountries() {
  const container = document.getElementById('selected-countries');

  if (selectedCountries.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm">No countries selected</p>';
    return;
  }

  container.innerHTML = selectedCountries.map(c => `
    <div class="selected-country-tag">
      <span class="flag">${c.flag || '🏳️'}</span>
      <span class="name">${c.name}</span>
      <button class="remove-btn" data-code="${c.code}">&times;</button>
    </div>
  `).join('');

  // Attach remove handlers
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      selectedCountries = selectedCountries.filter(c => c.code !== code);
      updateSelectedCountries();
    });
  });
}

/**
 * Calculate permit deadlines
 */
function calculateDeadlines() {
  const departureDate = document.getElementById('departure-date').value;
  const opType = document.getElementById('operation-type-lt').value;

  if (!departureDate) {
    alert('Please select a departure date.');
    return;
  }

  if (selectedCountries.length === 0) {
    alert('Please select at least one country.');
    return;
  }

  const departure = new Date(departureDate);
  const deadlines = [];

  selectedCountries.forEach(country => {
    const leadTimeStr = getCountryLeadTime(country);
    const leadDays = parseLeadTime(leadTimeStr);

    const deadline = subtractBusinessDays(departure, leadDays);

    deadlines.push({
      country,
      leadTime: leadTimeStr,
      leadDays,
      deadline,
      daysUntil: Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)),
    });
  });

  // Sort by deadline (earliest first)
  deadlines.sort((a, b) => a.deadline - b.deadline);

  displayDeadlines(deadlines, departure, opType);
}

/**
 * Parse lead time string to days
 */
function parseLeadTime(str) {
  if (!str || str === 'N/A' || str === 'Verify') return 5;

  const match = str.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }

  return 5; // Default
}

/**
 * Subtract business days from a date
 */
function subtractBusinessDays(date, days) {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }

  return result;
}

/**
 * Display calculated deadlines
 */
function displayDeadlines(deadlines, departure, opType) {
  const outputEl = document.getElementById('lead-time-output');
  const timelineEl = document.getElementById('deadline-timeline');

  outputEl.style.display = 'block';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const departureFormatted = formatDate(departure);
  const opLabel = opType === 'charter' ? 'Charter (Part 135)' : 'Private (Part 91)';

  timelineEl.innerHTML = `
    <div class="deadline-header">
      <div class="deadline-info">
        <span class="label">Departure</span>
        <span class="value">${departureFormatted}</span>
      </div>
      <div class="deadline-info">
        <span class="label">Operation</span>
        <span class="value">${opLabel}</span>
      </div>
      <div class="deadline-info">
        <span class="label">Countries</span>
        <span class="value">${deadlines.length}</span>
      </div>
    </div>

    <div class="deadline-list">
      ${deadlines.map(d => renderDeadlineItem(d, today)).join('')}
    </div>

    <div class="deadline-summary">
      <div class="summary-box ${getUrgencyClass(deadlines[0]?.daysUntil)}">
        <span class="summary-label">First Deadline</span>
        <span class="summary-value">
          ${formatDate(deadlines[0]?.deadline)}
          <small>(${formatDaysUntil(deadlines[0]?.daysUntil)})</small>
        </span>
      </div>
      <div class="actions">
        <button class="btn btn-outline" onclick="window.print()">Print Timeline</button>
      </div>
    </div>
  `;

  outputEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Render a single deadline item
 */
function renderDeadlineItem(deadline, today) {
  const urgency = getUrgencyClass(deadline.daysUntil);
  const isPast = deadline.deadline < today;

  return `
    <div class="deadline-item ${urgency} ${isPast ? 'past' : ''}">
      <div class="deadline-country">
        <span class="flag">${deadline.country.flag || '🏳️'}</span>
        <span class="name">${deadline.country.name}</span>
      </div>
      <div class="deadline-details">
        <span class="lead-time">${deadline.leadTime} lead time</span>
      </div>
      <div class="deadline-date">
        <span class="date">${formatDate(deadline.deadline)}</span>
        <span class="days-until ${urgency}">
          ${isPast ? 'OVERDUE' : formatDaysUntil(deadline.daysUntil)}
        </span>
      </div>
    </div>
  `;
}

/**
 * Get urgency CSS class based on days until deadline
 */
function getUrgencyClass(days) {
  if (days < 0) return 'urgent-critical';
  if (days <= 2) return 'urgent-high';
  if (days <= 5) return 'urgent-medium';
  return 'urgent-low';
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format days until deadline
 */
function formatDaysUntil(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `${days} days`;
}

/**
 * Get minimum date (today)
 */
function getMinDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get default date (7 days from now)
 */
function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
}

/**
 * Render lead time calculator styles
 */
function renderLeadTimeStyles() {
  return `
    <style>
      .lead-time-calculator {
        min-height: 500px;
      }

      .lead-time-layout {
        display: grid;
        grid-template-columns: 400px 1fr;
        gap: var(--spacing-lg);
        align-items: start;
      }

      .lead-time-form .card-header p {
        margin: var(--spacing-xs) 0 0;
        font-size: 0.85rem;
      }

      .country-search-wrapper {
        position: relative;
      }

      .country-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--white);
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 100;
        max-height: 250px;
        overflow-y: auto;
      }

      .country-result-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-bottom: 1px solid var(--gray-100);
      }

      .country-result-item:hover {
        background: var(--gray-50);
      }

      .country-result-item .flag {
        font-size: 1.2rem;
      }

      .country-result-item .name {
        flex: 1;
      }

      .country-result-item .lead-badge {
        font-size: 0.7rem;
        background: var(--gray-200);
        padding: 0.15rem 0.4rem;
        border-radius: 3px;
      }

      .country-result-item.no-results {
        color: var(--gray-500);
        cursor: default;
      }

      .selected-countries {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        min-height: 40px;
        padding: var(--spacing-sm);
        background: var(--gray-50);
        border-radius: var(--radius-md);
      }

      .selected-country-tag {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        background: var(--primary);
        color: var(--white);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
      }

      .selected-country-tag .flag {
        font-size: 1rem;
      }

      .selected-country-tag .remove-btn {
        background: none;
        border: none;
        color: var(--white);
        cursor: pointer;
        font-size: 1.1rem;
        line-height: 1;
        padding: 0;
        margin-left: var(--spacing-xs);
        opacity: 0.8;
      }

      .selected-country-tag .remove-btn:hover {
        opacity: 1;
      }

      .quick-add {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        align-items: center;
      }

      .quick-add .btn-link {
        font-size: 0.8rem;
      }

      /* Results */
      .deadline-header {
        display: flex;
        gap: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--gray-200);
        margin-bottom: var(--spacing-md);
      }

      .deadline-info {
        display: flex;
        flex-direction: column;
      }

      .deadline-info .label {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--gray-500);
      }

      .deadline-info .value {
        font-weight: 600;
      }

      .deadline-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .deadline-item {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: var(--spacing-md);
        align-items: center;
        padding: var(--spacing-md);
        background: var(--gray-50);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--gray-300);
      }

      .deadline-item.urgent-low {
        border-left-color: var(--success);
      }

      .deadline-item.urgent-medium {
        border-left-color: var(--warning);
        background: rgba(255, 193, 7, 0.1);
      }

      .deadline-item.urgent-high {
        border-left-color: var(--danger);
        background: rgba(220, 53, 69, 0.1);
      }

      .deadline-item.urgent-critical {
        border-left-color: #721c24;
        background: rgba(114, 28, 36, 0.15);
      }

      .deadline-item.past {
        opacity: 0.7;
      }

      .deadline-country {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .deadline-country .flag {
        font-size: 1.5rem;
      }

      .deadline-country .name {
        font-weight: 500;
      }

      .deadline-details {
        color: var(--gray-500);
        font-size: 0.85rem;
      }

      .deadline-date {
        text-align: right;
      }

      .deadline-date .date {
        font-weight: 600;
        display: block;
      }

      .deadline-date .days-until {
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        border-radius: 3px;
        display: inline-block;
        margin-top: 0.25rem;
      }

      .days-until.urgent-low {
        background: rgba(40, 167, 69, 0.2);
        color: #155724;
      }

      .days-until.urgent-medium {
        background: rgba(255, 193, 7, 0.3);
        color: #856404;
      }

      .days-until.urgent-high,
      .days-until.urgent-critical {
        background: rgba(220, 53, 69, 0.2);
        color: #721c24;
        font-weight: 600;
      }

      .deadline-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--gray-200);
      }

      .summary-box {
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        background: var(--gray-100);
      }

      .summary-box.urgent-high,
      .summary-box.urgent-critical {
        background: rgba(220, 53, 69, 0.15);
      }

      .summary-label {
        display: block;
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--gray-500);
      }

      .summary-value {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .summary-value small {
        font-weight: 400;
        color: var(--gray-500);
        margin-left: var(--spacing-xs);
      }

      .table-sm {
        font-size: 0.85rem;
      }

      .table-sm td, .table-sm th {
        padding: var(--spacing-sm);
      }

      @media (max-width: 900px) {
        .lead-time-layout {
          grid-template-columns: 1fr;
        }

        .deadline-item {
          grid-template-columns: 1fr;
          gap: var(--spacing-sm);
        }

        .deadline-date {
          text-align: left;
        }

        .deadline-header {
          flex-wrap: wrap;
        }
      }

      @media print {
        .lead-time-form,
        .lead-time-results > .card:last-child,
        .deadline-summary .actions {
          display: none;
        }

        .lead-time-results {
          width: 100%;
        }
      }
    </style>
  `;
}
