// HE-01-HU06 a HU08 · Recuperar contraseña. Una prueba por CA en la vista; las reglas del Núcleo tienen su
// prueba ca_he_01_hu06_* a ca_he_01_hu08_* en pruebas_de_recuperacion.rs.
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { abrirCuenta, Destino, llamadasA } from '../cuenta/pruebas';
import { Recovery } from './Recovery';

const ENVIADO = 'Si el correo está registrado, te enviamos un código de verificación.';
const SIN_CONEXION = 'No hay conexión a internet. Conéctate para recuperar tu contraseña.';

async function recuperar(conectado = true) {
  const nucleo = await abrirCuenta(
    'recovery',
    { recovery: Recovery, register: () => <Destino nombre="Registro" /> },
    conectado,
  );
  nucleo.responder('auth_recovery_request', () => ({
    ok: true,
    value: { resend_available_at: new Date(Date.now() + 60_000).toISOString() },
    result_message: { code: 'auth_recovery_request', message: ENVIADO },
  }));
  return nucleo;
}

// El paso «Correo electrónico» se llama igual que su campo: se busca solo entre los campos.
const campo = (etiqueta: string) => screen.getByLabelText(etiqueta, { selector: 'input' });

function escribir(etiqueta: string, valor: string) {
  fireEvent.change(campo(etiqueta), { target: { value: valor } });
}

async function seleccionar(nombre: string, rol: 'button' | 'link' = 'button') {
  await act(async () => {
    fireEvent.click(screen.getByRole(rol, { name: nombre }));
  });
}

/** Texto del mensaje de campo que quedó debajo del campo (RT-04). */
function textoDebajoDe(etiqueta: string) {
  const id = campo(etiqueta).getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent : undefined;
}

const paso = (nombre: string) => screen.getByRole('region', { name: nombre });

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('HE-01-HU06 · Solicitar un código de verificación en Recuperar contraseña', () => {
  it('HE-01-HU06-CA01 · Solicitar el código de verificación con un correo electrónico registrado', async () => {
    const nucleo = await recuperar();
    // ET01: miga de pan, Correo electrónico, «Enviar código» y «Regresar».
    const correo = paso('Correo electrónico');
    const miga = within(correo).getByRole('navigation', { name: 'Miga de pan' });
    expect(miga.textContent).toBe('Inicio de sesión>Recuperar contraseña');
    expect(within(correo).getByRole('button', { name: 'Regresar' })).toBeTruthy();
    escribir('Correo electrónico', 'ana@example.com');
    await seleccionar('Enviar código');
    expect(llamadasA(nucleo, 'auth_recovery_request')[0]?.params).toEqual({ email: 'ana@example.com' });
    // ET02: el paso siguiente es Diligenciar código, con el aviso de ET09.
    expect(within(paso('Diligenciar código')).getByRole('alert').textContent).toBe(ENVIADO);
  });

  it('HE-01-HU06-CA02 · Solicitar el código de verificación con un correo electrónico sin cuenta', async () => {
    // El Núcleo responde igual exista o no la cuenta (ET09): la vista no los distingue.
    await recuperar();
    escribir('Correo electrónico', 'nadie@example.com');
    await seleccionar('Enviar código');
    expect(within(paso('Diligenciar código')).getByRole('alert').textContent).toBe(ENVIADO);
  });

  it('HE-01-HU06-CA03 · Correo electrónico vacío', async () => {
    const nucleo = await recuperar();
    await seleccionar('Enviar código');
    expect(textoDebajoDe('Correo electrónico')).toBe('Este campo es obligatorio.');
    expect(llamadasA(nucleo, 'auth_recovery_request')).toHaveLength(0);
  });

  it('HE-01-HU06-CA04 · Correo electrónico con formato inválido', async () => {
    const nucleo = await recuperar();
    escribir('Correo electrónico', 'ana@example');
    await seleccionar('Enviar código');
    expect(textoDebajoDe('Correo electrónico')).toBe('Diligencia un correo electrónico válido.');
    expect(llamadasA(nucleo, 'auth_recovery_request')).toHaveLength(0);
  });

  it('HE-01-HU06-CA05 · Correo electrónico de más de 64 caracteres', async () => {
    const nucleo = await recuperar();
    escribir('Correo electrónico', `${'a'.repeat(53)}@example.com`);
    await seleccionar('Enviar código');
    expect(textoDebajoDe('Correo electrónico')).toBe('El correo electrónico no puede superar los 64 caracteres.');
    expect(llamadasA(nucleo, 'auth_recovery_request')).toHaveLength(0);
  });

  it('HE-01-HU06-CA06 · Solicitar el código de verificación sin conexión', async () => {
    const nucleo = await recuperar(false);
    escribir('Correo electrónico', 'ana@example.com');
    // ET11: el aviso arriba del paso; ET12: «Enviar código» deshabilitado hasta que vuelva la conexión.
    expect(within(paso('Correo electrónico')).getByRole('alert').textContent).toBe(SIN_CONEXION);
    const enviar = screen.getByRole('button', { name: 'Enviar código' });
    expect(enviar.hasAttribute('disabled')).toBe(true);
    await seleccionar('Enviar código');
    expect(llamadasA(nucleo, 'auth_recovery_request')).toHaveLength(0);
    nucleo.emitir('connectivity_changed', { online: true });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(enviar.hasAttribute('disabled')).toBe(false);
    expect(campo('Correo electrónico')).toHaveProperty('value', 'ana@example.com');
  });

  it('HE-01-HU06-CA06 · La conexión se pierde al enviar (net.offline)', async () => {
    const nucleo = await recuperar();
    nucleo.responder('auth_recovery_request', () => ({
      ok: false,
      error: { code: 'net.offline', message: SIN_CONEXION },
    }));
    escribir('Correo electrónico', 'ana@example.com');
    await seleccionar('Enviar código');
    expect(screen.getByRole('alert').textContent).toBe(SIN_CONEXION);
    expect(paso('Correo electrónico')).toBeTruthy();
  });

  it('HE-01-HU06-CA07 · Regresar a Inicio de sesión con la miga de pan', async () => {
    for (const enCodigo of [false, true]) {
      const nucleo = await recuperar();
      if (enCodigo) {
        escribir('Correo electrónico', 'ana@example.com');
        await seleccionar('Enviar código');
      }
      await seleccionar('Inicio de sesión');
      // ET04: abre Inicio de sesión sin cambiar la contraseña.
      expect(screen.getByRole('main', { name: 'Inicio de sesión' })).toBeTruthy();
      expect(llamadasA(nucleo, 'auth_recovery_set_password')).toHaveLength(0);
      cleanup();
    }
  });
});

const VENCIDO = 'El código venció. Solicita uno nuevo.';
const INCORRECTO = 'El código no es correcto. Revísalo e intenta de nuevo.';

/** En el paso Diligenciar código, con `esperaMs` hasta poder reenviar. */
async function enCodigo(esperaMs = 0) {
  const nucleo = await recuperar();
  nucleo.responder('auth_recovery_request', () => ({
    ok: true,
    value: { resend_available_at: new Date(Date.now() + esperaMs).toISOString() },
    result_message: { code: 'auth_recovery_request', message: ENVIADO },
  }));
  escribir('Correo electrónico', 'ana@example.com');
  await seleccionar('Enviar código');
  return nucleo;
}

type Nucleo = Awaited<ReturnType<typeof enCodigo>>;

/** El Núcleo rechaza el código con este error. */
function rechazarCodigo(nucleo: Nucleo, code: string, message: string, field?: string) {
  nucleo.responder('auth_recovery_verify', () => ({ ok: false, error: { code, message, ...(field && { field }) } }));
}

describe('HE-01-HU07 · Verificar el código de verificación en Recuperar contraseña', () => {
  it('HE-01-HU07-CA01 · Verificar el código y pasar al paso Nueva contraseña', async () => {
    const nucleo = await enCodigo();
    // ET01: campo, «Verificar», «Reenviar código», miga de pan y «Regresar».
    const codigo = paso('Diligenciar código');
    expect(within(codigo).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Inicio de sesión>Recuperar contraseña',
    );
    expect(within(codigo).getByRole('button', { name: 'Regresar' })).toBeTruthy();
    expect(within(codigo).getByRole('link', { name: 'Reenviar código' })).toBeTruthy();
    nucleo.responder('auth_recovery_verify', () => ({ ok: true, value: null }));
    escribir('Código de verificación', '482913');
    await seleccionar('Verificar');
    expect(llamadasA(nucleo, 'auth_recovery_verify')[0]?.params).toEqual({ code: '482913' });
    expect(paso('Nueva contraseña')).toBeTruthy();
  });

  it('HE-01-HU07-CA02 · Código de verificación vacío', async () => {
    const nucleo = await enCodigo();
    await seleccionar('Verificar');
    expect(textoDebajoDe('Código de verificación')).toBe('Este campo es obligatorio.');
    expect(llamadasA(nucleo, 'auth_recovery_verify')).toHaveLength(0);
    expect(screen.queryByRole('region', { name: 'Nueva contraseña' })).toBeNull();
  });

  it('HE-01-HU07-CA03 · Código de verificación incorrecto', async () => {
    const nucleo = await enCodigo();
    rechazarCodigo(nucleo, 'code.incorrect', INCORRECTO, 'code');
    escribir('Código de verificación', '000000');
    await seleccionar('Verificar');
    expect(textoDebajoDe('Código de verificación')).toBe(INCORRECTO);
    expect(paso('Diligenciar código')).toBeTruthy();
  });

  it('HE-01-HU07-CA04 · Código de verificación vencido', async () => {
    const nucleo = await enCodigo();
    rechazarCodigo(nucleo, 'code.expired', VENCIDO, 'code');
    escribir('Código de verificación', '482913');
    await seleccionar('Verificar');
    expect(textoDebajoDe('Código de verificación')).toBe(VENCIDO);
    expect(screen.queryByRole('region', { name: 'Nueva contraseña' })).toBeNull();
  });

  it('HE-01-HU07-CA05 · Superar el límite de intentos de verificación', async () => {
    const nucleo = await enCodigo();
    const limite = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
    rechazarCodigo(nucleo, 'auth.rate_limited', limite);
    escribir('Código de verificación', '482913');
    await seleccionar('Verificar');
    expect(within(paso('Diligenciar código')).getByRole('alert').textContent).toBe(limite);
  });

  it('HE-01-HU07-CA06 · Reenviar el código de verificación', async () => {
    const nucleo = await enCodigo();
    nucleo.responder('auth_recovery_resend', () => ({
      ok: true,
      value: { resend_available_at: new Date(Date.now() + 60_000).toISOString() },
      result_message: { code: 'auth_recovery_resend', message: 'Te enviamos un nuevo código.' },
    }));
    await seleccionar('Reenviar código', 'link');
    expect(llamadasA(nucleo, 'auth_recovery_resend')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toContain('Te enviamos un nuevo código.');
    // ET05: tras el reenvío vuelve la espera de 60 s.
    expect(screen.getByText(/^Puedes pedir un nuevo código en (60|59) s\.$/)).toBeTruthy();
  });

  it('HE-01-HU07-CA07 · Reenviar antes de 60 segundos', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const nucleo = await enCodigo(3_000);
    const enlace = screen.getByRole('link', { name: 'Reenviar código' });
    // ET11: deshabilitado con los segundos restantes.
    expect(enlace.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('Puedes pedir un nuevo código en 3 s.')).toBeTruthy();
    await seleccionar('Reenviar código', 'link');
    expect(llamadasA(nucleo, 'auth_recovery_resend')).toHaveLength(0);
    // ET12: los segundos se actualizan cada segundo y el hipervínculo se habilita al llegar a 0.
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

  it('HE-01-HU07-CA08 · Regresar al paso Correo electrónico', async () => {
    const nucleo = await enCodigo();
    await seleccionar('Regresar');
    // ET09: el correo diligenciado se conserva; volver al código exige pedir uno nuevo, que invalida el anterior.
    expect(paso('Correo electrónico')).toBeTruthy();
    expect(campo('Correo electrónico')).toHaveProperty('value', 'ana@example.com');
    expect(screen.queryByRole('region', { name: 'Diligenciar código' })).toBeNull();
    await seleccionar('Enviar código');
    expect(llamadasA(nucleo, 'auth_recovery_request')).toHaveLength(2);
    expect(paso('Diligenciar código')).toBeTruthy();
  });

  it('HE-01-HU07-CA09 · Verificar el código sin conexión', async () => {
    const nucleo = await enCodigo();
    escribir('Código de verificación', '482913');
    nucleo.emitir('connectivity_changed', { online: false });
    const codigo = paso('Diligenciar código');
    // ET13: el aviso en la parte superior del paso.
    expect(within(codigo).getByRole('alert').textContent).toBe(SIN_CONEXION);
    expect(screen.getByRole('button', { name: 'Verificar' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('link', { name: 'Reenviar código' }).getAttribute('aria-disabled')).toBe('true');
    await seleccionar('Verificar');
    await seleccionar('Reenviar código', 'link');
    expect(llamadasA(nucleo, 'auth_recovery_verify')).toHaveLength(0);
    expect(llamadasA(nucleo, 'auth_recovery_resend')).toHaveLength(0);
    // ET14: no avanza y conserva lo diligenciado hasta que vuelve la conexión.
    expect(campo('Código de verificación')).toHaveProperty('value', '482913');
    nucleo.emitir('connectivity_changed', { online: true });
    expect(screen.getByRole('button', { name: 'Verificar' }).hasAttribute('disabled')).toBe(false);
  });
});
