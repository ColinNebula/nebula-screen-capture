/**
 * Authentication Service
 * Handles user authentication with Firebase Auth and email verification
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  applyActionCode,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from './firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Listen to auth state changes
    if (isFirebaseConfigured && auth) {
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.notifyAuthStateListeners(user);
      });
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Register a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User display name
   * @returns {Promise<{user, verificationCode}>}
   */
  async signup(email, password, displayName = '') {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add your Firebase credentials.');
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Generate verification code for display
      const verificationCode = this.generateVerificationCode();

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName || null,
        emailVerified: false,
        verificationCode: verificationCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        plan: 'free',
        storageUsed: 0,
        maxStorage: 5, // 5GB for free plan
        maxRecordingDuration: 30 * 60, // 30 minutes in seconds
      });

      // Build verification URL
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const verificationUrl = `${baseUrl}/#/verify-email?code=${verificationCode}&uid=${user.uid}`;

      // Send verification email via Firebase Functions (with SendGrid)
      const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
      if (functionsUrl) {
        try {
          await fetch(`${functionsUrl}/sendVerificationEmail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: displayName || 'there',
              verificationToken: verificationCode,
              verificationUrl: verificationUrl
            }),
          });
          console.log('✅ Verification email sent via SendGrid');
        } catch (emailError) {
          console.warn('⚠️ Could not send verification email:', emailError);
          // Don't throw - user is still created
        }
      }

      // Also send Firebase's built-in verification email as backup
      try {
        await sendEmailVerification(user, {
          url: baseUrl,
          handleCodeInApp: false,
        });
        console.log('✅ Firebase verification email sent');
      } catch (firebaseEmailError) {
        console.warn('⚠️ Firebase verification email failed:', firebaseEmailError);
      }

      console.log('🎉 User created successfully:', user.email);
      
      return { 
        user, 
        verificationCode,
        verificationUrl
      };
    } catch (error) {
      console.error('❌ Signup error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User>}
   */
  async login(email, password) {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add your Firebase credentials.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login timestamp
      if (db) {
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp(),
        });
      }

      console.log('✅ User logged in:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async logout() {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.');
    }

    try {
      await signOut(auth);
      this.currentUser = null;
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify email with custom verification code
   * @param {string} code - 6-digit verification code
   * @param {string} uid - User ID
   * @returns {Promise<boolean>}
   */
  async verifyEmailWithCode(code, uid) {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.');
    }

    try {
      // Get user document
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      // Check if code matches
      if (userData.verificationCode !== code) {
        throw new Error('Invalid verification code');
      }

      // Update user as verified
      await updateDoc(doc(db, 'users', uid), {
        emailVerified: true,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Send welcome email
      const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
      if (functionsUrl) {
        try {
          await fetch(`${functionsUrl}/sendWelcomeEmailVerified`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userData.email,
              name: userData.displayName || 'there',
            }),
          });
          console.log('✅ Welcome email sent');
        } catch (emailError) {
          console.warn('⚠️ Could not send welcome email:', emailError);
        }
      }

      console.log('✅ Email verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email verification error:', error);
      throw error;
    }
  }

  /**
   * Verify email with Firebase action code (from email link)
   * @param {string} actionCode - Action code from email
   */
  async verifyEmailWithActionCode(actionCode) {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.');
    }

    try {
      await applyActionCode(auth, actionCode);
      
      // Update Firestore
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          emailVerified: true,
          verifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      console.log('✅ Email verified with action code');
      return true;
    } catch (error) {
      console.error('❌ Email verification error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend verification email
   * @param {User} user - Firebase user object
   */
  async resendVerificationEmail(user = null) {
    const targetUser = user || auth.currentUser;
    
    if (!targetUser) {
      throw new Error('No user signed in');
    }

    if (targetUser.emailVerified) {
      throw new Error('Email is already verified');
    }

    try {
      // Generate new verification code
      const verificationCode = this.generateVerificationCode();
      
      // Update verification code in Firestore
      await updateDoc(doc(db, 'users', targetUser.uid), {
        verificationCode: verificationCode,
        updatedAt: serverTimestamp(),
      });

      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const verificationUrl = `${baseUrl}/#/verify-email?code=${verificationCode}&uid=${targetUser.uid}`;

      // Send via SendGrid
      const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
      if (functionsUrl) {
        await fetch(`${functionsUrl}/sendVerificationEmail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: targetUser.email,
            name: targetUser.displayName || 'there',
            verificationToken: verificationCode,
            verificationUrl: verificationUrl
          }),
        });
      }

      // Also send Firebase's built-in verification email
      await sendEmailVerification(targetUser, {
        url: baseUrl,
        handleCodeInApp: false,
      });

      console.log('✅ Verification email resent');
      return { verificationCode, verificationUrl };
    } catch (error) {
      console.error('❌ Error resending verification email:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   */
  async sendPasswordReset(email) {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent to:', email);
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates (displayName, photoURL)
   */
  async updateUserProfile(updates) {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }

    try {
      await updateProfile(auth.currentUser, updates);
      
      // Also update Firestore
      const firestoreUpdates = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), firestoreUpdates);
      
      console.log('✅ Profile updated');
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user email
   * @param {string} newEmail - New email address
   */
  async updateUserEmail(newEmail) {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }

    try {
      await updateEmail(auth.currentUser, newEmail);
      
      // Update Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        email: newEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });

      // Send new verification email
      await this.resendVerificationEmail();
      
      console.log('✅ Email updated');
    } catch (error) {
      console.error('❌ Email update error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   */
  async updateUserPassword(newPassword) {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
      console.log('✅ Password updated');
    } catch (error) {
      console.error('❌ Password update error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Reauthenticate user (required before sensitive operations)
   * @param {string} password - Current password
   */
  async reauthenticate(password) {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      console.log('✅ Reauthenticated');
    } catch (error) {
      console.error('❌ Reauthentication error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount() {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }

    try {
      const uid = auth.currentUser.uid;
      
      // Delete user document from Firestore
      // Note: In production, use Cloud Functions to delete user data
      // This is a simplified version
      
      // Delete the auth user
      await deleteUser(auth.currentUser);
      
      console.log('✅ Account deleted');
    } catch (error) {
      console.error('❌ Account deletion error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get user data from Firestore
   * @param {string} uid - User ID (optional, defaults to current user)
   */
  async getUserData(uid = null) {
    const targetUid = uid || auth.currentUser?.uid;
    
    if (!targetUid) {
      throw new Error('No user ID provided');
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', targetUid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      return userDoc.data();
    } catch (error) {
      console.error('❌ Error getting user data:', error);
      throw error;
    }
  }

  /**
   * Check if user email is verified
   */
  async isEmailVerified() {
    if (!auth.currentUser) {
      return false;
    }

    // Check both Firebase Auth and Firestore
    const userData = await this.getUserData();
    return auth.currentUser.emailVerified || userData.emailVerified;
  }

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // Call immediately with current state
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all auth state listeners
   */
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth?.currentUser || null;
  }

  /**
   * Handle Firebase Auth errors
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/requires-recent-login': 'This operation requires recent authentication. Please log in again.',
      'auth/invalid-action-code': 'Invalid or expired verification code.',
      'auth/expired-action-code': 'This verification link has expired. Please request a new one.',
    };

    const message = errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
    
    return new Error(message);
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
