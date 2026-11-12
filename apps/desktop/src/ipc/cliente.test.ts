import { describe, expect, it } from 'vitest';
import { invocar } from './cliente';

describe('cliente IPC', () => {
  it('fuera de Tauri responde el Núcleo simulado con el error neutro', async () => {
    await expect(invocar('label_list', {})).resolves.toEqual({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    });
  });
});
