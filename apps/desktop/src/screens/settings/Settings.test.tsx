// HE-16-HU03 · Cerrar sesión desde la pantalla Configuración. Una prueba por CA en la vista; lo que borra el Núcleo
// tiene su prueba ca_he_16_hu03_* en servicio_de_sesion/pruebas_de_cierre.rs.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { crearNucleo, llamadasA, type NucleoDelPlanificador } from '@/screens/kanban/pruebas';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';
import { Settings } from './Settings';

const DESEAS = '¿Deseas cerrar sesión?';
const CON_CAMBIOS =
  'Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?';

/** Abre Menú principal > Configuración con los cambios pendientes indicados. */
async function abrirConfiguracion(pendientes: number): Promise<NucleoDelPlanificador> {
  const { nucleo, invocar, escuchar } = crearNucleo();
  nucleo.responder('auth_get_sign_out_info', () => ({
    ok: true,
    value: { pending_count: pendientes },
  }));
  nucleo.responder('auth_sign_out', () => ({
    ok: true,
    value: null,
    result_message: { code: 'auth_sign_out', message: 'Sesión cerrada.' },
  }));
  render(<VentanaPrincipal invocar={invocar} escuchar={escuchar} pantallas={{ settings: Settings }} />);
  const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
  fireEvent.click(within(menu).getByRole('button', { name: 'Configuración' }));
  await screen.findByRole('main', { name: 'Configuración' });
  return nucleo;
}

async function seleccionarCerrarSesion() {
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  return screen.findByRole('dialog');
}

/**
 * Selecciona la opción principal del mensaje («Cerrar sesión» en M-11 y «Confirmar» en M-12, docs/rediseno.md
 * RD-34) y comprueba que llega a Inicio de sesión con «Sesión cerrada.».
 */
async function confirmaYCierra(
  nucleo: NucleoDelPlanificador,
  dialogo: HTMLElement,
  opcion = 'Cerrar sesión',
) {
  fireEvent.click(within(dialogo).getByRole('button', { name: opcion }));
  expect(await screen.findByRole('main', { name: 'Inicio de sesión' })).toBeTruthy();
  expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
  expect(screen.getByRole('status').textContent).toContain('Sesión cerrada.');
  expect(llamadasA(nucleo, 'auth_sign_out')).toHaveLength(1);
}

describe('HE-16-HU03 · Cerrar sesión desde la pantalla Configuración', () => {
  it('HE-16-HU03-CA01 · Cierre de sesión confirmado', async () => {
    const nucleo = await abrirConfiguracion(0);
    // ET01: la pantalla Configuración tiene el botón «Cerrar sesión».
    const dialogo = await seleccionarCerrarSesion();
    expect(within(dialogo).getByText(DESEAS)).toBeTruthy();
    // ET03 y ET06: el Núcleo cierra la sesión y oculta el wallpaper; la vista muestra Inicio de sesión.
    await confirmaYCierra(nucleo, dialogo);
  });

  it('HE-16-HU03-CA02 · Cancelar el cierre de sesión', async () => {
    const nucleo = await abrirConfiguracion(0);
    const dialogo = await seleccionarCerrarSesion();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    await act(async () => {});
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Configuración' })).toBeTruthy();
    expect(llamadasA(nucleo, 'auth_sign_out')).toHaveLength(0);
  });

  it('HE-16-HU03-CA03 · Cierre de sesión con cambios sin sincronizar', async () => {
    const nucleo = await abrirConfiguracion(2);
    // ET04 y ET05: con cambios pendientes, el aviso M-12 con «Confirmar» (RD-34, Figma 85:140) y «Cancelar».
    const dialogo = await seleccionarCerrarSesion();
    expect(within(dialogo).getByText(CON_CAMBIOS)).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Confirmar' })).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(llamadasA(nucleo, 'auth_sign_out')).toHaveLength(0);
  });

  it('HE-16-HU03-CA04 · Confirmar el cierre con cambios sin sincronizar', async () => {
    const nucleo = await abrirConfiguracion(2);
    const dialogo = await seleccionarCerrarSesion();
    expect(within(dialogo).getByText(CON_CAMBIOS)).toBeTruthy();
    await confirmaYCierra(nucleo, dialogo, 'Confirmar');
  });

  it('HE-16-HU03-CA05 · Abrir el mensaje de confirmación de cierre de sesión', async () => {
    const nucleo = await abrirConfiguracion(0);
    const dialogo = await seleccionarCerrarSesion();
    // RT-02: ventana emergente; RT-04: confirmación con «Cerrar sesión» y «Cancelar». La sesión sigue iniciada.
    expect(within(dialogo).getByText(DESEAS)).toBeTruthy();
    expect(
      within(dialogo)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(expect.arrayContaining(['Cerrar sesión', 'Cancelar']));
    expect(screen.getByRole('navigation', { name: 'Menú principal' })).toBeTruthy();
    expect(llamadasA(nucleo, 'auth_sign_out')).toHaveLength(0);
  });
});

/** Abre Configuración con el inicio automático de Windows en `windows` y un `autostart_set` que hace `fijar`. */
async function abrirConInicio(windows: { enabled: boolean }, permitido = true) {
  const { nucleo, invocar, escuchar } = crearNucleo();
  nucleo.responder('autostart_get', () => ({ ok: true, value: { ...windows } }));
  nucleo.responder('autostart_set', ({ enabled }) => {
    if (!permitido) {
      return {
        ok: false,
        error: {
          code: 'autostart.failed',
          message: 'No pudimos cambiar el inicio automático. Intenta de nuevo.',
        },
      };
    }
    windows.enabled = enabled;
    return {
      ok: true,
      value: { enabled },
      result_message: {
        code: 'autostart_set',
        message: enabled ? 'Inicio automático activado.' : 'Inicio automático desactivado.',
      },
    };
  });
  render(<VentanaPrincipal invocar={invocar} escuchar={escuchar} pantallas={{ settings: Settings }} />);
  const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
  fireEvent.click(within(menu).getByRole('button', { name: 'Configuración' }));
  const interruptor = await screen.findByRole('switch', { name: 'Inicio automático' });
  return { nucleo, interruptor };
}

describe('HE-16-HU02 · Alternar el inicio automático en la pantalla Configuración', () => {
  it('HE-16-HU02-CA01 · Desactivar inicio automático', async () => {
    const { nucleo, interruptor } = await abrirConInicio({ enabled: true });
    // ET01: la pantalla muestra el interruptor «Inicio automático», activado como en Windows.
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(interruptor);
    expect((await screen.findByRole('status')).textContent).toContain('Inicio automático desactivado.');
    // ET03: guarda la preferencia.
    expect(llamadasA(nucleo, 'autostart_set')).toEqual([{ enabled: false }]);
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
  });

  it('HE-16-HU02-CA02 · Activar inicio automático', async () => {
    const { nucleo, interruptor } = await abrirConInicio({ enabled: false });
    fireEvent.click(interruptor);
    expect((await screen.findByRole('status')).textContent).toContain('Inicio automático activado.');
    expect(llamadasA(nucleo, 'autostart_set')).toEqual([{ enabled: true }]);
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
  });

  it('HE-16-HU02-CA03 · Cambio hecho desde Windows', async () => {
    const windows = { enabled: true };
    const { interruptor } = await abrirConInicio(windows);
    // La persona lo deshabilita en las aplicaciones de arranque de Windows y vuelve a la ventana (ET06).
    windows.enabled = false;
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
  });

  it('HE-16-HU02-CA04 · Inicio automático propio de cada computador', async () => {
    const { nucleo, interruptor } = await abrirConInicio({ enabled: true });
    const antes = nucleo.llamadas.length;
    fireEvent.click(interruptor);
    await screen.findByRole('status');
    // ET07: alternarlo solo llama a `autostart_set`, que no se sincroniza (el Núcleo no lo encola; ver
    // ca_he_16_hu02_ca04 en inicio_automatico.rs).
    expect(nucleo.llamadas.slice(antes).map((l) => l.comando)).toEqual(['autostart_set']);
  });

  it('HE-16-HU02-CA05 · Error al cambiar el inicio automático', async () => {
    const { interruptor } = await abrirConInicio({ enabled: false }, false);
    fireEvent.click(interruptor);
    expect((await screen.findByRole('alert')).textContent).toBe(
      'No pudimos cambiar el inicio automático. Intenta de nuevo.',
    );
    // ET09: el interruptor conserva el estado que tiene Windows.
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
  });

  it('HE-16-HU03-CA07 · No se pudo cerrar la sesión', async () => {
    const nucleo = await abrirConfiguracion(0);
    const aviso = 'No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.';
    nucleo.responder('auth_sign_out', () => ({
      ok: false,
      error: { code: 'auth.sign_out_failed', message: aviso },
    }));
    const dialogo = await seleccionarCerrarSesion();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cerrar sesión' }));
    // ET09: el aviso (RT-04), la sesión sigue iniciada y no aparece «Sesión cerrada.».
    expect(await screen.findByText(aviso)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Configuración' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Menú principal' })).toBeTruthy();
    expect(screen.queryByText('Sesión cerrada.')).toBeNull();
  });
});
