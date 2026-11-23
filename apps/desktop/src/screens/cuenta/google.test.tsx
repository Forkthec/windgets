// HE-01-HU05 · Iniciar sesión con la cuenta de Google. Una prueba por CA en la vista; las reglas del Núcleo
// (PKCE, alias, cuenta nueva, vencimiento) tienen su prueba ca_he_01_hu05_* en pruebas_de_google.rs.
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { EventMap } from '@/types';
import { Register } from '../register/Register';
import { SignIn } from '../sign_in/SignIn';
import { abrirCuenta, Destino, llamadasA, type NucleoDePrueba } from './pruebas';

const BIENVENIDA = '¡Bienvenido, Ana Gómez! Tu cuenta fue creada correctamente.';

async function desde(pantalla: 'sign_in' | 'register', conectado = true) {
  const nucleo = await abrirCuenta(
    pantalla,
    pantalla === 'register'
      ? { register: Register }
      : {
          sign_in: SignIn,
          register: () => <Destino nombre="Registro" />,
          recovery: () => <Destino nombre="Recuperar contraseña" />,
        },
    conectado,
  );
  nucleo.responder('auth_google_start', () => ({
    ok: true,
    value: { expires_at: new Date(Date.now() + 300_000).toISOString() },
  }));
  return nucleo;
}

async function continuarConGoogle() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
  });
}

/** Google regresó y el Núcleo emitió EV-02 (y EV-01 si inició la sesión). */
function resultado(nucleo: NucleoDePrueba, carga: EventMap['auth_google_result']) {
  nucleo.emitir('auth_google_result', carga);
  if (carga.status === 'success') {
    nucleo.emitir('session_changed', { state: 'signed_in', alias: carga.alias, reason: 'sign_in' });
  }
}

afterEach(cleanup);

describe('HE-01-HU05 · Iniciar sesión con la cuenta de Google', () => {
  it('HE-01-HU05-CA01 · Iniciar sesión con Google sin cuenta previa', async () => {
    const nucleo = await desde('sign_in');
    await continuarConGoogle();
    expect(llamadasA(nucleo, 'auth_google_start')).toEqual([{ comando: 'auth_google_start', params: {} }]);
    resultado(nucleo, { status: 'success', is_new_account: true, alias: 'Ana Gómez', message: BIENVENIDA });
    // RT-01: abre el Planificador diario con el mensaje de bienvenida.
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(BIENVENIDA);
  });

  it('HE-01-HU05-CA02 · Iniciar sesión con Google con cuenta existente', async () => {
    const nucleo = await desde('sign_in');
    await continuarConGoogle();
    resultado(nucleo, { status: 'success', is_new_account: false, alias: 'Anita', message: '' });
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('HE-01-HU05-CA03 · Nombre de la cuenta de Google de más de 30 caracteres', async () => {
    // El Núcleo recorta el alias (ca_he_01_hu05_ca03); la vista muestra el mensaje con el alias recortado.
    const nucleo = await desde('sign_in');
    await continuarConGoogle();
    const mensaje = '¡Bienvenido, María Fernanda de los Ángeles! Tu cuenta fue creada correctamente.';
    resultado(nucleo, {
      status: 'success',
      is_new_account: true,
      alias: 'María Fernanda de los Ángeles',
      message: mensaje,
    });
    expect(screen.getByRole('status').textContent).toContain(mensaje);
  });

  it('HE-01-HU05-CA04 · Cuenta de Google sin nombre', async () => {
    const nucleo = await desde('sign_in');
    await continuarConGoogle();
    const mensaje = '¡Bienvenido, juan.vela! Tu cuenta fue creada correctamente.';
    resultado(nucleo, { status: 'success', is_new_account: true, alias: 'juan.vela', message: mensaje });
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(mensaje);
  });

  it('HE-01-HU05-CA05 · Cancelar el inicio de sesión con Google', async () => {
    const nucleo = await desde('sign_in');
    await continuarConGoogle();
    resultado(nucleo, { status: 'cancelled', message: 'Se canceló el inicio de sesión con Google.' });
    expect(screen.getByRole('alert').textContent).toBe('Se canceló el inicio de sesión con Google.');
    expect(screen.getByRole('main', { name: 'Inicio de sesión' })).toBeTruthy();
  });

  it('HE-01-HU05-CA06 · Error del servicio de Google', async () => {
    const nucleo = await desde('sign_in');
    await continuarConGoogle();
    resultado(nucleo, {
      status: 'error',
      message: 'No fue posible iniciar sesión con Google. Intenta de nuevo.',
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'No fue posible iniciar sesión con Google. Intenta de nuevo.',
    );
    expect(screen.queryByRole('main', { name: 'Planificador diario' })).toBeNull();
  });

  it('HE-01-HU05-CA07 · Iniciar sesión con Google sin conexión', async () => {
    for (const pantalla of ['sign_in', 'register'] as const) {
      const nucleo = await desde(pantalla, false);
      const google = screen.getByRole('button', { name: 'Continuar con Google' });
      expect(google.hasAttribute('disabled')).toBe(true);
      await continuarConGoogle();
      expect(llamadasA(nucleo, 'auth_google_start')).toHaveLength(0);
      cleanup();
    }
    // Si la conexión se pierde al seleccionarlo, el Núcleo responde net.offline y no abre la ventana de Google.
    const nucleo = await desde('sign_in');
    nucleo.responder('auth_google_start', () => ({
      ok: false,
      error: { code: 'net.offline', message: 'No hay conexión a internet. Conéctate para iniciar sesión.' },
    }));
    await continuarConGoogle();
    expect(screen.getByRole('alert').textContent).toBe(
      'No hay conexión a internet. Conéctate para iniciar sesión.',
    );
    expect(screen.getByRole('button', { name: 'Continuar con Google' }).hasAttribute('disabled')).toBe(true);
  });

  it('HE-01-HU05-CA08 · Correo de Google de más de 64 caracteres', async () => {
    const nucleo = await desde('sign_in');
    await continuarConGoogle();
    resultado(nucleo, {
      status: 'email_too_long',
      message:
        'No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.',
    });
    const aviso = screen.getByRole('alert');
    expect(aviso.textContent).toBe(
      'No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.',
    );
    await act(async () => {
      fireEvent.click(within(aviso).getByRole('link', { name: 'Regístrate' }));
    });
    expect(screen.getByRole('main', { name: 'Registro' })).toBeTruthy();
  });

  it('HE-01-HU05-CA09 · Continuar con Google desde Registro', async () => {
    const nucleo = await desde('register');
    fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'Otro alias' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'otro@example.com' } });
    await continuarConGoogle();
    // ET11: no toma los datos del formulario ni pide el código de verificación.
    expect(llamadasA(nucleo, 'auth_google_start')).toEqual([{ comando: 'auth_google_start', params: {} }]);
    expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(0);
    resultado(nucleo, { status: 'success', is_new_account: true, alias: 'Ana Gómez', message: BIENVENIDA });
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(BIENVENIDA);
  });
});

describe('Rediseño · Error sin texto', () => {
  it('RD-24 · Si «Continuar con Google» falla sin texto, se muestra el aviso de error inesperado', async () => {
    const nucleo = await desde('sign_in');
    nucleo.responder('auth_google_start', () => ({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    }));
    await continuarConGoogle();
    expect(screen.getByRole('alert').textContent).toBe('Ocurrió un error inesperado. Intenta de nuevo.');
  });
});
