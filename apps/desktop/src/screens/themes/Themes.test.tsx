// HE-03-HU01 · Consultar los temas guardados con el tema aplicado marcado. Una prueba por CA en la vista; las
// reglas del Núcleo tienen sus pruebas ca_he_03_hu01_* en servicio_de_personalizacion_y_configuracion/pruebas_de_temas.rs.
import { within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemeSummary } from '@/types';
import { abrirPantalla, fijarHoy, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Themes } from './Themes';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

function tema(id: string, name: string, cambios: Partial<ThemeSummary> = {}): ThemeSummary {
  return {
    id,
    name,
    last_modified_at: '2026-11-02T15:00:00.000Z',
    is_applied: false,
    has_unapplied_changes: false,
    has_unsaved_changes: false,
    ...cambios,
  };
}

/** Abre Temas con los temas indicados, en el orden en que los da el Núcleo. */
export async function abrirTemas(temas: ThemeSummary[], preparar?: (n: NucleoDelPlanificador) => void) {
  return abrirPantalla('themes', 'Temas', Themes, [], (n) => {
    n.responder('theme_list', () => ({ ok: true, value: temas }));
    preparar?.(n);
  });
}

/** El texto de cada tema de la lista, sin sus opciones. */
function filas() {
  return within(screen.getByRole('list', { name: 'Lista de temas' }))
    .getAllByRole('listitem')
    .map((li) =>
      Array.from(li.querySelectorAll('span'))
        .map((s) => s.textContent)
        .join(' · '),
    );
}

const AYUDA = 'Guarda otra personalización con “Guardar como tema” para tener más temas.';

describe('HE-03-HU01 · Temas', () => {
  it('HE-03-HU01-CA01 · Consultar los temas', async () => {
    await abrirTemas([
      tema('t2', 'Verano', { last_modified_at: '2026-11-03T15:00:00.000Z' }),
      tema('t1', 'Mi tema', { is_applied: true }),
    ]);
    // ET01, ET02: nombre, fecha de última modificación y «Aplicado», del más reciente al más antiguo.
    expect(filas()).toEqual(['Verano · 03/11/2026', 'Mi tema · 02/11/2026 · Aplicado']);
    for (const li of within(screen.getByRole('list', { name: 'Lista de temas' })).getAllByRole('listitem')) {
      expect(
        within(li)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Aplicar', 'Renombrar', 'Eliminar']);
    }
    expect(screen.queryByText(AYUDA)).toBeNull();
  });

  it('HE-03-HU01-CA02 · Un solo tema guardado', async () => {
    await abrirTemas([tema('t1', 'Mi tema', { is_applied: true })]);
    // ET03: el estado de ayuda debajo de la lista.
    expect(filas()).toEqual(['Mi tema · 02/11/2026 · Aplicado']);
    expect(screen.getByText(AYUDA)).toBeTruthy();
  });

  it('HE-03-HU01-CA03 · Tema aplicado con cambios sin aplicar', async () => {
    await abrirTemas([tema('t1', 'Mi tema', { is_applied: true, has_unapplied_changes: true })]);
    expect(filas()).toEqual(['Mi tema · 02/11/2026 · Aplicado · Cambios sin aplicar']); // ET05
  });

  it('HE-03-HU01-CA04 · Tema aplicado con cambios sin guardar', async () => {
    await abrirTemas([tema('t1', 'Mi tema', { is_applied: true, has_unsaved_changes: true })]);
    expect(filas()).toEqual(['Mi tema · 02/11/2026 · Aplicado · Cambios sin guardar']); // ET07
  });
});
