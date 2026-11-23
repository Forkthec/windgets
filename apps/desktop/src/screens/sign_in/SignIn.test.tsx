// HE-01-HU04 · Inicio de sesión con correo y contraseña. Una prueba por CA (criterio de aceptación) en la vista;
// las reglas del Núcleo tienen su prueba ca_he_01_hu04_* en servicio_de_sesion.rs.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke } from '@/types';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';
import { abrirCuenta, Destino, llamadasA } from '../cuenta/pruebas';
import { SignIn } from './SignIn';

const CORRECTOS = { 'Correo electrónico': 'ana@example.com', Contraseña: 'Clave123' };
type Etiqueta = keyof typeof CORRECTOS;

function diligenciar(valores: Partial<Record<Etiqueta, string>>) {
  for (const [etiqueta, valor] of Object.entries({ ...CORRECTOS, ...valores })) {
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
  }
}

async function iniciar() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
  });
}

/** Texto del mensaje de campo que quedó debajo del campo (RT-04). */
function textoDebajoDe(etiqueta: string) {
  const id = screen.getByLabelText(etiqueta).getAttribute('aria-describedby');
  // Con ayuda fija (RD-11) `aria-describedby` también lleva el id de la ayuda: se toma solo el del mensaje.
  const mensaje = id?.split(' ').find((parte) => parte.endsWith('-mensaje'));
  return mensaje ? document.getElementById(mensaje)?.textContent : undefined;
}

async function inicio(conectado = true) {
  const nucleo = await abrirCuenta(
    'sign_in',
    {
      sign_in: SignIn,
      register: () => <Destino nombre="Registro" />,
      recovery: () => <Destino nombre="Recuperar contraseña" />,
    },
    conectado,
  );
  nucleo.responder('auth_sign_in', () => ({ ok: true, value: { user_id: 'u1', alias: 'Ana' } }));
  return nucleo;
}

/** El formulario no se envió al Núcleo y el mensaje quedó debajo del campo. */
async function rechazaEnLaVista(
  valores: Partial<Record<Etiqueta, string>>,
  mensajes: Partial<Record<Etiqueta, string>>,
) {
  const nucleo = await inicio();
  diligenciar(valores);
  await iniciar();
  for (const [etiqueta, texto] of Object.entries(mensajes)) expect(textoDebajoDe(etiqueta)).toBe(texto);
  expect(llamadasA(nucleo, 'auth_sign_in')).toHaveLength(0);
}

afterEach(cleanup);

describe('HE-01-HU04 · Inicio de sesión', () => {
  it('HE-01-HU04-CA01 · Iniciar sesión con credenciales válidas', async () => {
    const nucleo = await inicio();
    // ET01: campos vacíos, «Iniciar sesión», «Continuar con Google» y los dos hipervínculos.
    for (const etiqueta of Object.keys(CORRECTOS)) {
      expect(screen.getByLabelText(etiqueta)).toHaveProperty('value', '');
    }
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeTruthy();
    expect(screen.getByText(/¿No tienes cuenta\?/).textContent).toBe('¿No tienes cuenta? Regístrate');
    diligenciar({ 'Correo electrónico': ' ana@example.com ' });
    await iniciar();
    expect(llamadasA(nucleo, 'auth_sign_in')[0]?.params).toEqual({
      email: 'ana@example.com', // el campo de tipo correo no guarda los espacios de los extremos
      password: 'Clave123',
    });
    // RT-01: abre la pantalla principal (Planificador diario).
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
  });

  it('HE-01-HU04-CA02 · Abrir la aplicación con la sesión recordada (con o sin conexión)', async () => {
    for (const conectado of [true, false]) {
      const llamadas: string[] = [];
      const invocar = ((comando: string) => {
        llamadas.push(comando);
        if (comando === 'auth_get_session') {
          return Promise.resolve({ ok: true, value: { state: 'signed_in', alias: 'Ana', token: 'valid' } });
        }
        if (comando === 'connectivity_get')
          return Promise.resolve({ ok: true, value: { online: conectado } });
        return Promise.resolve({ ok: false, error: { code: 'internal.unexpected', message: '' } });
      }) as unknown as Invoke;
      const escuchar = (() => () => {}) as unknown as Escuchar;
      render(
        <VentanaPrincipal invocar={invocar} escuchar={escuchar} pantallasDeCuenta={{ sign_in: SignIn }} />,
      );
      await act(async () => {});
      expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
      expect(screen.queryByLabelText('Contraseña')).toBeNull();
      expect(llamadas).not.toContain('auth_sign_in'); // no pide credenciales
      cleanup();
    }
  });

  it('HE-01-HU04-CA03 · Iniciar sesión sin diligenciar ningún campo', async () => {
    await rechazaEnLaVista(
      { 'Correo electrónico': '', Contraseña: '' },
      { 'Correo electrónico': 'Este campo es obligatorio.', Contraseña: 'Este campo es obligatorio.' },
    );
  });

  it('HE-01-HU04-CA04 · Iniciar sesión sin diligenciar el correo electrónico', async () => {
    await rechazaEnLaVista(
      { 'Correo electrónico': '' },
      { 'Correo electrónico': 'Este campo es obligatorio.' },
    );
  });

  it('HE-01-HU04-CA05 · Iniciar sesión sin diligenciar la contraseña', async () => {
    await rechazaEnLaVista({ Contraseña: '' }, { Contraseña: 'Este campo es obligatorio.' });
  });

  it('HE-01-HU04-CA06 · Correo electrónico con formato inválido', async () => {
    await rechazaEnLaVista(
      { 'Correo electrónico': 'ana@example' },
      { 'Correo electrónico': 'Diligencia un correo electrónico válido.' },
    );
  });

  it('HE-01-HU04-CA07 · Correo electrónico de más de 64 caracteres', async () => {
    await rechazaEnLaVista(
      { 'Correo electrónico': `${'a'.repeat(53)}@example.com` },
      { 'Correo electrónico': 'El correo electrónico no puede superar los 64 caracteres.' },
    );
  });

  it('HE-01-HU04-CA08 · Correo no registrado o contraseña incorrecta', async () => {
    const nucleo = await inicio();
    nucleo.responder('auth_sign_in', () => ({
      ok: false,
      error: { code: 'auth.invalid_credentials', message: 'Correo electrónico o contraseña incorrectos.' },
    }));
    diligenciar({});
    await iniciar();
    expect(screen.getByRole('alert').textContent).toBe('Correo electrónico o contraseña incorrectos.');
    expect(screen.getByLabelText('Correo electrónico')).toHaveProperty('value', 'ana@example.com');
    expect(screen.queryByRole('main', { name: 'Planificador diario' })).toBeNull();
  });

  it('HE-01-HU04-CA09 · Demasiados intentos', async () => {
    const nucleo = await inicio();
    nucleo.responder('auth_sign_in', () => ({
      ok: false,
      error: {
        code: 'auth.rate_limited',
        message: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
      },
    }));
    diligenciar({});
    await iniciar();
    expect(screen.getByRole('alert').textContent).toBe(
      'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
    );
  });

  it('HE-01-HU04-CA10 · Iniciar sesión sin conexión', async () => {
    const nucleo = await inicio(false);
    diligenciar({});
    // ET09: el aviso va en la parte superior; ET10: botones deshabilitados hasta que vuelva la conexión.
    const formulario = screen.getByRole('form', { name: 'Formulario' });
    const aviso = screen.getByRole('alert');
    expect(aviso.textContent).toBe('No hay conexión a internet. Conéctate para iniciar sesión.');
    expect(formulario.firstElementChild).toBe(aviso);
    const entrar = screen.getByRole('button', { name: 'Iniciar sesión' });
    const google = screen.getByRole('button', { name: 'Continuar con Google' });
    expect([entrar.hasAttribute('disabled'), google.hasAttribute('disabled')]).toEqual([true, true]);
    await iniciar();
    expect(llamadasA(nucleo, 'auth_sign_in')).toHaveLength(0);
    expect(screen.getByLabelText('Correo electrónico')).toHaveProperty('value', 'ana@example.com');
    nucleo.emitir('connectivity_changed', { online: true });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(entrar.hasAttribute('disabled')).toBe(false);
  });

  it('HE-01-HU04-CA10 · La conexión se pierde al iniciar sesión (net.offline)', async () => {
    const nucleo = await inicio();
    nucleo.responder('auth_sign_in', () => ({
      ok: false,
      error: { code: 'net.offline', message: 'No hay conexión a internet. Conéctate para iniciar sesión.' },
    }));
    diligenciar({});
    await iniciar();
    expect(screen.getByRole('alert').textContent).toBe(
      'No hay conexión a internet. Conéctate para iniciar sesión.',
    );
    expect(screen.getByRole('button', { name: 'Iniciar sesión' }).hasAttribute('disabled')).toBe(true);
  });

  it('HE-01-HU04-CA11 · Ir a Recuperar contraseña', async () => {
    const nucleo = await inicio();
    diligenciar({});
    fireEvent.click(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }));
    expect(screen.getByRole('main', { name: 'Recuperar contraseña' }).textContent).toBe(
      'Correo: ana@example.com',
    );
    expect(llamadasA(nucleo, 'auth_sign_in')).toHaveLength(0);
  });

  it('HE-01-HU04-CA12 · Ir a Registro', async () => {
    const nucleo = await inicio();
    fireEvent.click(screen.getByRole('link', { name: 'Regístrate' }));
    expect(screen.getByRole('main', { name: 'Registro' })).toBeTruthy();
    expect(llamadasA(nucleo, 'auth_sign_in')).toHaveLength(0);
  });
});

// docs/rediseno.md: textos y elementos del Figma en Inicio de sesión.
describe('Rediseño · Inicio de sesión', () => {
  it('RD-08, RD-11, RD-13 · Título, subtítulo, Windi, campos obligatorios y el divisor «o»', async () => {
    await inicio();
    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido a Windgets' })).toBeTruthy();
    expect(screen.getByText('Qué bueno verte de nuevo.')).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Windi' }).textContent).toContain(
      '¿Qué organizamos hoy?',
    );
    for (const etiqueta of Object.keys(CORRECTOS)) {
      expect(screen.getByLabelText(etiqueta).getAttribute('aria-required')).toBe('true');
    }
    const orden = Array.from(document.querySelectorAll('.wg-nota button, .wg-nota .wg-divisor')).map(
      (e) => e.textContent,
    );
    expect(orden).toEqual(['Iniciar sesión', 'o', 'Continuar con Google']);
  });
});

describe('Rediseño · Error sin texto', () => {
  it('RD-24 · Un error del Núcleo sin texto muestra el aviso de error inesperado', async () => {
    const nucleo = await inicio();
    nucleo.responder('auth_sign_in', () => ({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    }));
    diligenciar({});
    await iniciar();
    expect(screen.getByRole('alert').textContent).toBe('Ocurrió un error inesperado. Intenta de nuevo.');
  });
});
