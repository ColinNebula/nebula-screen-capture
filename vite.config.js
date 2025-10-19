import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: './', // Relative paths for Electron
  publicDir: 'public', // Serve files from public directory
  build: {
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'wasm-filters': ['./src/services/wasmFilters.js'],
          'wasm-transitions': ['./src/services/wasmTransitions.js'],
          'wasm-audio': ['./src/services/wasmAudioProcessor.js']
        }
      },
      external: [
        // Mark WASM files as external (they'll be loaded at runtime)
        /\/wasm\/.*\.js$/
      ]
    },
    // Copy WASM files to build directory
    copyPublicDir: true
  },
  server: {
    port: 3001,
    host: 'localhost',
    strictPort: false,
    fs: {
      // Only allow serving files from project root and src
      allow: ['.', 'src']
    }
  },
  optimizeDeps: {
    exclude: ['svelte'],
    // Only scan Svelte files, not old React .js files
    entries: ['src/main.js', 'src/**/*.svelte']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
