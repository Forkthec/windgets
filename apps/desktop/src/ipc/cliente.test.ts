import { describe, expect, it } from 'vitest';
import { invocar } from './cliente';

describe('cliente IPC', () => {
  it('fuera de Tauri responde el Núcleo simulado con el error neutro', async () => {
    // Un comando que el simulado aún no responde (theme_list es de P13).
    await expect(invocar('theme_list', {})).resolves.toEqual({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    });
  });
});
