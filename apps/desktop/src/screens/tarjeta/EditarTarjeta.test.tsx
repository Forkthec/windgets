// HE-07-HU04 · Editar una tarjeta. Una prueba por CA en la vista; las reglas del Núcleo tienen su prueba
// ca_he_07_hu04_* en servicio_del_planificador/pruebas_de_edicion.rs.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CardUpdateParams } from '@/types';
import { Kanban } from '../kanban/Kanban';
import {
  abrirPantalla,
  fijarHoy,
  llamadasA,
  type NucleoDelPlanificador,
  screen,
  tarjeta,
} from '../kanban/pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const INFORME = {
  title: 'Informe',
  due_date: '2026-11-20',
  description: 'Borrador',
  priority: 'medium' as const,
};

/** Tablero con la tarjeta, su detalle abierto y «Editar» (ET01). */
async function abrirEdicion(datos: Parameters<typeof tarjeta>[0] = INFORME): Promise<NucleoDelPlanificador> {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta(datos)]);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: datos.title }));
  });
  await act(async () => {
    // «Editar» del Detalle de tarjeta (cada columna del tablero también tiene «Editar», HE-09-HU04).
    const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
    fireEvent.click(within(detalle).getByRole('button', { name: 'Editar' }));
  });
  screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
  return nucleo;
}

function escribir(etiqueta: string, valor: string) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
}

async function guardar() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  });
}

function textoDebajoDe(etiqueta: string) {
  const id = screen.getByLabelText(etiqueta).getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent : undefined;
}

/** El valor que muestra el detalle debajo del nombre del dato. */
function enDetalle(nombre: string) {
  const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
  return (within(detalle).getByText(nombre, { selector: 'dt' }).nextElementSibling as HTMLElement)
    .textContent;
}

/** No envía nada al Núcleo y deja el mensaje debajo del campo. */
async function rechaza(campo: string, valor: string, mensaje: string) {
  const nucleo = await abrirEdicion();
  escribir(campo, valor);
  await guardar();
  expect(textoDebajoDe(campo)).toBe(mensaje);
  expect(llamadasA(nucleo, 'card_update')).toHaveLength(0);
  expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBeTruthy();
}

describe('HE-07-HU04 · Editar una tarjeta', () => {
  it('HE-07-HU04-CA01 · Editar el título de una tarjeta', async () => {
    const nucleo = await abrirEdicion();
    // ET02: el formulario trae los datos actuales.
    expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Informe');
    expect((screen.getByLabelText('Fecha límite') as HTMLInputElement).value).toBe('20/11/2026');
    expect((screen.getByLabelText('Descripción') as HTMLTextAreaElement).value).toBe('Borrador');
    expect((screen.getByLabelText('Prioridad') as HTMLSelectElement).value).toBe('medium');
    escribir('Título', 'Informe final');
    await guardar();
    const [params] = llamadasA(nucleo, 'card_update') as CardUpdateParams[];
    expect(params?.patch.title).toBe('Informe final');
    // ET03: regresa al Detalle de tarjeta actualizado; ET14: «Tarjeta actualizada.».
    expect(enDetalle('Título')).toBe('Informe final');
    expect(screen.getByText('Tarjeta actualizada.')).toBeTruthy();
    // ET10: el tablero también muestra el cambio.
    expect(screen.getByRole('button', { name: 'Informe final', hidden: true })).toBeTruthy();
  });

  it('HE-07-HU04-CA02 · Cambiar la fecha límite de una tarjeta', async () => {
    const nucleo = await abrirEdicion();
    escribir('Fecha límite', '25/11/2026');
    await guardar();
    const [params] = llamadasA(nucleo, 'card_update') as CardUpdateParams[];
    expect(params?.patch.due_date).toBe('2026-11-25');
    expect(enDetalle('Fecha límite')).toBe('25/11/2026');
  });

  it('HE-07-HU04-CA03 · Editar una tarjeta vencida sin cambiar la fecha límite', async () => {
    const nucleo = await abrirEdicion({ ...INFORME, due_date: '2026-11-10', is_overdue: true });
    fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: 'low' } });
    await guardar();
    // ET08: la fecha de siempre no se compara con hoy.
    const [params] = llamadasA(nucleo, 'card_update') as CardUpdateParams[];
    expect(params?.patch).toMatchObject({ priority: 'low', due_date: '2026-11-10' });
    expect(screen.getByText('Tarjeta actualizada.')).toBeTruthy();
  });

  it('HE-07-HU04-CA04 · Rechazar un título vacío', async () => {
    await rechaza('Título', '', 'Este campo es obligatorio.');
  });

  it('HE-07-HU04-CA05 · Rechazar un título de más de 100 caracteres', async () => {
    await rechaza('Título', 't'.repeat(101), 'El título no puede superar los 100 caracteres.');
  });

  it('HE-07-HU04-CA06 · Rechazar una fecha límite vacía', async () => {
    await rechaza('Fecha límite', '', 'Este campo es obligatorio.');
  });

  it('HE-07-HU04-CA07 · Rechazar una nueva fecha límite anterior a hoy', async () => {
    await rechaza('Fecha límite', '13/11/2026', 'La fecha límite no puede ser anterior a hoy.');
  });

  it('HE-07-HU04-CA08 · Rechazar una descripción de más de 1000 caracteres', async () => {
    await rechaza('Descripción', 'd'.repeat(1001), 'La descripción no puede superar los 1000 caracteres.');
  });

  it('HE-07-HU04-CA09 · Cancelar la edición de la tarjeta', async () => {
    const nucleo = await abrirEdicion();
    escribir('Título', 'Otro título');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    });
    expect(llamadasA(nucleo, 'card_update')).toHaveLength(0);
    expect(enDetalle('Título')).toBe('Informe');
  });

  it('HE-07-HU04-CA10 · Cambiar la fecha límite a un día anterior al bloque horario', async () => {
    const nucleo = await abrirEdicion({ ...INFORME, scheduled_date: '2026-11-18', scheduled_hour: 9 });
    nucleo.responder('card_update', ({ id }) => {
      const t = nucleo.tarjetas.find((c) => c.id === id);
      if (!t) throw new Error('sin tarjeta');
      Object.assign(t, { due_date: '2026-11-16', scheduled_date: null, scheduled_hour: null });
      return {
        ok: true,
        value: t,
        result_message: {
          code: 'card_update',
          message:
            'Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.',
        },
      };
    });
    escribir('Fecha límite', '16/11/2026');
    await guardar();
    expect(
      screen.getByText(
        'Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.',
      ),
    ).toBeTruthy();
    const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
    expect(within(detalle).queryByText('Bloque horario')).toBeNull();
  });

  it('HE-07-HU04-CA11 · Editar una tarjeta eliminada en otro computador', async () => {
    const nucleo = await abrirEdicion();
    nucleo.tarjetas.length = 0; // la eliminó otro computador
    escribir('Título', 'Otro título');
    await guardar();
    // ET20, ET21: no guarda, cierra el formulario, la tarjeta sale del tablero y se ve el mensaje.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Informe' })).toBeNull();
    expect(screen.getByText('Esta tarjeta ya no existe.')).toBeTruthy();
  });
});
