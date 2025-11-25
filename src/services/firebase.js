/**
 * Firebase Configuration and Initialization
 * Handles Firebase setup for authentication, database, and storage
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if all required config is present
const isFirebaseConfigured = firebaseConfig.apiKey && 
                              firebaseConfig.projectId && 
                              firebaseConfig.authDomain;

let app = null;
let db = null;
let auth = null;
let storage = null;

if (isFirebaseConfigured) {
  console.log('🔥 Firebase configuration detected');
  
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase App initialized');
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Set persistence to LOCAL (survives browser restarts)
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Firebase Auth persistence set to LOCAL');
      })
      .catch((error) => {
        console.warn('⚠️ Could not set auth persistence:', error);
      });
    
    // Connect to emulators in development (if configured)
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
      const firestoreEmulatorHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
      const storageEmulatorHost = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
      
      console.log('🧪 Connecting to Firebase emulators...');
      
      const [authHost, authPort] = authEmulatorHost.split(':');
      connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: true });
      
      const [firestoreHost, firestorePort] = firestoreEmulatorHost.split(':');
      connectFirestoreEmulator(db, firestoreHost, parseInt(firestorePort));
      
      const [storageHost, storagePort] = storageEmulatorHost.split(':');
      connectStorageEmulator(storage, storageHost, parseInt(storagePort));
      
      console.log('✅ Connected to Firebase emulators');
    }
    
    console.log('🎉 Firebase services ready:', { 
      hasAuth: !!auth, 
      hasDb: !!db, 
      hasStorage: !!storage 
    });
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else {
  console.log('ℹ️ Firebase not configured - using local storage fallback');
  console.log('💡 To enable Firebase, set the following environment variables:');
  console.log('   - VITE_FIREBASE_API_KEY');
  console.log('   - VITE_FIREBASE_AUTH_DOMAIN');
  console.log('   - VITE_FIREBASE_PROJECT_ID');
  console.log('   - VITE_FIREBASE_STORAGE_BUCKET');
  console.log('   - VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.log('   - VITE_FIREBASE_APP_ID');
}

export { app, db, auth, storage, isFirebaseConfigured };
export default { app, db, auth, storage, isFirebaseConfigured };
