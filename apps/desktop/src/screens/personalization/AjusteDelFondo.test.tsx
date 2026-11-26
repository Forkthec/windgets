import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, WallpaperFit, WallpaperFitSettings } from '@/types';
import { AjusteDelFondo } from './AjusteDelFondo';

// HE-02-HU14 (P29) · El ajuste de la imagen de fondo en cada monitor, en Personalización > Imagen de fondo.

function configuracion(fits: WallpaperFit[], otros = 0): WallpaperFitSettings {
  return {
    monitors: fits.map((fit, i) => ({ monitor_id: String(i), number: i + 1, is_primary: i === 0, fit })),
    other_monitors: otros,
  };
}

function montar(
  inicial: WallpaperFitSettings,
  alElegir?: (p: { monitor_id: string; fit: WallpaperFit }) => unknown,
) {
  const pedidos: unknown[] = [];
  const invocar = vi.fn(async (comando: string, params: { monitor_id: string; fit: WallpaperFit }) => {
    pedidos.push([comando, params]);
    if (comando === 'wallpaper_fit_get') return { ok: true, value: inicial };
    return alElegir?.(params) ?? { ok: true, value: inicial };
  }) as unknown as Invoke;
  const escuchar = (() => () => {}) as unknown as Escuchar;
  render(<AjusteDelFondo invocar={invocar} escuchar={escuchar} />);
  return pedidos;
}

describe('HE-02-HU14 · Ajuste de la imagen por monitor', () => {
  it('HE-02-HU14-CA01 · con un monitor: «Ajuste de la imagen» en Rellenar y sin «Extender»', async () => {
    montar(configuracion(['fill']));
    const campo = (await screen.findByLabelText('Ajuste de la imagen')) as HTMLSelectElement;
    expect(campo.value).toBe('fill');
    const opciones = [...campo.options].map((o) => o.textContent);
    expect(opciones).toEqual(['Rellenar', 'Ajustar', 'Expandir', 'Mosaico', 'Centrar']);
  });

  it('HE-02-HU14-CA02 · cada monitor con su selector; elegir lo guarda al instante', async () => {
    const pedidos = montar(configuracion(['fill', 'fill']), ({ fit }) => ({
      ok: true,
      value: configuracion(['fill', fit]),
    }));
    expect(await screen.findByLabelText('Ajuste del monitor 1 (principal)')).toBeTruthy();
    const segundo = screen.getByLabelText('Ajuste del monitor 2') as HTMLSelectElement;
    expect([...segundo.options].map((o) => o.textContent)).toContain('Extender');
    fireEvent.change(segundo, { target: { value: 'center' } });
    await waitFor(() => expect(segundo.value).toBe('center'));
    expect(pedidos).toContainEqual(['wallpaper_fit_set', { monitor_id: '1', fit: 'center' }]);
  });

  it('HE-02-HU14-CA05 · Extender lo explica', async () => {
    montar(configuracion(['span', 'span']));
    expect(await screen.findByText('Extender pone una sola imagen sobre todos los monitores.')).toBeTruthy();
  });

  it('HE-02-HU14-CA06 · con más de 6 monitores, los demás usan el ajuste del principal', async () => {
    montar(configuracion(['fill', 'fill', 'fill', 'fill', 'fill', 'fill'], 2));
    expect(
      await screen.findByText('Los otros 2 monitores usan el ajuste del monitor principal.'),
    ).toBeTruthy();
    expect(screen.getAllByRole('combobox')).toHaveLength(6);
  });

  it('HE-02-HU14-CA07 · un monitor desconectado: el mensaje va en su selector', async () => {
    const texto = 'Ese monitor ya no está conectado. Elige otro monitor.';
    montar(configuracion(['fill', 'fill']), () => ({
      ok: false,
      error: { code: 'monitor.not_found', message: texto, field: 'monitor_id' },
    }));
    const segundo = (await screen.findByLabelText('Ajuste del monitor 2')) as HTMLSelectElement;
    fireEvent.change(segundo, { target: { value: 'fit' } });
    expect(await screen.findByText(texto)).toBeTruthy();
  });
});

describe('RD-83 · Ajuste de la imagen por monitor', () => {
  it('RD-83 · un error sin texto va en el selector con el genérico', async () => {
    montar(configuracion(['fill', 'fill']), () => ({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    }));
    const segundo = (await screen.findByLabelText('Ajuste del monitor 2')) as HTMLSelectElement;
    fireEvent.change(segundo, { target: { value: 'fit' } });
    expect(await screen.findByText('Ocurrió un error inesperado. Intenta de nuevo.')).toBeTruthy();
  });
});
