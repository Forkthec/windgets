// HE-02-HU01-CA04 · Error al mostrar el wallpaper: el aviso de la ventana principal (ET06, tipo aviso de RT-04).
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, WallpaperState } from '@/types';
import { VentanaPrincipal } from './VentanaPrincipal';

const AVISO = 'No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.';

function nucleo(inicial: WallpaperState) {
  const oyentes: Array<(c: { state: WallpaperState }) => void> = [];
  let leido = false;
  const invocar = ((comando: string) => {
    if (comando === 'auth_get_session')
      return Promise.resolve({
        ok: true,
        value: { state: 'signed_in', user_id: 'u-1', alias: 'Prueba', token: 'valid' },
      });
    if (comando === 'wallpaper_get_status') {
      leido = true;
      return Promise.resolve({ ok: true, value: { state: inicial } });
    }
    if (comando === 'sync_get_status')
      return Promise.resolve({ ok: true, value: { status: 'synced', pending_count: 0, last_sync_at: null } });
    return Promise.resolve({ ok: false, error: { code: 'internal.unexpected' } });
  }) as unknown as Invoke;
  const escuchar = ((evento: string, alRecibir: (c: { state: WallpaperState }) => void) => {
    if (evento === 'wallpaper_status_changed') oyentes.push(alRecibir);
    return () => {};
  }) as unknown as Escuchar;
  const emitir = (state: WallpaperState) => act(() => oyentes.forEach((o) => o({ state })));
  // Espera a que la ventana escuche EV-16 y haya leído el estado inicial antes de emitir.
  const listo = () =>
    waitFor(() => {
      if (oyentes.length === 0 || !leido) throw new Error('aún no escucha');
    });
  return { invocar, escuchar, emitir, listo };
}

describe('HE-02-HU01 · Aviso del wallpaper', () => {
  it('HE-02-HU01-CA04 · Error al mostrar el wallpaper', async () => {
    const n = nucleo('fallback_default');
    render(<VentanaPrincipal invocar={n.invocar} escuchar={n.escuchar} />);
    // rediseno_final_backend.md §3.4 (RD-64): mensaje emergente de advertencia, no un aviso fijo.
    const mensaje = (await screen.findByText(AVISO)).closest('.wg-resultado');
    expect(mensaje?.classList.contains('wg-resultado--advertencia')).toBe(true);
    expect(mensaje?.getAttribute('role')).toBe('status');
  });

  it('§3.4 · avisa una vez por cambio de estado y se va solo', async () => {
    const n = nucleo('ok');
    render(<VentanaPrincipal invocar={n.invocar} escuchar={n.escuchar} />);
    await screen.findByRole('main');
    expect(screen.queryByText(AVISO)).toBeNull();
    await n.listo();
    await act(async () => {});
    n.emitir('fallback_default');
    n.emitir('fallback_default');
    expect(await screen.findAllByText(AVISO)).toHaveLength(1);
    // «×» lo cierra; el mismo estado no lo vuelve a mostrar.
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar mensaje' }));
    n.emitir('fallback_default');
    expect(screen.queryByText(AVISO)).toBeNull();
    // Vuelve a fallar después de mostrarse bien: avisa otra vez.
    n.emitir('ok');
    n.emitir('fallback_default');
    expect(await screen.findByText(AVISO)).toBeTruthy();
  });

  it('§3.4 · el mensaje se oculta solo a los 6 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const n = nucleo('fallback_default');
    render(<VentanaPrincipal invocar={n.invocar} escuchar={n.escuchar} />);
    await screen.findByText(AVISO);
    await act(async () => {
      vi.advanceTimersByTime(6100);
    });
    expect(screen.queryByText(AVISO)).toBeNull();
    vi.useRealTimers();
  });
});
