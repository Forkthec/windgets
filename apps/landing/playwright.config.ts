import { defineConfig } from '@playwright/test';

// La landing page completa se prueba con Playwright (convenciones.md, «Pruebas»).
export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
  },
  use: { baseURL: 'http://localhost:4173' },
});
