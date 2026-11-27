import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// F6-03 · Solo el guion de comparación con el Figma (e2e/comparacion.spec.ts). No forma parte de `test:e2e` ni de la
// CI: se corre a mano con `pnpm --filter desktop comparar` y deja la evidencia en .trabajo/comparacion/.
export default defineConfig({ ...base, testMatch: 'comparacion.spec.ts', testIgnore: [] });
