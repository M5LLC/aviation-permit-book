/**
 * Create Admin User
 *
 * Creates the first admin user for the application.
 *
 * Usage: node scripts/create-admin.js <email> <password> <displayName>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = join(__dirname, '..', 'serviceAccountKey.json');

// Get command line args
const [,, email, password, displayName] = process.argv;

if (!email || !password) {
  console.log('Usage: node scripts/create-admin.js <email> <password> [displayName]');
  console.log('Example: node scripts/create-admin.js admin@example.com MySecurePass123 "John Admin"');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: true,
    });

    console.log('✅ Auth user created:', userRecord.uid);

    // Create Firestore user document
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || email.split('@')[0],
      organizationId: 'default-org',
      role: 'admin',
      status: 'approved',
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    console.log('✅ Firestore user document created');
    console.log('\n🎉 Admin user created successfully!');
    console.log('\nYou can now sign in with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists. Updating to admin role...');

      const user = await auth.getUserByEmail(email);
      await db.collection('users').doc(user.uid).set({
        email,
        displayName: displayName || user.displayName || email.split('@')[0],
        organizationId: 'default-org',
        role: 'admin',
        status: 'approved',
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log('✅ User upgraded to admin');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

createAdmin();
