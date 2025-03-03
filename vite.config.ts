import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Add this to suppress the findDOMNode warning in development
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});