import { defineConfig } from '@playwright/test';

// La landing page completa se prueba con Playwright (convenciones.md, «Pruebas»).
export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    // Repositorio de prueba: las pruebas simulan su API y su descarga (CD-01-HU02).
    env: { WINDGETS_GITHUB_REPO: 'prueba/windgets' },
  },
  use: { baseURL: 'http://localhost:4173' },
});
