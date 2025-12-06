/**
 * Migrate Data to Firestore
 *
 * This script uploads the extracted JSON data to Firestore.
 * It uses the Firebase Admin SDK for server-side access.
 *
 * Prerequisites:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Firestore Database
 * 3. Generate a service account key:
 *    - Go to Project Settings > Service Accounts
 *    - Click "Generate new private key"
 *    - Save as "serviceAccountKey.json" in the project root
 * 4. Run: node scripts/migrate-data.js
 *
 * Usage:
 *   node scripts/migrate-data.js [--clear]
 *
 * Options:
 *   --clear  Delete existing data before seeding
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const SERVICE_ACCOUNT_PATH = join(__dirname, '..', 'serviceAccountKey.json');

// Check for service account key
if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Service account key not found!');
  console.log('\nTo set up Firebase Admin SDK:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file as "serviceAccountKey.json" in the project root');
  console.log('\nPath expected:', SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Parse command line args
const shouldClear = process.argv.includes('--clear');

/**
 * Load JSON data file
 */
function loadData(filename) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    console.warn(`⚠️ Data file not found: ${filename}`);
    return null;
  }
  return JSON.parse(readFileSync(filepath, 'utf8'));
}

/**
 * Delete all documents in a collection
 */
async function clearCollection(collectionName) {
  console.log(`Clearing ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  Deleted ${snapshot.size} documents`);
}

/**
 * Upload documents to a collection
 */
async function uploadCollection(collectionName, documents, idField = null) {
  console.log(`Uploading to ${collectionName}...`);

  // Use batched writes for efficiency (max 500 per batch)
  const batchSize = 450;
  let uploadCount = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = db.batch();
    const chunk = documents.slice(i, i + batchSize);

    chunk.forEach(doc => {
      // Determine document ID
      let docId;
      if (idField && doc[idField]) {
        docId = doc[idField];
      } else if (doc.code) {
        docId = doc.code;
      } else if (doc.countryCode) {
        docId = doc.countryCode;
      } else if (doc.airport) {
        docId = doc.airport;
      } else {
        // Auto-generate ID
        docId = db.collection(collectionName).doc().id;
      }

      const docRef = db.collection(collectionName).doc(docId);

      // Add timestamp
      const docData = {
        ...doc,
        _importedAt: FieldValue.serverTimestamp(),
      };

      batch.set(docRef, docData);
    });

    await batch.commit();
    uploadCount += chunk.length;
    console.log(`  Uploaded ${uploadCount}/${documents.length}`);
  }

  return uploadCount;
}

/**
 * Create initial organization
 */
async function createDefaultOrganization() {
  const orgId = 'default-org';
  const orgRef = db.collection('organizations').doc(orgId);
  const orgDoc = await orgRef.get();

  if (!orgDoc.exists) {
    console.log('Creating default organization...');
    await orgRef.set({
      name: 'Default Organization',
      branding: {
        appName: 'Permit Book',
        primaryColor: '#1e3a5f',
        accentColor: '#c9a962',
      },
      settings: {
        allowSelfRegistration: true,
      },
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log('  Created organization:', orgId);
    return orgId;
  } else {
    console.log('Default organization already exists');
    return orgId;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Firestore migration...\n');

  try {
    // Clear collections if requested
    if (shouldClear) {
      console.log('📦 Clearing existing data...\n');
      await clearCollection('countries');
      await clearCollection('airports');
      await clearCollection('fbos');
      await clearCollection('firs');
      await clearCollection('changelog');
      console.log('');
    }

    // Create default organization
    console.log('🏢 Setting up organization...');
    await createDefaultOrganization();
    console.log('');

    // Upload countries
    const countries = loadData('countries.json');
    if (countries) {
      await uploadCollection('countries', countries, 'code');
    }

    // Upload airports
    const airports = loadData('airports.json');
    if (airports) {
      await uploadCollection('airports', airports, 'code');
    }

    // Upload FBOs
    const fbos = loadData('fbos.json');
    if (fbos) {
      await uploadCollection('fbos', fbos, 'airport');
    }

    // Upload FIRs
    const firs = loadData('firs.json');
    if (firs) {
      await uploadCollection('firs', firs, 'countryCode');
    }

    // Upload changelog
    const changelog = loadData('changelog.json');
    if (changelog) {
      // Add unique IDs to changelog entries
      const changelogWithIds = changelog.map((entry, index) => ({
        ...entry,
        id: `entry-${Date.now()}-${index}`,
      }));
      await uploadCollection('changelog', changelogWithIds, 'id');
    }

    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Deploy security rules: firebase deploy --only firestore:rules');
    console.log('2. Create an admin user in Firebase Auth');
    console.log('3. Add the user to Firestore users collection with role: "admin"');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
migrate();
