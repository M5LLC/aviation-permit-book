/**
 * Script to enhance airport data with comprehensive details
 * Run with: node scripts/enhance-airports.cjs
 */

const fs = require('fs');
const path = require('path');

// Slot coordination data for major airports
const slotData = {
  // Level 3 - Full coordination required
  'EGLL': { slotLevel: 3, slotCoordinator: 'ACL UK' },
  'EGKK': { slotLevel: 3, slotCoordinator: 'ACL UK' },
  'EGSS': { slotLevel: 3, slotCoordinator: 'ACL UK' },
  'EGGW': { slotLevel: 3, slotCoordinator: 'ACL UK' },
  'LFPG': { slotLevel: 3, slotCoordinator: 'COHOR' },
  'LFPO': { slotLevel: 3, slotCoordinator: 'COHOR' },
  'LFMN': { slotLevel: 3, slotCoordinator: 'COHOR' },
  'EDDF': { slotLevel: 3, slotCoordinator: 'FHKD' },
  'EDDM': { slotLevel: 3, slotCoordinator: 'FHKD' },
  'EDDL': { slotLevel: 3, slotCoordinator: 'FHKD' },
  'EDDS': { slotLevel: 3, slotCoordinator: 'FHKD' },
  'LEMD': { slotLevel: 3, slotCoordinator: 'SACTA' },
  'LEBL': { slotLevel: 3, slotCoordinator: 'SACTA' },
  'LEPA': { slotLevel: 3, slotCoordinator: 'SACTA' },
  'LIRF': { slotLevel: 3, slotCoordinator: 'ASSOCLEARANCE' },
  'LIMC': { slotLevel: 3, slotCoordinator: 'ASSOCLEARANCE' },
  'LIPZ': { slotLevel: 3, slotCoordinator: 'ASSOCLEARANCE' },
  'EHAM': { slotLevel: 3, slotCoordinator: 'ACNL' },
  'LSZH': { slotLevel: 3, slotCoordinator: 'SLOT CH' },
  'LSGG': { slotLevel: 2, slotCoordinator: 'SLOT CH' }, // Level 2 normally, 3 in winter
  // Level 2 - Schedule facilitated
  'LFPB': { slotLevel: 2, slotCoordinator: 'COHOR' },
  'EGLF': { slotLevel: 2, slotCoordinator: 'ACL UK' },
  'EGKB': { slotLevel: 1, slotCoordinator: null },
  'LIML': { slotLevel: 2, slotCoordinator: 'ASSOCLEARANCE' },
  'LOWW': { slotLevel: 2, slotCoordinator: 'Schedule Coordination Austria' },
  'LOWI': { slotLevel: 2, slotCoordinator: 'Schedule Coordination Austria' },
};

// Curfew data for airports with night restrictions
const curfewData = {
  'EGLL': { hasCurfew: true, hours: '23:30-04:30', exceptions: 'Emergency, delayed movements' },
  'EDDF': { hasCurfew: true, hours: '23:00-05:00', exceptions: 'Quota count system' },
  'EDDM': { hasCurfew: true, hours: '22:00-06:00', exceptions: 'Medical, emergency' },
  'LEMD': { hasCurfew: true, hours: '00:00-06:00', exceptions: 'Limited movements allowed' },
  'LSZH': { hasCurfew: true, hours: '23:00-06:00', exceptions: 'Emergency only' },
  'EHAM': { hasCurfew: true, hours: '23:00-06:00', exceptions: 'Schiphol night regime' },
  'LFPG': { hasCurfew: true, hours: '00:00-05:30', exceptions: 'Limited' },
  'LIRF': { hasCurfew: false, hours: null, exceptions: null },
  'LFPB': { hasCurfew: true, hours: '22:30-06:30', exceptions: 'PPR required' },
  'KVNY': { hasCurfew: true, hours: '22:00-07:00', exceptions: 'Voluntary compliance' },
};

// Customs data
const customsData = {
  // US - All international are AOE with CBP
  'KTEB': { available: true, hours: '24/7', advanceNotice: '1 hour eAPIS' },
  'KJFK': { available: true, hours: '24/7', advanceNotice: '1 hour eAPIS' },
  'KLAX': { available: true, hours: '24/7', advanceNotice: '1 hour eAPIS' },
  'KMIA': { available: true, hours: '24/7', advanceNotice: '1 hour eAPIS' },
  'KLAS': { available: true, hours: '24/7', advanceNotice: '1 hour eAPIS' },
  // Europe
  'EGLL': { available: true, hours: '24/7', advanceNotice: 'GAR required' },
  'EGLF': { available: true, hours: '24/7', advanceNotice: 'GAR required' },
  'LFPB': { available: true, hours: '05:30-23:30', advanceNotice: '2 hours' },
  'EDDF': { available: true, hours: '24/7', advanceNotice: '24 hours' },
  'LSZH': { available: true, hours: '06:00-22:00', advanceNotice: '24 hours' },
  'LSGG': { available: true, hours: '06:00-22:00', advanceNotice: '24 hours' },
  // Middle East - mostly 24/7
  'OMDB': { available: true, hours: '24/7', advanceNotice: 'Pre-arrival manifest' },
  'OMDW': { available: true, hours: '24/7', advanceNotice: 'Pre-arrival manifest' },
  'OTHH': { available: true, hours: '24/7', advanceNotice: 'Pre-arrival manifest' },
};

// Airport types
const airportTypes = {
  // Major international hubs
  'KJFK': 'international',
  'KLAX': 'international',
  'EGLL': 'international',
  'LFPG': 'international',
  'EDDF': 'international',
  'EHAM': 'international',
  'LSZH': 'international',
  'OMDB': 'international',
  'VHHH': 'international',
  'WSSS': 'international',
  'RJTT': 'international',
  'YSSY': 'international',
  // GA/Business aviation focused
  'KTEB': 'ga',
  'KVNY': 'ga',
  'KSDL': 'ga',
  'LFPB': 'ga',
  'EGLF': 'ga',
  'EGKB': 'ga',
  'LSGG': 'ga',
  'LIML': 'ga',
  'OMDW': 'ga',
};

// Get country region from code
function getRegion(country) {
  const regionMap = {
    'US': 'North America', 'CA': 'North America', 'MX': 'North America',
    'GB': 'Europe', 'FR': 'Europe', 'DE': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
    'CH': 'Europe', 'NL': 'Europe', 'BE': 'Europe', 'AT': 'Europe', 'PT': 'Europe',
    'IE': 'Europe', 'NO': 'Europe', 'SE': 'Europe', 'DK': 'Europe', 'FI': 'Europe',
    'GR': 'Europe', 'TR': 'Europe', 'RU': 'Europe', 'PL': 'Europe', 'CZ': 'Europe',
    'HU': 'Europe',
    'AE': 'Middle East', 'QA': 'Middle East', 'SA': 'Middle East', 'BH': 'Middle East',
    'KW': 'Middle East', 'OM': 'Middle East', 'IL': 'Middle East', 'JO': 'Middle East',
    'HK': 'Asia Pacific', 'SG': 'Asia Pacific', 'JP': 'Asia Pacific', 'KR': 'Asia Pacific',
    'TW': 'Asia Pacific', 'CN': 'Asia Pacific', 'IN': 'Asia Pacific', 'TH': 'Asia Pacific',
    'MY': 'Asia Pacific', 'ID': 'Asia Pacific', 'PH': 'Asia Pacific', 'VN': 'Asia Pacific',
    'MN': 'Asia Pacific',
    'ZA': 'Africa', 'KE': 'Africa', 'NG': 'Africa', 'EG': 'Africa', 'MA': 'Africa',
    'TN': 'Africa', 'DZ': 'Africa', 'MU': 'Africa', 'SC': 'Africa',
    'BR': 'South America', 'AR': 'South America', 'CL': 'South America',
    'CO': 'South America', 'PE': 'South America', 'EC': 'South America', 'VE': 'South America',
    'BS': 'Caribbean', 'JM': 'Caribbean', 'DO': 'Caribbean', 'SX': 'Caribbean',
    'BB': 'Caribbean', 'KY': 'Caribbean', 'PR': 'Caribbean', 'CU': 'Caribbean',
    'AU': 'Oceania', 'NZ': 'Oceania', 'FJ': 'Oceania', 'PF': 'Oceania',
  };
  return regionMap[country] || 'Other';
}

// Main enhancement function
async function enhanceAirports() {
  const airportsPath = path.join(__dirname, '../data/airports.json');

  // Read existing airports
  const airports = JSON.parse(fs.readFileSync(airportsPath, 'utf8'));

  let enhanced = 0;

  airports.forEach(airport => {
    // Add region
    airport.region = getRegion(airport.country);

    // Add airport type
    airport.type = airportTypes[airport.code] || 'regional';

    // Add slot coordination data
    const slot = slotData[airport.code];
    if (slot) {
      airport.slotLevel = slot.slotLevel;
      airport.slotCoordinator = slot.slotCoordinator;
    } else {
      airport.slotLevel = 1; // Default to Level 1 (non-coordinated)
      airport.slotCoordinator = null;
    }

    // Add curfew data
    const curfew = curfewData[airport.code];
    if (curfew) {
      airport.curfew = curfew;
    } else {
      airport.curfew = { hasCurfew: false, hours: null, exceptions: null };
    }

    // Add customs data
    const customs = customsData[airport.code];
    if (customs) {
      airport.customs = customs;
    } else {
      // Default based on airport type
      airport.customs = {
        available: airport.type === 'international' || airport.type === 'ga',
        hours: 'Contact FBO',
        advanceNotice: '24 hours typical'
      };
    }

    // Add AOE (Airport of Entry) status - most international airports
    airport.aoe = airport.type === 'international' ||
                  ['KTEB', 'KVNY', 'KSDL', 'LFPB', 'EGLF', 'OMDW', 'LSGG'].includes(airport.code);

    // Add immigration availability (same as customs for most)
    airport.immigration = {
      available: airport.customs.available,
      hours: airport.customs.hours
    };

    // Update version
    airport._version = (airport._version || 1) + 1;
    enhanced++;
  });

  // Write enhanced data back
  fs.writeFileSync(airportsPath, JSON.stringify(airports, null, 2));

  console.log(`Enhanced ${enhanced} airports with comprehensive data`);
  console.log('Airports file updated successfully!');
}

enhanceAirports();
