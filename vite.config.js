import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'leaflet': ['leaflet'],
        },
      },
    },
    // Increase chunk size warning limit (Firebase is large)
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@config': '/src/config',
    },
  },
  // PWA optimizations
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'leaflet'],
  },
});
