// HE-13-HU01 · Seleccionar el rango de fechas de los reportes. Una prueba por CA en la vista; las reglas del
// Núcleo tienen su prueba ca_he_13_hu01_* en servicio_del_planificador/reportes.rs.
import { fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirPantalla, fijarHoy, llamadasA, screen } from '../kanban/pruebas';
import { Reports } from './Reports';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

async function abrir() {
  const nucleo = await abrirPantalla('reports', 'Reportes', Reports);
  return nucleo;
}

function elegir(texto: string) {
  const selector = screen.getByRole('combobox', { name: 'Rango de fechas' }) as HTMLSelectElement;
  const opcion = [...selector.options].find((o) => o.textContent === texto);
  fireEvent.change(selector, { target: { value: opcion?.value } });
}

function escribir(campo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(campo), { target: { value: valor } });
}

function mensajeDe(campo: string) {
  return screen.getByLabelText(campo).closest('.wg-campo')?.querySelector('.wg-campo__mensaje')?.textContent;
}

async function personalizado(inicio: string, fin: string) {
  elegir('Personalizado');
  escribir('Fecha de inicio', inicio);
  escribir('Fecha de fin', fin);
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
}

/** Rangos pedidos al Núcleo después del de apertura. */
function pedidos(nucleo: Awaited<ReturnType<typeof abrir>>) {
  return llamadasA(nucleo, 'report_resolve_range').slice(1);
}

describe('HE-13-HU01 · Rango de fechas', () => {
  it('HE-13-HU01-CA01 · Seleccionar un rango predefinido', async () => {
    const nucleo = await abrir();
    const selector = screen.getByRole('combobox', { name: 'Rango de fechas' }) as HTMLSelectElement;
    // ET01 y ET16: las cuatro opciones, con «Últimos 30 días» al abrir.
    expect([...selector.options].map((o) => o.textContent)).toEqual([
      'Últimos 7 días',
      'Últimos 30 días',
      'Últimos 12 meses',
      'Personalizado',
    ]);
    expect(selector.selectedOptions[0]?.textContent).toBe('Últimos 30 días');
    expect(llamadasA(nucleo, 'report_resolve_range')).toEqual([{ range: { kind: 'last_30' } }]);
    // ET02: se aplica al seleccionarlo, sin «Aplicar».
    elegir('Últimos 7 días');
    expect(selector.selectedOptions[0]?.textContent).toBe('Últimos 7 días');
    await waitFor(() => expect(pedidos(nucleo)).toEqual([{ range: { kind: 'last_7' } }]));
    expect(screen.queryByRole('button', { name: 'Aplicar' })).toBeNull();
  });

  it('HE-13-HU01-CA02 · Seleccionar un rango personalizado', async () => {
    const nucleo = await abrir();
    await personalizado('01/10/2026', '15/10/2026');
    // ET03, ET04: DD/MM/AAAA en pantalla, AAAA-MM-DD al Núcleo.
    await waitFor(() =>
      expect(pedidos(nucleo)).toEqual([
        { range: { kind: 'custom', start: '2026-10-01', end: '2026-10-15' } },
      ]),
    );
  });

  it('HE-13-HU01-CA03 · Fecha de inicio posterior a la fecha de fin', async () => {
    const nucleo = await abrir();
    nucleo.responder('report_resolve_range', () => ({
      ok: false,
      error: {
        code: 'range.start_after_end',
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
        field: 'end',
      },
    }));
    await personalizado('15/10/2026', '10/10/2026');
    // ET07, ET11: en el campo Fecha de fin.
    await waitFor(() =>
      expect(mensajeDe('Fecha de fin')).toBe('La fecha de inicio no puede ser posterior a la fecha de fin.'),
    );
  });

  it('HE-13-HU01-CA04 · Fecha de inicio vacía', async () => {
    const nucleo = await abrir();
    await personalizado('', '15/10/2026');
    await waitFor(() => expect(mensajeDe('Fecha de inicio')).toBe('Este campo es obligatorio.'));
    expect(pedidos(nucleo)).toEqual([]); // ET10
  });

  it('HE-13-HU01-CA05 · Fecha de fin vacía', async () => {
    const nucleo = await abrir();
    await personalizado('01/10/2026', '');
    await waitFor(() => expect(mensajeDe('Fecha de fin')).toBe('Este campo es obligatorio.'));
    expect(pedidos(nucleo)).toEqual([]);
  });

  it('HE-13-HU01-CA06 · Rango mayor a un año', async () => {
    const nucleo = await abrir();
    nucleo.responder('report_resolve_range', () => ({
      ok: false,
      error: { code: 'range.too_long', message: 'El rango máximo es de un año.', field: 'end' },
    }));
    await personalizado('01/01/2025', '15/10/2026');
    // ET08, ET13: debajo del campo Fecha de fin.
    await waitFor(() => expect(mensajeDe('Fecha de fin')).toBe('El rango máximo es de un año.'));
  });

  it('HE-13-HU01-CA07 · Fecha que no existe en el calendario', async () => {
    const nucleo = await abrir();
    await personalizado('31/02/2026', '15/10/2026');
    await waitFor(() => expect(mensajeDe('Fecha de inicio')).toBe('Diligencia una fecha válida.'));
    expect(pedidos(nucleo)).toEqual([]);
  });

  it('HE-13-HU01-CA08 · Fecha con formato incorrecto', async () => {
    const nucleo = await abrir();
    await personalizado('2026-10-01', '15/10/2026');
    await waitFor(() => expect(mensajeDe('Fecha de inicio')).toBe('Diligencia una fecha válida.'));
    expect(pedidos(nucleo)).toEqual([]);
  });
});
