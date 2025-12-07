/**
 * Check User - Verify user document exists in Firestore
 *
 * Usage: node scripts/check-user.js <uid>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = join(__dirname, '..', 'serviceAccountKey.json');

const [,, uid] = process.argv;

if (!uid) {
  console.log('Usage: node scripts/check-user.js <uid>');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

async function checkUser() {
  console.log(`\nChecking user: ${uid}\n`);
  console.log('='.repeat(50));

  // Check Firebase Auth
  console.log('\n📧 FIREBASE AUTH:');
  try {
    const authUser = await auth.getUser(uid);
    console.log(`  ✅ User exists in Firebase Auth`);
    console.log(`     Email: ${authUser.email}`);
    console.log(`     Email Verified: ${authUser.emailVerified}`);
    console.log(`     Disabled: ${authUser.disabled}`);
    console.log(`     Created: ${authUser.metadata.creationTime}`);
    console.log(`     Last Sign In: ${authUser.metadata.lastSignInTime || 'Never'}`);
  } catch (error) {
    console.log(`  ❌ User NOT found in Firebase Auth`);
    console.log(`     Error: ${error.message}`);
  }

  // Check Firestore users collection
  console.log('\n📄 FIRESTORE /users COLLECTION:');
  const userDoc = await db.collection('users').doc(uid).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log(`  ✅ User document exists`);
    console.log(`     Data:`);
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value._seconds) {
        console.log(`       ${key}: ${new Date(value._seconds * 1000).toISOString()}`);
      } else {
        console.log(`       ${key}: ${JSON.stringify(value)}`);
      }
    });

    // Check critical fields
    console.log('\n  🔍 CRITICAL FIELD CHECK:');
    if (data.status === 'approved') {
      console.log('     ✅ status = "approved"');
    } else {
      console.log(`     ❌ status = "${data.status}" (should be "approved")`);
    }
    if (data.organizationId) {
      console.log(`     ✅ organizationId = "${data.organizationId}"`);
    } else {
      console.log('     ❌ organizationId is missing');
    }
    if (data.role) {
      console.log(`     ✅ role = "${data.role}"`);
    } else {
      console.log('     ❌ role is missing');
    }
  } else {
    console.log(`  ❌ User document does NOT exist`);
  }

  // Check pendingUsers collection
  console.log('\n📋 FIRESTORE /pendingUsers COLLECTION:');
  const pendingDoc = await db.collection('pendingUsers').doc(uid).get();
  if (pendingDoc.exists) {
    console.log(`  ⚠️  User has a pending request (may cause issues)`);
    console.log(`     Data: ${JSON.stringify(pendingDoc.data(), null, 2)}`);
  } else {
    console.log(`  ✅ No pending user request`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n');
}

checkUser();
