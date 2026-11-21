// HE-01-HU06 a HU08 · Recuperar contraseña. Una prueba por CA en la vista; las reglas del Núcleo tienen su
// prueba ca_he_01_hu06_* a ca_he_01_hu08_* en pruebas_de_recuperacion.rs.
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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

async function seleccionar(nombre: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: nombre }));
  });
}

/** Texto del mensaje de campo que quedó debajo del campo (RT-04). */
function textoDebajoDe(etiqueta: string) {
  const id = campo(etiqueta).getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent : undefined;
}

const paso = (nombre: string) => screen.getByRole('region', { name: nombre });

afterEach(cleanup);

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
