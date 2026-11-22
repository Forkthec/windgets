// HE-05 · Pantalla de edición de la distribución de widgets (C-03). Una prueba por CA en la vista; las reglas del
// Núcleo (área visible, sin superponerse, 100 × 100, guardar y cancelar) tienen sus pruebas ca_he_05_* en
// servicio_de_personalizacion_y_configuracion/pruebas_de_distribucion.rs. Que la ventana cubra el escritorio
// y esté por encima de las demás (ET01, ET02) se revisa a mano en Windows 11.
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Capa } from '@/capa/Capa';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, LayerInitialState, WidgetRect } from '@/types';
import { Edicion } from './Edicion';

// jsdom no tiene PointerEvent: sin él, los eventos de puntero llegan sin coordenadas.
if (!('PointerEvent' in window)) {
  class EventoDePuntero extends MouseEvent {
    pointerId: number;
    constructor(tipo: string, datos: PointerEventInit = {}) {
      super(tipo, datos);
      this.pointerId = datos.pointerId ?? 0;
    }
  }
  Object.assign(window, { PointerEvent: EventoDePuntero });
}

const RELOJ: WidgetRect = {
  widget_id: 'reloj',
  type: 'clock',
  x: 40,
  y: 40,
  width: 320,
  height: 160,
  is_active: true,
};
const TAREAS: WidgetRect = {
  widget_id: 'tareas',
  type: 'daily_tasks',
  x: 380,
  y: 40,
  width: 360,
  height: 520,
  is_active: true,
};

function capa(widgets: WidgetRect[], escala = 1): LayerInitialState {
  return {
    applied: {
      template_id: 'default',
      background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
      colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
      palette_id: null,
      font: { id: 'nunito', size: 'medium' },
    },
    widgets,
    monitors: [{ id: '0', x: 0, y: 0, width: 1920, height: 1080, scale_factor: escala }],
    wallpaper_state: 'ok',
  };
}

/**
 * Núcleo de prueba de la distribución: `mover` y `redimensionar` dicen qué responde el Núcleo; cuenta las llamadas
 * y si hay cambios sin guardar.
 */
function nucleo(
  widgets: WidgetRect[],
  responder: {
    mover?: (p: { widget_id: string; x: number; y: number }) => { rect: WidgetRect; collided: boolean };
    redimensionar?: (p: { widget_id: string; width: number; height: number }) => {
      rect: WidgetRect;
      collided: boolean;
    };
  } = {},
  escala = 1,
) {
  const llamadas: Array<{ comando: string; params: unknown }> = [];
  let cambios = false;
  const invocar = ((comando: string, params: never) => {
    llamadas.push({ comando, params });
    const ok = (value: unknown) => Promise.resolve({ ok: true, value });
    switch (comando) {
      case 'layer_get_initial_state':
        return ok(capa(widgets, escala));
      case 'asset_resolve':
        return ok({ url: '', state: 'unavailable' });
      case 'catalog_list':
        return ok([]);
      case 'system_time_format_get':
        // IPC-DESK-14: el Reloj de la capa lee el formato de hora de Windows (HE-04-HU03-ET02).
        return ok({ hour_cycle: 'h23', two_digit_hour: true });
      case 'layout_edit_move': {
        const r = responder.mover?.(params) ?? {
          rect: widgets.find((w) => w.widget_id === (params as { widget_id: string }).widget_id) ?? RELOJ,
          collided: false,
        };
        cambios = true;
        return ok(r);
      }
      case 'layout_edit_resize': {
        const r = responder.redimensionar?.(params);
        cambios = true;
        return ok(r);
      }
      case 'layout_edit_get_status':
        return ok({ dirty: cambios });
      default:
        return ok(null);
    }
  }) as unknown as Invoke;
  const de = (comando: string) => llamadas.filter((l) => l.comando === comando).map((l) => l.params);
  return { invocar, de };
}

async function abrir(n: ReturnType<typeof nucleo>, escuchar?: Escuchar) {
  render(<Edicion invocar={n.invocar} {...(escuchar ? { escuchar } : {})} />);
  return screen.findByRole('main', { name: 'Pantalla de edición' });
}

const widget = (nombre: string) => screen.getByRole('region', { name: nombre });
const esquina = (id: string) => document.querySelector(`[data-esquina="${id}"]`) as HTMLElement;

/** Arrastra un elemento con el mouse de (x, y) a (x + dx, y + dy) sin soltarlo. */
async function arrastrar(elemento: HTMLElement, dx: number, dy: number) {
  await act(async () => {
    fireEvent.pointerDown(elemento, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(elemento, { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 });
  });
}

async function soltar(elemento: HTMLElement) {
  await act(async () => {
    fireEvent.pointerUp(elemento, { pointerId: 1 });
  });
}

describe('HE-05-HU01 · Abrir la pantalla de edición', () => {
  it('HE-05-HU01-CA01 · Abrir la pantalla de edición', async () => {
    const pantalla = await abrir(nucleo([RELOJ, TAREAS]));
    // ET04: la barra superior con el texto y «Guardar» y «Cancelar»; sin menú principal (ET01).
    const barra = within(pantalla).getByRole('toolbar', { name: 'Barra de edición' });
    expect(
      within(barra).getByText('Arrastra los widgets para moverlos o desde su esquina para cambiar su tamaño'),
    ).toBeTruthy();
    expect(within(barra).getByRole('button', { name: 'Guardar' })).toBeTruthy();
    expect(within(barra).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
    // ET02, ET03: los widgets activos en su posición y tamaño reales, con el borde de edición.
    const reloj = widget('Reloj');
    expect([reloj.style.left, reloj.style.top, reloj.style.width, reloj.style.height]).toEqual([
      '40px',
      '40px',
      '320px',
      '160px',
    ]);
    expect(reloj.classList.contains('wg-edicion__widget')).toBe(true);
    expect(widget('Tareas del día')).toBeTruthy();
  });

  it('HE-05-HU01-CA02 · Abrir la pantalla de edición sin widgets activos', async () => {
    const pantalla = await abrir(nucleo([]));
    // ET06: solo el wallpaper y la barra superior (D-159).
    expect(within(pantalla).queryAllByRole('region')).toEqual([]);
    expect(within(pantalla).getByRole('toolbar', { name: 'Barra de edición' })).toBeTruthy();
  });
});

describe('HE-05-HU02 · Mover un widget', () => {
  it('HE-05-HU02-CA01 · Mover un widget a una posición libre', async () => {
    const n = nucleo([RELOJ, TAREAS], {
      mover: ({ x, y }) => ({ rect: { ...RELOJ, x, y }, collided: false }),
    });
    await abrir(n);
    // ET01: se arrastra y se suelta; el Núcleo lo deja en memoria hasta «Guardar».
    await arrastrar(widget('Reloj'), 0, 500);
    await soltar(widget('Reloj'));
    expect(n.de('layout_edit_move')).toEqual([{ widget_id: 'reloj', x: 40, y: 540 }]);
    expect(widget('Reloj').style.top).toBe('540px');
    expect(n.de('layout_edit_save')).toEqual([]);
  });

  it('HE-05-HU02-ET01 · Un arrastre rápido no acumula llamadas al Núcleo', async () => {
    const n = nucleo([RELOJ, TAREAS], {
      mover: ({ x, y }) => ({ rect: { ...RELOJ, x, y }, collided: false }),
    });
    await abrir(n);
    const reloj = widget('Reloj');
    // Cinco movimientos seguidos mientras el Núcleo responde el primero: solo viajan el primero y el último.
    await act(async () => {
      fireEvent.pointerDown(reloj, { clientX: 100, clientY: 100, pointerId: 1 });
      for (const dy of [10, 20, 30, 40, 50]) {
        fireEvent.pointerMove(reloj, { clientX: 100, clientY: 100 + dy, pointerId: 1 });
      }
    });
    await soltar(reloj);
    expect(n.de('layout_edit_move')).toEqual([
      { widget_id: 'reloj', x: 40, y: 50 },
      { widget_id: 'reloj', x: 40, y: 90 },
    ]);
    expect(widget('Reloj').style.top).toBe('90px');
  });

  it('HE-05-HU02-CA02 · Mover un widget fuera del área visible', async () => {
    const n = nucleo([RELOJ], { mover: () => ({ rect: { ...RELOJ, x: 1600, y: 920 }, collided: false }) });
    await abrir(n);
    await arrastrar(widget('Reloj'), 3000, 3000);
    // ET02: queda ajustado al borde, como lo devuelve el Núcleo.
    expect([widget('Reloj').style.left, widget('Reloj').style.top]).toEqual(['1600px', '920px']);
  });

  it('HE-05-HU02-CA03 · Mover un widget sobre otro widget', async () => {
    const n = nucleo([RELOJ, TAREAS], { mover: () => ({ rect: RELOJ, collided: true }) });
    await abrir(n);
    await arrastrar(widget('Reloj'), 400, 0);
    // ET04: borde rojo en ambos mientras se superponen.
    expect(widget('Reloj').classList.contains('wg-edicion__widget--choque')).toBe(true);
    expect(widget('Tareas del día').classList.contains('wg-edicion__widget--choque')).toBe(true);
    await soltar(widget('Reloj'));
    // ET03: al soltar vuelve a su última posición libre, sin superponerse.
    expect(widget('Reloj').classList.contains('wg-edicion__widget--choque')).toBe(false);
    expect(widget('Reloj').style.left).toBe('40px');
  });

  it('HE-05-HU02-CA04 · Mover un widget fuera de la pantalla de edición', async () => {
    // ET05: en la capa del escritorio los widgets no se arrastran ni se mueven.
    const n = nucleo([RELOJ]);
    const escuchar = (() => () => {}) as unknown as Escuchar;
    render(<Capa invocar={n.invocar} escuchar={escuchar} />);
    const reloj = await screen.findByRole('region', { name: 'Reloj' });
    await arrastrar(reloj, 0, 500);
    expect(n.de('layout_edit_move')).toEqual([]);
    expect(reloj.style.top).toBe('40px');
  });
});

describe('HE-05-HU03 · Redimensionar un widget', () => {
  it('HE-05-HU03-CA01 · Redimensionar un widget desde su esquina', async () => {
    const n = nucleo([RELOJ], {
      redimensionar: ({ width, height }) => ({ rect: { ...RELOJ, width, height }, collided: false }),
    });
    await abrir(n);
    // ET01: desde la esquina inferior derecha.
    await arrastrar(esquina('reloj'), 80, 40);
    expect(n.de('layout_edit_resize')).toEqual([
      { widget_id: 'reloj', x: 40, y: 40, width: 400, height: 200 },
    ]);
    expect([widget('Reloj').style.width, widget('Reloj').style.height]).toEqual(['400px', '200px']);
    expect(n.de('layout_edit_move')).toEqual([]);
  });

  it('HE-05-HU03-CA02 · Tamaño mínimo', async () => {
    const n = nucleo([RELOJ], {
      redimensionar: () => ({ rect: { ...RELOJ, width: 100, height: 100 }, collided: false }),
    });
    await abrir(n);
    await arrastrar(esquina('reloj'), -300, -300);
    expect([widget('Reloj').style.width, widget('Reloj').style.height]).toEqual(['100px', '100px']); // ET02
  });

  it('HE-05-HU03-CA03 · Tamaño máximo', async () => {
    const n = nucleo([RELOJ], {
      redimensionar: () => ({ rect: { ...RELOJ, width: 1880, height: 1040 }, collided: false }),
    });
    await abrir(n);
    await arrastrar(esquina('reloj'), 5000, 5000);
    expect([widget('Reloj').style.width, widget('Reloj').style.height]).toEqual(['1880px', '1040px']); // ET03
  });

  it('HE-05-HU03-CA04 · Redimensionar hasta otro widget', async () => {
    const n = nucleo([RELOJ, TAREAS], {
      redimensionar: () => ({ rect: { ...RELOJ, width: 340 }, collided: true }),
    });
    await abrir(n);
    await arrastrar(esquina('reloj'), 200, 0);
    // ET04: se detiene en el borde del otro y marca la colisión en ambos.
    expect(widget('Reloj').style.width).toBe('340px');
    expect(widget('Reloj').classList.contains('wg-edicion__widget--choque')).toBe(true);
    expect(widget('Tareas del día').classList.contains('wg-edicion__widget--choque')).toBe(true);
  });

  it('HE-05-HU03-CA05 · Redimensionar un widget fuera de la pantalla de edición', async () => {
    // ET06: en la capa del escritorio los widgets no tienen esquina para redimensionar.
    const n = nucleo([RELOJ]);
    const escuchar = (() => () => {}) as unknown as Escuchar;
    render(<Capa invocar={n.invocar} escuchar={escuchar} />);
    const reloj = await screen.findByRole('region', { name: 'Reloj' });
    expect(reloj.querySelector('[data-esquina]')).toBeNull();
    expect(n.de('layout_edit_resize')).toEqual([]);
  });
});

describe('HE-05-HU04 · Guardar la distribución (pantalla de edición)', () => {
  it('HE-05-HU04-CA01 · «Guardar» pide guardar la distribución', async () => {
    const n = nucleo([RELOJ], { mover: ({ x, y }) => ({ rect: { ...RELOJ, x, y }, collided: false }) });
    await abrir(n);
    await arrastrar(widget('Reloj'), 0, 500);
    await soltar(widget('Reloj'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    // ET01, ET02: el Núcleo guarda en el tema aplicado y cierra la pantalla de edición.
    await waitFor(() => expect(n.de('layout_edit_save')).toEqual([{}]));
  });
});

describe('HE-05-HU02 a HU04 · Distribución a escala', () => {
  it('HE-05-HU02-CA05 · Mover un widget a escala', async () => {
    // ET07: a 125 %, las medidas son píxeles físicos y se dibujan divididas por la escala; el puntero se multiplica.
    const n = nucleo(
      [RELOJ, TAREAS],
      { mover: ({ x, y }) => ({ rect: { ...RELOJ, x, y }, collided: false }) },
      1.25,
    );
    await abrir(n);
    expect([widget('Reloj').style.left, widget('Reloj').style.width]).toEqual(['32px', '256px']);
    await arrastrar(widget('Reloj'), 0, 400);
    await soltar(widget('Reloj'));
    expect(n.de('layout_edit_move')).toEqual([{ widget_id: 'reloj', x: 40, y: 540 }]);
    expect(widget('Reloj').style.top).toBe('432px');
  });

  it('HE-05-HU03-CA06 · Redimensionar un widget a escala', async () => {
    const n = nucleo(
      [RELOJ],
      {
        // ET03: el Núcleo lo detiene en el borde del área visible del monitor principal.
        redimensionar: ({ width, height }) => ({
          rect: { ...RELOJ, width: Math.min(width, 1880), height: Math.min(height, 1040) },
          collided: false,
        }),
      },
      1.25,
    );
    await abrir(n);
    await arrastrar(esquina('reloj'), 80, 80);
    await soltar(esquina('reloj'));
    expect(n.de('layout_edit_resize')).toEqual([
      { widget_id: 'reloj', x: 40, y: 40, width: 420, height: 260 },
    ]);
    expect([widget('Reloj').style.width, widget('Reloj').style.height]).toEqual(['336px', '208px']);
  });

  it('HE-05-HU04-CA05 · Guardar justo después de varios cambios', async () => {
    const n = nucleo([RELOJ], { mover: ({ x, y }) => ({ rect: { ...RELOJ, x, y }, collided: false }) });
    // El Núcleo tarda en responder el movimiento: «Guardar» lo espera (ET05).
    let liberar: () => void = () => undefined;
    const orden: string[] = [];
    const invocar = ((comando: string, params: never) => {
      orden.push(comando);
      if (comando !== 'layout_edit_move') return n.invocar(comando as never, params);
      return new Promise((listo) => {
        liberar = () => listo(n.invocar(comando as never, params));
      });
    }) as unknown as Invoke;
    render(<Edicion invocar={invocar} />);
    await screen.findByRole('main', { name: 'Pantalla de edición' });
    await arrastrar(widget('Reloj'), 0, 500);
    await soltar(widget('Reloj'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(orden).not.toContain('layout_edit_save');
    await act(async () => {
      liberar();
    });
    await waitFor(() => expect(orden).toContain('layout_edit_save'));
    expect(orden.indexOf('layout_edit_move')).toBeLessThan(orden.indexOf('layout_edit_save'));
  });

  it('HE-05-HU04-ET06 · Un widget que ya no existe muestra su mensaje y no cierra la edición', async () => {
    const mensaje = 'Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.';
    const n = nucleo([RELOJ]);
    const invocar = ((comando: string, params: never) =>
      comando === 'layout_edit_move' || comando === 'layout_edit_save'
        ? Promise.resolve({ ok: false, error: { code: 'layout.widget_missing', message: mensaje } })
        : n.invocar(comando as never, params)) as unknown as Invoke;
    render(<Edicion invocar={invocar} />);
    await screen.findByRole('main', { name: 'Pantalla de edición' });
    await arrastrar(widget('Reloj'), 0, 500);
    await soltar(widget('Reloj'));
    expect(screen.getByRole('alert').textContent).toBe(mensaje);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    });
    expect(screen.getByRole('alert').textContent).toBe(mensaje);
    expect(screen.getByRole('main', { name: 'Pantalla de edición' })).toBeTruthy();
  });
});

describe('HE-05-HU05 · Cancelar los cambios de la distribución', () => {
  async function conCambios() {
    const n = nucleo([RELOJ], { mover: ({ x, y }) => ({ rect: { ...RELOJ, x, y }, collided: false }) });
    await abrir(n);
    await arrastrar(widget('Reloj'), 0, 500);
    await soltar(widget('Reloj'));
    return n;
  }

  it('HE-05-HU05-CA01 · Cancelar los cambios de la distribución con el botón', async () => {
    const n = await conCambios();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    // ET02, ET05: el mismo mensaje de confirmación que con Esc (D-204).
    const dialogo = await screen.findByRole('dialog');
    expect(
      within(dialogo).getByText('Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?'),
    ).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Salir sin guardar' })).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Seguir editando' })).toBeTruthy();
    expect(n.de('layout_edit_cancel')).toEqual([]);
  });

  it('HE-05-HU05-CA02 · Cancelar con la tecla Esc', async () => {
    await conCambios();
    fireEvent.keyDown(document, { key: 'Escape' });
    // ET01: con cambios sin guardar, Esc abre el mensaje de confirmación de salida.
    const dialogo = await screen.findByRole('dialog');
    expect(
      within(dialogo).getByText('Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?'),
    ).toBeTruthy();
  });

  it('HE-05-HU05-CA03 · Salir sin guardar', async () => {
    const n = await conCambios();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Salir sin guardar' }),
    );
    // ET03: el Núcleo devuelve cada widget a su posición y tamaño anteriores y vuelve a la pantalla Widgets.
    await waitFor(() => expect(n.de('layout_edit_cancel')).toEqual([{}]));
  });

  it('HE-05-HU05-CA04 · Seguir editando', async () => {
    const n = await conCambios();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Seguir editando' }),
    );
    // ET04: se cierra el mensaje y se conservan los cambios.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(n.de('layout_edit_cancel')).toEqual([]);
    expect(widget('Reloj').style.top).toBe('540px');
  });

  it('HE-05-HU05-CA05 · Cancelar sin haber hecho cambios', async () => {
    const n = nucleo([RELOJ]);
    await abrir(n);
    fireEvent.keyDown(document, { key: 'Escape' });
    // ET06: sin cambios, cierra sin mensaje (D-159).
    await waitFor(() => expect(n.de('layout_edit_cancel')).toEqual([{}]));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(n.de('layout_edit_cancel')).toHaveLength(2));
  });
});

describe('RT-01 · Pantalla de edición', () => {
  it('RT-01-CA12 · Pantalla de edición sin menú principal', async () => {
    const pantalla = await abrir(nucleo([RELOJ]));
    // ET08: ocupa todo el escritorio (ventana C-03) y no muestra el menú principal.
    expect(pantalla).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
  });
});

describe('HE-15-HU04 · Distribución desde otro computador', () => {
  it('HE-15-HU04-CA08 · la pantalla de edición conserva los cambios y avisa', async () => {
    const oyentes: Array<(c: unknown) => void> = [];
    const escuchar = ((evento: string, alRecibir: (c: unknown) => void) => {
      if (evento === 'layout_changed') oyentes.push(alRecibir);
      return () => undefined;
    }) as unknown as Escuchar;
    const n = nucleo([RELOJ]);
    const pantalla = await abrir(n, escuchar);
    // Un movimiento deja cambios sin guardar.
    await act(async () => {
      await n.invocar('layout_edit_move', { widget_id: RELOJ.widget_id, x: 100, y: 100 });
    });
    act(() => oyentes.forEach((o) => o({ theme_id: 't1', origin: 'remote' })));
    expect(
      await within(pantalla).findByText(
        'Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.',
      ),
    ).toBeTruthy();
  });
});
