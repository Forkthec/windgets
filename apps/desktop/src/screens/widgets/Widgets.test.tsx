// HE-04 en P07 · Widgets. Una prueba por CA en la vista; las reglas del Núcleo tienen su prueba ca_he_04_* en
// servicio_de_personalizacion_y_configuracion/pruebas_de_widgets.rs.
import { act, fireEvent, render, screen as pantalla, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Capa } from '@/capa/Capa';
import type { Escuchar } from '@/ipc/eventos';
import type {
  ErrorCode,
  GeocodeResult,
  Invoke,
  LayerInitialState,
  WidgetCatalog,
  WidgetCatalogEntry,
  WidgetItem,
  WidgetRect,
} from '@/types';
import { abrirPantalla, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Widgets } from './Widgets';

// El Núcleo manda el resultado de la pantalla de edición a esta ventana (`resultadoDeLaEdicion.ts`).
const resultados: Array<(mensaje: { code: string; message: string }) => void> = [];
vi.mock('@/ipc/resultadoDeLaEdicion', () => ({
  escucharResultadoDeLaEdicion: (alRecibir: (mensaje: { code: string; message: string }) => void) => {
    resultados.push(alRecibir);
    return () => resultados.splice(resultados.indexOf(alRecibir), 1);
  },
}));

function widget(datos: Partial<WidgetItem> & Pick<WidgetItem, 'widget_id' | 'type' | 'display_name'>) {
  return {
    distinguishing_value: null,
    is_default: false,
    is_active: true,
    can_configure: false,
    can_delete: true,
    paused_by_load: false,
    config: {},
    ...datos,
  } as WidgetItem;
}

const POR_DEFECTO: WidgetItem[] = [
  widget({ widget_id: 'reloj', type: 'clock', display_name: 'Reloj', is_default: true, can_delete: false }),
  widget({
    widget_id: 'cal',
    type: 'calendar',
    display_name: 'Calendario',
    is_default: true,
    can_delete: false,
  }),
  widget({
    widget_id: 'tareas',
    type: 'daily_tasks',
    display_name: 'Tareas del día',
    is_default: true,
    can_delete: false,
  }),
  widget({
    widget_id: 'kanban',
    type: 'kanban',
    display_name: 'Kanban',
    is_default: true,
    can_delete: false,
  }),
];

const AGREGADOS: WidgetItem[] = [
  widget({
    widget_id: 'clima',
    type: 'weather',
    display_name: 'Clima',
    distinguishing_value: 'Bogotá',
    can_configure: true,
    config: { city: 'Bogotá' },
  }),
  widget({
    widget_id: 'texto',
    type: 'text',
    display_name: 'Texto',
    distinguishing_value: 'Hola',
    can_configure: true,
  }),
  widget({ widget_id: 'noticias', type: 'news', display_name: 'Noticias', is_active: false }),
];

/** Abre Widgets con la lista que devuelve el Núcleo (ya en orden). */
async function abrir(lista: WidgetItem[]): Promise<NucleoDelPlanificador & { widgets: WidgetItem[] }> {
  const widgets = lista.map((w) => ({ ...w }));
  const nucleo = await abrirPantalla('widgets', 'Widgets', Widgets, [], (n) => {
    n.responder('widget_list', () => ({ ok: true, value: widgets.map((w) => ({ ...w })) }));
    n.responder('widget_set_active', ({ widget_id, active }) => {
      const w = widgets.find((x) => x.widget_id === widget_id);
      if (!w) return { ok: false, error: { code: 'widget.not_found', message: '' } };
      w.is_active = active;
      return { ok: true, value: { ...w } };
    });
    n.responder('widget_delete', ({ widget_id }) => {
      const i = widgets.findIndex((x) => x.widget_id === widget_id);
      if (i < 0) return { ok: false, error: { code: 'widget.not_found', message: '' } };
      widgets.splice(i, 1);
      return {
        ok: true,
        value: null,
        result_message: { code: 'widget_delete', message: 'Widget eliminado.' },
      };
    });
  });
  await screen.findByRole('list', { name: 'Lista de widgets' });
  return Object.assign(nucleo, { widgets });
}

function filas() {
  return within(screen.getByRole('list', { name: 'Lista de widgets' })).getAllByRole('listitem');
}

function fila(i: number): HTMLElement {
  const f = filas()[i];
  if (!f) throw new Error(`No hay fila ${i}`);
  return f;
}

/** La capa del escritorio con los rectángulos de los widgets activos que da el Núcleo en cada lectura. */
async function pintarCapa(widgets: WidgetRect[] | (() => WidgetRect[])) {
  const leer = typeof widgets === 'function' ? widgets : () => widgets;
  const estado = (): LayerInitialState => ({
    applied: {
      template_id: 'default',
      background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
      colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
      palette_id: null,
      font: { id: 'nunito', size: 'medium' },
    },
    widgets: leer(),
    monitors: [],
    wallpaper_state: 'ok',
    wallpaper_fit: [],
  });
  const invocar = ((comando: string) =>
    Promise.resolve(
      comando === 'layer_get_initial_state'
        ? { ok: true, value: estado() }
        : comando === 'asset_resolve'
          ? { ok: true, value: { url: '', state: 'unavailable' } }
          : { ok: false, error: { code: 'internal.unexpected', message: '' } },
    )) as unknown as Invoke;
  const oyentes = new Map<string, Array<() => void>>();
  const escuchar = ((evento: string, alRecibir: () => void) => {
    oyentes.set(evento, [...(oyentes.get(evento) ?? []), alRecibir]);
    return () => {};
  }) as unknown as Escuchar;
  const { unmount } = render(<Capa invocar={invocar} escuchar={escuchar} />);
  const wallpaper = await pantalla.findByRole('main', { name: 'Wallpaper' });
  /** EV-12 widgets_changed hacia la capa. */
  const avisar = () => act(async () => (oyentes.get('widgets_changed') ?? []).forEach((o) => o()));
  return { wallpaper, unmount, avisar };
}

describe('HE-04-HU01 · Widgets', () => {
  it('HE-04-HU01-CA01 · Widgets por defecto al primer inicio', async () => {
    await abrir(POR_DEFECTO);
    // ET01, ET04: Reloj, Calendario, Tareas del día y Kanban con el interruptor «Activo».
    expect(filas().map((f) => f.querySelector('.wg-lista__nombre')?.textContent)).toEqual([
      'Reloj',
      'Calendario',
      'Tareas del día',
      'Kanban',
    ]);
    for (const fila of filas()) {
      expect(within(fila).getByRole('switch').getAttribute('aria-checked')).toBe('true');
      expect(within(fila).getByText('Activo')).toBeTruthy();
    }
    // La capa los pinta sobre el wallpaper en su posición por defecto (H-D-18).
    const { wallpaper, unmount } = await pintarCapa([
      { widget_id: 'reloj', type: 'clock', x: 40, y: 40, width: 320, height: 160, is_active: true },
      { widget_id: 'cal', type: 'calendar', x: 40, y: 220, width: 320, height: 340, is_active: true },
      { widget_id: 'tareas', type: 'daily_tasks', x: 380, y: 40, width: 360, height: 520, is_active: true },
      { widget_id: 'kanban', type: 'kanban', x: 760, y: 40, width: 640, height: 520, is_active: true },
    ]);
    const reloj = within(wallpaper).getByRole('region', { name: 'Reloj' });
    expect([reloj.style.left, reloj.style.top, reloj.style.width, reloj.style.height]).toEqual([
      '40px',
      '40px',
      '320px',
      '160px',
    ]);
    expect(
      within(wallpaper)
        .getAllByRole('region')
        .map((r) => r.getAttribute('aria-label')),
    ).toEqual(['Reloj', 'Calendario', 'Tareas del día', 'Kanban']);
    unmount();
  });

  it('HE-04-HU01-CA02 · Consultar la lista de widgets', async () => {
    await abrir([...POR_DEFECTO, ...AGREGADOS]);
    expect(screen.getByRole('button', { name: 'Agregar widget' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Editar escritorio' })).toBeTruthy();
    const [reloj, clima, texto, noticias] = [fila(0), fila(4), fila(5), fila(6)];
    // ET02: primero los por defecto y luego los agregados; ET03: nombre, tipo, dato, interruptor y opciones.
    expect(within(reloj).getByText('Reloj')).toBeTruthy();
    expect(within(reloj).getByText('Por defecto')).toBeTruthy();
    expect(within(reloj).queryByRole('button', { name: 'Configurar' })).toBeNull();
    // HE-04-HU13-CA02 (ET04): en los widgets por defecto, «Eliminar» se muestra deshabilitada con su motivo.
    expect((within(reloj).getByRole('button', { name: 'Eliminar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(within(clima).getByText('Clima')).toBeTruthy();
    expect(within(clima).getByText('Bogotá')).toBeTruthy();
    expect(within(clima).getByText('Externo')).toBeTruthy();
    expect(within(clima).getByText('Activo')).toBeTruthy();
    expect(within(clima).getByRole('button', { name: 'Configurar' })).toBeTruthy();
    expect(within(clima).getByRole('button', { name: 'Eliminar' })).toBeTruthy();
    expect(within(texto).getByText('Local')).toBeTruthy();
    expect(within(noticias).getByText('Externo')).toBeTruthy();
    expect(within(noticias).getByText('Inactivo')).toBeTruthy();
    expect(within(noticias).queryByRole('button', { name: 'Configurar' })).toBeNull();
  });

  it('HE-04-HU01-CA03 · Todos los widgets inactivos', async () => {
    await abrir(POR_DEFECTO.map((w) => ({ ...w, is_active: false })));
    for (const fila of filas()) {
      expect(within(fila).getByRole('switch').getAttribute('aria-checked')).toBe('false');
      expect(within(fila).getByText('Inactivo')).toBeTruthy();
    }
    // ET05: el Núcleo no da rectángulos y la capa muestra solo el wallpaper.
    const { wallpaper, unmount } = await pintarCapa([]);
    expect(within(wallpaper).queryAllByRole('region')).toHaveLength(0);
    unmount();
  });
});

/** Rectángulos de la capa: los widgets activos de la lista, cada uno con su última posición y tamaño. */
function rectangulosDe(widgets: WidgetItem[], posiciones: Record<string, [number, number, number, number]>) {
  return widgets
    .filter((w) => w.is_active)
    .map((w) => {
      const [x, y, width, height] = posiciones[w.widget_id] ?? [0, 0, 100, 100];
      return { widget_id: w.widget_id, type: w.type, x, y, width, height, is_active: true };
    });
}

const POSICIONES: Record<string, [number, number, number, number]> = {
  reloj: [40, 40, 320, 160],
  cal: [40, 220, 320, 340],
  tareas: [380, 40, 360, 520],
  kanban: [760, 40, 640, 520],
  clima: [40, 600, 320, 160],
  texto: [40, 800, 320, 100],
  noticias: [380, 600, 360, 300],
};

describe('HE-04-HU02 · Alternar un widget', () => {
  it('HE-04-HU02-CA01 · Desactivar un widget activo', async () => {
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
    const capa = await pintarCapa(() => rectangulosDe(nucleo.widgets, POSICIONES));
    expect(within(capa.wallpaper).getByRole('region', { name: 'Clima' })).toBeTruthy();
    fireEvent.click(within(fila(4)).getByRole('switch'));
    expect(await within(fila(4)).findByText('Inactivo')).toBeTruthy();
    expect(nucleo.llamadas.filter((l) => l.comando === 'widget_set_active').map((l) => l.params)).toEqual([
      { widget_id: 'clima', active: false },
    ]);
    // ET01, ET02: con EV-12 la capa deja de pintarlo y los demás siguen igual.
    await capa.avisar();
    expect(within(capa.wallpaper).queryByRole('region', { name: 'Clima' })).toBeNull();
    expect(
      within(capa.wallpaper)
        .getAllByRole('region')
        .map((r) => r.getAttribute('aria-label')),
    ).toEqual(['Reloj', 'Calendario', 'Tareas del día', 'Kanban', 'Texto']);
    expect(filas()).toHaveLength(7);
    capa.unmount();
  });

  it('HE-04-HU02-CA02 · Activar un widget inactivo', async () => {
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
    const capa = await pintarCapa(() => rectangulosDe(nucleo.widgets, POSICIONES));
    expect(within(capa.wallpaper).queryByRole('region', { name: 'Noticias' })).toBeNull();
    fireEvent.click(within(fila(6)).getByRole('switch'));
    expect(await within(fila(6)).findByText('Activo')).toBeTruthy();
    // ET03: vuelve con su última posición y su último tamaño.
    await capa.avisar();
    const noticias = within(capa.wallpaper).getByRole('region', { name: 'Noticias' });
    expect([noticias.style.left, noticias.style.top, noticias.style.width, noticias.style.height]).toEqual([
      '380px',
      '600px',
      '360px',
      '300px',
    ]);
    capa.unmount();
  });
});

function entrada(type: WidgetCatalogEntry['type'], name: string, yaAgregado = false): WidgetCatalogEntry {
  return {
    type,
    name,
    description: `Descripción de ${name}.`,
    enabled: !yaAgregado,
    disabled_reason: yaAgregado ? 'Ya agregaste este widget.' : null,
  };
}

function catalogo(yaAgregados: string[] = []): WidgetCatalog {
  const e = (type: WidgetCatalogEntry['type'], name: string) =>
    entrada(type, name, yaAgregados.includes(name));
  return {
    external: [e('weather', 'Clima'), e('news', 'Noticias')],
    local: [
      e('animation', 'Animación'),
      e('image_carousel', 'Carrusel de imágenes'),
      e('static_image', 'Imagen estática'),
      e('music_player', 'Reproductor de música'),
      e('text', 'Texto'),
    ],
  };
}

/** Abre Widgets y selecciona «Agregar widget» con el catálogo que da el Núcleo. */
async function abrirCatalogo(c: WidgetCatalog) {
  const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
  nucleo.responder('widget_catalog_get', () => ({ ok: true, value: c }));
  fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
  return screen.findByRole('main', { name: 'Agregar widget' });
}

function nombresDe(grupo: HTMLElement) {
  return Array.from(grupo.querySelectorAll('.wg-lista__nombre')).map((n) => n.textContent);
}

describe('HE-04-HU13 · Eliminar un widget', () => {
  const M07 = (nombre: string) => `¿Deseas eliminar el widget “${nombre}”? Se quitará de todos tus temas.`;
  const eliminarDe = (f: HTMLElement) =>
    within(f).getByRole('button', { name: 'Eliminar' }) as HTMLButtonElement;
  const nombres = () => filas().map((f) => f.querySelector('.wg-lista__nombre')?.textContent);

  /** Elige «Eliminar» en la fila y confirma en M-07. */
  async function eliminarYConfirmar(i: number) {
    fireEvent.click(eliminarDe(fila(i)));
    const dialogo = await screen.findByRole('dialog');
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Eliminar' }));
  }

  it('HE-04-HU13-CA01 · Eliminar un widget agregado', async () => {
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
    await eliminarYConfirmar(5);
    // ET02: sale de la lista (y el Núcleo lo quita del escritorio y de todos los temas).
    expect((await screen.findByRole('status')).textContent).toContain('Widget eliminado.');
    expect(llamadasA(nucleo, 'widget_delete')).toEqual([{ widget_id: 'texto' }]);
    await waitFor(() => expect(nombres()).not.toContain('Texto'));
  });

  it('HE-04-HU13-CA02 · Widget por defecto no eliminable', async () => {
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
    // ET04: deshabilitada con su motivo (RT-04) en los cuatro widgets por defecto.
    for (const i of [0, 1, 2, 3]) expect(eliminarDe(fila(i)).disabled).toBe(true);
    expect(
      within(fila(0)).getByText('Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.'),
    ).toBeTruthy();
    fireEvent.click(eliminarDe(fila(0)));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(llamadasA(nucleo, 'widget_delete')).toEqual([]);
  });

  it('HE-04-HU13-CA03 · Cancelar la eliminación', async () => {
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
    fireEvent.click(eliminarDe(fila(4)));
    const dialogo = await screen.findByRole('dialog');
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    // ET07: se conserva sin cambios.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(nucleo, 'widget_delete')).toEqual([]);
    expect(nombres()).toContain('Clima');
  });

  it('HE-04-HU13-CA04 · Eliminar un widget Clima', async () => {
    const cali = widget({
      widget_id: 'clima-cali',
      type: 'weather',
      display_name: 'Clima',
      distinguishing_value: 'Cali',
      can_configure: true,
      config: { city: 'Cali' },
    });
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS, cali]);
    expect(within(fila(7)).getByText('Cali')).toBeTruthy();
    await eliminarYConfirmar(7);
    expect((await screen.findByRole('status')).textContent).toContain('Widget eliminado.');
    expect(llamadasA(nucleo, 'widget_delete')).toEqual([{ widget_id: 'clima-cali' }]);
    // ET05: el Clima de otra ciudad se conserva.
    await waitFor(() => expect(filas()).toHaveLength(7));
    expect(within(fila(4)).getByText('Bogotá')).toBeTruthy();
  });

  it('HE-04-HU13-CA05 · Eliminar el widget Noticias', async () => {
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
    await eliminarYConfirmar(6);
    expect((await screen.findByRole('status')).textContent).toContain('Widget eliminado.');
    expect(llamadasA(nucleo, 'widget_delete')).toEqual([{ widget_id: 'noticias' }]);
    // ET06: el Núcleo vuelve a habilitar Noticias en el catálogo (prueba ca_he_04_hu13_ca05).
    await waitFor(() => expect(nombres()).not.toContain('Noticias'));
  });

  it('HE-04-HU13-CA06 · Abrir el mensaje de confirmación para eliminar un widget', async () => {
    const nucleo = await abrir([...POR_DEFECTO, ...AGREGADOS]);
    fireEvent.click(eliminarDe(fila(4)));
    // ET01: ventana emergente con «Eliminar» y «Cancelar»; todavía no se elimina.
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText(M07('Clima'))).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Eliminar' })).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(llamadasA(nucleo, 'widget_delete')).toEqual([]);
  });
});

describe('HE-04-HU04 · Catálogo de widgets', () => {
  it('HE-04-HU04-CA01 · Consultar el catálogo de widgets', async () => {
    const subpantalla = await abrirCatalogo(catalogo());
    // ET01: miga de pan «Widgets > Agregar widget» y «Regresar» (RT-03).
    const miga = within(subpantalla).getByRole('navigation', { name: 'Miga de pan' });
    expect(miga.textContent).toBe('Widgets>Agregar widget');
    expect(within(subpantalla).getByRole('button', { name: 'Regresar' })).toBeTruthy();
    // ET02, ET03: los dos grupos, con nombre, ícono y descripción, sin los widgets por defecto.
    const externos = await within(subpantalla).findByRole('region', { name: 'Widgets externos' });
    const locales = within(subpantalla).getByRole('region', { name: 'Widgets locales' });
    expect(nombresDe(externos)).toEqual(['Clima', 'Noticias']);
    expect(nombresDe(locales)).toEqual([
      'Animación',
      'Carrusel de imágenes',
      'Imagen estática',
      'Reproductor de música',
      'Texto',
    ]);
    const clima = within(externos).getByRole('button', { name: /Clima/ });
    expect(clima.querySelector('.wg-icono-widget')).toBeTruthy();
    expect(within(clima).getByText('Descripción de Clima.')).toBeTruthy();
    for (const nombre of ['Reloj', 'Calendario', 'Tareas del día', 'Kanban']) {
      expect(within(subpantalla).queryByText(nombre)).toBeNull();
    }
    // «Regresar» vuelve a la pantalla Widgets.
    fireEvent.click(within(subpantalla).getByRole('button', { name: 'Regresar' }));
    expect(await screen.findByRole('main', { name: 'Widgets' })).toBeTruthy();
  });

  it('HE-04-HU04-CA02 · Widget que ya se agregó', async () => {
    const subpantalla = await abrirCatalogo(catalogo(['Noticias', 'Reproductor de música']));
    await within(subpantalla).findByRole('region', { name: 'Widgets externos' });
    // ET04: deshabilitados con «Ya agregaste este widget.» (RT-04); los demás habilitados.
    for (const nombre of ['Noticias', 'Reproductor de música']) {
      const boton = within(subpantalla).getByRole('button', { name: new RegExp(nombre) });
      expect(boton).toHaveProperty('disabled', true);
      expect(boton.parentElement?.textContent).toContain('Ya agregaste este widget.');
    }
    for (const nombre of ['Clima', 'Animación', 'Carrusel de imágenes', 'Imagen estática', 'Texto']) {
      expect(within(subpantalla).getByRole('button', { name: new RegExp(nombre) })).toHaveProperty(
        'disabled',
        false,
      );
    }
  });
});

describe('HE-05 · Pantalla de edición desde Widgets', () => {
  /** El Núcleo cierra la ventana de edición y manda el resultado a esta ventana (o nada, sin cambios). */
  const volverDeLaEdicion = (mensaje: string) =>
    act(() => {
      for (const alRecibir of resultados) alRecibir({ code: 'layout_edit_save', message: mensaje });
    });

  it('HE-05-HU01-CA01 · «Editar escritorio» abre la pantalla de edición', async () => {
    const nucleo = await abrir(POR_DEFECTO);
    // ET05: la opción está en la pantalla Widgets; el Núcleo oculta esta ventana y abre la de edición.
    fireEvent.click(screen.getByRole('button', { name: 'Editar escritorio' }));
    await waitFor(() => expect(llamadasA(nucleo, 'layout_edit_open')).toEqual([{}]));
  });

  it.each([
    ['HE-05-HU04-CA01 · Guardar la distribución después de mover un widget', 'Cambios guardados.'],
    ['HE-05-HU04-CA02 · Guardar la distribución después de redimensionar un widget', 'Cambios guardados.'],
    ['HE-05-HU04-CA04 · Guardar la distribución sin conexión', 'Cambios guardados.'],
    ['HE-05-HU05-CA03 · Salir sin guardar: el mensaje en la pantalla Widgets', 'No se guardaron cambios.'],
  ])('%s', async (_nombre, mensaje) => {
    const nucleo = await abrir(POR_DEFECTO);
    const lecturas = llamadasA(nucleo, 'widget_list').length;
    await volverDeLaEdicion(mensaje);
    // Se abre la pantalla Widgets con el mensaje de resultado (RT-04) y la lista vuelve a leer.
    expect((await screen.findByRole('status')).textContent).toContain(mensaje);
    expect(llamadasA(nucleo, 'widget_list').length).toBeGreaterThan(lecturas);
  });

  it('HE-05-HU04-CA03 · Guardar la distribución sin haber hecho cambios', async () => {
    await abrir(POR_DEFECTO);
    // ET03: sin cambios el Núcleo no manda mensaje; la pantalla Widgets no muestra ninguno.
    expect(screen.queryByRole('status')).toBeNull();
  });
});

/** Un lugar de las sugerencias del campo Ciudad (IPC-WID-08). */
function lugar(name: string, geo_id: string, admin1: string | null = null): GeocodeResult {
  return { geo_id, name, admin1, country: 'Colombia', latitude: 2.44, longitude: -76.61 };
}

/** Escribe en el campo Ciudad y elige la sugerencia indicada (HE-04-HU05-ET18). */
async function elegirCiudad(contenedor: HTMLElement, campo: HTMLInputElement, texto: string, opcion: string) {
  fireEvent.change(campo, { target: { value: texto } });
  const lista = await within(contenedor).findByRole('listbox', { name: 'Sugerencias de ciudad' });
  fireEvent.mouseDown(within(lista).getByRole('option', { name: opcion }));
}

describe('HE-04-HU05 · Agregar el widget Clima', () => {
  const POPAYAN = lugar('Popayán', '3673269', 'Cauca');
  const CALI = lugar('Cali', '3687925', 'Valle del Cauca');

  /** Abre la subpantalla Clima desde el catálogo; el Núcleo sugiere Popayán y Cali según lo escrito. */
  async function abrirClima(responder?: (n: NucleoDelPlanificador) => void) {
    const nucleo = await abrir([...POR_DEFECTO]);
    nucleo.responder('widget_catalog_get', () => ({ ok: true, value: catalogo() }));
    nucleo.responder('weather_city_search', (params) => {
      const q = (params as { query: string }).query.toLowerCase();
      return { ok: true, value: [POPAYAN, CALI].filter((l) => l.name.toLowerCase().startsWith(q)) };
    });
    responder?.(nucleo);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
    const enCatalogo = await screen.findByRole('main', { name: 'Agregar widget' });
    fireEvent.click(await within(enCatalogo).findByRole('button', { name: /Clima/ }));
    const sub = await screen.findByRole('main', { name: 'Clima' });
    const campo = within(sub).getByLabelText('Ciudad') as HTMLInputElement;
    const agregar = within(sub).getByRole('button', { name: 'Agregar' }) as HTMLButtonElement;
    return { nucleo, sub, campo, agregar };
  }

  const rechazo = (code: ErrorCode, message: string) => () => ({
    ok: false as const,
    error: { code, message, field: 'city' },
  });
  const agregado = (ciudad: string) => () => ({
    ok: true as const,
    value: widget({
      widget_id: `w-${ciudad}`,
      type: 'weather',
      display_name: 'Clima',
      distinguishing_value: ciudad,
    }),
  });

  it('HE-04-HU05-CA01 · Agregar el widget Clima', async () => {
    const { nucleo, sub, campo, agregar } = await abrirClima((n) =>
      n.responder('widget_add', agregado('Popayán')),
    );
    // ET01, ET16: miga de pan, el campo Ciudad vacío, «Agregar» y «Regresar».
    expect(within(sub).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Widgets>Agregar widget>Clima',
    );
    expect(within(sub).getByRole('button', { name: 'Regresar' })).toBeTruthy();
    expect(campo.value).toBe('');
    await elegirCiudad(sub, campo, ' Popa', 'Popayán, Cauca, Colombia');
    expect(campo.value).toBe('Popayán, Cauca, Colombia');
    fireEvent.click(agregar);
    // Regresa a la pantalla Widgets.
    expect(await screen.findByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(llamadasA(nucleo, 'widget_add')).toEqual([
      { type: 'weather', config: { city: 'Popayán', place: POPAYAN } },
    ]);
  });

  it('HE-04-HU05-CA02 · Agregar el clima de otra ciudad', async () => {
    // ET04: Clima sigue habilitado en el catálogo aunque ya haya uno; cada ciudad es un widget aparte.
    const { nucleo, sub, campo, agregar } = await abrirClima((n) =>
      n.responder('widget_add', agregado('Cali')),
    );
    await elegirCiudad(sub, campo, 'Cali', 'Cali, Valle del Cauca, Colombia');
    fireEvent.click(agregar);
    await screen.findByRole('main', { name: 'Widgets' });
    expect(llamadasA(nucleo, 'widget_add')).toEqual([
      { type: 'weather', config: { city: 'Cali', place: CALI } },
    ]);
  });

  it('HE-04-HU05-CA03 · Ciudad vacía', async () => {
    const { nucleo, campo, agregar } = await abrirClima();
    expect(agregar.disabled).toBe(true);
    fireEvent.change(campo, { target: { value: '   ' } });
    expect(agregar.disabled).toBe(true);
    expect(llamadasA(nucleo, 'widget_add')).toEqual([]);
  });

  it('HE-04-HU05-CA04 · Ciudad no encontrada', async () => {
    // ET18 (P29): sin sugerencias, el mensaje va en el campo y «Agregar» sigue deshabilitada.
    const texto = 'No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.';
    const { nucleo, sub, campo, agregar } = await abrirClima();
    fireEvent.change(campo, { target: { value: 'Xyzzy' } });
    expect(await within(sub).findByText(texto)).toBeTruthy();
    expect(within(sub).queryByRole('listbox')).toBeNull();
    expect(agregar.disabled).toBe(true);
    expect(llamadasA(nucleo, 'widget_add')).toEqual([]);
  });

  it('HE-04-HU05-CA05 · Ciudad que ya tiene un widget Clima', async () => {
    const texto = 'Ya tienes un widget Clima para esa ciudad.';
    const { sub, campo, agregar } = await abrirClima((n) =>
      n.responder('widget_add', rechazo('city.duplicate', texto)),
    );
    await elegirCiudad(sub, campo, 'Popayán', 'Popayán, Cauca, Colombia');
    fireEvent.click(agregar);
    expect(await within(sub).findByText(texto)).toBeTruthy();
  });

  it('HE-04-HU05-CA09 · Ciudad de más de 100 caracteres', async () => {
    const { nucleo, sub, campo, agregar } = await abrirClima();
    fireEvent.change(campo, { target: { value: 'a'.repeat(101) } });
    expect(within(sub).getByText('La ciudad no puede superar los 100 caracteres.')).toBeTruthy();
    expect(agregar.disabled).toBe(true);
    expect(llamadasA(nucleo, 'weather_city_search')).toEqual([]);
  });

  it('HE-04-HU05-CA10 · Sugerencias al escribir', async () => {
    // ET18 (P29): desde 2 caracteres, tras una pausa, hasta 5 lugares con nombre, región y país; con 1 no consulta.
    const { nucleo, sub, campo, agregar } = await abrirClima();
    fireEvent.change(campo, { target: { value: 'P' } });
    await new Promise((r) => setTimeout(r, 500));
    expect(llamadasA(nucleo, 'weather_city_search')).toEqual([]);
    fireEvent.change(campo, { target: { value: 'Po' } });
    const lista = await within(sub).findByRole('listbox', { name: 'Sugerencias de ciudad' });
    expect(
      within(lista)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Popayán, Cauca, Colombia']);
    expect(llamadasA(nucleo, 'weather_city_search')).toEqual([{ query: 'Po' }]);
    // Escribir no basta: «Agregar» espera un lugar elegido.
    expect(agregar.disabled).toBe(true);
    expect(campo.getAttribute('aria-expanded')).toBe('true');
  });

  it('HE-04-HU05-CA11 · Elegir un lugar con el teclado', async () => {
    // ET18 (P29): las flechas recorren las sugerencias y Enter elige la activa sin enviar el formulario.
    const { nucleo, sub, campo, agregar } = await abrirClima((n) => {
      n.responder('weather_city_search', () => ({ ok: true, value: [POPAYAN, CALI] }));
      n.responder('widget_add', agregado('Cali'));
    });
    fireEvent.change(campo, { target: { value: 'Ca' } });
    await within(sub).findByRole('listbox');
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    expect(within(sub).getByRole('option', { name: /Cali/ }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(campo.value).toBe('Cali, Valle del Cauca, Colombia');
    expect(llamadasA(nucleo, 'widget_add')).toEqual([]);
    expect(agregar.disabled).toBe(false);
    // Escribir después de elegir quita el lugar elegido.
    fireEvent.change(campo, { target: { value: 'Cal' } });
    expect(agregar.disabled).toBe(true);
  });

  it('HE-04-HU05-CA12 · Sugerencias sin conexión', async () => {
    // ET18: sin conexión el campo muestra el mensaje claro del Núcleo, no el genérico.
    const texto = 'No hay conexión a internet. Conéctate para validar la ciudad.';
    const { sub, campo } = await abrirClima((n) =>
      n.responder('weather_city_search', rechazo('net.offline', texto)),
    );
    fireEvent.change(campo, { target: { value: 'Popayán' } });
    expect(await within(sub).findByText(texto)).toBeTruthy();
  });
});

describe('HE-04-HU06 · Agregar el widget Noticias', () => {
  it('HE-04-HU06-CA01 · Agregar el widget Noticias', async () => {
    const nucleo = await abrir([...POR_DEFECTO]);
    nucleo.responder('widget_catalog_get', () => ({ ok: true, value: catalogo() }));
    nucleo.responder('widget_add', () => ({
      ok: true,
      value: widget({ widget_id: 'w-noticias', type: 'news', display_name: 'Noticias' }),
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
    const enCatalogo = await screen.findByRole('main', { name: 'Agregar widget' });
    fireEvent.click(await within(enCatalogo).findByRole('button', { name: /Noticias/ }));
    const sub = await screen.findByRole('main', { name: 'Noticias' });
    // ET01: miga de pan, la descripción del widget, «Agregar» y «Regresar».
    expect(within(sub).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Widgets>Agregar widget>Noticias',
    );
    expect(within(sub).getByText('Descripción de Noticias.')).toBeTruthy();
    expect(within(sub).getByRole('button', { name: 'Regresar' })).toBeTruthy();
    fireEvent.click(within(sub).getByRole('button', { name: 'Agregar' }));
    // Regresa a la pantalla Widgets.
    expect(await screen.findByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(llamadasA(nucleo, 'widget_add')).toEqual([{ type: 'news', config: {} }]);
  });
});

describe('HE-04-HU11 · Agregar el widget Reproductor de música', () => {
  it('HE-04-HU11-CA01 · la subpantalla tiene la descripción, «Agregar» y «Regresar»', async () => {
    const nucleo = await abrir([...POR_DEFECTO]);
    nucleo.responder('widget_catalog_get', () => ({ ok: true, value: catalogo() }));
    nucleo.responder('widget_add', () => ({
      ok: true,
      value: widget({ widget_id: 'w-m', type: 'music_player', display_name: 'Reproductor de música' }),
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
    const enCatalogo = await screen.findByRole('main', { name: 'Agregar widget' });
    fireEvent.click(await within(enCatalogo).findByRole('button', { name: /Reproductor de música/ }));
    const sub = await screen.findByRole('main', { name: 'Reproductor de música' });
    // ET01
    expect(within(sub).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Widgets>Agregar widget>Reproductor de música',
    );
    expect(within(sub).getByText('Descripción de Reproductor de música.')).toBeTruthy();
    fireEvent.click(within(sub).getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(llamadasA(nucleo, 'widget_add')).toEqual([{ type: 'music_player', config: {} }]);
  });
});

describe('HE-04-HU12 · Configurar un widget agregado', () => {
  const clima = (ciudad: string, id = 'w-clima') =>
    widget({
      widget_id: id,
      type: 'weather',
      display_name: 'Clima',
      distinguishing_value: ciudad,
      can_configure: true,
      config: { city: ciudad },
    });
  const texto = widget({
    widget_id: 'w-texto',
    type: 'text',
    display_name: 'Texto',
    distinguishing_value: 'Estudiar',
    can_configure: true,
    config: { text: 'Estudiar' },
  });

  /** Abre Widgets con la lista dada y selecciona «Configurar» en el widget indicado. */
  async function configurar(lista: WidgetItem[], id: string, preparar?: (n: NucleoDelPlanificador) => void) {
    const nucleo = await abrir(lista);
    preparar?.(nucleo);
    const f = fila(lista.findIndex((w) => w.widget_id === id));
    fireEvent.click(within(f).getByRole('button', { name: 'Configurar' }));
    const ventana = await screen.findByRole('dialog', { name: 'Configurar' });
    return { nucleo, ventana };
  }
  const rechazo = (code: ErrorCode, message: string) => () => ({
    ok: false as const,
    error: { code, message, field: 'city' },
  });

  const CALI = lugar('Cali', '3687925', 'Valle del Cauca');
  const POPAYAN = lugar('Popayán', '3673269', 'Cauca');
  const sugerir = (n: NucleoDelPlanificador) =>
    n.responder('weather_city_search', (params) => {
      const q = (params as { query: string }).query.toLowerCase();
      return { ok: true, value: [POPAYAN, CALI].filter((l) => l.name.toLowerCase().startsWith(q)) };
    });

  it('HE-04-HU12-CA01 · Cambiar la ciudad del widget Clima', async () => {
    const { nucleo, ventana } = await configurar([...POR_DEFECTO, clima('Popayán')], 'w-clima', (n) => {
      sugerir(n);
      n.responder('widget_configure', () => ({ ok: true, value: clima('Cali') }));
    });
    // ET05: el campo Ciudad precargado, «Guardar» y «Cancelar».
    const campo = within(ventana).getByLabelText('Ciudad') as HTMLInputElement;
    expect(campo.value).toBe('Popayán');
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    // HE-04-HU05-ET18 (P29): la ciudad nueva se elige de las sugerencias.
    await elegirCiudad(ventana, campo, 'Cali', 'Cali, Valle del Cauca, Colombia');
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Configurar' })).toBeNull());
    expect(llamadasA(nucleo, 'widget_configure')).toEqual([
      { widget_id: 'w-clima', config: { city: 'Cali', place: CALI } },
    ]);
  });

  it('HE-04-HU12-CA02 · Cambiar el texto del widget Texto', async () => {
    const { nucleo, ventana } = await configurar([...POR_DEFECTO, texto], 'w-texto', (n) =>
      n.responder('widget_configure', () => ({ ok: true, value: texto })),
    );
    const campo = within(ventana).getByLabelText('Texto') as HTMLTextAreaElement;
    expect(campo.value).toBe('Estudiar');
    fireEvent.change(campo, { target: { value: 'Repasar simulación' } });
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(llamadasA(nucleo, 'widget_configure')).toEqual([
        { widget_id: 'w-texto', config: { text: 'Repasar simulación' } },
      ]),
    );
  });

  it('HE-04-HU12-CA03 · Ciudad vacía al cambiar la ciudad', async () => {
    const { nucleo, ventana } = await configurar([...POR_DEFECTO, clima('Popayán')], 'w-clima');
    fireEvent.change(within(ventana).getByLabelText('Ciudad'), { target: { value: '   ' } });
    expect((within(ventana).getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(llamadasA(nucleo, 'widget_configure')).toEqual([]);
  });

  it('HE-04-HU12-CA04 · Ciudad no encontrada al cambiar la ciudad', async () => {
    // HE-04-HU05-ET18 (P29): sin sugerencias, el mensaje va en el campo y «Guardar» sigue deshabilitada.
    const t = 'No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.';
    const { nucleo, ventana } = await configurar([...POR_DEFECTO, clima('Popayán')], 'w-clima', sugerir);
    fireEvent.change(within(ventana).getByLabelText('Ciudad'), { target: { value: 'Xyzzy' } });
    expect(await within(ventana).findByText(t)).toBeTruthy();
    expect((within(ventana).getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(llamadasA(nucleo, 'widget_configure')).toEqual([]);
  });

  it('HE-04-HU12-CA05 · Ciudad que ya tiene un widget Clima al cambiar la ciudad', async () => {
    const t = 'Ya tienes un widget Clima para esa ciudad.';
    const { ventana } = await configurar(
      [...POR_DEFECTO, clima('Popayán', 'w-p'), clima('Cali')],
      'w-clima',
      (n) => {
        sugerir(n);
        n.responder('widget_configure', rechazo('city.duplicate', t));
      },
    );
    const campo = within(ventana).getByLabelText('Ciudad') as HTMLInputElement;
    await elegirCiudad(ventana, campo, 'Popayán', 'Popayán, Cauca, Colombia');
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    expect(await within(ventana).findByText(t)).toBeTruthy();
  });
});
