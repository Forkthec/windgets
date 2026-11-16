// HE-17-HU02 · Abrir la ventana de la aplicación desde el ícono del área de notificación. El ícono, su menú y
// mostrar la ventana son del Núcleo (area_de_notificacion.rs, prueba manual en Windows 11); la última pantalla se
// guarda en la base local (ca_he_17_hu02_* en ultima_pantalla.rs). Aquí, lo que hace la ventana principal.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { crearNucleo, llamadasA } from '@/screens/kanban/pruebas';
import { VentanaPrincipal } from './VentanaPrincipal';

async function abrirAplicacion() {
  const { nucleo, invocar, escuchar } = crearNucleo();
  render(<VentanaPrincipal invocar={invocar} escuchar={escuchar} />);
  const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
  return { nucleo, menu };
}

describe('HE-17-HU02 · Abrir la ventana desde el ícono del área de notificación', () => {
  it('HE-17-HU02-CA01 · Abrir la ventana desde el ícono', async () => {
    const { nucleo, menu } = await abrirAplicacion();
    fireEvent.click(within(menu).getByRole('button', { name: 'Reportes' }));
    await screen.findByRole('main', { name: 'Reportes' });
    // ET05: la pantalla visitada queda como la última (D-156).
    expect(llamadasA(nucleo, 'app_set_last_screen')).toContainEqual({ screen: 'reports' });
    // El Núcleo muestra la ventana y pide la última pantalla visitada (EV-23).
    nucleo.emitir('navigate_requested', { screen: 'reports' });
    expect(await screen.findByRole('main', { name: 'Reportes' })).toBeTruthy();
    // ET02: sin reiniciar la aplicación ni cerrar la sesión.
    expect(llamadasA(nucleo, 'auth_get_session')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Menú principal' })).toBeTruthy();
  });

  it('HE-17-HU02-CA02 · Abrir la ventana desde la opción «Abrir» del menú del ícono', async () => {
    const { nucleo } = await abrirAplicacion();
    // «Abrir» llega igual que el ícono: con la última pantalla guardada en el computador (ET06).
    nucleo.emitir('navigate_requested', { screen: 'labels' });
    expect(await screen.findByRole('main', { name: 'Etiquetas' })).toBeTruthy();
    expect(llamadasA(nucleo, 'auth_get_session')).toHaveLength(1);
  });

  it('HE-17-HU02-CA03 · Abrir la ventana sin conexión', async () => {
    const { nucleo } = await abrirAplicacion();
    nucleo.emitir('connectivity_changed', { online: false });
    // ET03: la pantalla sale de lo guardado en el computador; abrirla no llama a la nube.
    nucleo.emitir('navigate_requested', { screen: 'kanban' });
    expect(await screen.findByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Menú principal' })).toBeTruthy();
  });
});
