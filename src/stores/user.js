import { writable } from 'svelte/store';

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
    } catch (error) {
      console.error('Error parsing saved user data:', error);
      localStorage.removeItem('nebulaUser');
    }
  }
}

// Auto-save to localStorage
user.subscribe(value => {
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem('nebulaUser', JSON.stringify(value));
      isAuthenticated.set(true);
    } else {
      localStorage.removeItem('nebulaUser');
      isAuthenticated.set(false);
    }
  }
});
