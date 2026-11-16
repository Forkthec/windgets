// HE-02-HU01-CA04 · Error al mostrar el wallpaper: el aviso de la ventana principal (ET06, tipo aviso de RT-04).
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, WallpaperState } from '@/types';
import { VentanaPrincipal } from './VentanaPrincipal';

const AVISO = 'No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.';

function nucleo(inicial: WallpaperState) {
  const oyentes: Array<(c: { state: WallpaperState }) => void> = [];
  const invocar = ((comando: string) => {
    if (comando === 'auth_get_session')
      return Promise.resolve({
        ok: true,
        value: { state: 'signed_in', user_id: 'u-1', alias: 'Prueba', token: 'valid' },
      });
    if (comando === 'wallpaper_get_status') return Promise.resolve({ ok: true, value: { state: inicial } });
    if (comando === 'sync_get_status')
      return Promise.resolve({ ok: true, value: { status: 'synced', pending_count: 0, last_sync_at: null } });
    return Promise.resolve({ ok: false, error: { code: 'internal.unexpected' } });
  }) as unknown as Invoke;
  const escuchar = ((evento: string, alRecibir: (c: { state: WallpaperState }) => void) => {
    if (evento === 'wallpaper_status_changed') oyentes.push(alRecibir);
    return () => {};
  }) as unknown as Escuchar;
  const emitir = (state: WallpaperState) => act(() => oyentes.forEach((o) => o({ state })));
  return { invocar, escuchar, emitir };
}

describe('HE-02-HU01 · Aviso del wallpaper', () => {
  it('HE-02-HU01-CA04 · Error al mostrar el wallpaper', async () => {
    const n = nucleo('fallback_default');
    render(<VentanaPrincipal invocar={n.invocar} escuchar={n.escuchar} />);
    expect((await screen.findByText(AVISO)).getAttribute('role')).toBe('alert');
  });

  it('con el wallpaper a la vista no avisa, y avisa si EV-16 trae fallback_default', async () => {
    const n = nucleo('ok');
    render(<VentanaPrincipal invocar={n.invocar} escuchar={n.escuchar} />);
    await screen.findByRole('main');
    expect(screen.queryByText(AVISO)).toBeNull();
    n.emitir('fallback_default');
    expect(await screen.findByText(AVISO)).toBeTruthy();
    n.emitir('ok');
    expect(screen.queryByText(AVISO)).toBeNull();
  });
});
