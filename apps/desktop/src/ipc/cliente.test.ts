import { describe, expect, it } from 'vitest';
import { invocar } from './cliente';

describe('cliente IPC', () => {
  it('fuera de Tauri responde el Núcleo simulado con el error neutro', async () => {
    // Un comando que el simulado aún no responde (theme_draft_save es de HE-02-HU11).
    await expect(invocar('theme_draft_save', {})).resolves.toEqual({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    });
  });
});
