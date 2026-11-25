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
    // ET01: «Aplicar» y el botón de acciones «⋮» con «Renombrar» y «Eliminar» en cada tema (RT-02-ET10).
    const lista = screen.getByRole('list', { name: 'Lista de temas' });
    for (const [i, li] of within(lista).getAllByRole('listitem').entries()) {
      const nombre = ['Verano', 'Mi tema'][i] as string;
      expect(
        within(li)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Aplicar', '⋮']);
      fireEvent.click(within(li).getByRole('button', { name: `Acciones de ${nombre}` }));
      const menu = screen.getByRole('menu', { name: `Acciones de ${nombre}` });
      expect(
        within(menu)
          .getAllByRole('menuitem')
          .map((o) => o.textContent),
      ).toEqual(['Renombrar', 'Eliminar']);
      fireEvent.keyDown(menu, { key: 'Escape' });
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

describe('HE-03-HU04 · Renombrar un tema', () => {
  const TEMAS = [tema('t2', 'Verano'), tema('t1', 'Mi tema', { is_applied: true })];

  async function abrirRenombrar(preparar?: (n: NucleoDelPlanificador) => void) {
    const n = await abrirTemas(TEMAS, preparar);
    const fila = within(screen.getByRole('list', { name: 'Lista de temas' })).getAllByRole(
      'listitem',
    )[1] as HTMLElement;
    // HE-03-HU04-ET01: «Renombrar» en el botón de acciones «⋮» del tema.
    fireEvent.click(within(fila).getByRole('button', { name: /^Acciones de / }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Renombrar' }));
    const ventana = await screen.findByRole('dialog', { name: 'Renombrar tema' });
    return { n, ventana, campo: within(ventana).getByLabelText('Nombre') as HTMLInputElement };
  }

  it('RD-91 · el único campo muestra su error', async () => {
    const { n, ventana, campo } = await abrirRenombrar();
    fireEvent.change(campo, { target: { value: 'a'.repeat(41) } });
    expect(within(ventana).getByText('El nombre no puede superar los 40 caracteres.')).toBeTruthy();
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    expect(ventana.querySelectorAll('.wg-campo__mensaje')).toHaveLength(1);
    expect(llamadasA(n, 'theme_rename')).toEqual([]);
  });

  it('HE-03-HU04-CA07 · Abrir la ventana Renombrar tema', async () => {
    const { ventana, campo } = await abrirRenombrar();
    expect(campo.value).toBe('Mi tema');
    expect(within(ventana).getByRole('button', { name: 'Guardar' })).toBeTruthy();
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('HE-03-HU04-CA01 · Renombrar un tema', async () => {
    const { n, ventana, campo } = await abrirRenombrar((n) =>
      n.responder('theme_rename', () => ({
        ok: true,
        value: tema('t1', 'Mi escritorio', { is_applied: true }),
        result_message: { code: 'theme_rename', message: 'Tema renombrado.' },
      })),
    );
    fireEvent.change(campo, { target: { value: ' Mi escritorio ' } });
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Tema renombrado.')).toBeTruthy();
    expect(llamadasA(n, 'theme_rename')).toEqual([{ theme_id: 't1', name: 'Mi escritorio' }]);
    expect(screen.queryByRole('dialog', { name: 'Renombrar tema' })).toBeNull();
  });

  it('HE-03-HU04-CA02 · Nombre vacío', async () => {
    const { n, ventana, campo } = await abrirRenombrar();
    fireEvent.change(campo, { target: { value: '   ' } });
    expect((within(ventana).getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(llamadasA(n, 'theme_rename')).toEqual([]);
  });

  it('HE-03-HU04-CA03 · Nombre de más de 40 caracteres', async () => {
    const { n, ventana, campo } = await abrirRenombrar();
    fireEvent.change(campo, { target: { value: 'a'.repeat(41) } });
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    expect(within(ventana).getByText('El nombre no puede superar los 40 caracteres.')).toBeTruthy();
    expect(llamadasA(n, 'theme_rename')).toEqual([]);
  });

  it('HE-03-HU04-CA04 · Nombre duplicado', async () => {
    const { ventana, campo } = await abrirRenombrar((n) =>
      n.responder('theme_rename', () => ({
        ok: false,
        error: {
          code: 'name.duplicate',
          message: 'Ya existe un tema con ese nombre. Elige otro.',
          field: 'name',
        },
      })),
    );
    fireEvent.change(campo, { target: { value: 'VERANO' } });
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    expect(await within(ventana).findByText('Ya existe un tema con ese nombre. Elige otro.')).toBeTruthy();
  });

  it('HE-03-HU04-CA05 · Cancelar el renombrado', async () => {
    const { n, ventana, campo } = await abrirRenombrar();
    fireEvent.change(campo, { target: { value: 'Otro' } });
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Renombrar tema' })).toBeNull());
    expect(llamadasA(n, 'theme_rename')).toEqual([]);
    expect(screen.getByText('Mi tema')).toBeTruthy();
  });

  it('HE-03-HU04-CA06 · Cambiar solo mayúsculas o minúsculas', async () => {
    const { ventana, campo } = await abrirRenombrar((n) =>
      n.responder('theme_rename', () => ({
        ok: true,
        value: tema('t1', 'MI TEMA', { is_applied: true }),
        result_message: { code: 'theme_rename', message: 'Tema renombrado.' },
      })),
    );
    fireEvent.change(campo, { target: { value: 'MI TEMA' } });
    fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Tema renombrado.')).toBeTruthy();
  });
});

describe('HE-03-HU05 · Eliminar un tema', () => {
  const TEMAS = [tema('t2', 'Verano'), tema('t1', 'Mi tema', { is_applied: true })];
  const fila = (i: number) =>
    within(screen.getByRole('list', { name: 'Lista de temas' })).getAllByRole('listitem')[i] as HTMLElement;

  async function abrirEliminar(preparar?: (n: NucleoDelPlanificador) => void) {
    const n = await abrirTemas(TEMAS, preparar);
    // ET01: «Eliminar» en el botón de acciones «⋮» del tema.
    fireEvent.click(within(fila(0)).getByRole('button', { name: 'Acciones de Verano' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    const ventana = await screen.findByRole('dialog');
    return { n, ventana };
  }

  it('HE-03-HU05-CA01 · Eliminar un tema con confirmación', async () => {
    const { n, ventana } = await abrirEliminar((n) =>
      n.responder('theme_delete', () => ({
        ok: true,
        value: null,
        result_message: { code: 'theme_delete', message: 'Tema eliminado.' },
      })),
    );
    // ET01: M-06 con «Eliminar» y «Cancelar».
    expect(
      within(ventana).getByText('¿Deseas eliminar el tema “Verano”? Esta acción no se puede deshacer.'),
    ).toBeTruthy();
    fireEvent.click(within(ventana).getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('Tema eliminado.')).toBeTruthy();
    expect(llamadasA(n, 'theme_delete')).toEqual([{ theme_id: 't2' }]);
  });

  it('HE-03-HU05-CA02 · Intentar eliminar el tema aplicado', async () => {
    await abrirTemas(TEMAS);
    // ET04: deshabilitada dentro del menú «⋮», con el texto al pasar el mouse (RT-04).
    fireEvent.click(within(fila(1)).getByRole('button', { name: /^Acciones de / }));
    const boton = screen.getByRole('menuitem', { name: 'Eliminar' }) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    const motivo = 'No puedes eliminar el tema aplicado. Aplica otro tema primero.';
    expect(document.getElementById(boton.getAttribute('aria-describedby') ?? '')?.textContent).toBe(motivo);
    fireEvent.pointerEnter(boton);
    expect((await screen.findByRole('tooltip')).textContent).toBe(motivo);
  });

  it('HE-03-HU05-CA03 · Cancelar la eliminación', async () => {
    const { n, ventana } = await abrirEliminar();
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(n, 'theme_delete')).toEqual([]);
    expect(within(fila(0)).getByText('Verano')).toBeTruthy();
  });
});

describe('Rediseño · Temas (P35)', () => {
  it('RD-55 · Cada tema en una fila de la lista de la pantalla de Temas', async () => {
    await abrirTemas([tema('t1', 'Mi tema', { is_applied: true })]);
    const temas = screen.getByRole('main', { name: 'Temas' });
    expect(temas.classList.contains('wg-temas')).toBe(true);
    expect(within(temas).getByRole('list', { name: 'Lista de temas' })).toBeTruthy();
  });
});
