import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      clientPort: 5173,
      // If you are using a proxy to your backend, ensure ws is set to false for that route
      // proxy: { '/api': { target: 'http://localhost:8000', ws: false } }
    }
  }
});