// HE-07-HU01 · Crear una tarjeta de tipo Tarea, Recordatorio o Evento. Una prueba por CA (criterio de
// aceptación) en la vista; las reglas del Núcleo tienen su prueba ca_he_07_hu01_* en servicio_del_planificador.rs.
import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kanban } from '../kanban/Kanban';
import { abrirPantalla, fijarHoy, llamadasA, type NucleoDelPlanificador } from '../kanban/pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

/** En el Tablero Kanban con el Formulario de tarjeta abierto con «Nueva tarjeta» (ET25). */
async function abrirFormulario(): Promise<NucleoDelPlanificador> {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
  fireEvent.click(screen.getByRole('button', { name: 'Nueva tarjeta' }));
  screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
  await act(async () => {}); // label_list
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

/** Texto del mensaje de campo que quedó debajo del campo (RT-04). */
function textoDebajoDe(etiqueta: string) {
  const id = screen.getByLabelText(etiqueta).getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent : undefined;
}

/** No envía nada al Núcleo, deja el formulario abierto y muestra los mensajes debajo de cada campo. */
async function rechaza(valores: Record<string, string>, mensajes: Record<string, string>) {
  const nucleo = await abrirFormulario();
  for (const [etiqueta, valor] of Object.entries(valores)) escribir(etiqueta, valor);
  await guardar();
  for (const [etiqueta, texto] of Object.entries(mensajes)) expect(textoDebajoDe(etiqueta)).toBe(texto);
  expect(llamadasA(nucleo, 'card_create')).toHaveLength(0);
  expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBeTruthy();
}

describe('HE-07-HU01 · Crear una tarjeta', () => {
  it('HE-07-HU01-CA01 · Crear una tarjeta con los campos obligatorios', async () => {
    const nucleo = await abrirFormulario();
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    // ET02, ET03, ET25, ET27: los seis campos, «Guardar» y «Cancelar»; Tipo en «Tarea» y lo demás vacío.
    const tipo = within(formulario).getByLabelText('Tipo') as HTMLSelectElement;
    expect(tipo.selectedOptions[0]?.textContent).toBe('Tarea');
    for (const etiqueta of ['Título', 'Fecha límite', 'Descripción']) {
      expect((within(formulario).getByLabelText(etiqueta) as HTMLInputElement).value).toBe('');
    }
    expect((within(formulario).getByLabelText('Prioridad') as HTMLSelectElement).value).toBe('');
    expect(within(formulario).getByRole('group', { name: 'Etiquetas' })).toBeTruthy();
    expect(within(formulario).getByRole('group', { name: 'Selector de fecha' })).toBeTruthy(); // ET04
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();

    escribir('Título', 'Entregar informe');
    escribir('Fecha límite', '14/11/2026');
    await guardar();

    expect(llamadasA(nucleo, 'card_create')).toEqual([
      { type: 'task', title: 'Entregar informe', due_date: '2026-11-14' },
    ]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Tarjeta creada.')).toBeTruthy(); // ET16
    // ET13, ET14: la tarjeta queda al final de Por hacer, en el tablero.
    const porHacer = screen.getByRole('region', { name: 'Por hacer' });
    expect(within(porHacer).getByText('Entregar informe')).toBeTruthy();
  });

  it('HE-07-HU01-CA02 · Crear una tarjeta con todos los campos', async () => {
    const nucleo = await abrirFormulario();
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'event' } });
    escribir('Título', 'Feria');
    escribir('Fecha límite', '20/11/2026');
    escribir('Descripción', 'Stand 4');
    fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: 'high' } });
    fireEvent.click(screen.getByLabelText('Casa'));
    await guardar();
    expect(llamadasA(nucleo, 'card_create')).toEqual([
      {
        type: 'event',
        title: 'Feria',
        due_date: '2026-11-20',
        description: 'Stand 4',
        priority: 'high',
        label_ids: ['e2'],
      },
    ]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Tarjeta creada.')).toBeTruthy();
  });

  it('HE-07-HU01-CA03 · Crear una tarjeta de tipo Recordatorio o Evento', async () => {
    await abrirFormulario();
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    const opciones = within(within(formulario).getByLabelText('Tipo'))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(opciones).toEqual(['Tarea', 'Recordatorio', 'Evento']);
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'reminder' } });
    escribir('Título', 'Llamar');
    escribir('Fecha límite', '15/11/2026');
    await guardar();
    expect(screen.queryByRole('dialog')).toBeNull();
    // ET15: la tarjeta muestra el nombre de su tipo.
    const porHacer = screen.getByRole('region', { name: 'Por hacer' });
    const enTablero = within(porHacer).getByText('Llamar').closest('li') as HTMLElement;
    expect(within(enTablero).getByText('Recordatorio')).toBeTruthy();
  });

  it('HE-07-HU01-CA04 · Rechazar el formulario sin datos', async () => {
    await rechaza({}, { Título: 'Este campo es obligatorio.', 'Fecha límite': 'Este campo es obligatorio.' });
    // RT-04: el cursor va al primer campo con error.
    expect(document.activeElement).toBe(screen.getByLabelText('Título'));
  });

  it('HE-07-HU01-CA05 · Rechazar un título vacío o formado solo por espacios', async () => {
    await rechaza({ Título: '    ', 'Fecha límite': '14/11/2026' }, { Título: 'Este campo es obligatorio.' });
  });

  it('HE-07-HU01-CA06 · Rechazar un título de más de 100 caracteres', async () => {
    await rechaza(
      { Título: 't'.repeat(101), 'Fecha límite': '14/11/2026' },
      { Título: 'El título no puede superar los 100 caracteres.' },
    );
  });

  it('HE-07-HU01-CA07 · Rechazar una tarjeta sin fecha límite', async () => {
    await rechaza({ Título: 'Informe' }, { 'Fecha límite': 'Este campo es obligatorio.' });
  });

  it.each(['31/02/2026', '2026-11-20', '1/11/2026'])(
    'HE-07-HU01-CA08 · Rechazar una fecha límite inválida (%s)',
    async (fecha) => {
      await rechaza(
        { Título: 'Informe', 'Fecha límite': fecha },
        { 'Fecha límite': 'Diligencia una fecha válida.' },
      );
    },
  );

  it('HE-07-HU01-CA09 · Rechazar una fecha límite anterior a hoy', async () => {
    await rechaza(
      { Título: 'Informe', 'Fecha límite': '13/11/2026' },
      { 'Fecha límite': 'La fecha límite no puede ser anterior a hoy.' },
    );
  });

  it('HE-07-HU01-CA10 · Rechazar una descripción de más de 1000 caracteres', async () => {
    await rechaza(
      { Título: 'Informe', 'Fecha límite': '14/11/2026', Descripción: 'd'.repeat(1001) },
      { Descripción: 'La descripción no puede superar los 1000 caracteres.' },
    );
  });

  it('HE-07-HU01-CA11 · Cancelar la creación de la tarjeta', async () => {
    const nucleo = await abrirFormulario();
    escribir('Título', 'A medias');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    expect(llamadasA(nucleo, 'card_create')).toHaveLength(0);
  });

  it('HE-07-HU01-CA12 · Crear una tarjeta sin conexión', async () => {
    // Sin conexión el formulario no cambia: el Núcleo guarda la tarjeta en el computador (ET24).
    const nucleo = await abrirFormulario();
    escribir('Título', 'Sin red');
    escribir('Fecha límite', '15/11/2026');
    await guardar();
    expect(llamadasA(nucleo, 'card_create')).toHaveLength(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Tarjeta creada.')).toBeTruthy();
  });

  it('muestra debajo del campo el error que devuelve el Núcleo', async () => {
    const nucleo = await abrirFormulario();
    nucleo.responder('card_create', () => ({
      ok: false,
      error: {
        code: 'due_date.in_past',
        message: 'La fecha límite no puede ser anterior a hoy.',
        field: 'due_date',
      },
    }));
    escribir('Título', 'Informe');
    escribir('Fecha límite', '14/11/2026');
    await guardar();
    expect(textoDebajoDe('Fecha límite')).toBe('La fecha límite no puede ser anterior a hoy.');
    expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBeTruthy();
  });

  it('el selector de fecha escribe la fecha elegida en DD/MM/AAAA (ET27)', async () => {
    await abrirFormulario();
    const selector = screen.getByRole('group', { name: 'Selector de fecha' });
    fireEvent.click(within(selector).getByRole('button', { name: /20 de noviembre/ }));
    expect((screen.getByLabelText('Fecha límite') as HTMLInputElement).value).toBe('20/11/2026');
  });
});
