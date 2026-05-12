import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// TODO: add @vitejs/plugin-react to devDependencies when scaffolding React
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    target: 'es2020',
    // TODO: configure Capacitor output path when adding mobile packaging
  },
  server: {
    port: 3000,
  },
});
