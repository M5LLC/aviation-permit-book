/**
 * Script to enhance FBO data with type badges and additional fields
 * Run with: node scripts/enhance-fbos.cjs
 */

const fs = require('fs');
const path = require('path');

// FBO type mapping - categorize known FBOs/Handlers
const fboTypes = {
  // Global FBO chains - typically "both" as they provide full service
  'Signature Flight Support': 'fbo',
  'Jet Aviation': 'fbo',
  'ExecuJet': 'fbo',
  'TAG Aviation': 'fbo',
  'TAG Farnborough': 'fbo',
  'Harrods Aviation': 'fbo',
  'Atlantic Aviation': 'fbo',
  'Ross Aviation': 'fbo',
  'Clay Lacy Aviation': 'fbo',
  'Million Air': 'fbo',
  'Sheltair': 'fbo',
  'Pentastar Aviation': 'fbo',

  // Trip support / handling companies
  'Universal Aviation': 'handler',
  'World Fuel Services': 'handler',
  'Hadid International': 'handler',
  'Jetex': 'both',
  'Jetex Dubai': 'both',
  'Swissport Executive': 'handler',
  'Iberia Handling': 'handler',
  'Sky Services': 'handler',
  'Aviapartner': 'handler',
  'Menzies Aviation': 'handler',
  'dnata': 'handler',

  // Regional FBOs - typically "fbo"
  'Geneva Airpark': 'fbo',
  'London City Airport Jet Centre': 'fbo',

};

// Operating hours for major airports (default to "24/7" for international hubs)
const operatingHours = {
  'EGLL': '06:00-23:00 LT',
  'EGLF': '24/7',
  'LFPB': '05:30-23:30 LT',
  'LSGG': '06:00-22:00 LT',
  'EDDF': '24/7',
  'EDDM': '24/7',
  'LIRF': '24/7',
  'LEMD': '24/7',
  'OMDB': '24/7',
  'OMDW': '24/7',
  'KJFK': '24/7',
  'KTEB': '24/7',
  'KLAX': '24/7',
  'KVNY': '24/7',
  'KSDL': '24/7',
  'KLAS': '24/7',
  'KMIA': '24/7',
  'CYYZ': '24/7',
  'CYVR': '24/7',
};

// Customs availability
const customsInfo = {
  'EGLL': 'on-site',
  'EGLF': 'on-site',
  'LFPB': 'on-site',
  'LSGG': 'on-site',
  'EDDF': 'on-site',
  'EDDM': 'on-site',
  'LIRF': 'on-site',
  'LEMD': 'on-site',
  'OMDB': 'on-site',
  'OMDW': 'on-site',
  'KJFK': 'on-site',
  'KTEB': 'on-site',
  'KLAX': 'on-site',
  'KMIA': 'on-site',
  'CYYZ': 'on-site',
};

// Function to determine FBO type from name
function getFBOType(name) {
  // Check direct mapping first
  if (fboTypes[name]) return fboTypes[name];

  // Check partial matches
  for (const [key, type] of Object.entries(fboTypes)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return type;
    }
  }

  // Default logic based on common keywords
  const lowerName = name.toLowerCase();
  if (lowerName.includes('handling') || lowerName.includes('services') || lowerName.includes('support')) {
    return 'handler';
  }
  if (lowerName.includes('fbo') || lowerName.includes('aviation center') || lowerName.includes('jet center')) {
    return 'fbo';
  }

  // Default to "both" for unknown - most provide combined services
  return 'both';
}

// Main enhancement function
async function enhanceFBOs() {
  const fbosPath = path.join(__dirname, '../data/fbos.json');

  // Read existing FBOs
  const airports = JSON.parse(fs.readFileSync(fbosPath, 'utf8'));

  let enhancedCount = 0;

  airports.forEach(airport => {
    // Add airport-level enhancements
    airport.operatingHours = operatingHours[airport.airport] || 'Contact FBO';
    airport.customs = customsInfo[airport.airport] || 'airport';

    // Enhance each FBO
    if (airport.fbos) {
      airport.fbos.forEach(fbo => {
        // Add type badge
        fbo.type = fbo.type || getFBOType(fbo.name);

        // Add additional fields with reasonable defaults
        if (!fbo.operatingHours) {
          fbo.operatingHours = airport.operatingHours;
        }

        // Set fuel availability (most FBOs have Jet-A)
        if (!fbo.fuel) {
          fbo.fuel = ['Jet-A'];
        }

        // Set common amenities based on FBO type
        if (fbo.type === 'fbo' || fbo.type === 'both') {
          if (fbo.hangar === undefined) fbo.hangar = true;
          if (fbo.vipLounge === undefined) fbo.vipLounge = true;
          if (fbo.crewLounge === undefined) fbo.crewLounge = true;
        } else {
          if (fbo.hangar === undefined) fbo.hangar = false;
          if (fbo.vipLounge === undefined) fbo.vipLounge = false;
          if (fbo.crewLounge === undefined) fbo.crewLounge = true;
        }

        // Customs handling
        if (!fbo.customs) {
          fbo.customs = airport.customs;
        }

        // Confidence level
        if (!fbo.confidence) {
          // High confidence for well-known chains
          const knownChains = ['Signature', 'Jet Aviation', 'Universal', 'ExecuJet', 'Jetex', 'TAG', 'Hadid'];
          fbo.confidence = knownChains.some(chain => fbo.name.includes(chain)) ? 'high' : 'medium';
        }

        enhancedCount++;
      });
    }

    // Update version
    airport._version = (airport._version || 1) + 1;
  });

  // Write enhanced data back
  fs.writeFileSync(fbosPath, JSON.stringify(airports, null, 2));

  console.log(`Enhanced ${enhancedCount} FBO entries across ${airports.length} airports`);
  console.log('FBOs file updated successfully!');
}

enhanceFBOs();
