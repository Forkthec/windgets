import type { AppError, CommandMap, CommandName, Result } from '@/types';
import textos from '@/types/messages.es.json';

// Núcleo simulado para `pnpm --filter desktop dev`: «solo las vistas en el navegador, con IPC simulado»
// (convenciones.md, «Ejecutar en desarrollo»). Cada HU (historia de usuario) define aquí la respuesta de su
// comando; los demás responden un error neutro con el mensaje vacío, porque ningún CA (criterio de
// aceptación) lo define (tipos.ts, AppError.message). No valida: las validaciones de campo están en la vista
// y en el Núcleo real.

/** Cuenta ya verificada del simulado (datos de prueba mínimos de HE-01-HU04). */
export const CUENTA_SIMULADA = { email: 'usuario.prueba@example.com', alias: 'Prueba' };

const ESPERA_DE_REENVIO_MS = 60_000;
const VIGENCIA_DEL_CODIGO_MS = 600_000;

const error = (e: AppError): Result<never> => ({ ok: false, error: e });

type Respuestas = {
  [K in CommandName]?: (params: CommandMap[K]['params']) => Result<CommandMap[K]['result']>;
};

const respuestas: Respuestas = {
  connectivity_get: () => ({ ok: true, value: { online: true } }),
  auth_get_session: () => ({ ok: true, value: { state: 'signed_out', token: 'valid' } }),
  auth_register_start: ({ email }) => {
    if (email.trim().toLowerCase() === CUENTA_SIMULADA.email) {
      return error({ code: 'email.already_registered', message: textos.CORREO_YA_REGISTRADO });
    }
    const ahora = Date.now();
    return {
      ok: true,
      value: {
        resend_available_at: new Date(ahora + ESPERA_DE_REENVIO_MS).toISOString(),
        expires_at: new Date(ahora + VIGENCIA_DEL_CODIGO_MS).toISOString(),
      },
      result_message: { code: 'auth_register_start', message: textos.CODIGO_ENVIADO },
    };
  },
  // Cualquier código se acepta: el simulado no envía correos.
  auth_register_verify: () => ({
    ok: true,
    value: { alias: 'Prueba' },
    result_message: {
      code: 'auth_register_verify',
      message: textos.BIENVENIDA.replace('<alias>', 'Prueba'),
      params: { alias: 'Prueba' },
    },
  }),
  auth_register_resend: () => ({
    ok: true,
    value: { resend_available_at: new Date(Date.now() + ESPERA_DE_REENVIO_MS).toISOString() },
    result_message: { code: 'auth_register_resend', message: textos.CODIGO_REENVIADO },
  }),
  auth_register_cancel: () => ({ ok: true, value: null }),
};

export async function invocarSimulado<K extends CommandName>(
  comando: K,
  params: CommandMap[K]['params'],
): Promise<Result<CommandMap[K]['result']>> {
  const respuesta = respuestas[comando] as
    ((p: CommandMap[K]['params']) => Result<CommandMap[K]['result']>) | undefined;
  return respuesta ? respuesta(params) : error({ code: 'internal.unexpected', message: '' });
}
