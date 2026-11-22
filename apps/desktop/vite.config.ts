/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto fijo que espera tauri.conf.json (devUrl). `@/` apunta a src/ (también en tsconfig.json).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: { alias: { '@': '/src' } },
  // Tres páginas: la ventana principal, la capa del wallpaper (C-02), que se ancla detrás de los íconos, y la
  // ventana de edición de la distribución (C-03).
  build: {
    rollupOptions: {
      input: { main: 'index.html', capa: 'capa.html', edicion: 'edicion.html' },
    },
  },
  server: { port: 1420, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/configuracionPruebas.ts'],
    // Las pruebas que leen reglas de estilo (`tokens.css?raw`, HE-09-HU02-CA10) reciben el archivo real.
    css: { include: [/tokens\.css/] },
  },
});
