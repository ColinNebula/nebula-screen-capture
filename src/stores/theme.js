import { writable } from 'svelte/store';

// Load saved theme or default to 'dark'
const savedTheme = typeof window !== 'undefined' 
  ? localStorage.getItem('nebulaTheme') || 'dark'
  : 'dark';

export const theme = writable(savedTheme);

// Function to apply theme to document
function applyTheme(value) {
  if (typeof window !== 'undefined') {
    // Apply to html element (most important)
    document.documentElement.setAttribute('data-theme', value);
    
    // Also apply to body for compatibility
    document.body.setAttribute('data-theme', value);
    
    // Save to localStorage
    localStorage.setItem('nebulaTheme', value);
    
    console.log('Theme applied:', value);
  }
}

// Apply theme on initialization
applyTheme(savedTheme);

// Subscribe to theme changes
theme.subscribe(value => {
  applyTheme(value);
});

// Helper function to toggle theme
export function toggleTheme() {
  theme.update(current => current === 'dark' ? 'light' : 'dark');
}
