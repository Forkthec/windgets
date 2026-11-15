import { describe, expect, it } from 'vitest';
import { invocar } from './cliente';

describe('cliente IPC', () => {
  it('fuera de Tauri responde el Núcleo simulado con el error neutro', async () => {
    // Un comando que el simulado aún no responde (sync_get_status es de HE-16-HU01, P20).
    await expect(invocar('sync_get_status', {})).resolves.toEqual({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    });
  });
});
