import { writable } from 'svelte/store';

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// Create user store
export const user = writable(null);
export const isAuthenticated = writable(false);

// Load from localStorage on initialization
if (typeof window !== 'undefined') {
  const savedUser = localStorage.getItem('nebulaUser');
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser);
      user.set(userData);
      isAuthenticated.set(true);
      if (isTauri) {
        console.log('✅ User restored in Tauri:', userData.email);
      }
    } catch (error) {
      console.error('Error parsing saved user data:', error);
      localStorage.removeItem('nebulaUser');
    }
  }
}

// Auto-save to localStorage
let isInitialLoad = true;
user.subscribe(value => {
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem('nebulaUser', JSON.stringify(value));
      isAuthenticated.set(true);
      
      if (isTauri && !isInitialLoad) {
        console.log('✅ User authenticated in Tauri:', value.email);
      }
    } else {
      localStorage.removeItem('nebulaUser');
      isAuthenticated.set(false);
      
      if (isTauri) {
        console.log('🚪 User logged out in Tauri');
      }
    }
    
    // Mark initial load as complete
    if (isInitialLoad) {
      isInitialLoad = false;
    }
  }
});
