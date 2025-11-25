import { writable } from 'svelte/store';

// Load saved theme or default to 'dark'
const savedTheme = typeof window !== 'undefined' 
  ? localStorage.getItem('nebulaTheme') || 'dark'
  : 'dark';

export const theme = writable(savedTheme);

// Apply initial theme
if (typeof window !== 'undefined') {
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-theme', savedTheme);
}

// Subscribe to theme changes (skip initial trigger to prevent reload loop)
let isInitialThemeLoad = true;
theme.subscribe(value => {
  if (isInitialThemeLoad) {
    isInitialThemeLoad = false;
    return;
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('nebulaTheme', value);
    document.documentElement.setAttribute('data-theme', value);
    document.body.setAttribute('data-theme', value);
  }
});

// Helper function to toggle theme
export function toggleTheme() {
  theme.update(current => current === 'dark' ? 'light' : 'dark');
}
