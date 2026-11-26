import { invoke, isTauri } from '@tauri-apps/api/core';
import { describe, expect, it, vi } from 'vitest';
import { invocar } from './cliente';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn(() => false) }));

describe('cliente IPC', () => {
  it('fuera de Tauri responde el Núcleo simulado con el error neutro', async () => {
    // Un comando que el simulado aún no responde (theme_draft_save es de HE-02-HU11).
    await expect(invocar('theme_draft_save', {})).resolves.toEqual({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    });
  });

  it('RD-83 · una llamada que Tauri rechaza llega a la vista como error genérico', async () => {
    vi.mocked(isTauri).mockReturnValueOnce(true);
    vi.mocked(invoke).mockRejectedValueOnce('invalid args `params` for command `theme_draft_save`');
    await expect(invocar('theme_draft_save', {})).resolves.toEqual({
      ok: false,
      error: { code: 'internal.unexpected', message: 'Ocurrió un error inesperado. Intenta de nuevo.' },
    });
  });
});
