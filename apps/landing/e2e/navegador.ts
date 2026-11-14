import type { Page } from '@playwright/test';

// Lo que el navegador informa del sistema (CD-01-HU01-ET08). Se fija `userAgentData` en cada prueba porque
// Playwright solo cambia el userAgent y Chromium seguiría informando la plataforma real del equipo de pruebas.
export interface SistemaInformado {
  userAgent: string;
  platform?: string;
  architecture?: string;
  bitness?: string;
}

export const WINDOWS_X64: SistemaInformado = {
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  platform: 'Windows',
  architecture: 'x86',
  bitness: '64',
};

export async function informar(page: Page, sistema: SistemaInformado) {
  await page.addInitScript((s: SistemaInformado) => {
    Object.defineProperty(navigator, 'userAgent', { get: () => s.userAgent, configurable: true });
    const datos =
      s.platform === undefined
        ? undefined
        : {
            platform: s.platform,
            getHighEntropyValues: async () => ({ architecture: s.architecture, bitness: s.bitness }),
          };
    Object.defineProperty(navigator, 'userAgentData', { get: () => datos, configurable: true });
  }, sistema);
}
