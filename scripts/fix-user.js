/**
 * Fix User - Add missing Firestore document for existing Firebase Auth user
 *
 * Usage: node scripts/fix-user.js <uid> <email> [organizationId]
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = join(__dirname, '..', 'serviceAccountKey.json');

// Get command line args
const [,, uid, email, organizationId = 'default-org'] = process.argv;

if (!uid || !email) {
  console.log('Usage: node scripts/fix-user.js <uid> <email> [organizationId]');
  console.log('Example: node scripts/fix-user.js abc123xyz user@example.com gac');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function fixUser() {
  try {
    console.log('Adding Firestore user document...');
    console.log(`  UID: ${uid}`);
    console.log(`  Email: ${email}`);
    console.log(`  Organization: ${organizationId}`);

    // Check if document already exists
    const existingDoc = await db.collection('users').doc(uid).get();
    if (existingDoc.exists) {
      console.log('\n⚠️  User document already exists. Current data:');
      console.log(JSON.stringify(existingDoc.data(), null, 2));
      console.log('\nUpdating status to approved...');

      await db.collection('users').doc(uid).update({
        status: 'approved',
        lastLogin: null,
      });
      console.log('✅ User status updated to approved');
    } else {
      // Create new user document
      await db.collection('users').doc(uid).set({
        email,
        displayName: email.split('@')[0],
        organizationId,
        role: 'user',
        status: 'approved',
        createdAt: FieldValue.serverTimestamp(),
        lastLogin: null,
      });
      console.log('✅ Firestore user document created');
    }

    // Also check and clean up pendingUsers if exists
    const pendingDoc = await db.collection('pendingUsers').doc(uid).get();
    if (pendingDoc.exists) {
      await db.collection('pendingUsers').doc(uid).delete();
      console.log('✅ Removed from pendingUsers collection');
    }

    console.log('\n🎉 User fixed successfully!');
    console.log(`\n${email} should now be able to log in.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUser();
