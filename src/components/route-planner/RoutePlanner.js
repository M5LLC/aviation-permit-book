/**
 * Route Planner Component
 * Calculate routes and analyze FIR/permit requirements
 */

import { getAirports, getFIRs, getCountries } from '../../services/firestore.js';
import L from 'leaflet';

// Component state
let map = null;
let routeLayer = null;
let markersLayer = null;
let airports = [];
let firs = {};
let countries = {};
let waypoints = [];

/**
 * Render the Route Planner tab
 */
export function renderRoutePlanner() {
  setTimeout(initRoutePlanner, 100);

  return `
    <div class="route-planner">
      <div class="route-planner-layout">
        <div class="route-sidebar">
          ${renderRouteForm()}
          ${renderRouteResults()}
        </div>
        <div class="route-map-container">
          <div id="route-map"></div>
        </div>
      </div>
    </div>
    ${renderRoutePlannerStyles()}
  `;
}

/**
 * Initialize the route planner
 */
async function initRoutePlanner() {
  // Load data
  try {
    const [airportsData, firsData, countriesData] = await Promise.all([
      getAirports(),
      getFIRs(),
      getCountries(),
    ]);

    airports = airportsData;

    // Convert FIRs array to map by country code
    firs = {};
    firsData.forEach(fir => {
      firs[fir.countryCode] = fir;
    });

    // Convert countries array to map by code
    countries = {};
    countriesData.forEach(country => {
      countries[country.code] = country;
    });

    console.log(`Loaded ${airports.length} airports, ${Object.keys(firs).length} FIRs`);
  } catch (error) {
    console.error('Error loading route planner data:', error);
  }

  // Initialize map
  initMap();

  // Attach event listeners
  attachRouteListeners();
}

/**
 * Initialize Leaflet map
 */
function initMap() {
  if (map) {
    map.remove();
  }

  const mapContainer = document.getElementById('route-map');
  if (!mapContainer) return;

  map = L.map('route-map', {
    center: [30, 0],
    zoom: 2,
    worldCopyJump: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  routeLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

/**
 * Render route input form
 */
function renderRouteForm() {
  return `
    <div class="route-form card">
      <div class="card-header">
        <h3>Route Planner</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="departure-input">Departure Airport</label>
          <div class="autocomplete-wrapper">
            <input type="text" id="departure-input" class="input"
                   placeholder="ICAO code (e.g., KTEB)" autocomplete="off">
            <div id="departure-results" class="autocomplete-results"></div>
          </div>
        </div>

        <div class="form-group">
          <label for="destination-input">Destination Airport</label>
          <div class="autocomplete-wrapper">
            <input type="text" id="destination-input" class="input"
                   placeholder="ICAO code (e.g., EGLL)" autocomplete="off">
            <div id="destination-results" class="autocomplete-results"></div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="aircraft-speed">Aircraft Speed (kts)</label>
            <select id="aircraft-speed" class="select">
              <option value="420">Light Jet (~420 kts)</option>
              <option value="480" selected>Mid Jet (~480 kts)</option>
              <option value="510">Super Mid (~510 kts)</option>
              <option value="550">Heavy Jet (~550 kts)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="operation-type">Operation Type</label>
            <select id="operation-type" class="select">
              <option value="private">Private</option>
              <option value="charter">Charter</option>
            </select>
          </div>
        </div>

        <button id="calculate-route-btn" class="btn btn-primary btn-full">
          Calculate Route
        </button>

        <div class="example-routes mt-2">
          <span class="text-muted">Try:</span>
          <button class="btn-link" data-dep="KTEB" data-dest="EGLL">TEB→LHR</button>
          <button class="btn-link" data-dep="KLAX" data-dest="OMDB">LAX→DXB</button>
          <button class="btn-link" data-dep="KJFK" data-dest="RJTT">JFK→HND</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render route results panel
 */
function renderRouteResults() {
  return `
    <div id="route-results" class="route-results card" style="display: none;">
      <div class="card-header">
        <h3>Route Analysis</h3>
      </div>
      <div class="card-body">
        <div class="route-summary">
          <div class="summary-item">
            <span class="summary-label">Distance</span>
            <span class="summary-value" id="route-distance">-</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Est. Flight Time</span>
            <span class="summary-value" id="route-time">-</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Countries/FIRs</span>
            <span class="summary-value" id="route-firs">-</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Permits Required</span>
            <span class="summary-value" id="route-permits">-</span>
          </div>
          <div class="summary-item highlight">
            <span class="summary-label">Max Lead Time</span>
            <span class="summary-value" id="route-lead-time">-</span>
          </div>
        </div>

        <div id="route-warnings" class="route-warnings" style="display: none;">
          <h4>⚠️ Warnings</h4>
          <ul id="warnings-list"></ul>
        </div>

        <div class="fir-table-container">
          <h4>FIR/Country Analysis</h4>
          <table class="table fir-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>FIRs</th>
                <th>Permit</th>
                <th>Lead Time</th>
              </tr>
            </thead>
            <tbody id="fir-table-body">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach event listeners
 */
function attachRouteListeners() {
  // Departure autocomplete
  const depInput = document.getElementById('departure-input');
  if (depInput) {
    depInput.addEventListener('input', (e) => handleAirportSearch(e.target.value, 'departure'));
    depInput.addEventListener('focus', (e) => handleAirportSearch(e.target.value, 'departure'));
  }

  // Destination autocomplete
  const destInput = document.getElementById('destination-input');
  if (destInput) {
    destInput.addEventListener('input', (e) => handleAirportSearch(e.target.value, 'destination'));
    destInput.addEventListener('focus', (e) => handleAirportSearch(e.target.value, 'destination'));
  }

  // Close autocomplete on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper')) {
      document.querySelectorAll('.autocomplete-results').forEach(el => el.innerHTML = '');
    }
  });

  // Calculate button
  const calcBtn = document.getElementById('calculate-route-btn');
  if (calcBtn) {
    calcBtn.addEventListener('click', calculateRoute);
  }

  // Example routes
  document.querySelectorAll('.example-routes .btn-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('departure-input').value = btn.dataset.dep;
      document.getElementById('destination-input').value = btn.dataset.dest;
      calculateRoute();
    });
  });
}

/**
 * Handle airport search autocomplete
 */
function handleAirportSearch(query, type) {
  const resultsEl = document.getElementById(`${type}-results`);
  if (!resultsEl) return;

  if (query.length < 2) {
    resultsEl.innerHTML = '';
    return;
  }

  const q = query.toUpperCase();
  const matches = airports.filter(apt =>
    apt.code?.toUpperCase().includes(q) ||
    apt.name?.toUpperCase().includes(q) ||
    apt.city?.toUpperCase().includes(q)
  ).slice(0, 8);

  if (matches.length === 0) {
    resultsEl.innerHTML = '<div class="autocomplete-item no-results">No airports found</div>';
    return;
  }

  resultsEl.innerHTML = matches.map(apt => `
    <div class="autocomplete-item" data-code="${apt.code}" data-type="${type}">
      <strong>${apt.code}</strong> - ${apt.name}
      <small>${apt.city}, ${apt.country}</small>
    </div>
  `).join('');

  // Attach click handlers
  resultsEl.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.dataset.code;
      const inputType = item.dataset.type;
      document.getElementById(`${inputType}-input`).value = code;
      resultsEl.innerHTML = '';
    });
  });
}

/**
 * Calculate route
 */
function calculateRoute() {
  const depCode = document.getElementById('departure-input').value.toUpperCase().trim();
  const destCode = document.getElementById('destination-input').value.toUpperCase().trim();
  const speed = parseInt(document.getElementById('aircraft-speed').value);
  const opType = document.getElementById('operation-type').value;

  if (!depCode || !destCode) {
    alert('Please enter both departure and destination airports.');
    return;
  }

  const depAirport = airports.find(a => a.code === depCode);
  const destAirport = airports.find(a => a.code === destCode);

  if (!depAirport) {
    alert(`Airport ${depCode} not found. Try a major airport ICAO code.`);
    return;
  }
  if (!destAirport) {
    alert(`Airport ${destCode} not found. Try a major airport ICAO code.`);
    return;
  }

  // Calculate great circle route
  const routePoints = calculateGreatCircle(
    { lat: depAirport.lat, lon: depAirport.lon },
    { lat: destAirport.lat, lon: destAirport.lon },
    100
  );

  // Calculate distance
  const distance = calculateDistance(
    { lat: depAirport.lat, lon: depAirport.lon },
    { lat: destAirport.lat, lon: destAirport.lon }
  );

  // Analyze countries along route
  const countriesOnRoute = analyzeRouteCountries(routePoints);

  // Build analysis
  const analysis = buildRouteAnalysis(countriesOnRoute, opType);

  // Draw route on map
  drawRoute(routePoints, depAirport, destAirport);

  // Display results
  displayResults(distance, speed, analysis);
}

/**
 * Calculate great circle route points
 */
function calculateGreatCircle(start, end, numPoints) {
  const points = [];
  const lat1 = start.lat * Math.PI / 180;
  const lon1 = start.lon * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const lon2 = end.lon * Math.PI / 180;

  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
  ));

  if (d === 0) return [[start.lat, start.lon]];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
    const lon = Math.atan2(y, x) * 180 / Math.PI;
    points.push([lat, lon]);
  }

  return points;
}

/**
 * Calculate distance in nautical miles
 */
function calculateDistance(start, end) {
  const R = 3440.065; // Earth radius in nm
  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const dLat = (end.lat - start.lat) * Math.PI / 180;
  const dLon = (end.lon - start.lon) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Analyze which countries the route passes through
 */
function analyzeRouteCountries(routePoints) {
  const countriesOnRoute = new Set();

  for (const point of routePoints) {
    const country = getCountryFromCoordinates(point[0], point[1]);
    if (country) {
      countriesOnRoute.add(country);
    }
  }

  return Array.from(countriesOnRoute);
}

/**
 * Get country code from coordinates (simplified)
 */
function getCountryFromCoordinates(lat, lon) {
  // Simplified country detection using bounding boxes
  // In production, use proper GeoJSON boundaries

  // North America
  if (lat >= 25 && lat <= 72 && lon >= -170 && lon <= -50) {
    if (lat >= 49 && lon >= -141 && lon <= -52) return "CA";
    if (lat >= 14 && lat <= 33 && lon >= -118 && lon <= -86) return "MX";
    return "US";
  }

  // Europe
  if (lat >= 35 && lat <= 72 && lon >= -12 && lon <= 40) {
    if (lat >= 49 && lat <= 61 && lon >= -11 && lon <= 2) return "GB";
    if (lat >= 42 && lat <= 51 && lon >= -5 && lon <= 8) return "FR";
    if (lat >= 47 && lat <= 55 && lon >= 5 && lon <= 15) return "DE";
    if (lat >= 36 && lat <= 47 && lon >= 6 && lon <= 19) return "IT";
    if (lat >= 36 && lat <= 44 && lon >= -10 && lon <= 4) return "ES";
    if (lat >= 50 && lat <= 54 && lon >= 3 && lon <= 8) return "NL";
    if (lat >= 54 && lat <= 58 && lon >= 7 && lon <= 16) return "DK";
    if (lat >= 55 && lat <= 70 && lon >= 10 && lon <= 25) return "SE";
    if (lat >= 59 && lat <= 70 && lon >= 19 && lon <= 32) return "FI";
    if (lat >= 36 && lat <= 42 && lon >= 26 && lon <= 45) return "TR";
    if (lat >= 44 && lat <= 56 && lon >= 22 && lon <= 41) return "UA";
    if (lat >= 50 && lat <= 72 && lon >= 27 && lon <= 180) return "RU";
  }

  // Middle East
  if (lat >= 12 && lat <= 42 && lon >= 30 && lon <= 65) {
    if (lat >= 22 && lat <= 27 && lon >= 51 && lon <= 57) return "AE";
    if (lat >= 16 && lat <= 33 && lon >= 34 && lon <= 56) return "SA";
    if (lat >= 25 && lat <= 40 && lon >= 44 && lon <= 64) return "IR";
    if (lat >= 29 && lat <= 34 && lon >= 34 && lon <= 36) return "IL";
    if (lat >= 29 && lat <= 38 && lon >= 38 && lon <= 49) return "IQ";
  }

  // Asia
  if (lat >= -10 && lat <= 55 && lon >= 65 && lon <= 145) {
    if (lat >= 6 && lat <= 36 && lon >= 68 && lon <= 98) return "IN";
    if (lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135) return "CN";
    if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 146) return "JP";
    if (lat >= 33 && lat <= 39 && lon >= 124 && lon <= 132) return "KR";
    if (lat >= 5 && lat <= 21 && lon >= 97 && lon <= 106) return "TH";
    if (lat >= 1 && lat <= 2 && lon >= 103 && lon <= 104) return "SG";
  }

  // Africa
  if (lat >= -35 && lat <= 38 && lon >= -18 && lon <= 52) {
    if (lat >= 22 && lat <= 32 && lon >= 24 && lon <= 37) return "EG";
    if (lat >= 27 && lat <= 36 && lon >= -13 && lon <= -1) return "MA";
    if (lat >= -35 && lat <= -22 && lon >= 16 && lon <= 33) return "ZA";
  }

  // South America
  if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) {
    if (lat >= -34 && lat <= 6 && lon >= -74 && lon <= -34) return "BR";
    if (lat >= -56 && lat <= -21 && lon >= -74 && lon <= -53) return "AR";
  }

  // Oceania
  if (lat >= -48 && lat <= 0 && lon >= 110 && lon <= 180) {
    if (lat >= -45 && lat <= -10 && lon >= 112 && lon <= 154) return "AU";
    if (lat >= -48 && lat <= -33 && lon >= 165 && lon <= 179) return "NZ";
  }

  return null;
}

/**
 * Build route analysis
 */
function buildRouteAnalysis(countryCodes, opType) {
  const analysis = {
    countries: [],
    warnings: [],
    permitsRequired: 0,
    maxLeadTime: 0,
  };

  countryCodes.forEach(code => {
    const firInfo = firs[code] || {};
    const countryInfo = countries[code] || {};
    const countryName = countryInfo.name || code;

    let leadTime = firInfo.leadTime || 'Verify';
    let required = firInfo.permitRequired;

    // Get lead time as number for max calculation
    if (required && leadTime && leadTime !== 'N/A' && leadTime !== 'CLOSED') {
      const match = leadTime.match(/(\d+)/);
      if (match) {
        const days = parseInt(match[1]);
        if (opType === 'charter') {
          // Charter typically adds time
          if (days + 2 > analysis.maxLeadTime) {
            analysis.maxLeadTime = days + 2;
          }
        } else {
          if (days > analysis.maxLeadTime) {
            analysis.maxLeadTime = days;
          }
        }
      }
    }

    if (required) {
      analysis.permitsRequired++;
    }

    if (firInfo.warning) {
      analysis.warnings.push(`${countryName}: ${firInfo.warning}`);
    }

    analysis.countries.push({
      code,
      name: countryName,
      flag: countryInfo.flag || '🏳️',
      firs: firInfo.firs?.join(', ') || 'Unknown',
      required,
      leadTime,
      warning: firInfo.warning,
    });
  });

  return analysis;
}

/**
 * Draw route on map
 */
function drawRoute(routePoints, depAirport, destAirport) {
  routeLayer.clearLayers();
  markersLayer.clearLayers();

  // Draw route line
  const routeLine = L.polyline(routePoints, {
    color: '#1e3a5f',
    weight: 3,
    opacity: 0.8,
    dashArray: '10, 5',
  }).addTo(routeLayer);

  // Add departure marker
  L.circleMarker([depAirport.lat, depAirport.lon], {
    radius: 8,
    fillColor: '#28a745',
    color: '#1e3a5f',
    weight: 2,
    fillOpacity: 1,
  }).addTo(markersLayer).bindPopup(`
    <strong>${depAirport.code}</strong><br>
    ${depAirport.name}<br>
    ${depAirport.city}, ${depAirport.country}
  `);

  // Add destination marker
  L.circleMarker([destAirport.lat, destAirport.lon], {
    radius: 8,
    fillColor: '#dc3545',
    color: '#1e3a5f',
    weight: 2,
    fillOpacity: 1,
  }).addTo(markersLayer).bindPopup(`
    <strong>${destAirport.code}</strong><br>
    ${destAirport.name}<br>
    ${destAirport.city}, ${destAirport.country}
  `);

  // Fit map to route
  map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

/**
 * Display route results
 */
function displayResults(distance, speed, analysis) {
  const resultsEl = document.getElementById('route-results');
  resultsEl.style.display = 'block';

  // Flight time
  const flightHours = distance / speed;
  const hours = Math.floor(flightHours);
  const minutes = Math.round((flightHours - hours) * 60);

  document.getElementById('route-distance').textContent = `${Math.round(distance).toLocaleString()} nm`;
  document.getElementById('route-time').textContent = `${hours}h ${minutes}m`;
  document.getElementById('route-firs').textContent = analysis.countries.length;
  document.getElementById('route-permits').textContent = analysis.permitsRequired;
  document.getElementById('route-lead-time').textContent =
    analysis.maxLeadTime > 0 ? `${analysis.maxLeadTime} days` : 'None';

  // Warnings
  const warningsEl = document.getElementById('route-warnings');
  const warningsListEl = document.getElementById('warnings-list');
  if (analysis.warnings.length > 0) {
    warningsEl.style.display = 'block';
    warningsListEl.innerHTML = analysis.warnings.map(w => `<li>${w}</li>`).join('');
  } else {
    warningsEl.style.display = 'none';
  }

  // FIR table
  const tableBody = document.getElementById('fir-table-body');
  tableBody.innerHTML = analysis.countries.map(c => `
    <tr class="${c.warning ? 'warning-row' : ''}">
      <td>
        <span class="country-flag-sm">${c.flag}</span>
        ${c.name}
        ${c.warning ? '<span class="warning-icon" title="' + c.warning + '">⚠️</span>' : ''}
      </td>
      <td><code>${c.firs}</code></td>
      <td>
        <span class="badge ${c.required ? 'badge-danger' : 'badge-success'}">
          ${c.required ? 'Yes' : 'No'}
        </span>
      </td>
      <td>${c.required ? c.leadTime + ' days' : '-'}</td>
    </tr>
  `).join('');

  // Scroll results into view
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Render route planner styles
 */
function renderRoutePlannerStyles() {
  return `
    <style>
      .route-planner {
        height: calc(100vh - 180px);
        min-height: 600px;
      }

      .route-planner-layout {
        display: grid;
        grid-template-columns: 400px 1fr;
        gap: var(--spacing-lg);
        height: 100%;
      }

      .route-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        overflow-y: auto;
        padding-right: var(--spacing-sm);
      }

      .route-map-container {
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-md);
      }

      #route-map {
        height: 100%;
        width: 100%;
        min-height: 400px;
      }

      .route-form .card-header h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }

      .autocomplete-wrapper {
        position: relative;
      }

      .autocomplete-results {
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

      .autocomplete-item {
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-bottom: 1px solid var(--gray-100);
      }

      .autocomplete-item:hover {
        background: var(--gray-50);
      }

      .autocomplete-item small {
        display: block;
        color: var(--gray-500);
        font-size: 0.75rem;
      }

      .autocomplete-item.no-results {
        color: var(--gray-500);
        cursor: default;
      }

      .example-routes {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .btn-link {
        background: none;
        border: none;
        color: var(--primary);
        cursor: pointer;
        font-size: 0.85rem;
        padding: 0;
        text-decoration: underline;
      }

      .btn-link:hover {
        color: var(--primary-light);
      }

      .route-results .card-header h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .route-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .summary-item {
        display: flex;
        flex-direction: column;
        padding: var(--spacing-sm);
        background: var(--gray-50);
        border-radius: var(--radius-md);
      }

      .summary-item.highlight {
        background: var(--primary);
        color: var(--white);
        grid-column: 1 / -1;
      }

      .summary-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--gray-500);
      }

      .summary-item.highlight .summary-label {
        color: rgba(255,255,255,0.7);
      }

      .summary-value {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .route-warnings {
        background: rgba(220, 53, 69, 0.1);
        border-left: 4px solid var(--danger);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-lg);
      }

      .route-warnings h4 {
        margin: 0 0 var(--spacing-sm);
        font-size: 0.9rem;
      }

      .route-warnings ul {
        margin: 0;
        padding-left: var(--spacing-lg);
        font-size: 0.85rem;
      }

      .fir-table-container h4 {
        margin: 0 0 var(--spacing-sm);
        font-size: 0.9rem;
      }

      .fir-table {
        font-size: 0.85rem;
      }

      .fir-table code {
        font-size: 0.75rem;
        background: var(--gray-100);
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
      }

      .country-flag-sm {
        font-size: 1rem;
        margin-right: var(--spacing-xs);
      }

      .warning-icon {
        margin-left: var(--spacing-xs);
      }

      .warning-row {
        background: rgba(255, 193, 7, 0.1);
      }

      @media (max-width: 1024px) {
        .route-planner-layout {
          grid-template-columns: 1fr;
          height: auto;
        }

        .route-map-container {
          height: 400px;
          order: -1;
        }

        .route-sidebar {
          overflow: visible;
          padding-right: 0;
        }
      }
    </style>
  `;
}
