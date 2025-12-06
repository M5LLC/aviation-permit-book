/**
 * Route Planner Component
 * Calculate routes and analyze FIR/permit requirements
 * Enhanced with aircraft selector, Mach speeds, and realistic flight time calculation
 */

import { getAirports, getFIRs, getCountries } from '../../services/firestore.js';
import {
  machSpeeds,
  machToKnots,
  getManufacturers,
  getModels,
  getVariants
} from '../../data/aircraft.js';
import L from 'leaflet';

// Component state
let map = null;
let routeLayer = null;
let markersLayer = null;
let airports = [];
let firs = {};
let countries = {};
let speedMode = 'mach'; // 'mach' or 'knots'

/**
 * Render the Route Planner tab
 */
export function renderRoutePlanner() {
  setTimeout(initRoutePlanner, 100);

  return `
    <div class="route-planner">
      ${renderRouteForm()}
      <div id="routeMap" class="route-map"></div>
      <div id="routeResults" class="route-results" style="display: none;">
        ${renderRouteResultsContent()}
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
  attachAircraftListeners();
  attachSpeedListeners();
}

/**
 * Initialize Leaflet map
 */
function initMap() {
  if (map) {
    map.remove();
  }

  const mapContainer = document.getElementById('routeMap');
  if (!mapContainer) return;

  map = L.map('routeMap', {
    center: [30, 0],
    zoom: 2,
    worldCopyJump: true,
    scrollWheelZoom: false, // Disable scroll zoom by default for better UX
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  routeLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  // Enable scroll zoom only when map is clicked
  mapContainer.addEventListener('click', () => {
    map.scrollWheelZoom.enable();
    mapContainer.classList.add('zoom-enabled');
  });

  // Disable scroll zoom when mouse leaves map
  mapContainer.addEventListener('mouseleave', () => {
    map.scrollWheelZoom.disable();
    mapContainer.classList.remove('zoom-enabled');
  });
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
        <div class="form-row">
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
        </div>

        <div class="form-group">
          <label>Aircraft (Optional)</label>
          <div class="aircraft-selector">
            <select id="manufacturer-select" class="select">
              <option value="">Select Manufacturer...</option>
              ${getManufacturers().map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
            <select id="model-select" class="select" disabled>
              <option value="">Select Model...</option>
            </select>
            <select id="variant-select" class="select" disabled>
              <option value="">Select Variant...</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Cruise Speed</label>
            <div class="speed-selector">
              <div class="speed-toggle">
                <button type="button" id="mach-toggle" class="toggle-btn active">Mach</button>
                <button type="button" id="knots-toggle" class="toggle-btn">Knots</button>
              </div>
              <select id="mach-speed" class="select">
                ${machSpeeds.map(s => `
                  <option value="${s.value}" ${s.value === 0.85 ? 'selected' : ''}>
                    ${s.label}${s.value !== 'custom' ? ` (${machToKnots(s.value)} kts)` : ''}
                  </option>
                `).join('')}
              </select>
              <input type="number" id="custom-speed" class="input"
                     placeholder="Enter speed in knots..." style="display: none;"
                     min="200" max="700">
            </div>
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
 * Render route results content
 */
function renderRouteResultsContent() {
  return `
    <div class="results-header">
      <h3>Route Analysis</h3>
    </div>

    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-label">Total Distance</div>
        <div class="stat-value" id="totalDistance">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Est. Flight Time</div>
        <div class="stat-value" id="estFlightTime">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Countries/FIRs</div>
        <div class="stat-value" id="countriesFirs">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Permits Required</div>
        <div class="stat-value" id="permitsRequired">-</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-label">Max Lead Time</div>
        <div class="stat-value" id="maxLeadTime">-</div>
      </div>
    </div>

    <div id="routeWarnings" class="warnings-section" style="display: none;">
      <h4>Route Warnings</h4>
      <ul id="warningsList"></ul>
    </div>

    <div class="fir-table-container">
      <h4>FIR/Country Analysis</h4>
      <table class="fir-table">
        <thead>
          <tr>
            <th>Country</th>
            <th>FIR(s)</th>
            <th>Permit Required</th>
            <th>Lead Time</th>
            <th>Notes</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody id="firTableBody">
        </tbody>
      </table>
    </div>

    <div id="nextSteps" class="next-steps-section">
      <h4>Next Steps</h4>
      <ol id="nextStepsList">
        <li>Review permit requirements for each country along the route</li>
        <li>Contact handling agents at destination and tech stops</li>
        <li>Submit permit applications based on lead time requirements</li>
        <li>Confirm fuel availability and handling arrangements</li>
        <li>Verify overflight and landing slot requirements</li>
      </ol>
    </div>

    <!-- Country Details Modal -->
    <div id="countryDetailsModal" class="modal-overlay" style="display: none;">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">
            <span id="modalCountryFlag"></span>
            <span id="modalCountryName"></span>
          </h3>
          <button class="modal-close" id="closeCountryModal">&times;</button>
        </div>
        <div class="modal-body" id="modalCountryContent">
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="closeCountryModalBtn">Close</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach aircraft selector event listeners
 */
function attachAircraftListeners() {
  const manufacturerSelect = document.getElementById('manufacturer-select');
  const modelSelect = document.getElementById('model-select');
  const variantSelect = document.getElementById('variant-select');

  manufacturerSelect?.addEventListener('change', (e) => {
    const manufacturer = e.target.value;
    modelSelect.disabled = !manufacturer;
    modelSelect.innerHTML = '<option value="">Select Model...</option>' +
      getModels(manufacturer).map(m => `<option value="${m}">${m}</option>`).join('');
    variantSelect.disabled = true;
    variantSelect.innerHTML = '<option value="">Select Variant...</option>';
  });

  modelSelect?.addEventListener('change', (e) => {
    const manufacturer = manufacturerSelect.value;
    const model = e.target.value;
    variantSelect.disabled = !model;
    variantSelect.innerHTML = '<option value="">Select Variant...</option>' +
      getVariants(manufacturer, model).map(v => `<option value="${v}">${v}</option>`).join('');
  });
}

/**
 * Attach speed selector event listeners
 */
function attachSpeedListeners() {
  const machToggle = document.getElementById('mach-toggle');
  const knotsToggle = document.getElementById('knots-toggle');
  const machSpeed = document.getElementById('mach-speed');
  const customSpeed = document.getElementById('custom-speed');

  machToggle?.addEventListener('click', () => {
    speedMode = 'mach';
    machToggle.classList.add('active');
    knotsToggle.classList.remove('active');
    machSpeed.style.display = '';
    customSpeed.style.display = 'none';
  });

  knotsToggle?.addEventListener('click', () => {
    speedMode = 'knots';
    knotsToggle.classList.add('active');
    machToggle.classList.remove('active');
    machSpeed.style.display = 'none';
    customSpeed.style.display = '';
    // Pre-fill with converted Mach speed
    const mach = parseFloat(machSpeed.value);
    if (!isNaN(mach) && machSpeed.value !== 'custom') {
      customSpeed.value = machToKnots(mach);
    }
  });

  machSpeed?.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customSpeed.style.display = '';
      customSpeed.placeholder = 'Enter Mach number (e.g., 0.82)...';
      customSpeed.min = '0.5';
      customSpeed.max = '1.0';
      customSpeed.step = '0.01';
      customSpeed.focus();
    } else {
      customSpeed.style.display = 'none';
    }
  });
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
 * Get current speed in knots
 */
function getCurrentSpeedKnots() {
  const machSpeed = document.getElementById('mach-speed');
  const customSpeed = document.getElementById('custom-speed');

  if (speedMode === 'knots') {
    return parseInt(customSpeed.value) || 480;
  }

  // Mach mode
  const machValue = machSpeed.value;
  if (machValue === 'custom') {
    const customMach = parseFloat(customSpeed.value);
    return isNaN(customMach) ? 480 : machToKnots(customMach);
  }

  return machToKnots(parseFloat(machValue));
}

/**
 * Calculate realistic flight time with operational factors
 * Based on Support Docs/flight-time-calculation-methodology.html
 */
function calculateRealisticFlightTime(distance, cruiseSpeed, depLon, destLon) {
  // Step 1: Base cruise time
  let baseCruiseTime = distance / cruiseSpeed;

  // Step 2: Climb/descent time based on distance
  let climbDescentTime;
  if (distance < 500) {
    climbDescentTime = 0.33; // 20 min for short flights
  } else if (distance < 1000) {
    climbDescentTime = 0.28; // 17 min for medium flights
  } else {
    climbDescentTime = 0.25; // 15 min for long flights
  }

  // Step 3: ATC routing factor based on distance
  let routingFactor;
  if (distance < 500) {
    routingFactor = 1.12; // 12% longer
  } else if (distance < 1000) {
    routingFactor = 1.08; // 8% longer
  } else if (distance < 2000) {
    routingFactor = 1.06; // 6% longer
  } else {
    routingFactor = 1.04; // 4% longer
  }

  let flightTime = (baseCruiseTime + climbDescentTime) * routingFactor;

  // Step 4: Terminal delays (~4 min)
  flightTime += 0.067;

  // Step 5: Prevailing wind factor (for flights > 1000 NM)
  if (distance > 1000) {
    const isEastbound = destLon > depLon;
    const isWestbound = destLon < depLon;
    if (isWestbound) {
      flightTime *= 1.04; // 4% slower (headwinds)
    } else if (isEastbound) {
      flightTime *= 0.96; // 4% faster (tailwinds)
    }
  }

  // Step 6: Taxi time (12 min)
  flightTime += 0.2;

  return flightTime;
}

/**
 * Calculate route
 */
function calculateRoute() {
  const depCode = document.getElementById('departure-input').value.toUpperCase().trim();
  const destCode = document.getElementById('destination-input').value.toUpperCase().trim();
  const speed = getCurrentSpeedKnots();
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

  // Display results with enhanced flight time
  displayResults(distance, speed, analysis, depAirport, destAirport);
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
      notes: firInfo.notes || countryInfo.notes || '',
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
function displayResults(distance, speed, analysis, depAirport, destAirport) {
  const resultsEl = document.getElementById('routeResults');
  resultsEl.style.display = 'block';

  // Calculate realistic flight time
  const flightHours = calculateRealisticFlightTime(
    distance,
    speed,
    depAirport.lon,
    destAirport.lon
  );
  const hours = Math.floor(flightHours);
  const minutes = Math.round((flightHours - hours) * 60);

  document.getElementById('totalDistance').textContent = `${Math.round(distance).toLocaleString()} NM`;
  document.getElementById('estFlightTime').textContent = `${hours}h ${minutes}m`;
  document.getElementById('countriesFirs').textContent = analysis.countries.length;
  document.getElementById('permitsRequired').textContent = analysis.permitsRequired;
  document.getElementById('maxLeadTime').textContent =
    analysis.maxLeadTime > 0 ? `${analysis.maxLeadTime} days` : 'None';

  // Warnings
  const warningsEl = document.getElementById('routeWarnings');
  const warningsListEl = document.getElementById('warningsList');
  if (analysis.warnings.length > 0) {
    warningsEl.style.display = 'block';
    warningsListEl.innerHTML = analysis.warnings.map(w => `<li>${w}</li>`).join('');
  } else {
    warningsEl.style.display = 'none';
  }

  // FIR table with Notes and Details columns
  const tableBody = document.getElementById('firTableBody');
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
      <td class="notes-cell">${c.notes || '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary view-country-btn" data-code="${c.code}">
          View
        </button>
      </td>
    </tr>
  `).join('');

  // Attach country detail modal handlers
  attachCountryDetailHandlers();

  // Scroll results into view
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Attach country detail modal handlers
 */
function attachCountryDetailHandlers() {
  document.querySelectorAll('.view-country-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.target.dataset.code;
      openCountryDetailsModal(code);
    });
  });

  document.getElementById('closeCountryModal')?.addEventListener('click', closeCountryDetailsModal);
  document.getElementById('closeCountryModalBtn')?.addEventListener('click', closeCountryDetailsModal);

  // Close on overlay click
  document.getElementById('countryDetailsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'countryDetailsModal') {
      closeCountryDetailsModal();
    }
  });
}

/**
 * Open country details modal
 */
function openCountryDetailsModal(code) {
  const country = countries[code];
  const firInfo = firs[code];

  if (!country) return;

  document.getElementById('modalCountryFlag').textContent = country.flag || '🏳️';
  document.getElementById('modalCountryName').textContent = country.name;

  document.getElementById('modalCountryContent').innerHTML = renderCountryModalContent(country, firInfo);
  document.getElementById('countryDetailsModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Close country details modal
 */
function closeCountryDetailsModal() {
  document.getElementById('countryDetailsModal').style.display = 'none';
  document.body.style.overflow = '';
}

/**
 * Render country modal content
 */
function renderCountryModalContent(country, firInfo) {
  return `
    <div class="country-modal-grid">
      ${country.warnings?.length ? `
        <div class="modal-section warnings">
          ${country.warnings.map(w => `
            <div class="alert alert-warning">⚠️ ${w}</div>
          `).join('')}
        </div>
      ` : ''}

      <div class="modal-section">
        <h4>Permit Requirements</h4>
        ${renderPermitSummary(country.permits)}
      </div>

      <div class="modal-section">
        <h4>FIR Information</h4>
        <div class="detail-row">
          <span class="detail-label">FIRs:</span>
          <span>${firInfo?.firs?.join(', ') || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ICAO Prefix:</span>
          <span>${country.icaoPrefix || 'N/A'}</span>
        </div>
      </div>

      <div class="modal-section">
        <h4>Civil Aviation Authority</h4>
        <div class="detail-row">
          <span class="detail-label">CAA:</span>
          <span>${country.caa || 'Contact local handler'}</span>
        </div>
        ${country.caaWebsite ? `
          <div class="detail-row">
            <span class="detail-label">Website:</span>
            <a href="${country.caaWebsite}" target="_blank" rel="noopener">${country.caaWebsite}</a>
          </div>
        ` : ''}
      </div>

      <div class="modal-section">
        <h4>Additional Information</h4>
        <div class="detail-row">
          <span class="detail-label">Crew Visa:</span>
          <span>${country.visaCrew || 'Verify requirements'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Key Airports:</span>
          <span>${country.airports?.join(', ') || 'N/A'}</span>
        </div>
        ${country.notes ? `
          <div class="detail-row full-width">
            <span class="detail-label">Notes:</span>
            <span>${country.notes}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render permit summary table
 */
function renderPermitSummary(permits) {
  if (!permits) return '<p class="text-muted">No permit data available</p>';

  const types = [
    { key: 'overflight', label: 'Overflight' },
    { key: 'landingPrivate', label: 'Landing (Private)' },
    { key: 'landingCharter', label: 'Landing (Charter)' },
    { key: 'techStop', label: 'Tech Stop' },
  ];

  const rows = types
    .filter(t => permits[t.key])
    .map(t => {
      const p = permits[t.key];
      return `
        <tr>
          <td>${t.label}</td>
          <td>
            <span class="badge ${p.required ? 'badge-danger' : 'badge-success'}">
              ${p.required ? 'Yes' : 'No'}
            </span>
          </td>
          <td>${p.leadTime ? p.leadTime + ' days' : '-'}</td>
        </tr>
      `;
    });

  return rows.length ? `
    <table class="permit-table table">
      <thead>
        <tr><th>Type</th><th>Required</th><th>Lead Time</th></tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  ` : '<p class="text-muted">No permit data available</p>';
}

/**
 * Render route planner styles
 */
function renderRoutePlannerStyles() {
  return `
    <style>
      .route-planner {
        max-width: 1200px;
        margin: 0 auto;
      }

      .route-form {
        margin-bottom: var(--spacing-xl);
      }

      .route-form .card-body {
        padding: var(--spacing-xl);
      }

      .route-form .card-header h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .route-form .form-group {
        margin-bottom: var(--spacing-lg);
      }

      .route-form label {
        display: block;
        margin-bottom: var(--spacing-sm);
        font-weight: 500;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-xl);
        margin-bottom: var(--spacing-lg);
      }

      /* Aircraft Selector */
      .aircraft-selector {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-md);
        margin-top: var(--spacing-sm);
      }

      /* Speed Selector */
      .speed-selector {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .speed-toggle {
        display: flex;
        border-radius: var(--radius-md);
        overflow: hidden;
        border: 1px solid var(--gray-300);
      }

      .toggle-btn {
        flex: 1;
        padding: var(--spacing-xs) var(--spacing-sm);
        border: none;
        background: var(--white);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .toggle-btn:first-child {
        border-right: 1px solid var(--gray-300);
      }

      .toggle-btn.active {
        background: var(--primary);
        color: var(--white);
      }

      .toggle-btn:hover:not(.active) {
        background: var(--gray-100);
      }

      /* Map */
      .route-map {
        height: 500px;
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-md);
        margin-bottom: var(--spacing-lg);
        position: relative;
      }

      .route-map::after {
        content: 'Click map to enable scroll zoom';
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 6px 14px;
        border-radius: 4px;
        font-size: 0.75rem;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .route-map:hover::after {
        opacity: 1;
      }

      .route-map.zoom-enabled::after {
        display: none;
      }

      /* Autocomplete */
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

      /* Results */
      .route-results {
        background: var(--white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        padding: var(--spacing-lg);
      }

      .results-header h3 {
        margin: 0 0 var(--spacing-lg);
        font-size: 1.25rem;
        color: var(--gray-800);
      }

      /* Summary Stats - 5 column grid */
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .stat-card {
        background: var(--gray-100);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        text-align: center;
      }

      .stat-card.highlight {
        background: var(--primary);
        color: var(--white);
      }

      .stat-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--gray-500);
        margin-bottom: var(--spacing-xs);
      }

      .stat-card.highlight .stat-label {
        color: rgba(255,255,255,0.7);
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
      }

      /* Warnings - Amber style */
      .warnings-section {
        background: #fff3cd;
        border-left: 4px solid #f59e0b;
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-lg);
      }

      .warnings-section h4 {
        margin: 0 0 var(--spacing-sm);
        font-size: 0.9rem;
        color: #856404;
      }

      .warnings-section ul {
        margin: 0;
        padding-left: var(--spacing-lg);
        font-size: 0.85rem;
        color: #856404;
      }

      /* FIR Table */
      .fir-table-container {
        margin-bottom: var(--spacing-lg);
      }

      .fir-table-container h4 {
        margin: 0 0 var(--spacing-sm);
        font-size: 0.9rem;
      }

      .fir-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }

      .fir-table th {
        background: #1e3a5f;
        color: white;
        padding: var(--spacing-sm) var(--spacing-md);
        text-align: left;
        font-weight: 600;
      }

      .fir-table td {
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid var(--gray-200);
      }

      .fir-table tr:hover {
        background: var(--gray-50);
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

      .notes-cell {
        font-size: 0.8rem;
        color: var(--gray-600);
        max-width: 200px;
      }

      /* Next Steps */
      .next-steps-section {
        background: var(--gray-50);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
      }

      .next-steps-section h4 {
        margin: 0 0 var(--spacing-sm);
        font-size: 0.9rem;
        color: var(--gray-700);
      }

      .next-steps-section ol {
        margin: 0;
        padding-left: var(--spacing-lg);
        font-size: 0.85rem;
        color: var(--gray-600);
      }

      .next-steps-section li {
        margin-bottom: var(--spacing-xs);
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .summary-stats {
          grid-template-columns: repeat(3, 1fr);
        }

        .stat-card.highlight {
          grid-column: span 3;
        }

        .aircraft-selector {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }

        .summary-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .stat-card.highlight {
          grid-column: span 2;
        }

        .route-map {
          height: 350px;
        }

        .fir-table {
          font-size: 0.75rem;
        }

        .notes-cell {
          display: none;
        }
      }

      /* Modal Overlay */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--spacing-lg);
      }

      .modal {
        background: var(--white);
        border-radius: var(--radius-lg);
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-lg {
        max-width: 700px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md) var(--spacing-lg);
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
      }

      .modal-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin: 0;
        font-size: 1.25rem;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--gray-500);
        padding: 0;
        line-height: 1;
      }

      .modal-close:hover {
        color: var(--gray-700);
      }

      .modal-body {
        padding: var(--spacing-lg);
        overflow-y: auto;
        flex: 1;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        border-top: 1px solid var(--gray-200);
      }

      /* Country Modal Content */
      .country-modal-grid {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .modal-section h4 {
        margin: 0 0 var(--spacing-sm);
        font-size: 0.9rem;
        color: var(--gray-700);
        border-bottom: 1px solid var(--gray-200);
        padding-bottom: var(--spacing-xs);
      }

      .detail-row {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-xs) 0;
      }

      .detail-label {
        font-weight: 500;
        color: var(--gray-600);
        min-width: 120px;
        flex-shrink: 0;
      }

      .detail-row a {
        color: var(--primary);
        word-break: break-all;
      }

      /* View button styling */
      .view-country-btn {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }

      /* Permit table in modal */
      .modal .permit-table {
        font-size: 0.85rem;
        margin-top: var(--spacing-sm);
      }

      .modal .permit-table th {
        background: var(--gray-100);
        color: var(--gray-700);
        font-weight: 600;
      }

      /* Alert in modal */
      .modal .alert {
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-sm);
      }

      .modal .alert-warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
      }

      @media (max-width: 600px) {
        .modal {
          max-height: 90vh;
        }

        .modal-body {
          padding: var(--spacing-md);
        }

        .detail-row {
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .detail-label {
          min-width: auto;
        }
      }
    </style>
  `;
}
