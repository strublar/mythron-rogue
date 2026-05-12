import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    target: 'es2020',
  },
  server: {
    port: 3000,
  },
});
