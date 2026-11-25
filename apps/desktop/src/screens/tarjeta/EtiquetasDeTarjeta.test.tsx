// HE-07-HU02 · Asignar etiquetas a una tarjeta. Una prueba por CA en la vista; el Núcleo valida `labels.too_many`
// y `labels.not_found` (pruebas ca_he_07_hu01_* y ca_he_07_hu02_* en servicio_del_planificador).
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Label } from '@/types';
import { Kanban } from '../kanban/Kanban';
import { abrirPantalla, fijarHoy, llamadasA, type NucleoDelPlanificador, tarjeta } from '../kanban/pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

function etiqueta(name: string, i: number): Label {
  return { id: `x${i}`, name, color_id: 'blue', color_hex: '#2196F3', card_count: 0 };
}

/** Tablero Kanban con el Formulario de tarjeta abierto y las etiquetas indicadas (en el orden del Núcleo). */
async function abrirFormulario(etiquetas: Label[]) {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
  nucleo.etiquetas.splice(0, nucleo.etiquetas.length, ...etiquetas);
  fireEvent.click(screen.getByRole('button', { name: 'Nueva tarjeta' }));
  const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
  await act(async () => {}); // label_list
  return { nucleo, formulario };
}

/** Selecciona el campo Etiquetas: abre la lista desplegable (ET01). */
function abrirCampo(formulario: HTMLElement) {
  fireEvent.click(within(formulario).getByRole('button', { name: 'Etiquetas asignadas' }));
}

function escribir(formulario: HTMLElement, campo: string, valor: string) {
  fireEvent.change(within(formulario).getByLabelText(campo), { target: { value: valor } });
}

describe('HE-07-HU02 · Asignar etiquetas a una tarjeta', () => {
  it('HE-07-HU02-CA01 · Asignar etiquetas a la tarjeta', async () => {
    const { nucleo, formulario } = await abrirFormulario([etiqueta('Casa', 1), etiqueta('Estudio', 2)]);
    escribir(formulario, 'Título', 'Repasar');
    escribir(formulario, 'Fecha límite', '20/11/2026');
    abrirCampo(formulario);
    fireEvent.click(within(formulario).getByLabelText('Estudio'));
    // El campo muestra la etiqueta asignada.
    expect(within(formulario).getByRole('button', { name: 'Etiquetas asignadas' }).textContent).toBe(
      'Estudio',
    );
    await act(async () => {
      fireEvent.click(within(formulario).getByRole('button', { name: 'Guardar' }));
    });
    // ET05: se conserva en la tarjeta al guardar.
    expect(llamadasA(nucleo, 'card_create')).toEqual([
      expect.objectContaining({ title: 'Repasar', label_ids: ['x2'] }),
    ]);
  });

  // RD-96: el máximo por tarjeta es 3.
  it('HE-07-HU02-CA02 · Asignar más de 3 etiquetas', async () => {
    const nombres = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const { formulario } = await abrirFormulario(nombres.map(etiqueta));
    abrirCampo(formulario);
    for (const n of nombres.slice(0, 3)) fireEvent.click(within(formulario).getByLabelText(n));
    // ET06: las demás, deshabilitadas con el texto.
    for (const n of ['D', 'E', 'F', 'G']) {
      expect((within(formulario).getByLabelText(n) as HTMLInputElement).disabled).toBe(true);
    }
    expect((within(formulario).getByLabelText('A') as HTMLInputElement).disabled).toBe(false);
    expect(within(formulario).getByText('Puedes asignar hasta 3 etiquetas.')).toBeTruthy();
  });

  it('HE-07-HU02-CA03 · Consultar el campo Etiquetas sin etiquetas creadas', async () => {
    const { formulario } = await abrirFormulario([]);
    abrirCampo(formulario);
    // ET07
    expect(within(formulario).getByText('Aún no tienes etiquetas.')).toBeTruthy();
    expect(within(formulario).getByRole('button', { name: 'Nueva etiqueta' })).toBeTruthy();
  });

  it('HE-07-HU02-CA04 · Crear una etiqueta desde el campo Etiquetas', async () => {
    const { formulario } = await abrirFormulario([]);
    escribir(formulario, 'Título', 'Repasar');
    escribir(formulario, 'Descripción', 'Capítulo 3');
    abrirCampo(formulario);
    // ET08: el Formulario de etiqueta se abre sobre el Formulario de tarjeta.
    fireEvent.click(within(formulario).getByRole('button', { name: 'Nueva etiqueta' }));
    let etiquetaNueva = await screen.findByRole('dialog', { name: 'Nueva etiqueta' });
    // ET09: al cancelar, regresa con los datos.
    fireEvent.click(within(etiquetaNueva).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull());
    expect((within(formulario).getByLabelText('Título') as HTMLInputElement).value).toBe('Repasar');
    // ET09: al guardar, regresa con los datos y la etiqueta nueva queda en el campo.
    fireEvent.click(within(formulario).getByRole('button', { name: 'Nueva etiqueta' }));
    etiquetaNueva = await screen.findByRole('dialog', { name: 'Nueva etiqueta' });
    fireEvent.change(within(etiquetaNueva).getByLabelText('Nombre'), { target: { value: 'Estudio' } });
    fireEvent.click(await within(etiquetaNueva).findByRole('radio', { name: 'Azul' }));
    fireEvent.click(within(etiquetaNueva).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull());
    expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBe(formulario);
    expect((within(formulario).getByLabelText('Título') as HTMLInputElement).value).toBe('Repasar');
    expect((within(formulario).getByLabelText('Descripción') as HTMLInputElement).value).toBe('Capítulo 3');
    expect(await within(formulario).findByLabelText('Estudio')).toBeTruthy();
  });

  it('HE-07-HU02-CA05 · Consultar el campo Etiquetas en orden alfabético', async () => {
    const { formulario } = await abrirFormulario([
      etiqueta('casa', 1),
      etiqueta('Estudio', 2),
      etiqueta('Trabajo', 3),
    ]);
    abrirCampo(formulario);
    // ET10: el orden del Núcleo, de la A a la Z.
    const lista = within(formulario).getByRole('list', { name: 'Lista de etiquetas' });
    expect(
      within(lista)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['casa', 'Estudio', 'Trabajo']);
  });
});

describe('RD-92 · Una etiqueta elegida ya no existe', () => {
  const YA_NO_EXISTE = 'Esta etiqueta ya no existe.';
  const CASA = etiqueta('Casa', 1);
  const ESTUDIO = etiqueta('Estudio', 2);

  /** El Núcleo rechaza el guardado porque «Casa» se eliminó en otro computador. */
  function eliminarCasaAlGuardar(nucleo: NucleoDelPlanificador, comando: 'card_create' | 'card_update') {
    nucleo.responder(comando, () => {
      nucleo.etiquetas.splice(0, nucleo.etiquetas.length, ESTUDIO);
      return { ok: false, error: { code: 'labels.not_found', message: YA_NO_EXISTE, field: 'label_ids' } };
    });
  }

  const campo = (f: HTMLElement) => within(f).getByRole('button', { name: 'Etiquetas asignadas' });

  async function guardar(f: HTMLElement) {
    await act(async () => {
      fireEvent.click(within(f).getByRole('button', { name: 'Guardar' }));
    });
  }

  /** Formulario en creación con «Casa» y «Estudio» elegidas, listo para guardar. */
  async function abrirConDosElegidas() {
    const { nucleo, formulario } = await abrirFormulario([CASA, ESTUDIO]);
    escribir(formulario, 'Título', 'Repasar');
    escribir(formulario, 'Fecha límite', '20/11/2026');
    abrirCampo(formulario);
    fireEvent.click(within(formulario).getByLabelText('Casa'));
    fireEvent.click(within(formulario).getByLabelText('Estudio'));
    return { nucleo, formulario };
  }

  /** El mensaje queda en el campo Etiquetas, con el foco, y «Casa» sale de la lista y de la selección. */
  function loDiceEnElCampoYQuitaCasa(formulario: HTMLElement) {
    expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBe(formulario);
    const aviso = within(formulario).getByText(YA_NO_EXISTE);
    expect(campo(formulario).getAttribute('aria-describedby')).toBe(aviso.id);
    expect(campo(formulario).getAttribute('aria-invalid')).toBe('true');
    const grupo = within(formulario).getByRole('group', { name: 'Etiquetas' });
    expect(grupo.getAttribute('aria-describedby')).toBe(aviso.id);
    expect(document.activeElement).toBe(campo(formulario));
    expect(campo(formulario).textContent).toBe('Estudio');
    expect(within(formulario).queryByLabelText('Casa')).toBeNull();
    // Solo en el campo: sin mensaje emergente.
    expect(screen.queryByRole('alert')).toBeNull();
  }

  it('RD-92 · al crear, lo dice en el campo Etiquetas, vuelve a leer y quita la elegida', async () => {
    const { nucleo, formulario } = await abrirConDosElegidas();
    eliminarCasaAlGuardar(nucleo, 'card_create');
    const lecturas = llamadasA(nucleo, 'label_list').length;
    await guardar(formulario);
    loDiceEnElCampoYQuitaCasa(formulario);
    expect(llamadasA(nucleo, 'label_list').length).toBeGreaterThan(lecturas);
    // Al volver a guardar ya no se envía la eliminada.
    await guardar(formulario);
    expect(llamadasA(nucleo, 'card_create')).toEqual([
      expect.objectContaining({ label_ids: ['x1', 'x2'] }),
      expect.objectContaining({ label_ids: ['x2'] }),
    ]);
  });

  it('RD-92 · al editar, lo dice en el campo Etiquetas, vuelve a leer y quita la elegida', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ id: 't-rd92', title: 'Informe', label_ids: ['x1', 'x2'] }),
    ]);
    nucleo.etiquetas.splice(0, nucleo.etiquetas.length, CASA, ESTUDIO);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Informe' }));
    });
    await act(async () => {
      const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
      fireEvent.click(within(detalle).getByRole('button', { name: 'Editar' }));
    });
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    abrirCampo(formulario);
    eliminarCasaAlGuardar(nucleo, 'card_update');
    const lecturas = llamadasA(nucleo, 'label_list').length;
    await guardar(formulario);
    loDiceEnElCampoYQuitaCasa(formulario);
    expect(llamadasA(nucleo, 'label_list').length).toBeGreaterThan(lecturas);
    await guardar(formulario);
    expect(llamadasA(nucleo, 'card_update')).toEqual([
      { id: 't-rd92', patch: expect.objectContaining({ label_ids: ['x1', 'x2'] }) },
      { id: 't-rd92', patch: expect.objectContaining({ label_ids: ['x2'] }) },
    ]);
  });

  it('RD-92 · el mensaje se quita al cambiar las etiquetas elegidas', async () => {
    const { nucleo, formulario } = await abrirConDosElegidas();
    eliminarCasaAlGuardar(nucleo, 'card_create');
    await guardar(formulario);
    fireEvent.click(within(formulario).getByLabelText('Estudio'));
    expect(within(formulario).queryByText(YA_NO_EXISTE)).toBeNull();
    expect(campo(formulario).getAttribute('aria-invalid')).toBeNull();
    expect(campo(formulario).getAttribute('aria-describedby')).toBeNull();
  });

  it('RD-92 · el mensaje se quita al volver a guardar, aunque falte otro dato', async () => {
    const { nucleo, formulario } = await abrirConDosElegidas();
    eliminarCasaAlGuardar(nucleo, 'card_create');
    await guardar(formulario);
    escribir(formulario, 'Título', '');
    await guardar(formulario);
    expect(within(formulario).queryByText(YA_NO_EXISTE)).toBeNull();
    expect(llamadasA(nucleo, 'card_create')).toHaveLength(1);
  });

  it('RD-92 · si la lista no se puede volver a leer, conserva lo elegido y el mensaje', async () => {
    const { nucleo, formulario } = await abrirConDosElegidas();
    eliminarCasaAlGuardar(nucleo, 'card_create');
    nucleo.responder('label_list', () => ({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    }));
    await guardar(formulario);
    expect(within(formulario).getByText(YA_NO_EXISTE)).toBeTruthy();
    expect(campo(formulario).textContent).toBe('CasaEstudio');
  });
});

describe('RD-96 · Una tarjeta llega con más etiquetas que el máximo', () => {
  const MAXIMO = 'Puedes asignar hasta 3 etiquetas.';
  const IDS = ['x1', 'x2', 'x3', 'x4'];

  it('RD-96 · al guardar lo dice en el campo Etiquetas y se puede desmarcar una', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ id: 't-rd96', title: 'Informe', label_ids: IDS }),
    ]);
    nucleo.etiquetas.splice(
      0,
      nucleo.etiquetas.length,
      ...['A', 'B', 'C', 'D'].map((n, i) => etiqueta(n, i + 1)),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Informe' }));
    });
    await act(async () => {
      const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
      fireEvent.click(within(detalle).getByRole('button', { name: 'Editar' }));
    });
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    const campo = within(formulario).getByRole('button', { name: 'Etiquetas asignadas' });
    const guardar = () =>
      act(async () => {
        fireEvent.click(within(formulario).getByRole('button', { name: 'Guardar' }));
      });
    nucleo.responder('card_update', () => ({
      ok: false,
      error: { code: 'labels.too_many', message: MAXIMO, field: 'label_ids' },
    }));

    await guardar();
    // En el campo, con el foco y sin mensaje emergente.
    const aviso = document.getElementById(campo.getAttribute('aria-describedby') ?? '');
    expect(aviso?.textContent).toBe(MAXIMO);
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(campo);
    expect(screen.queryByRole('alert')).toBeNull();

    abrirCampo(formulario);
    for (const n of ['A', 'B', 'C', 'D']) {
      const casilla = within(formulario).getByLabelText(n) as HTMLInputElement;
      expect([casilla.checked, casilla.disabled]).toEqual([true, false]);
    }
    fireEvent.click(within(formulario).getByLabelText('D'));
    expect(campo.getAttribute('aria-invalid')).toBeNull();
    await guardar();
    expect(llamadasA(nucleo, 'card_update')).toEqual([
      { id: 't-rd96', patch: expect.objectContaining({ label_ids: IDS }) },
      { id: 't-rd96', patch: expect.objectContaining({ label_ids: IDS.slice(0, 3) }) },
    ]);
  });
});
