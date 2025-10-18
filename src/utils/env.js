/**
 * Environment variable compatibility layer
 * Maps Vite's import.meta.env to process.env for React compatibility
 */

// Create a process.env compatible object
export const env = {
  NODE_ENV: import.meta.env.MODE === 'development' ? 'development' : 'production',
  PUBLIC_URL: import.meta.env.BASE_URL || '',
  REACT_APP_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  REACT_APP_FIREBASE_FUNCTIONS_URL: import.meta.env.VITE_FIREBASE_FUNCTIONS_URL,
  REACT_APP_API_URL: import.meta.env.VITE_API_URL,
  REACT_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  VITE_FIREBASE_FUNCTIONS_URL: import.meta.env.VITE_FIREBASE_FUNCTIONS_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
};

// Make process.env available globally for React compatibility
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = env;
}

// Export for direct import usage
export default env;
