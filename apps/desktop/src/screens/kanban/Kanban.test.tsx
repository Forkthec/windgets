// HE-07-HU01 · Crear una tarjeta de tipo Tarea, Recordatorio o Evento. Una prueba por CA (criterio de
// aceptación) en la vista; las reglas del Núcleo tienen su prueba ca_he_07_hu01_* en servicio_del_planificador.rs.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { Card, CardCreateParams, Invoke, Label, Result } from '@/types';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';
import { Kanban } from './Kanban';

const ETIQUETAS: Label[] = [
  { id: 'e1', name: 'Estudio', color_id: 'blue', color_hex: '#2196F3', card_count: 0 },
  { id: 'e2', name: 'Casa', color_id: 'green', color_hex: '#4CAF50', card_count: 0 },
];

function tarjeta(p: CardCreateParams): Card {
  return {
    id: 'c1',
    type: p.type ?? 'task',
    title: p.title,
    description: p.description ?? null,
    priority: p.priority ?? null,
    due_date: p.due_date,
    column_id: 'todo',
    position: 1024,
    previous_column_id: null,
    completed_on: null,
    scheduled_date: null,
    scheduled_hour: null,
    label_ids: p.label_ids ?? [],
    is_completed: false,
    is_overdue: false,
    created_at: '2026-11-14T12:00:00.000Z',
  };
}

let creaciones: CardCreateParams[];
let respuestaDeCrear: (p: CardCreateParams) => Result<Card>;

const invocar = ((comando: string, params: unknown) => {
  switch (comando) {
    case 'auth_get_session':
      return Promise.resolve({ ok: true, value: { state: 'signed_in', alias: 'Prueba', token: 'valid' } });
    case 'label_list':
      return Promise.resolve({ ok: true, value: ETIQUETAS });
    case 'card_create':
      creaciones.push(params as CardCreateParams);
      return Promise.resolve(respuestaDeCrear(params as CardCreateParams));
    default:
      return Promise.resolve({ ok: false, error: { code: 'internal.unexpected', message: '' } });
  }
}) as unknown as Invoke;
const escuchar = (() => () => {}) as unknown as Escuchar;

beforeEach(() => {
  // Hoy es el sábado 14/11/2026 en el computador.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 14, 12, 0, 0));
  creaciones = [];
  respuestaDeCrear = (p) => ({
    ok: true,
    value: tarjeta(p),
    result_message: { code: 'card_create', message: 'Tarjeta creada.' },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Ventana principal con sesión iniciada, en Menú principal > Planificador > Tablero Kanban. */
async function abrirFormulario() {
  render(<VentanaPrincipal invocar={invocar} escuchar={escuchar} pantallas={{ kanban: Kanban }} />);
  const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
  fireEvent.click(within(menu).getByRole('button', { name: 'Tablero Kanban' }));
  await screen.findByRole('main', { name: 'Tablero Kanban' });
  fireEvent.click(screen.getByRole('button', { name: 'Nueva tarjeta' }));
  const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
  await act(async () => {}); // label_list
  return formulario;
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
  await abrirFormulario();
  for (const [etiqueta, valor] of Object.entries(valores)) escribir(etiqueta, valor);
  await guardar();
  for (const [etiqueta, texto] of Object.entries(mensajes)) expect(textoDebajoDe(etiqueta)).toBe(texto);
  expect(creaciones).toHaveLength(0);
  expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBeTruthy();
}

describe('HE-07-HU01 · Crear una tarjeta', () => {
  it('HE-07-HU01-CA01 · Crear una tarjeta con los campos obligatorios', async () => {
    const formulario = await abrirFormulario();
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

    expect(creaciones).toEqual([{ type: 'task', title: 'Entregar informe', due_date: '2026-11-14' }]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    expect(screen.getByText('Tarjeta creada.')).toBeTruthy(); // ET16
  });

  it('HE-07-HU01-CA02 · Crear una tarjeta con todos los campos', async () => {
    await abrirFormulario();
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'event' } });
    escribir('Título', 'Feria');
    escribir('Fecha límite', '20/11/2026');
    escribir('Descripción', 'Stand 4');
    fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: 'high' } });
    fireEvent.click(screen.getByLabelText('Casa'));
    await guardar();
    expect(creaciones).toEqual([
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
    const formulario = await abrirFormulario();
    const opciones = within(formulario)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(opciones.slice(0, 3)).toEqual(['Tarea', 'Recordatorio', 'Evento']);
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'reminder' } });
    escribir('Título', 'Llamar');
    escribir('Fecha límite', '15/11/2026');
    await guardar();
    expect(creaciones[0]?.type).toBe('reminder');
    expect(screen.queryByRole('dialog')).toBeNull();
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
    await abrirFormulario();
    escribir('Título', 'A medias');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    expect(creaciones).toHaveLength(0);
  });

  it('HE-07-HU01-CA12 · Crear una tarjeta sin conexión', async () => {
    // Sin conexión el formulario no cambia: el Núcleo guarda la tarjeta en el computador (ET24).
    await abrirFormulario();
    escribir('Título', 'Sin red');
    escribir('Fecha límite', '15/11/2026');
    await guardar();
    expect(creaciones).toHaveLength(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Tarjeta creada.')).toBeTruthy();
  });

  it('muestra debajo del campo el error que devuelve el Núcleo', async () => {
    respuestaDeCrear = () => ({
      ok: false,
      error: {
        code: 'due_date.in_past',
        message: 'La fecha límite no puede ser anterior a hoy.',
        field: 'due_date',
      },
    });
    await abrirFormulario();
    escribir('Título', 'Informe');
    escribir('Fecha límite', '14/11/2026');
    await guardar();
    expect(textoDebajoDe('Fecha límite')).toBe('La fecha límite no puede ser anterior a hoy.');
    expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBeTruthy();
  });

  it('el selector de fecha escribe la fecha elegida en DD/MM/AAAA (ET27)', async () => {
    const formulario = await abrirFormulario();
    const selector = within(formulario).getByRole('group', { name: 'Selector de fecha' });
    fireEvent.click(within(selector).getByRole('button', { name: /20 de noviembre/ }));
    expect((screen.getByLabelText('Fecha límite') as HTMLInputElement).value).toBe('20/11/2026');
  });
});
