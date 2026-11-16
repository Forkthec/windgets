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

/** Selecciona «Cerrar sesión» en el mensaje y comprueba que llega a Inicio de sesión con «Sesión cerrada.». */
async function confirmaYCierra(nucleo: NucleoDelPlanificador, dialogo: HTMLElement) {
  fireEvent.click(within(dialogo).getByRole('button', { name: 'Cerrar sesión' }));
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
    // ET04 y ET05: con cambios pendientes, el aviso M-12 con «Cerrar sesión» y «Cancelar».
    const dialogo = await seleccionarCerrarSesion();
    expect(within(dialogo).getByText(CON_CAMBIOS)).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(llamadasA(nucleo, 'auth_sign_out')).toHaveLength(0);
  });

  it('HE-16-HU03-CA04 · Confirmar el cierre con cambios sin sincronizar', async () => {
    const nucleo = await abrirConfiguracion(2);
    const dialogo = await seleccionarCerrarSesion();
    expect(within(dialogo).getByText(CON_CAMBIOS)).toBeTruthy();
    await confirmaYCierra(nucleo, dialogo);
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
