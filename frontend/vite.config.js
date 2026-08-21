import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the Laravel backend during local development
      '/api': {
        target: 'https://tenagaahli.latihan.co.id',
        changeOrigin: true,
      },
    },
  },
});
