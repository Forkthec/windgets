// HE-03-HU01 · Consultar los temas guardados con el tema aplicado marcado; HE-03-HU03 · Aplicar un tema
// guardado. Una prueba por CA en la vista; las reglas del Núcleo tienen sus pruebas ca_he_03_hu01_* y
// ca_he_03_hu03_* en servicio_de_personalizacion_y_configuracion (pruebas_de_temas.rs, pruebas_de_aplicar_un_tema.rs).
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemeSummary } from '@/types';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
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
      Array.from(li.children)
        .filter((h) => h.tagName === 'SPAN' && !h.querySelector('button'))
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

describe('HE-03-HU03 · Aplicar un tema guardado', () => {
  const M05 = 'Se reemplazará la personalización actual por la del tema “Verano”. ¿Deseas aplicarlo?';
  const M15 = 'Tienes cambios sin guardar en el tema “Mi tema”. ¿Qué deseas hacer?';
  const nombreDe = (id: string) => (id === 't2' ? 'Verano' : 'Mi tema');

  /** El botón «Aplicar» del tema con ese nombre. */
  function aplicarDe(nombre: string) {
    const fila = within(screen.getByRole('list', { name: 'Lista de temas' }))
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes(nombre)) as HTMLElement;
    return within(fila).getByRole('button', { name: 'Aplicar' }) as HTMLButtonElement;
  }

  /** «Mi tema» aplicado y «Verano»; al aplicar, el Núcleo pasa «Aplicado» al tema aplicado. */
  async function conDosTemas(conCambios = false) {
    let aplicado = 't1';
    return abrirTemas([], (n) => {
      n.responder('theme_list', () => ({
        ok: true,
        value: [
          tema('t2', 'Verano', { is_applied: aplicado === 't2' }),
          tema('t1', 'Mi tema', { is_applied: aplicado === 't1' }),
        ],
      }));
      n.responder('theme_apply', ({ theme_id, discard_draft }) => {
        if (conCambios && !discard_draft)
          return { ok: false, error: { code: 'draft.unsaved_changes', message: M15 } };
        aplicado = theme_id;
        return {
          ok: true,
          value: { theme_id },
          result_message: { code: 'theme_apply', message: 'Tema “' + nombreDe(theme_id) + '” aplicado.' },
        };
      });
      n.responder('theme_draft_save', () => ({
        ok: true,
        value: { theme_id: 't1', is_applied: true },
        result_message: { code: 'theme_draft_save', message: 'Cambios guardados en el tema aplicado.' },
      }));
    });
  }

  it('HE-03-HU03-CA01 · Aplicar un tema con confirmación', async () => {
    const nucleo = await conDosTemas();
    fireEvent.click(aplicarDe('Verano'));
    const dialogo = await screen.findByRole('dialog');
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar' }));
    // ET02, ET04: el tema se aplica y «Aplicado» pasa a él, con el mensaje de resultado.
    expect((await screen.findByRole('status')).textContent).toContain('Tema “Verano” aplicado.');
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([{ theme_id: 't2' }]);
    await waitFor(() => expect(filas()).toEqual(['Verano · 02/11/2026 · Aplicado', 'Mi tema · 02/11/2026']));
  });

  it('HE-03-HU03-CA02 · Cancelar la aplicación del tema', async () => {
    const nucleo = await conDosTemas();
    fireEvent.click(aplicarDe('Verano'));
    const dialogo = await screen.findByRole('dialog');
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
    expect(filas()).toEqual(['Verano · 02/11/2026', 'Mi tema · 02/11/2026 · Aplicado']);
  });

  it('HE-03-HU03-CA03 · Aplicar el tema que ya está aplicado', async () => {
    const nucleo = await conDosTemas();
    // ET05: deshabilitada con «Este tema ya está aplicado.» (RT-04).
    expect(aplicarDe('Mi tema').disabled).toBe(true);
    expect(screen.getByText('Este tema ya está aplicado.')).toBeTruthy();
    fireEvent.click(aplicarDe('Mi tema'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
  });

  it('HE-03-HU03-CA04 · Aplicar un tema con cambios sin aplicar', async () => {
    let conCambiosSinAplicar = true;
    const nucleo = await abrirTemas([], (n) => {
      n.responder('theme_list', () => ({
        ok: true,
        value: [tema('t1', 'Mi tema', { is_applied: true, has_unapplied_changes: conCambiosSinAplicar })],
      }));
      n.responder('theme_apply', ({ theme_id }) => {
        conCambiosSinAplicar = false;
        return {
          ok: true,
          value: { theme_id },
          result_message: { code: 'theme_apply', message: 'Tema “Mi tema” aplicado.' },
        };
      });
    });
    expect(filas()).toEqual(['Mi tema · 02/11/2026 · Aplicado · Cambios sin aplicar']);
    expect(aplicarDe('Mi tema').disabled).toBe(false);
    fireEvent.click(aplicarDe('Mi tema'));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Aplicar' }));
    // ET06: se lleva la última versión guardada y desaparece la marca.
    expect((await screen.findByRole('status')).textContent).toContain('Tema “Mi tema” aplicado.');
    await waitFor(() => expect(filas()).toEqual(['Mi tema · 02/11/2026 · Aplicado']));
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([{ theme_id: 't1' }]);
  });

  it('HE-03-HU03-CA05 · Aplicar un tema con cambios sin guardar en la vista previa', async () => {
    const nucleo = await conDosTemas(true);
    fireEvent.click(aplicarDe('Verano'));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Aplicar' }));
    // ET08: el mismo mensaje de HE-02-HU12-CA02, con el nombre del tema en edición y sus tres opciones.
    const m15 = await screen.findByText(M15);
    const dialogo = m15.closest('[role="dialog"]') as HTMLElement;
    for (const opcion of ['Guardar y aplicar', 'Aplicar sin guardar', 'Cancelar']) {
      expect(within(dialogo).getByRole('button', { name: opcion })).toBeTruthy();
    }
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar sin guardar' }));
    expect((await screen.findByRole('status')).textContent).toContain('Tema “Verano” aplicado.');
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([
      { theme_id: 't2' },
      { theme_id: 't2', discard_draft: true },
    ]);
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([]);
  });

  it('HE-03-HU03-CA06 · Abrir el mensaje de confirmación para aplicar', async () => {
    const nucleo = await conDosTemas();
    fireEvent.click(aplicarDe('Verano'));
    // ET01: confirmación en ventana emergente con «Aplicar» y «Cancelar»; el tema aplicado no cambia.
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText(M05)).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Aplicar' })).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
  });
});
