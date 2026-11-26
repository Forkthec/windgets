// HE-01-HU01 a HU03 · Registro: formulario, contraseña y verificación del correo. Una prueba por CA (criterio
// de aceptación) en la vista; las reglas del Núcleo tienen su prueba ca_he_01_hu0n_* en servicio_de_sesion.rs.
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  // Con ayuda fija (RD-11) `aria-describedby` también lleva el id de la ayuda: se toma solo el del mensaje.
  const mensaje = id?.split(' ').find((parte) => parte.endsWith('-mensaje'));
  return mensaje ? document.getElementById(mensaje)?.textContent : undefined;
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
    expect(screen.getByText(/¿Ya tienes cuenta\?/).textContent).toBe('¿Ya tienes cuenta? Inicia sesión');
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
    fireEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }));
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

/** Llega al paso Verificar correo con el código enviado; el reenvío queda disponible en `reenvioEnMs`. */
async function enVerificar(conectado = true, reenvioEnMs = 60_000) {
  const nucleo = await registro();
  const ahora = Date.now();
  nucleo.responder('auth_register_start', () => ({
    ok: true,
    value: {
      resend_available_at: new Date(ahora + reenvioEnMs).toISOString(),
      expires_at: new Date(ahora + 600_000).toISOString(),
    },
  }));
  nucleo.responder('auth_register_verify', () => ({
    ok: true,
    value: { alias: 'Ana' },
    result_message: {
      code: 'auth_register_verify',
      message: '¡Bienvenido, Ana! Tu cuenta fue creada correctamente.',
      params: { alias: 'Ana' },
    },
  }));
  diligenciar({});
  await crearCuenta();
  if (!conectado) nucleo.emitir('connectivity_changed', { online: false });
  return nucleo;
}

function escribirCodigo(codigo: string) {
  fireEvent.change(screen.getByLabelText('Código de verificación'), { target: { value: codigo } });
}

async function seleccionar(nombre: string, rol: 'button' | 'link' = 'button') {
  await act(async () => {
    fireEvent.click(screen.getByRole(rol, { name: nombre }));
  });
}

type Nucleo = Awaited<ReturnType<typeof enVerificar>>;

function errorAlVerificar(nucleo: Nucleo, code: 'code.incorrect' | 'code.expired', message: string) {
  nucleo.responder('auth_register_verify', () => ({ ok: false, error: { code, message, field: 'code' } }));
}

describe('HE-01-HU03 · Verificar el correo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('HE-01-HU03-CA01 · Verificar el correo y crear la cuenta', async () => {
    const nucleo = await enVerificar();
    // ET01: campo, «Verificar», «Reenviar código» y «Regresar». docs/rediseno.md RD-16: el texto del Figma ya no
    // muestra el correo.
    const paso = screen.getByRole('region', { name: 'Verificar correo' });
    expect(within(paso).getByText('Escribe el código que enviamos a tu correo.')).toBeTruthy();
    expect(within(paso).queryByText('ana@example.com')).toBeNull();
    expect(within(paso).getByRole('link', { name: 'Reenviar código' })).toBeTruthy();
    expect(within(paso).getByRole('button', { name: 'Regresar' })).toBeTruthy();
    escribirCodigo('482913');
    await seleccionar('Verificar');
    expect(llamadasA(nucleo, 'auth_register_verify')[0]?.params).toEqual({ code: '482913' });
    // RT-01: abre la pantalla principal (Planificador diario) con el mensaje de bienvenida.
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      '¡Bienvenido, Ana! Tu cuenta fue creada correctamente.',
    );
  });

  it('HE-01-HU03-CA02 · Código de verificación vacío', async () => {
    const nucleo = await enVerificar();
    await seleccionar('Verificar');
    expect(textoDebajoDe('Código de verificación')).toBe('Este campo es obligatorio.');
    expect(llamadasA(nucleo, 'auth_register_verify')).toHaveLength(0);
  });

  it('HE-01-HU03-CA03 · Código de verificación incorrecto', async () => {
    const nucleo = await enVerificar();
    errorAlVerificar(nucleo, 'code.incorrect', 'El código no es correcto. Revísalo e intenta de nuevo.');
    escribirCodigo('000000');
    await seleccionar('Verificar');
    expect(textoDebajoDe('Código de verificación')).toBe(
      'El código no es correcto. Revísalo e intenta de nuevo.',
    );
    expect(screen.getByRole('region', { name: 'Verificar correo' })).toBeTruthy();
  });

  it('HE-01-HU03-CA04 · Código de verificación vencido', async () => {
    const nucleo = await enVerificar();
    errorAlVerificar(nucleo, 'code.expired', 'El código venció. Solicita uno nuevo.');
    escribirCodigo('482913');
    await seleccionar('Verificar');
    expect(textoDebajoDe('Código de verificación')).toBe('El código venció. Solicita uno nuevo.');
    expect(screen.getByRole('region', { name: 'Verificar correo' })).toBeTruthy();
  });

  it('HE-01-HU03-CA05 · Superar el límite de intentos de verificación', async () => {
    const nucleo = await enVerificar();
    nucleo.responder('auth_register_verify', () => ({
      ok: false,
      error: {
        code: 'auth.rate_limited',
        message: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
      },
    }));
    escribirCodigo('482913');
    await seleccionar('Verificar');
    expect(screen.getByRole('alert').textContent).toBe(
      'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
    );
    expect(screen.getByRole('region', { name: 'Verificar correo' })).toBeTruthy();
  });

  it('HE-01-HU03-CA06 · Reenviar el código de verificación', async () => {
    const nucleo = await enVerificar(true, 0);
    nucleo.responder('auth_register_resend', () => ({
      ok: true,
      value: { resend_available_at: new Date(Date.now() + 60_000).toISOString() },
      result_message: { code: 'auth_register_resend', message: 'Te enviamos un nuevo código.' },
    }));
    await seleccionar('Reenviar código', 'link');
    expect(llamadasA(nucleo, 'auth_register_resend')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toContain('Te enviamos un nuevo código.');
    // Tras el reenvío vuelve la espera de 60 s (ET05).
    expect(screen.getByText(/^Puedes pedir un nuevo código en (60|59) s\.$/)).toBeTruthy();
  });

  it('HE-01-HU03-CA07 · Reenviar antes de 60 segundos', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const nucleo = await enVerificar(true, 3_000);
    const enlace = screen.getByRole('link', { name: 'Reenviar código' });
    expect(enlace.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('Puedes pedir un nuevo código en 3 s.')).toBeTruthy();
    await seleccionar('Reenviar código', 'link');
    expect(llamadasA(nucleo, 'auth_register_resend')).toHaveLength(0);
    // ET13: los segundos se actualizan cada segundo y el hipervínculo se habilita al llegar a 0.
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByText('Puedes pedir un nuevo código en 2 s.')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.queryByText(/Puedes pedir un nuevo código/)).toBeNull();
    expect(enlace.getAttribute('aria-disabled')).toBeNull();
  });

  it('HE-01-HU03-CA08 · Regresar al formulario para corregir los datos', async () => {
    const nucleo = await enVerificar();
    await seleccionar('Regresar');
    expect(llamadasA(nucleo, 'auth_register_cancel')).toHaveLength(1);
    expect(screen.getByRole('form', { name: 'Formulario' })).toBeTruthy();
    expect(screen.getByLabelText('Alias')).toHaveProperty('value', 'Ana');
    expect(screen.getByLabelText('Correo electrónico')).toHaveProperty('value', 'ana@example.com');
  });

  it('HE-01-HU03-CA09 · Verificar el correo sin conexión', async () => {
    const nucleo = await enVerificar(false, 0);
    escribirCodigo('482913');
    const paso = screen.getByRole('region', { name: 'Verificar correo' });
    // ET14 y docs/rediseno.md RD-16: el aviso arriba del paso, debajo de la miga de pan, el título y el subtítulo.
    const aviso = within(paso).getByRole('alert');
    expect(aviso.textContent).toBe('No hay conexión a internet. Conéctate para crear tu cuenta.');
    expect(paso.children[3]).toBe(aviso);
    // RD-18: debajo de las acciones, por qué «Verificar» está deshabilitado.
    expect(within(paso).getByText('Verificar requiere conexión a internet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Verificar' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('link', { name: 'Reenviar código' }).getAttribute('aria-disabled')).toBe('true');
    await seleccionar('Verificar');
    await seleccionar('Reenviar código', 'link');
    expect(llamadasA(nucleo, 'auth_register_verify')).toHaveLength(0);
    expect(llamadasA(nucleo, 'auth_register_resend')).toHaveLength(0);
    // ET15: no avanza y conserva lo diligenciado hasta que vuelve la conexión.
    expect(screen.getByLabelText('Código de verificación')).toHaveProperty('value', '482913');
    nucleo.emitir('connectivity_changed', { online: true });
    expect(screen.getByRole('button', { name: 'Verificar' }).hasAttribute('disabled')).toBe(false);
  });
});

// docs/rediseno.md: textos y elementos del Figma en Registro > Formulario.
describe('Rediseño · Registro', () => {
  afterEach(cleanup);

  it('RD-08, RD-09 · Título, subtítulo, Windi y el paso Formulario marcado', async () => {
    await registro();
    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeTruthy();
    expect(screen.getByText('Solo te toma un minuto.')).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Windi' }).textContent).toContain('¿Creamos tu cuenta?');
    const pasos = screen.getByRole('list', { name: 'Pasos' });
    expect(
      within(pasos)
        .getAllByRole('listitem')
        .map((p) => p.textContent),
    ).toEqual(['1Formulario', '2Verificar correo']);
    expect(pasos.querySelector('[aria-current="step"]')?.textContent).toBe('1Formulario');
  });

  it('RD-10, RD-11 · Contadores, ayuda fija de la contraseña y campos obligatorios', async () => {
    await registro();
    fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'Ana' } });
    expect(screen.getByText('3/30')).toBeTruthy();
    // Correo y Contraseña llevan 64; Confirmar contraseña no lleva contador.
    expect(screen.getAllByText('0/64')).toHaveLength(2);
    const ayuda = '8 a 64 caracteres con al menos una mayúscula, una minúscula y un número.';
    expect(screen.getByLabelText('Contraseña').getAttribute('aria-describedby')).toContain(
      screen.getByText(ayuda).id,
    );
    for (const etiqueta of Object.keys(CORRECTOS)) {
      expect(screen.getByLabelText(etiqueta).getAttribute('aria-required')).toBe('true');
    }
  });

  it('RD-12 · «Crear cuenta», divisor, «Continuar con Google» y «Inicia sesión» en ese orden', async () => {
    await registro();
    const formulario = screen.getByRole('form', { name: 'Formulario' });
    // RD-81: sin el ojo de las contraseñas.
    const orden = Array.from(formulario.querySelectorAll('button:not(.wg-campo__ojo), .wg-divisor, a')).map(
      (e) => e.textContent,
    );
    expect(orden).toEqual(['Crear cuenta', 'o', 'Continuar con Google', 'Inicia sesión']);
  });
});

// docs/rediseno.md RD-16, RD-17: Verificar correo con la nota centrada del Figma «01 · Acceso».
describe('Rediseño · Verificar correo', () => {
  it('RD-16 · Sin Windi ni indicador de pasos, con la miga «Registro / Verificar correo»', async () => {
    await enVerificar();
    expect(screen.queryByRole('complementary', { name: 'Windi' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Pasos' })).toBeNull();
    const paso = screen.getByRole('region', { name: 'Verificar correo' });
    expect(within(paso).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Registro/Verificar correo',
    );
    expect(within(paso).getByRole('heading', { level: 1, name: 'Verifica tu correo' })).toBeTruthy();
  });

  it('RD-16, RD-17 · «Registro» en la miga y «Regresar» vuelven al formulario con lo diligenciado', async () => {
    const nucleo = await enVerificar();
    const acciones = Array.from(document.querySelectorAll('.wg-acciones button')).map((b) => b.textContent);
    expect(acciones).toEqual(['Regresar', 'Verificar']);
    fireEvent.click(screen.getByRole('button', { name: 'Registro' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeTruthy();
    expect(screen.getByLabelText('Correo electrónico')).toHaveProperty('value', 'ana@example.com');
    expect(llamadasA(nucleo, 'auth_register_cancel')).toHaveLength(1);
  });
});

describe('Rediseño · Error sin texto', () => {
  it('RD-24 · En el formulario, un error del Núcleo sin texto muestra el aviso de error inesperado', async () => {
    const nucleo = await registro();
    nucleo.responder('auth_register_start', () => ({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    }));
    diligenciar({});
    await crearCuenta();
    expect(screen.getByRole('alert').textContent).toBe('Ocurrió un error inesperado. Intenta de nuevo.');
  });

  it('RD-24 · En Verificar correo, un error del Núcleo sin texto muestra el aviso de error inesperado', async () => {
    const nucleo = await enVerificar();
    nucleo.responder('auth_register_verify', () => ({
      ok: false,
      error: { code: 'internal.unexpected', message: '' },
    }));
    escribirCodigo('482913');
    await seleccionar('Verificar');
    const paso = screen.getByRole('region', { name: 'Verificar correo' });
    expect(within(paso).getByRole('alert').textContent).toBe(
      'Ocurrió un error inesperado. Intenta de nuevo.',
    );
  });
});

describe('RD-91 · Todos los errores del Registro a la vez', () => {
  it('RD-91 · cada campo mal por una razón distinta', async () => {
    const nucleo = await registro();
    diligenciar({
      Alias: 'a'.repeat(31),
      'Correo electrónico': 'ana@example',
      Contraseña: 'clave',
      'Confirmar contraseña': 'otra',
    });
    await crearCuenta();
    for (const etiqueta of ['Alias', 'Correo electrónico', 'Contraseña', 'Confirmar contraseña']) {
      expect(textoDebajoDe(etiqueta)).toBeTruthy();
    }
    expect(textoDebajoDe('Correo electrónico')).toBe('Diligencia un correo electrónico válido.');
    expect(textoDebajoDe('Contraseña')).toBe(INVALIDA);
    expect(textoDebajoDe('Confirmar contraseña')).toBe('Las contraseñas no coinciden.');
    expect(llamadasA(nucleo, 'auth_register_start')).toHaveLength(0);
  });
});
