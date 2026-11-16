import { describe, expect, it } from 'vitest';
import { invocar } from './cliente';

describe('cliente IPC', () => {
  it('fuera de Tauri responde el Núcleo simulado con el error neutro', async () => {
    // Un comando que el simulado aún no responde (theme_get_applied es de HE-02-HU01).
    await expect(invocar('theme_get_applied', {})).resolves.toEqual({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    });
  });
});
