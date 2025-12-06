/**
 * Aircraft Database for Route Planner
 * Focus on business aviation aircraft commonly used for international operations
 * Source: Support Docs/aircraft_manufacturer_selector.html
 */

export const aircraftData = {
  "Gulfstream Aerospace": {
    "G700/G800": ["G700", "G800"],
    "G650": ["G650", "G650ER"],
    "G500/G600": ["G500", "G600"],
    "G450/G550": ["G450", "G550"],
    "G280": ["G280"],
    "G150": ["G150"],
    "G100": ["G100"],
  },
  "Bombardier": {
    "Global 7500/8000": ["Global 7500", "Global 8000"],
    "Global 6000/6500": ["Global 6000", "Global 6500"],
    "Global 5000/5500": ["Global 5000", "Global 5500"],
    "Challenger 650": ["Challenger 650", "Challenger 605", "Challenger 604"],
    "Challenger 350": ["Challenger 350", "Challenger 300"],
    "Challenger 3500": ["Challenger 3500"],
    "Learjet 75": ["Learjet 75", "Learjet 75 Liberty"],
    "Learjet 70": ["Learjet 70"],
    "Learjet 60": ["Learjet 60", "Learjet 60SE", "Learjet 60XR"],
    "Learjet 45": ["Learjet 45", "Learjet 45XR"],
    "Learjet 40": ["Learjet 40", "Learjet 40XR"],
  },
  "Dassault Aviation": {
    "Falcon 10X": ["Falcon 10X"],
    "Falcon 8X": ["Falcon 8X"],
    "Falcon 7X": ["Falcon 7X"],
    "Falcon 6X": ["Falcon 6X"],
    "Falcon 900": ["Falcon 900LX", "Falcon 900EX", "Falcon 900DX", "Falcon 900C", "Falcon 900B"],
    "Falcon 2000": ["Falcon 2000LXS", "Falcon 2000S", "Falcon 2000LX", "Falcon 2000EX"],
    "Falcon 50": ["Falcon 50EX", "Falcon 50"],
  },
  "Cessna (Textron)": {
    "Citation Longitude": ["Citation Longitude"],
    "Citation Latitude": ["Citation Latitude"],
    "Citation X": ["Citation X+", "Citation X"],
    "Citation Sovereign": ["Citation Sovereign+", "Citation Sovereign"],
    "Citation XLS": ["Citation XLS+", "Citation XLS", "Citation Excel"],
    "Citation CJ4": ["CitationJet CJ4"],
    "Citation CJ3": ["CitationJet CJ3+", "CitationJet CJ3"],
    "Citation CJ2": ["CitationJet CJ2+", "CitationJet CJ2"],
    "Citation M2": ["Citation M2"],
    "Citation Mustang": ["Citation Mustang"],
  },
  "Embraer": {
    "Praetor 600": ["Praetor 600"],
    "Praetor 500": ["Praetor 500"],
    "Legacy 650": ["Legacy 650E", "Legacy 650"],
    "Legacy 600": ["Legacy 600"],
    "Legacy 500": ["Legacy 500"],
    "Legacy 450": ["Legacy 450"],
    "Phenom 300": ["Phenom 300E", "Phenom 300"],
    "Phenom 100": ["Phenom 100EV", "Phenom 100E", "Phenom 100"],
    "Lineage 1000": ["Lineage 1000E", "Lineage 1000"],
  },
  "Pilatus": {
    "PC-24": ["PC-24"],
    "PC-12": ["PC-12 NGX", "PC-12 NG", "PC-12/47E"],
  },
  "Honda Aircraft": {
    "HondaJet": ["HondaJet Elite II", "HondaJet Elite S", "HondaJet Elite", "HondaJet HA-420"],
  },
  "Daher": {
    "TBM 960": ["TBM 960"],
    "TBM 940": ["TBM 940"],
    "TBM 930": ["TBM 930"],
    "TBM 910": ["TBM 910"],
    "TBM 900": ["TBM 900"],
    "Kodiak": ["Kodiak 900", "Kodiak 100 Series III"],
  },
  "Beechcraft (Textron)": {
    "King Air 360": ["King Air 360", "King Air 360ER"],
    "King Air 350": ["King Air 350i", "King Air 350ER", "King Air 350"],
    "King Air 250": ["King Air 250"],
    "King Air 200": ["King Air B200GT", "King Air B200"],
    "King Air 90": ["King Air C90GTx", "King Air C90GTi"],
  },
  "British Aerospace / Hawker": {
    "Hawker 4000": ["Hawker 4000"],
    "Hawker 900XP": ["Hawker 900XP"],
    "Hawker 850XP": ["Hawker 850XP"],
    "Hawker 800XP": ["Hawker 800XP"],
    "Hawker 750": ["Hawker 750"],
    "BAe 125": ["BAe 125-800", "BAe 125-700"],
  },
};

// Cruise speed presets (Mach at typical cruise altitude FL410-450)
export const machSpeeds = [
  { value: 0.77, label: '.77' },
  { value: 0.78, label: '.78' },
  { value: 0.79, label: '.79' },
  { value: 0.80, label: '.80' },
  { value: 0.81, label: '.81' },
  { value: 0.82, label: '.82' },
  { value: 0.83, label: '.83' },
  { value: 0.84, label: '.84' },
  { value: 0.85, label: '.85' },
  { value: 0.86, label: '.86' },
  { value: 0.87, label: '.87' },
  { value: 0.88, label: '.88' },
  { value: 0.89, label: '.89' },
  { value: 0.90, label: '.90' },
  { value: 0.91, label: '.91' },
  { value: 0.92, label: '.92' },
  { value: 0.93, label: '.93' },
  { value: 0.94, label: '.94' },
  { value: 0.95, label: '.95' },
  { value: 'custom', label: 'Custom...' },
];

// Convert Mach to TAS (True Airspeed in knots) at cruise altitude
// At FL410 (~-56.5°C), speed of sound ≈ 573 kts
export function machToKnots(mach) {
  const speedOfSound = 573; // kts at FL410
  return Math.round(mach * speedOfSound);
}

// Convert knots to Mach
export function knotsToMach(knots) {
  const speedOfSound = 573;
  return knots / speedOfSound;
}

// Get all manufacturers
export function getManufacturers() {
  return Object.keys(aircraftData).sort();
}

// Get models for a manufacturer
export function getModels(manufacturer) {
  if (!aircraftData[manufacturer]) return [];
  return Object.keys(aircraftData[manufacturer]);
}

// Get variants for a model
export function getVariants(manufacturer, model) {
  if (!aircraftData[manufacturer] || !aircraftData[manufacturer][model]) return [];
  return aircraftData[manufacturer][model];
}

// Format aircraft display name
export function formatAircraftName(manufacturer, model, variant) {
  if (variant && variant !== model) {
    return `${manufacturer} ${variant}`;
  }
  return `${manufacturer} ${model}`;
}
