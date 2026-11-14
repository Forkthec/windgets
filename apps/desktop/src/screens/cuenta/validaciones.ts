import { estaVacio, type Validador } from '@/reglas/formulario';
import { TEXTOS } from './textos';

// Repetición en la vista de las validaciones de campo de servicio_de_sesion.rs, para mostrar los mensajes al
// instante (D-188). El Núcleo las vuelve a comprobar.

/** Largo en caracteres, igual que `chars().count()` en Rust. */
const largo = (valor: string) => [...valor].length;

/** Alias (HE-01-HU01-ET02 a ET04): obligatorio y de 1 a 30 caracteres. */
export const validarAlias: Validador = (valor) => {
  if (estaVacio(valor)) return TEXTOS.CAMPO_OBLIGATORIO;
  if (largo(valor.trim()) > 30) return TEXTOS.ALIAS_MUY_LARGO;
  return undefined;
};

/** Formato usuario@dominio.ext (HE-01-HU01-ET06), como `formato_de_correo` del Núcleo. */
export function formatoDeCorreo(correo: string): boolean {
  const arroba = correo.indexOf('@');
  if (arroba <= 0 || /\s/u.test(correo)) return false;
  const dominio = correo.slice(arroba + 1);
  const partes = dominio.split('.');
  return !dominio.includes('@') && partes.length >= 2 && partes.every((p) => p !== '');
}

/** Correo electrónico (HE-01-HU01-ET05 a ET07): obligatorio, de máximo 64 caracteres y con formato. */
export const validarCorreo: Validador = (valor) => {
  const correo = valor.trim();
  if (correo === '') return TEXTOS.CAMPO_OBLIGATORIO;
  if (largo(correo) > 64) return TEXTOS.CORREO_MUY_LARGO;
  if (!formatoDeCorreo(correo)) return TEXTOS.CORREO_INVALIDO;
  return undefined;
};

/**
 * Contraseña (HE-01-HU02-ET01 a ET03): obligatoria, de 8 a 64 caracteres, con una mayúscula, una minúscula y
 * un número (A-Z, a-z, 0-9, como `validar_contrasena` del Núcleo). No se recorta.
 */
export const validarContrasena: Validador = (valor) => {
  if (estaVacio(valor)) return TEXTOS.CAMPO_OBLIGATORIO;
  const n = largo(valor);
  const valida = n >= 8 && n <= 64 && /[A-Z]/.test(valor) && /[a-z]/.test(valor) && /[0-9]/.test(valor);
  return valida ? undefined : TEXTOS.CONTRASENA_INVALIDA;
};

/** Confirmar contraseña (HE-01-HU02-ET04, ET05): obligatoria e idéntica a la contraseña. */
export function validarConfirmacion(contrasena: string, confirmacion: string): string | undefined {
  if (estaVacio(confirmacion)) return TEXTOS.CAMPO_OBLIGATORIO;
  return confirmacion === contrasena ? undefined : TEXTOS.CONTRASENAS_NO_COINCIDEN;
}
