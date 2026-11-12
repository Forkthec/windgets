import { defineConfig } from '@playwright/test';

// Recorridos de pantallas en el navegador con el IPC simulado (convenciones.md, «Pruebas»).
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'pnpm dev', port: 1420, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:1420' },
});
