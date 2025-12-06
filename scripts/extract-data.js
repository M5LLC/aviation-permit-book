/**
 * Extract Data from HTML
 *
 * This script parses the original HTML file and extracts the JavaScript
 * data structures (countries, airports, FBOs, FIRs, changelog) into
 * separate JSON files for use with Firestore.
 *
 * Usage: node scripts/extract-data.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// Source HTML file
const HTML_FILE = join(__dirname, '..', '..', 'Global_Air_Charters_Permit_Book_v3.html');

console.log('Extracting data from:', HTML_FILE);

// Read the HTML file
let htmlContent;
try {
  htmlContent = readFileSync(HTML_FILE, 'utf8');
  console.log('HTML file loaded, size:', htmlContent.length, 'bytes');
} catch (error) {
  console.error('Error reading HTML file:', error.message);
  process.exit(1);
}

// Ensure data directory exists
mkdirSync(DATA_DIR, { recursive: true });

/**
 * Extract JavaScript array/object from HTML content
 * @param {string} html - HTML content
 * @param {string} varName - Variable name to extract
 * @returns {any} Parsed JavaScript object
 */
function extractJSVariable(html, varName) {
  // Match: const varName = [...] or const varName = {...}
  const patterns = [
    new RegExp(`const\\s+${varName}\\s*=\\s*(\\[\\s*[\\s\\S]*?\\n\\s*\\]);`, 'm'),
    new RegExp(`const\\s+${varName}\\s*=\\s*(\\{\\s*[\\s\\S]*?\\n\\s*\\});`, 'm'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        // Clean up the JS to make it valid JSON
        let jsCode = match[1];

        // Remove trailing commas before ] or }
        jsCode = jsCode.replace(/,(\s*[}\]])/g, '$1');

        // Replace single quotes with double quotes (careful with apostrophes)
        // This is tricky - we need to handle cases like "Côte d'Azur"
        // For now, we'll evaluate as JS instead of parsing as JSON

        // Use Function constructor to safely evaluate (safer than eval)
        const fn = new Function(`return ${jsCode}`);
        return fn();
      } catch (e) {
        console.error(`Error parsing ${varName}:`, e.message);
        console.log('First 500 chars of match:', match[1].substring(0, 500));
        return null;
      }
    }
  }

  console.warn(`Variable ${varName} not found`);
  return null;
}

// Extract countries array
console.log('\nExtracting countries...');
const countries = extractJSVariable(htmlContent, 'countries');
if (countries) {
  console.log(`Found ${countries.length} countries`);

  // Add _version field for conflict detection
  const countriesWithVersion = countries.map(country => ({
    ...country,
    _version: 1,
  }));

  writeFileSync(
    join(DATA_DIR, 'countries.json'),
    JSON.stringify(countriesWithVersion, null, 2)
  );
  console.log('Saved to data/countries.json');
}

// Extract FBO database
console.log('\nExtracting FBOs...');
const fboDatabase = extractJSVariable(htmlContent, 'fboDatabase');
if (fboDatabase) {
  console.log(`Found ${fboDatabase.length} airport FBO entries`);
  const totalFBOs = fboDatabase.reduce((sum, apt) => sum + (apt.fbos?.length || 0), 0);
  console.log(`Total FBOs: ${totalFBOs}`);

  writeFileSync(
    join(DATA_DIR, 'fbos.json'),
    JSON.stringify(fboDatabase, null, 2)
  );
  console.log('Saved to data/fbos.json');
}

// Extract airport database
console.log('\nExtracting airports...');
const airportDatabase = extractJSVariable(htmlContent, 'airportDatabase');
if (airportDatabase) {
  const airportCount = Object.keys(airportDatabase).length;
  console.log(`Found ${airportCount} airports`);

  // Convert to array format with ICAO code as id
  const airportsArray = Object.entries(airportDatabase).map(([code, data]) => ({
    code,
    ...data,
    _version: 1,
  }));

  writeFileSync(
    join(DATA_DIR, 'airports.json'),
    JSON.stringify(airportsArray, null, 2)
  );
  console.log('Saved to data/airports.json');
}

// Extract FIR data
console.log('\nExtracting FIR data...');
const firData = extractJSVariable(htmlContent, 'firData');
if (firData) {
  const firCount = Object.keys(firData).length;
  console.log(`Found ${firCount} FIR entries`);

  // Convert to array format
  const firsArray = Object.entries(firData).map(([countryCode, data]) => ({
    countryCode,
    ...data,
  }));

  writeFileSync(
    join(DATA_DIR, 'firs.json'),
    JSON.stringify(firsArray, null, 2)
  );
  console.log('Saved to data/firs.json');
}

// Extract changelog
console.log('\nExtracting changelog...');
const changelog = extractJSVariable(htmlContent, 'changelog');
if (changelog) {
  console.log(`Found ${changelog.length} changelog entries`);

  writeFileSync(
    join(DATA_DIR, 'changelog.json'),
    JSON.stringify(changelog, null, 2)
  );
  console.log('Saved to data/changelog.json');
}

// Extract country code map
console.log('\nExtracting country code map...');
const countryCodeMap = extractJSVariable(htmlContent, 'countryCodeMap');
if (countryCodeMap) {
  const mapCount = Object.keys(countryCodeMap).length;
  console.log(`Found ${mapCount} country code mappings`);

  writeFileSync(
    join(DATA_DIR, 'country-codes.json'),
    JSON.stringify(countryCodeMap, null, 2)
  );
  console.log('Saved to data/country-codes.json');
}

console.log('\n✅ Data extraction complete!');
console.log('Files saved to:', DATA_DIR);
