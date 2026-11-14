// RT-01 · Menú principal y pantalla principal. Una prueba por CA (criterio de aceptación). Las pantallas de
// cuenta y Personalización del wallpaper son pantallas de prueba: sus HU llegan en pasos siguientes del plan.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { AuthSessionState, EventMap, Invoke, Result } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useGuardiaDeSalida, useNavegacion, VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

const OPCIONES = {
  Planificador: [
    'Planificador diario',
    'Tablero Kanban',
    'Calendario',
    'Agenda diaria',
    'Reportes',
    'Agente de IA',
    'Etiquetas',
  ],
  Personalización: ['Personalización del wallpaper', 'Temas', 'Widgets'],
  Configuración: ['Configuración'],
};

/** Núcleo de prueba: responde auth_get_session y deja emitir session_changed. */
function nucleo(sesion: Result<AuthSessionState>) {
  const oyentes: Array<(c: EventMap['session_changed']) => void> = [];
  const invocar = ((comando: string) =>
    Promise.resolve(
      comando === 'auth_get_session' ? sesion : { ok: false, error: { code: 'internal.unexpected' } },
    )) as unknown as Invoke;
  const escuchar = ((_evento: string, alRecibir: (c: EventMap['session_changed']) => void) => {
    oyentes.push(alRecibir);
    return () => oyentes.splice(oyentes.indexOf(alRecibir), 1);
  }) as unknown as Escuchar;
  const emitir = (carga: EventMap['session_changed']) => act(() => oyentes.forEach((o) => o(carga)));
  return { invocar, escuchar, emitir };
}

const SIN_SESION: Result<AuthSessionState> = { ok: true, value: { state: 'signed_out', token: 'valid' } };
const CON_SESION: Result<AuthSessionState> = {
  ok: true,
  value: { state: 'signed_in', user_id: 'u-1', alias: 'Paula', token: 'valid' },
};
// Sin conexión la sesión recordada sigue iniciada con el token por renovar (IPC-AUTH-12).
const CON_SESION_SIN_CONEXION: Result<AuthSessionState> = {
  ok: true,
  value: { state: 'signed_in', user_id: 'u-1', alias: 'Paula', token: 'refresh_pending' },
};

function InicioDeSesion() {
  const { abrirCuenta } = useNavegacion();
  return (
    <main aria-label="Inicio de sesión">
      <Boton principal>Iniciar sesión</Boton>
      <Boton>Continuar con Google</Boton>
      <Boton onClick={() => abrirCuenta('register')}>Crear cuenta</Boton>
      <Boton onClick={() => abrirCuenta('recovery')}>¿Olvidaste tu contraseña?</Boton>
    </main>
  );
}

/** Personalización del wallpaper con cambios pendientes; los mensajes son los de HE-02-HU13-CA02 y CA05. */
function PersonalizacionConCambios({ aplicados }: { aplicados: boolean }) {
  const [pregunta, setPregunta] = useState<((salir: boolean) => void) | null>(null);
  const guardia = useCallback(() => new Promise<boolean>((resolver) => setPregunta(() => resolver)), []);
  useGuardiaDeSalida(guardia);
  const responder = (salir: boolean) => {
    pregunta?.(salir);
    setPregunta(null);
  };
  return (
    <main aria-label="Personalización del wallpaper">
      {pregunta && (
        <VentanaEmergente
          titulo="Cambios sin guardar"
          alSalir={() => responder(false)}
          acciones={
            <>
              {aplicados && <Boton onClick={() => responder(true)}>Guardar</Boton>}
              <Boton onClick={() => responder(true)}>Salir sin guardar</Boton>
              <Boton principal onClick={() => responder(false)}>
                Seguir editando
              </Boton>
            </>
          }
        >
          <p>
            {aplicados
              ? 'Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?'
              : 'Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?'}
          </p>
        </VentanaEmergente>
      )}
    </main>
  );
}

function menu() {
  return screen.getByRole('navigation', { name: 'Menú principal' });
}

/** Abre la pantalla principal y comprueba el menú visible con la opción marcada (RT-01-ET01, ET03, ET04). */
async function esperarPantallaPrincipal() {
  expect(await screen.findByRole('main', { name: 'Planificador diario' })).toBeTruthy();
  const marcadas = within(menu())
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-current') === 'page');
  expect(marcadas.map((b) => b.textContent)).toEqual(['Planificador diario']);
}

describe('RT-01 · Menú principal y pantalla principal', () => {
  it('RT-01-CA01 · Pantalla principal al iniciar sesión con correo electrónico y contraseña', async () => {
    const n = nucleo(SIN_SESION);
    render(<VentanaPrincipal {...n} pantallasDeCuenta={{ sign_in: InicioDeSesion }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }));
    n.emitir({ state: 'signed_in', alias: 'Paula', reason: 'sign_in' });
    await esperarPantallaPrincipal();
  });

  it('RT-01-CA02 · Pantalla principal al iniciar sesión con Google', async () => {
    const n = nucleo(SIN_SESION);
    render(<VentanaPrincipal {...n} pantallasDeCuenta={{ sign_in: InicioDeSesion }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar con Google' }));
    n.emitir({ state: 'signed_in', alias: 'Paula', reason: 'sign_in' });
    await esperarPantallaPrincipal();
  });

  it('RT-01-CA03 · Pantalla principal al crear la cuenta', async () => {
    const n = nucleo(SIN_SESION);
    render(<VentanaPrincipal {...n} />);
    expect(await screen.findByRole('main', { name: 'Inicio de sesión' })).toBeTruthy();
    n.emitir({ state: 'signed_in', alias: 'Paula', reason: 'registered' });
    await esperarPantallaPrincipal();
  });

  it('RT-01-CA04 · Pantalla principal con la sesión recordada y con conexión', async () => {
    render(<VentanaPrincipal {...nucleo(CON_SESION)} />);
    await esperarPantallaPrincipal();
  });

  it('RT-01-CA05 · Pantalla principal con la sesión recordada y sin conexión', async () => {
    render(<VentanaPrincipal {...nucleo(CON_SESION_SIN_CONEXION)} />);
    await esperarPantallaPrincipal();
  });

  it('RT-01-CA06 · Consultar el menú principal', async () => {
    render(<VentanaPrincipal {...nucleo(CON_SESION)} />);
    await esperarPantallaPrincipal();
    const secciones = within(menu()).getAllByRole('heading');
    expect(secciones.map((s) => s.textContent)).toEqual(Object.keys(OPCIONES));
    for (const seccion of secciones) {
      const opciones = within(seccion.parentElement as HTMLElement).getAllByRole('button');
      expect(opciones.map((o) => o.textContent)).toEqual(
        OPCIONES[seccion.textContent as keyof typeof OPCIONES],
      );
    }
  });

  it('RT-01-CA07 · Abrir una pantalla desde el menú principal', async () => {
    render(<VentanaPrincipal {...nucleo(CON_SESION)} />);
    await esperarPantallaPrincipal();
    fireEvent.click(within(menu()).getByRole('button', { name: 'Tablero Kanban' }));
    expect(await screen.findByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    expect(within(menu()).getByRole('button', { name: 'Tablero Kanban' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      within(menu()).getByRole('button', { name: 'Planificador diario' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('RT-01-CA08 · Cambiar de pantalla con cambios sin guardar ni aplicar', async () => {
    const Personalizacion = () => <PersonalizacionConCambios aplicados={false} />;
    render(<VentanaPrincipal {...nucleo(CON_SESION)} pantallas={{ personalization: Personalizacion }} />);
    await esperarPantallaPrincipal();
    fireEvent.click(within(menu()).getByRole('button', { name: 'Personalización del wallpaper' }));
    await screen.findByRole('main', { name: 'Personalización del wallpaper' });

    fireEvent.click(within(menu()).getByRole('button', { name: 'Tablero Kanban' }));
    const mensaje = await screen.findByRole('dialog');
    expect(mensaje.textContent).toContain('Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?');
    expect(
      within(mensaje)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Salir sin guardar', 'Seguir editando']);
    expect(screen.queryByRole('main', { name: 'Tablero Kanban' })).toBeNull();

    fireEvent.click(within(mensaje).getByRole('button', { name: 'Salir sin guardar' }));
    expect(await screen.findByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
  });

  it('RT-01-CA09 · Cambiar de pantalla con cambios aplicados sin guardar', async () => {
    const Personalizacion = () => <PersonalizacionConCambios aplicados />;
    render(<VentanaPrincipal {...nucleo(CON_SESION)} pantallas={{ personalization: Personalizacion }} />);
    await esperarPantallaPrincipal();
    fireEvent.click(within(menu()).getByRole('button', { name: 'Personalización del wallpaper' }));
    await screen.findByRole('main', { name: 'Personalización del wallpaper' });

    fireEvent.click(within(menu()).getByRole('button', { name: 'Tablero Kanban' }));
    const mensaje = await screen.findByRole('dialog');
    expect(mensaje.textContent).toContain(
      'Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?',
    );
    expect(
      within(mensaje)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Guardar', 'Salir sin guardar', 'Seguir editando']);

    // «Seguir editando» no confirma la salida: sigue en Personalización del wallpaper.
    fireEvent.click(within(mensaje).getByRole('button', { name: 'Seguir editando' }));
    expect(await screen.findByRole('main', { name: 'Personalización del wallpaper' })).toBeTruthy();
    expect(screen.queryByRole('main', { name: 'Tablero Kanban' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('RT-01-CA10 · Menú principal sin sesión iniciada', async () => {
    render(<VentanaPrincipal {...nucleo(SIN_SESION)} pantallasDeCuenta={{ sign_in: InicioDeSesion }} />);
    expect(await screen.findByRole('main', { name: 'Inicio de sesión' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('main', { name: 'Registro' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
  });

  it('RT-01-CA10 · Sin sesión solo se abren Inicio de sesión, Registro y Recuperar contraseña', async () => {
    function Probar() {
      const { abrir } = useNavegacion();
      return <Boton onClick={() => void abrir('kanban')}>Abrir Tablero Kanban</Boton>;
    }
    const sinSesion = nucleo(SIN_SESION);
    render(<VentanaPrincipal {...sinSesion} pantallasDeCuenta={{ sign_in: Probar }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir Tablero Kanban' }));
    await act(() => Promise.resolve());
    expect(screen.queryByRole('main', { name: 'Tablero Kanban' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir Tablero Kanban' })).toBeTruthy();
  });

  it('RT-01-CA11 · Menú principal sin conexión', async () => {
    render(<VentanaPrincipal {...nucleo(CON_SESION_SIN_CONEXION)} />);
    await esperarPantallaPrincipal();
    const opciones = within(menu()).getAllByRole('button');
    expect(opciones.map((o) => o.textContent)).toEqual(Object.values(OPCIONES).flat());
    for (const opcion of opciones) expect((opcion as HTMLButtonElement).disabled).toBe(false);
    // Deshabilitar el agente de IA y los widgets externos dentro de su pantalla es de HE-15-HU02-CA06.
  });

  // La pantalla de edición es la ventana C-03 (interfaz.md), aparte de la ventana principal; se crea con
  // HE-05-HU01 (abrir la pantalla de edición), que es la que prueba este CA.
  it.todo('RT-01-CA12 · Pantalla de edición sin menú principal (se prueba con HE-05-HU01)');
});
