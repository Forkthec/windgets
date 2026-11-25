// docs/rediseno.md RD-88: una cuenta bloqueada se dice con su texto. Las reglas del Núcleo: rd_88_* en
// servicio_de_sesion.
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { abrirCuenta } from '@/screens/cuenta/pruebas';
import { SignIn } from '@/screens/sign_in/SignIn';

const TEXTO = 'Tu cuenta está bloqueada. Escríbenos para revisarla.';

afterEach(cleanup);

describe('RD-88 · Cuenta bloqueada', () => {
  it('RD-88 · «Iniciar sesión» lo dice y conserva lo escrito', async () => {
    const nucleo = await abrirCuenta('sign_in', { sign_in: SignIn }, true);
    nucleo.responder('auth_sign_in', () => ({
      ok: false,
      error: { code: 'auth.user_banned', message: TEXTO },
    }));
    const correo = screen.getByLabelText('Correo electrónico') as HTMLInputElement;
    fireEvent.change(correo, { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Clave123' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    });
    expect(screen.getByRole('alert').textContent).toBe(TEXTO);
    expect(correo.value).toBe('ana@example.com');
  });
});
