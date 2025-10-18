import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // Preprocess Svelte files for CSS, TypeScript, etc.
  preprocess: vitePreprocess(),
  
  // Compiler options
  compilerOptions: {
    // Enable runtime checks in dev mode
    dev: process.env.NODE_ENV !== 'production'
  }
};
