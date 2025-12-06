/**
 * Firestore Service
 * Handles all Firestore database operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// =====================================================
// COUNTRIES
// =====================================================

/**
 * Get all countries
 * @returns {Promise<Array>} Array of country objects
 */
export async function getCountries() {
  const snapshot = await getDocs(collection(db, 'countries'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get a single country by code
 * @param {string} countryCode - Country code (e.g., 'US')
 * @returns {Promise<Object|null>} Country object or null
 */
export async function getCountry(countryCode) {
  const docRef = doc(db, 'countries', countryCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Subscribe to countries collection (real-time updates)
 * @param {Function} callback - Called with array of countries
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCountries(callback) {
  const q = query(collection(db, 'countries'), orderBy('name'));

  return onSnapshot(q, (snapshot) => {
    const countries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(countries);
  }, (error) => {
    console.error('Error subscribing to countries:', error);
  });
}

// =====================================================
// COUNTRY OVERRIDES (Organization-specific)
// =====================================================

/**
 * Get country overrides for an organization
 * @param {string} orgId - Organization ID
 * @param {string} countryCode - Country code
 * @returns {Promise<Object|null>} Override object or null
 */
export async function getCountryOverride(orgId, countryCode) {
  const docRef = doc(db, 'organizations', orgId, 'countryOverrides', countryCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

/**
 * Get all country overrides for an organization
 * @param {string} orgId - Organization ID
 * @returns {Promise<Object>} Map of countryCode -> override data
 */
export async function getAllCountryOverrides(orgId) {
  const snapshot = await getDocs(
    collection(db, 'organizations', orgId, 'countryOverrides')
  );

  const overrides = {};
  snapshot.docs.forEach(doc => {
    overrides[doc.id] = doc.data();
  });
  return overrides;
}

/**
 * Save country override
 * @param {string} orgId - Organization ID
 * @param {string} countryCode - Country code
 * @param {Object} overrideData - Override data
 * @param {number} baseVersion - Version of master data when override was made
 */
export async function saveCountryOverride(orgId, countryCode, overrideData, baseVersion) {
  const docRef = doc(db, 'organizations', orgId, 'countryOverrides', countryCode);

  await setDoc(docRef, {
    overrides: overrideData,
    _baseVersion: baseVersion,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Save country notes
 * @param {string} orgId - Organization ID
 * @param {string} countryCode - Country code
 * @param {string} notes - Notes text
 */
export async function saveCountryNotes(orgId, countryCode, notes) {
  const docRef = doc(db, 'organizations', orgId, 'countryOverrides', countryCode);

  await setDoc(docRef, {
    notes: notes,
    notesUpdatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Delete country override
 * @param {string} orgId - Organization ID
 * @param {string} countryCode - Country code
 */
export async function deleteCountryOverride(orgId, countryCode) {
  const docRef = doc(db, 'organizations', orgId, 'countryOverrides', countryCode);
  await deleteDoc(docRef);
}

/**
 * Subscribe to country overrides for an organization
 * @param {string} orgId - Organization ID
 * @param {Function} callback - Called with overrides map
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCountryOverrides(orgId, callback) {
  const q = collection(db, 'organizations', orgId, 'countryOverrides');

  return onSnapshot(q, (snapshot) => {
    const overrides = {};
    snapshot.docs.forEach(doc => {
      overrides[doc.id] = doc.data();
    });
    callback(overrides);
  }, (error) => {
    console.error('Error subscribing to overrides:', error);
  });
}

// =====================================================
// AIRPORTS
// =====================================================

/**
 * Get all airports
 * @returns {Promise<Array>} Array of airport objects
 */
export async function getAirports() {
  const snapshot = await getDocs(collection(db, 'airports'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get airport by ICAO code
 * @param {string} icaoCode - ICAO code (e.g., 'KJFK')
 * @returns {Promise<Object|null>} Airport object or null
 */
export async function getAirport(icaoCode) {
  const docRef = doc(db, 'airports', icaoCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

// =====================================================
// FBOs
// =====================================================

/**
 * Get all FBOs
 * @returns {Promise<Array>} Array of FBO entries
 */
export async function getFBOs() {
  const snapshot = await getDocs(collection(db, 'fbos'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get FBOs for a specific airport
 * @param {string} airportCode - ICAO code
 * @returns {Promise<Object|null>} FBO entry or null
 */
export async function getFBOsForAirport(airportCode) {
  const docRef = doc(db, 'fbos', airportCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

// =====================================================
// FIRs
// =====================================================

/**
 * Get all FIR data
 * @returns {Promise<Array>} Array of FIR entries
 */
export async function getFIRs() {
  const snapshot = await getDocs(collection(db, 'firs'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get FIR data for a country
 * @param {string} countryCode - Country code
 * @returns {Promise<Object|null>} FIR data or null
 */
export async function getFIRForCountry(countryCode) {
  const docRef = doc(db, 'firs', countryCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

// =====================================================
// CHANGELOG
// =====================================================

/**
 * Get changelog entries
 * @param {number} limit - Max entries to return
 * @returns {Promise<Array>} Array of changelog entries
 */
export async function getChangelog(limit = 50) {
  const q = query(
    collection(db, 'changelog'),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// =====================================================
// ORGANIZATIONS
// =====================================================

/**
 * Get organization by ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<Object|null>} Organization data or null
 */
export async function getOrganization(orgId) {
  const docRef = doc(db, 'organizations', orgId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

// =====================================================
// SUGGESTED UPDATES
// =====================================================

/**
 * Submit a suggested update to master data
 * @param {Object} suggestion - Suggestion data
 */
export async function submitSuggestedUpdate(suggestion) {
  const docRef = doc(collection(db, 'suggestedUpdates'));

  await setDoc(docRef, {
    ...suggestion,
    status: 'pending',
    submittedAt: serverTimestamp(),
  });

  return docRef.id;
}

// =====================================================
// ADMIN - USER MANAGEMENT
// =====================================================

/**
 * Get all users for an organization
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>} Array of user objects
 */
export async function getOrganizationUsers(orgId) {
  const q = query(
    collection(db, 'users'),
    where('organizationId', '==', orgId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get pending user requests for an organization
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>} Array of pending requests
 */
export async function getPendingUsers(orgId) {
  const q = query(
    collection(db, 'pendingUsers'),
    where('organizationId', '==', orgId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Approve a pending user
 * @param {string} requestId - Pending request ID
 * @param {Object} userData - User data to create
 */
export async function approvePendingUser(requestId, userData) {
  // Create user document
  await setDoc(doc(db, 'users', userData.uid), {
    email: userData.email,
    displayName: userData.displayName,
    organizationId: userData.organizationId,
    role: 'user',
    status: 'approved',
    createdAt: serverTimestamp(),
    lastLogin: null,
  });

  // Update pending request status
  await updateDoc(doc(db, 'pendingUsers', requestId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
  });
}

/**
 * Deny a pending user request
 * @param {string} requestId - Pending request ID
 */
export async function denyPendingUser(requestId) {
  await updateDoc(doc(db, 'pendingUsers', requestId), {
    status: 'denied',
    deniedAt: serverTimestamp(),
  });
}

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} role - New role ('admin' or 'user')
 */
export async function updateUserRole(userId, role) {
  await updateDoc(doc(db, 'users', userId), {
    role: role,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user status
 * @param {string} userId - User ID
 * @param {string} status - New status ('approved' or 'disabled')
 */
export async function updateUserStatus(userId, status) {
  await updateDoc(doc(db, 'users', userId), {
    status: status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Create invitation
 * @param {Object} invitation - Invitation data
 * @returns {string} Invitation ID
 */
export async function createInvitation(invitation) {
  const docRef = doc(collection(db, 'invitations'));
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

  await setDoc(docRef, {
    ...invitation,
    token,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt,
  });

  return { id: docRef.id, token };
}

/**
 * Generate random invite token
 */
function generateInviteToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get invitations for an organization
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>} Array of invitations
 */
export async function getInvitations(orgId) {
  const q = query(
    collection(db, 'invitations'),
    where('organizationId', '==', orgId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Subscribe to organization users (real-time)
 * @param {string} orgId - Organization ID
 * @param {Function} callback - Called with users array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToOrganizationUsers(orgId, callback) {
  const q = query(
    collection(db, 'users'),
    where('organizationId', '==', orgId)
  );

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(users);
  }, (error) => {
    console.error('Error subscribing to users:', error);
  });
}

/**
 * Subscribe to pending users (real-time)
 * @param {string} orgId - Organization ID
 * @param {Function} callback - Called with pending users array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPendingUsers(orgId, callback) {
  const q = query(
    collection(db, 'pendingUsers'),
    where('organizationId', '==', orgId),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const pending = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(pending);
  }, (error) => {
    console.error('Error subscribing to pending users:', error);
  });
}
