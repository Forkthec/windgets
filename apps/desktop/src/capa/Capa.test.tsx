// HE-02-HU01 · Consultar el wallpaper como fondo real de Windows. Pruebas de la capa (C-02); el Núcleo tiene sus
// pruebas ca_he_02_hu01_* en pruebas_de_escritorio.rs y el anclaje a WorkerW se verifica a mano (CA06).
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { AssetResolveParams, Invoke, LayerInitialState, ThemeContent, WallpaperState } from '@/types';
import { Capa, recursoDelFondo } from './Capa';

const POR_DEFECTO: ThemeContent = {
  template_id: 'default',
  background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
  colors: { primary: '#123456', secondary: '#654321', text: '#FFFFFF' },
  palette_id: null,
  font: { id: 'nunito', size: 'medium' },
};

const DEL_CATALOGO: ThemeContent = {
  ...POR_DEFECTO,
  background: { source: 'catalog', catalog_image_id: 'mar', uploaded_image_id: null },
  colors: { primary: '#0A0B0C', secondary: '#654321', text: '#000000' },
};

function capa(applied: ThemeContent, wallpaper_state: WallpaperState): LayerInitialState {
  return { applied, widgets: [], monitors: [], wallpaper_state };
}

/** Núcleo de prueba: el estado de la capa, los archivos que existen y EV-16. */
function nucleo(inicial: LayerInitialState, archivos: Record<string, string>) {
  let actual = inicial;
  const pedidos: AssetResolveParams[] = [];
  const oyentes: Array<() => void> = [];
  const invocar = ((comando: string, params: AssetResolveParams) => {
    if (comando === 'layer_get_initial_state') return Promise.resolve({ ok: true, value: actual });
    if (comando === 'asset_resolve') {
      pedidos.push(params);
      const url = archivos[`${params.kind}:${params.id}`];
      return Promise.resolve({
        ok: true,
        value: url ? { url, state: 'ready' } : { url: '', state: 'unavailable' },
      });
    }
    return Promise.resolve({ ok: false, error: { code: 'internal.unexpected' } });
  }) as unknown as Invoke;
  const escuchar = ((evento: string, alRecibir: () => void) => {
    if (evento === 'wallpaper_status_changed') oyentes.push(alRecibir);
    return () => {};
  }) as unknown as Escuchar;
  const cambiar = async (nuevo: LayerInitialState) => {
    actual = nuevo;
    await act(async () => oyentes.forEach((o) => o()));
  };
  return { invocar, escuchar, pedidos, cambiar };
}

describe('HE-02-HU01 · Capa del wallpaper', () => {
  it('HE-02-HU01-CA01 · Wallpaper por defecto al primer inicio', async () => {
    const n = nucleo(capa(POR_DEFECTO, 'ok'), { 'catalog_template:default': 'C:/fondo/default.jpg' });
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const wallpaper = await screen.findByRole('main', { name: 'Wallpaper' });
    expect(n.pedidos).toEqual([{ kind: 'catalog_template', id: 'default' }]);
    expect(wallpaper.style.backgroundImage).toContain('C:/fondo/default.jpg');
    expect(wallpaper.style.backgroundSize).toBe('cover');
  });

  it('HE-02-HU01-CA02 · Conservar el tema aplicado', async () => {
    const n = nucleo(capa(DEL_CATALOGO, 'ok'), { 'catalog_image:mar': 'C:/fondo/mar.jpg' });
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const wallpaper = await screen.findByRole('main', { name: 'Wallpaper' });
    expect(wallpaper.style.backgroundImage).toContain('C:/fondo/mar.jpg');
    expect(wallpaper.style.backgroundColor).toBe('rgb(10, 11, 12)');
  });

  it('HE-02-HU01-CA04 · Error al mostrar el wallpaper', async () => {
    // El Núcleo ya cambió el contenido por el de la plantilla por defecto (ET05); la capa lo pinta.
    const n = nucleo(capa(POR_DEFECTO, 'fallback_default'), {
      'catalog_template:default': 'C:/fondo/default.jpg',
    });
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const wallpaper = await screen.findByRole('main', { name: 'Wallpaper' });
    expect(wallpaper.style.backgroundImage).toContain('C:/fondo/default.jpg');
  });

  it('HE-02-HU01-CA05 · Sin sesión iniciada', async () => {
    const n = nucleo(capa(POR_DEFECTO, 'hidden'), { 'catalog_template:default': 'C:/fondo/default.jpg' });
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    await act(async () => {});
    expect(screen.queryByRole('main', { name: 'Wallpaper' })).toBeNull();
    expect(n.pedidos).toEqual([]);
    // Al iniciar sesión llega EV-16 y la capa pinta el wallpaper.
    await n.cambiar(capa(POR_DEFECTO, 'ok'));
    expect(await screen.findByRole('main', { name: 'Wallpaper' })).toBeTruthy();
  });

  it('sin la imagen en el computador pinta solo el color primario', async () => {
    const n = nucleo(capa(DEL_CATALOGO, 'ok'), {});
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const wallpaper = await screen.findByRole('main', { name: 'Wallpaper' });
    expect(wallpaper.style.backgroundImage).toBe('');
  });

  it('el fondo propio se pide como imagen propia', () => {
    expect(
      recursoDelFondo({
        ...POR_DEFECTO,
        background: { source: 'own', catalog_image_id: null, uploaded_image_id: 'img-1' },
      }),
    ).toEqual({ kind: 'uploaded_image', id: 'img-1' });
  });
});
