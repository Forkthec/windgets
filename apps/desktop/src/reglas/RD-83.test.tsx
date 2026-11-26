// docs/rediseno.md RD-83: un error que llega sin texto (`internal.unexpected`) se ve en cada pantalla con el texto
// genérico, y una acción que falla nunca queda en silencio. Una prueba por pantalla; Personalización, Windi,
// Widgets y la pantalla de edición tienen la suya junto a sus pruebas.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Agenda } from '@/screens/agenda/Agenda';
import { Kanban } from '@/screens/kanban/Kanban';
import {
  abrirPantalla,
  fijarHoy,
  screen,
  tarjeta,
  type NucleoDelPlanificador,
} from '@/screens/kanban/pruebas';
import { Labels } from '@/screens/labels/Labels';
import { PlannerDaily } from '@/screens/planner_daily/PlannerDaily';
import { Reports } from '@/screens/reports/Reports';
import { Themes } from '@/screens/themes/Themes';
import { AgregarAnimacion } from '@/screens/widgets/AgregarAnimacion';
import { AgregarImagenEstatica } from '@/screens/widgets/AgregarImagenEstatica';
import { AgregarSinDatos } from '@/screens/widgets/AgregarSinDatos';
import { AgregarTexto } from '@/screens/widgets/AgregarTexto';
import type { CommandName } from '@/types';
import textos from '@/types/messages.es.json';

const GENERICO = textos.ERROR_INESPERADO;

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

/** El Núcleo falla en esos comandos sin texto, como `internal.unexpected`. */
function fallar(nucleo: NucleoDelPlanificador, ...comandos: CommandName[]) {
  for (const comando of comandos) {
    nucleo.responder(comando, () => ({ ok: false, error: { code: 'internal.unexpected', message: '' } }));
  }
}

async function pulsar(elemento: HTMLElement) {
  await act(async () => {
    fireEvent.click(elemento);
  });
}

/** El mensaje emergente de error con el texto genérico (RD-63: `role="alert"`). */
async function veElErrorGenerico() {
  await vi.waitFor(() => {
    const avisos = screen.getAllByRole('alert').map((a) => a.textContent);
    expect(avisos.join(' ')).toContain(GENERICO);
  });
}

const boton = (name: string) => screen.getByRole('button', { name });

describe('RD-83 · Errores sin texto, pantalla por pantalla', () => {
  it('RD-83 · Agenda diaria: «Quitar del horario»', async () => {
    const nucleo = await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Estudiar redes', scheduled_date: '2026-11-14', scheduled_hour: 16 }),
    ]);
    fallar(nucleo, 'card_unassign_time_block');
    await pulsar(boton('Quitar del horario'));
    await veElErrorGenerico();
  });

  it('RD-83 · Planificador diario: marcar una tarjeta', async () => {
    const nucleo = await abrirPantalla('planner_daily', 'Planificador diario', PlannerDaily, [
      tarjeta({ title: 'Pagar la luz', due_date: '2026-11-14' }),
    ]);
    fallar(nucleo, 'card_set_completed');
    await pulsar(await screen.findByRole('checkbox', { name: 'Pagar la luz' }));
    await veElErrorGenerico();
  });

  it('RD-83 · Tablero: «Mover a»', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Informe' })]);
    fallar(nucleo, 'card_move');
    await pulsar(await screen.findByRole('button', { name: 'Acciones de Informe' }));
    await pulsar(screen.getByRole('menuitem', { name: 'Mover a' }));
    await pulsar(screen.getByRole('menuitemradio', { name: 'Hecho' }));
    await veElErrorGenerico();
  });

  it('RD-83 · Formulario de columna: guardar', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
    fallar(nucleo, 'column_create');
    await pulsar(await screen.findByRole('button', { name: 'Nueva columna' }));
    const ventana = screen.getByRole('dialog');
    fireEvent.change(within(ventana).getByLabelText('Nombre'), { target: { value: 'Revisión' } });
    await pulsar(within(ventana).getByRole('button', { name: 'Guardar' }));
    await veElErrorGenerico();
    // La ventana sigue abierta con lo escrito.
    expect((within(ventana).getByLabelText('Nombre') as HTMLInputElement).value).toBe('Revisión');
  });

  it('RD-83 · Eliminar una tarjeta', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Informe' })]);
    fallar(nucleo, 'card_delete');
    await pulsar(await screen.findByRole('button', { name: 'Informe' }));
    await pulsar(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    await pulsar(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    await veElErrorGenerico();
  });

  it('RD-83 · Detalle de una tarjeta que no se puede leer', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Informe' })]);
    fallar(nucleo, 'card_get');
    await pulsar(await screen.findByRole('button', { name: 'Informe' }));
    await veElErrorGenerico();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('RD-83 · Formulario de tarjeta: guardar', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
    fallar(nucleo, 'card_create');
    await pulsar(await screen.findByRole('button', { name: 'Nueva tarjeta' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar pan' } });
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '20/11/2026' } });
    await pulsar(boton('Guardar'));
    await veElErrorGenerico();
    expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Comprar pan');
  });

  it('RD-83 · Etiquetas: eliminar', async () => {
    const nucleo = await abrirPantalla('labels', 'Etiquetas', Labels);
    fallar(nucleo, 'label_get_delete_info');
    await pulsar(await screen.findByRole('button', { name: 'Acciones de Casa' }));
    await pulsar(screen.getByRole('menuitem', { name: 'Eliminar' }));
    await veElErrorGenerico();
  });

  it('RD-83 · Formulario de etiqueta: guardar', async () => {
    const nucleo = await abrirPantalla('labels', 'Etiquetas', Labels);
    fallar(nucleo, 'label_create');
    await pulsar(await screen.findByRole('button', { name: 'Nueva etiqueta' }));
    const ventana = screen.getByRole('dialog');
    fireEvent.change(within(ventana).getByLabelText('Nombre'), { target: { value: 'Gimnasio' } });
    await pulsar(within(ventana).getByRole('radio', { name: 'Azul' }));
    await pulsar(within(ventana).getByRole('button', { name: 'Guardar' }));
    await veElErrorGenerico();
  });

  it('RD-83 · Temas: aplicar', async () => {
    const nucleo = await abrirPantalla('themes', 'Temas', Themes, [], (n) => {
      n.responder('theme_list', () => ({
        ok: true,
        value: [
          {
            id: 't2',
            name: 'Verano',
            last_modified_at: '2026-11-02T12:00:00.000Z',
            is_applied: false,
            has_unapplied_changes: false,
            has_unsaved_changes: false,
          },
        ],
      }));
    });
    fallar(nucleo, 'theme_apply');
    await pulsar(await screen.findByRole('button', { name: 'Aplicar' }));
    await pulsar(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aplicar' }));
    await veElErrorGenerico();
  });

  it('RD-83 · Reportes: elegir un rango', async () => {
    const nucleo = await abrirPantalla('reports', 'Reportes', Reports);
    const selector = (await screen.findByRole('combobox', { name: 'Rango de fechas' })) as HTMLSelectElement;
    fallar(nucleo, 'report_resolve_range');
    const otra = [...selector.options].find((o) => o.value !== selector.value && o.value !== 'custom');
    await act(async () => {
      fireEvent.change(selector, { target: { value: otra?.value } });
    });
    await veElErrorGenerico();
  });

  it('RD-83 · Agregar widget sin datos: «Agregar»', async () => {
    const nucleo = await abrirPantalla('widgets', 'Noticias', () => (
      <AgregarSinDatos
        tipo="news"
        nombre="Noticias"
        descripcion="Titulares"
        alRegresar={() => {}}
        alIrAWidgets={() => {}}
      />
    ));
    fallar(nucleo, 'widget_add');
    await pulsar(boton('Agregar'));
    expect(await screen.findByText(GENERICO)).toBeTruthy();
  });

  it('RD-83 · Agregar texto: «Agregar»', async () => {
    const nucleo = await abrirPantalla('widgets', 'Texto', () => (
      <AgregarTexto alRegresar={() => {}} alIrAWidgets={() => {}} />
    ));
    fallar(nucleo, 'widget_add');
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto' }), { target: { value: 'Hola' } });
    await pulsar(boton('Agregar'));
    expect(await screen.findByText(GENERICO)).toBeTruthy();
  });

  it('RD-83 · Agregar animación: la vista previa y «Agregar»', async () => {
    const nucleo = await abrirPantalla('widgets', 'Animación', () => (
      <AgregarAnimacion alRegresar={() => {}} alIrAWidgets={() => {}} />
    ));
    fallar(nucleo, 'asset_resolve', 'widget_add');
    // El catálogo de la semilla de prueba (cualquier lista con nombre sirve de animación).
    await pulsar(await screen.findByRole('button', { name: 'Azul' }));
    expect(await screen.findByText(GENERICO)).toBeTruthy();
    await pulsar(boton('Agregar'));
    expect(screen.getByText(GENERICO)).toBeTruthy();
  });

  it('RD-83 · Agregar imagen estática: el catálogo de imágenes', async () => {
    const nucleo = await abrirPantalla('widgets', 'Imagen estática', () => (
      <AgregarImagenEstatica alRegresar={() => {}} alIrAWidgets={() => {}} />
    ));
    fallar(nucleo, 'catalog_list');
    await pulsar(boton('Catálogo de imágenes'));
    expect(await screen.findByText(GENERICO)).toBeTruthy();
  });
});
