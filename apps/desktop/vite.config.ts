/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto fijo que espera tauri.conf.json (devUrl). `@/` apunta a src/ (también en tsconfig.json).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: { alias: { '@': '/src' } },
  // Dos páginas: la ventana principal y la capa del wallpaper (C-02), que se ancla detrás de los íconos.
  build: {
    rollupOptions: {
      input: { main: 'index.html', capa: 'capa.html' },
    },
  },
  server: { port: 1420, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/configuracionPruebas.ts'],
  },
});
