/**
 * Authentication Service
 * Handles Firebase Authentication and user profile management
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

// Current user state
let currentUser = null;
let currentUserProfile = null;
let authStateCallbacks = [];

/**
 * Initialize authentication listeners
 */
export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      currentUserProfile = await fetchUserProfile(user.uid);
    } else {
      currentUser = null;
      currentUserProfile = null;
    }

    // Notify all callbacks
    authStateCallbacks.forEach(callback => callback(currentUser));
  });
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with user object (or null)
 */
export function onAuthStateChange(callback) {
  authStateCallbacks.push(callback);

  // Immediately call with current state if already initialized
  if (currentUser !== undefined) {
    callback(currentUser);
  }

  // Return unsubscribe function
  return () => {
    authStateCallbacks = authStateCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user with profile data
 */
export function getCurrentUser() {
  if (!currentUser) return null;

  return {
    uid: currentUser.uid,
    email: currentUser.email,
    ...currentUserProfile,
  };
}

/**
 * Fetch user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Object|null} User profile
 */
async function fetchUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Object} Result with user or error
 */
export async function signIn(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Update last login
    await setDoc(doc(db, 'users', result.user.uid), {
      lastLogin: serverTimestamp(),
    }, { merge: true });

    return { success: true, user: result.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

/**
 * Sign up a new user
 * @param {Object} data - Registration data
 * @returns {Object} Result with user or error
 */
export async function signUp({ email, password, displayName, organizationId }) {
  try {
    // Create auth account
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Create pending user request (for admin approval)
    await setDoc(doc(db, 'pendingUsers', result.user.uid), {
      email,
      displayName,
      organizationId,
      requestedAt: serverTimestamp(),
      status: 'pending',
    });

    // Sign out immediately - user needs approval
    await firebaseSignOut(auth);

    return {
      success: true,
      message: 'Registration successful. Please wait for admin approval.',
      pending: true,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

/**
 * Sign up via invitation link
 * @param {Object} data - Registration data with invitation token
 * @returns {Object} Result
 */
export async function signUpWithInvitation({ email, password, displayName, invitationToken }) {
  try {
    // Verify invitation
    const inviteDoc = await getDoc(doc(db, 'invitations', invitationToken));
    if (!inviteDoc.exists()) {
      return { success: false, error: 'Invalid invitation link.' };
    }

    const invitation = inviteDoc.data();
    if (invitation.status !== 'pending') {
      return { success: false, error: 'This invitation has already been used.' };
    }

    if (invitation.email !== email) {
      return { success: false, error: 'Email does not match invitation.' };
    }

    if (new Date() > invitation.expiresAt.toDate()) {
      return { success: false, error: 'This invitation has expired.' };
    }

    // Create auth account
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Create approved user (bypass pending approval)
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      displayName,
      organizationId: invitation.organizationId,
      role: 'user',
      status: 'approved',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      invitedBy: invitation.invitedBy,
    });

    // Mark invitation as accepted
    await setDoc(doc(db, 'invitations', invitationToken), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true, user: result.user };
  } catch (error) {
    console.error('Invitation signup error:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Object} Result
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent.' };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

/**
 * Check if current user has admin role
 * @returns {boolean}
 */
export function isAdmin() {
  return currentUserProfile?.role === 'admin';
}

/**
 * Check if user is approved
 * @returns {boolean}
 */
export function isApproved() {
  return currentUserProfile?.status === 'approved';
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 * @param {string} code - Firebase error code
 * @returns {string} User-friendly message
 */
function getAuthErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/operation-not-allowed': 'Operation not allowed.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid email or password.',
  };

  return messages[code] || 'An error occurred. Please try again.';
}
