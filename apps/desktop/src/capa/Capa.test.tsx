// HE-02-HU01 · Consultar el wallpaper como fondo real de Windows. Pruebas de la capa (C-02); el Núcleo tiene sus
// pruebas ca_he_02_hu01_* en pruebas_de_escritorio.rs y el anclaje a WorkerW se verifica a mano (CA06).
import { act, render, screen, waitFor } from '@testing-library/react';
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
  const oyentes = new Map<string, Array<() => void>>();
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
    oyentes.set(evento, [...(oyentes.get(evento) ?? []), alRecibir]);
    return () => {};
  }) as unknown as Escuchar;
  const cambiar = async (nuevo: LayerInitialState, evento = 'wallpaper_status_changed') => {
    actual = nuevo;
    await act(async () => (oyentes.get(evento) ?? []).forEach((o) => o()));
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

  it('HE-02-HU12-CA05 · Cambios de la vista previa en tiempo real', async () => {
    // Al aplicar llega EV-11 y la capa pinta el tema nuevo sin reiniciar la aplicación (ET05).
    const n = nucleo(capa(POR_DEFECTO, 'ok'), {
      'catalog_template:default': 'C:/fondo/default.jpg',
      'catalog_image:mar': 'C:/fondo/mar.jpg',
    });
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    await screen.findByRole('main', { name: 'Wallpaper' });
    await n.cambiar(capa(DEL_CATALOGO, 'ok'), 'applied_theme_changed');
    const wallpaper = screen.getByRole('main', { name: 'Wallpaper' });
    expect(wallpaper.style.backgroundImage).toContain('C:/fondo/mar.jpg');
    expect(wallpaper.style.backgroundColor).toBe('rgb(10, 11, 12)');
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

describe('HE-15-HU04 · Personalización desde otro computador en la capa', () => {
  it('HE-15-HU04-CA01 · Cambio aplicado en otro computador', async () => {
    const n = nucleo(capa(POR_DEFECTO, 'ok'), {
      'catalog_template:default': 'C:/fondo/default.jpg',
      'catalog_image:mar': 'C:/fondo/mar.jpg',
    });
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const wallpaper = await screen.findByRole('main', { name: 'Wallpaper' });
    // ET01, ET02: llega el tema aplicado del computador A (EV-11 remoto) y la capa se vuelve a pintar.
    await n.cambiar(capa(DEL_CATALOGO, 'ok'), 'applied_theme_changed');
    await waitFor(() => expect(wallpaper.style.backgroundImage).toContain('C:/fondo/mar.jpg'));
  });

  it('HE-15-HU04-CA03 · Abrir la aplicación en un computador desactualizado', async () => {
    // ET03: el primer pintado sale de lo guardado en el computador (IPC-DESK-01), sin esperar a la nube.
    const n = nucleo(capa(DEL_CATALOGO, 'ok'), { 'catalog_image:mar': 'C:/fondo/mar.jpg' });
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const wallpaper = await screen.findByRole('main', { name: 'Wallpaper' });
    expect(wallpaper.style.backgroundImage).toContain('C:/fondo/mar.jpg');
  });

  it('HE-15-HU04-CA04 · Widgets sincronizados', async () => {
    const reloj = {
      widget_id: 'r',
      type: 'clock' as const,
      x: 40,
      y: 40,
      width: 320,
      height: 160,
      is_active: true,
    };
    const n = nucleo({ ...capa(POR_DEFECTO, 'ok'), widgets: [reloj] }, {});
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const widget = await screen.findByRole('region', { name: 'Reloj' });
    expect(widget.style.left).toBe('40px');
    // ET04, ET05: llega la distribución guardada en el computador A (EV-13 remoto) y la capa la muestra.
    await n.cambiar({ ...capa(POR_DEFECTO, 'ok'), widgets: [{ ...reloj, x: 500 }] }, 'layout_changed');
    await waitFor(() => expect(screen.getByRole('region', { name: 'Reloj' }).style.left).toBe('500px'));
  });
});

describe('HE-05-HU04 · La capa muestra la distribución guardada', () => {
  const RELOJ = {
    widget_id: 'reloj',
    type: 'clock' as const,
    x: 1800,
    y: 1000,
    width: 400,
    height: 200,
    is_active: true,
  };
  const escritorio = (x: number, escala: number): LayerInitialState => ({
    applied: POR_DEFECTO,
    widgets: [{ ...RELOJ, x }],
    monitors: [{ id: '0', x: 0, y: 0, width: 2560, height: 1440, scale_factor: escala }],
    wallpaper_state: 'ok',
  });

  it('HE-05-HU02-CA05 · La capa dibuja a escala los píxeles físicos guardados', async () => {
    // HE-05-HU02-ET07: a 125 %, 1800 px físicos son 1440 px de pantalla, igual que en la pantalla de edición.
    const n = nucleo(escritorio(1800, 1.25), {});
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const reloj = await screen.findByRole('region', { name: 'Reloj' });
    expect([reloj.style.left, reloj.style.top, reloj.style.width, reloj.style.height]).toEqual([
      '1440px',
      '800px',
      '320px',
      '160px',
    ]);
  });

  it('HE-05-HU02-CA05 · Al cambiar la escala de Windows la capa la vuelve a leer', async () => {
    // RNF-34, ET07: de 125 % a 200 % con la aplicación abierta llega EV-17 y el widget se dibuja con la escala nueva.
    const n = nucleo(escritorio(1800, 1.25), {});
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    expect((await screen.findByRole('region', { name: 'Reloj' })).style.left).toBe('1440px');
    await n.cambiar(escritorio(1800, 2), 'monitors_changed');
    await waitFor(() => {
      const reloj = screen.getByRole('region', { name: 'Reloj' });
      expect([reloj.style.left, reloj.style.width]).toEqual(['900px', '200px']);
    });
  });

  it('HE-05-HU04-CA05 · Una lectura vieja que llega tarde no deshace lo guardado', async () => {
    // ET05: la primera lectura (antes de guardar) responde después de la segunda (después de guardar).
    let primera: (v: unknown) => void = () => undefined;
    let llamada = 0;
    const oyentes: Array<() => void> = [];
    const invocar = ((comando: string) => {
      if (comando !== 'layer_get_initial_state')
        return Promise.resolve({ ok: false, error: { code: 'internal.unexpected' } });
      llamada += 1;
      if (llamada === 1)
        return new Promise((listo) => {
          primera = listo;
        });
      return Promise.resolve({ ok: true, value: escritorio(1000, 1) });
    }) as unknown as Invoke;
    const escuchar = ((evento: string, alRecibir: () => void) => {
      if (evento === 'layout_changed') oyentes.push(alRecibir);
      return () => {};
    }) as unknown as Escuchar;
    render(<Capa invocar={invocar} escuchar={escuchar} />);
    await act(async () => oyentes.forEach((o) => o()));
    await act(async () => primera({ ok: true, value: escritorio(1800, 1) }));
    const reloj = await screen.findByRole('region', { name: 'Reloj' });
    expect(reloj.style.left).toBe('1000px');
  });
});
