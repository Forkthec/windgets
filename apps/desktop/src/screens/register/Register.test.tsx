// HE-01-HU01 · Registrar una cuenta con alias y correo electrónico. Una prueba por CA (criterio de aceptación)
// en la vista; las reglas del Núcleo tienen su prueba ca_he_01_hu01_* en servicio_de_sesion.rs.
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { abrirCuenta, Destino, llamadasA } from '../cuenta/pruebas';
import { Register } from './Register';

const CORRECTOS = {
  Alias: 'Ana',
  'Correo electrónico': 'ana@example.com',
  Contraseña: 'Clave123',
  'Confirmar contraseña': 'Clave123',
};
type Etiqueta = keyof typeof CORRECTOS;

function diligenciar(valores: Partial<Record<Etiqueta, string>>) {
  for (const [etiqueta, valor] of Object.entries({ ...CORRECTOS, ...valores })) {
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
  }
}

async function crearCuenta() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  });
}

/** Texto del mensaje de campo que quedó debajo del campo (RT-04). */
function textoDebajoDe(etiqueta: string) {
  const id = screen.getByLabelText(etiqueta).getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent : undefined;
}

async function registro(conectado = true) {
  const nucleo = await abrirCuenta(
    'register',
    { register: Register, recovery: () => <Destino nombre="Recuperar contraseña" /> },
    conectado,
  );
  const ahora = Date.now();
  nucleo.responder('auth_register_start', () => ({
    ok: true,
    value: {
      resend_available_at: new Date(ahora + 60_000).toISOString(),
      expires_at: new Date(ahora + 600_000).toISOString(),
    },
    result_message: {
      code: 'auth_register_start',
      message: 'Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.',
    },
  }));
  return nucleo;
}

/** El formulario no se envió al Núcleo y el mensaje quedó debajo del campo. */
async function rechazaEnLaVista(valores: Partial<Record<Etiqueta, string>>, etiqueta: string, texto: string) {
  const nucleo = await registro();
  diligenciar(valores);
  await crearCuenta();
  expect(textoDebajoDe(etiqueta)).toBe(texto);
  expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(0);
}

async function correoRegistrado() {
  const nucleo = await registro();
  nucleo.responder('auth_register_start', () => ({
    ok: false,
    error: { code: 'email.already_registered', message: 'Este correo electrónico ya está registrado.' },
  }));
  diligenciar({ 'Correo electrónico': ' usuario.prueba@example.com ' });
  await crearCuenta();
  return screen.getByText('Este correo electrónico ya está registrado.', { exact: false });
}

describe('HE-01-HU01 · Registro', () => {
  it('HE-01-HU01-CA01 · Enviar el código de verificación con datos válidos', async () => {
    const nucleo = await registro();
    // ET01 y ET14: los cuatro campos vacíos, los dos botones y el hipervínculo del texto de ayuda.
    for (const etiqueta of Object.keys(CORRECTOS)) {
      expect(screen.getByLabelText(etiqueta)).toHaveProperty('value', '');
    }
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeTruthy();
    expect(screen.getByText(/¿Ya tienes cuenta\?/).textContent).toBe('¿Ya tienes cuenta? Iniciar sesión');
    diligenciar({ Alias: '  Ana ', 'Correo electrónico': ' ana@example.com ' });
    await crearCuenta();
    expect(llamadasA(nucleo, 'auth_register_start')[0]?.params).toEqual({
      alias: '  Ana ',
      email: 'ana@example.com', // el campo de tipo correo no guarda los espacios de los extremos
      password: 'Clave123',
      password_confirmation: 'Clave123',
    });
    expect(screen.getByRole('status').textContent).toContain(
      'Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.',
    );
    expect(screen.queryByRole('form', { name: 'Formulario' })).toBeNull();
  });

  it('HE-01-HU01-CA02 · Alias vacío o formado solo por espacios', async () => {
    await rechazaEnLaVista({ Alias: '   ' }, 'Alias', 'Este campo es obligatorio.');
  });

  it('HE-01-HU01-CA03 · Alias de más de 30 caracteres', async () => {
    await rechazaEnLaVista(
      { Alias: 'a'.repeat(31) },
      'Alias',
      'El alias no puede superar los 30 caracteres.',
    );
  });

  it('HE-01-HU01-CA04 · Alias que ya tiene otra cuenta', async () => {
    const nucleo = await registro();
    diligenciar({ Alias: 'Prueba' });
    await crearCuenta();
    expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(1);
    expect(screen.queryByRole('form', { name: 'Formulario' })).toBeNull();
  });

  it('HE-01-HU01-CA05 · Correo electrónico vacío', async () => {
    await rechazaEnLaVista({ 'Correo electrónico': '' }, 'Correo electrónico', 'Este campo es obligatorio.');
  });

  it('HE-01-HU01-CA06 · Correo electrónico con formato inválido', async () => {
    await rechazaEnLaVista(
      { 'Correo electrónico': 'ana@example' },
      'Correo electrónico',
      'Diligencia un correo electrónico válido.',
    );
  });

  it('HE-01-HU01-CA07 · Correo electrónico de más de 64 caracteres', async () => {
    await rechazaEnLaVista(
      { 'Correo electrónico': `${'a'.repeat(53)}@example.com` },
      'Correo electrónico',
      'El correo electrónico no puede superar los 64 caracteres.',
    );
  });

  it('HE-01-HU01-CA08 · Correo electrónico que ya tiene una cuenta', async () => {
    const mensaje = await correoRegistrado();
    expect(within(mensaje).getByRole('link', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(within(mensaje).getByRole('link', { name: 'Recuperar contraseña' })).toBeTruthy();
    expect(screen.getByRole('form', { name: 'Formulario' })).toBeTruthy();
  });

  it('HE-01-HU01-CA09 · Ir a Inicio de sesión desde un correo ya registrado', async () => {
    const mensaje = await correoRegistrado();
    fireEvent.click(within(mensaje).getByRole('link', { name: 'Iniciar sesión' }));
    const destino = screen.getByRole('main', { name: 'Inicio de sesión' });
    expect(destino.textContent).toBe('Correo: usuario.prueba@example.com');
  });

  it('HE-01-HU01-CA10 · Ir a Recuperar contraseña desde un correo ya registrado', async () => {
    const mensaje = await correoRegistrado();
    fireEvent.click(within(mensaje).getByRole('link', { name: 'Recuperar contraseña' }));
    const destino = screen.getByRole('main', { name: 'Recuperar contraseña' });
    expect(destino.textContent).toBe('Correo: usuario.prueba@example.com');
  });

  it('HE-01-HU01-CA11 · Ir a Inicio de sesión desde el texto de ayuda del formulario', async () => {
    const nucleo = await registro();
    fireEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }));
    expect(screen.getByRole('main', { name: 'Inicio de sesión' })).toBeTruthy();
    expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(0);
  });

  it('HE-01-HU01-CA12 · Registrar la cuenta sin conexión', async () => {
    const nucleo = await registro(false);
    diligenciar({});
    // ET11: el aviso va en la parte superior del formulario.
    const formulario = screen.getByRole('form', { name: 'Formulario' });
    const aviso = within(formulario).getByRole('alert');
    expect(aviso.textContent).toBe('No hay conexión a internet. Conéctate para crear tu cuenta.');
    expect(formulario.firstElementChild).toBe(aviso);
    // ET12: los dos botones deshabilitados hasta que vuelva la conexión.
    const crear = screen.getByRole('button', { name: 'Crear cuenta' });
    const google = screen.getByRole('button', { name: 'Continuar con Google' });
    expect([crear.hasAttribute('disabled'), google.hasAttribute('disabled')]).toEqual([true, true]);
    await crearCuenta();
    expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(0);
    // ET13: no se borran los datos del formulario.
    expect(screen.getByLabelText('Alias')).toHaveProperty('value', 'Ana');
    nucleo.emitir('connectivity_changed', { online: true });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(crear.hasAttribute('disabled')).toBe(false);
  });

  it('HE-01-HU01-CA12 · La conexión se pierde al crear la cuenta (net.offline)', async () => {
    const nucleo = await registro();
    nucleo.responder('auth_register_start', () => ({
      ok: false,
      error: { code: 'net.offline', message: 'No hay conexión a internet. Conéctate para crear tu cuenta.' },
    }));
    diligenciar({});
    await crearCuenta();
    expect(screen.getByRole('alert').textContent).toBe(
      'No hay conexión a internet. Conéctate para crear tu cuenta.',
    );
    expect(screen.getByRole('button', { name: 'Crear cuenta' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByLabelText('Correo electrónico')).toHaveProperty('value', 'ana@example.com');
  });

  it('RT-04-CA13 · Servicio de cuentas sin respuesta en Registro', async () => {
    const nucleo = await registro();
    nucleo.responder('auth_register_start', () => ({
      ok: false,
      error: {
        code: 'service.unavailable',
        message: 'No pudimos completar la operación. Intenta de nuevo más tarde.',
      },
    }));
    diligenciar({});
    await crearCuenta();
    expect(screen.getByRole('alert').textContent).toBe(
      'No pudimos completar la operación. Intenta de nuevo más tarde.',
    );
    expect(screen.getByRole('form', { name: 'Formulario' })).toBeTruthy();
  });
});

const INVALIDA =
  'La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.';

describe('HE-01-HU02 · Contraseña del registro', () => {
  it('HE-01-HU02-CA01 · Crear la contraseña con valores válidos', async () => {
    for (const clave of ['Clave123', `Aa1${'x'.repeat(61)}`]) {
      const nucleo = await registro();
      diligenciar({ Contraseña: clave, 'Confirmar contraseña': clave });
      await crearCuenta();
      expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(1);
      expect(screen.queryByRole('form', { name: 'Formulario' })).toBeNull();
      cleanup();
    }
  });

  it('HE-01-HU02-CA02 · Formulario sin ningún campo diligenciado', async () => {
    const nucleo = await registro();
    await crearCuenta();
    for (const etiqueta of ['Alias', 'Correo electrónico', 'Contraseña', 'Confirmar contraseña']) {
      expect(textoDebajoDe(etiqueta)).toBe('Este campo es obligatorio.');
    }
    // RT-04: el cursor va al primer campo con error.
    expect(document.activeElement).toBe(screen.getByLabelText('Alias'));
    expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(0);
  });

  it('HE-01-HU02-CA03 · Contraseña vacía', async () => {
    await rechazaEnLaVista({ Contraseña: '' }, 'Contraseña', 'Este campo es obligatorio.');
  });

  it('HE-01-HU02-CA04 · Contraseña de menos de 8 caracteres', async () => {
    await rechazaEnLaVista(
      { Contraseña: 'Clave12', 'Confirmar contraseña': 'Clave12' },
      'Contraseña',
      INVALIDA,
    );
  });

  it('HE-01-HU02-CA05 · Contraseña de más de 64 caracteres', async () => {
    const clave = `Aa1${'x'.repeat(62)}`;
    await rechazaEnLaVista({ Contraseña: clave, 'Confirmar contraseña': clave }, 'Contraseña', INVALIDA);
  });

  it('HE-01-HU02-CA06 · Contraseña sin mayúscula, minúscula o número', async () => {
    for (const clave of ['clave123', 'CLAVE123', 'ClaveClave']) {
      await rechazaEnLaVista({ Contraseña: clave, 'Confirmar contraseña': clave }, 'Contraseña', INVALIDA);
      cleanup();
    }
  });

  it('HE-01-HU02-CA07 · Confirmación de contraseña vacía', async () => {
    await rechazaEnLaVista(
      { 'Confirmar contraseña': '' },
      'Confirmar contraseña',
      'Este campo es obligatorio.',
    );
  });

  it('HE-01-HU02-CA08 · Contraseñas distintas', async () => {
    await rechazaEnLaVista(
      { 'Confirmar contraseña': 'Clave124' },
      'Confirmar contraseña',
      'Las contraseñas no coinciden.',
    );
  });
});
