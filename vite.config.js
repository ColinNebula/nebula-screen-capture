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
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 KB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Firebase core and services
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            if (id.includes('firestore')) return 'firebase-firestore';
            if (id.includes('storage')) return 'firebase-storage';
            if (id.includes('auth')) return 'firebase-auth';
            return 'firebase-core';
          }
          
          // Video processing libraries
          if (id.includes('ffmpeg') || id.includes('webm')) {
            return 'video-processing';
          }
          
          // Large UI components - lazy loaded separately
          if (id.includes('VideoEditor.svelte')) return 'video-editor';
          if (id.includes('AdminPanel.svelte')) return 'admin-panel';
          if (id.includes('CloudSyncManager.svelte')) return 'cloud-sync';
          if (id.includes('CollaborationPanel.svelte')) return 'collaboration';
          
          // WASM modules
          if (id.includes('wasmFilters')) return 'wasm-filters';
          if (id.includes('wasmTransitions')) return 'wasm-transitions';
          if (id.includes('wasmAudioProcessor')) return 'wasm-audio';
          
          // Vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
      external: [
        // Mark WASM files as external (they'll be loaded at runtime)
        /\/wasm\/.*\.js$/
      ]
    },
    // Copy WASM files to build directory
    copyPublicDir: true,
    // Optimize minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3001,
    host: 'localhost',
    strictPort: true, // Don't try other ports - fail if 3001 is in use
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3001,
      overlay: false // Disable error overlay to prevent reload triggers
    },
    watch: {
      // Ignore node_modules and build artifacts to prevent unnecessary reloads
      ignored: [
        '**/node_modules/**', 
        '**/build/**', 
        '**/.git/**', 
        '**/target/**',
        '**/src-tauri/target/**'
      ]
    },
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
