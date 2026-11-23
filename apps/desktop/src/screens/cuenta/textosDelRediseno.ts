// Textos del rediseño de las pantallas de cuenta (docs/rediseno.md RD-08 a RD-12, RD-15). No salen de un CA: los
// fija docs/rediseno.md, que gana sobre las HU mientras dure el rediseño.
import type { SaludoDeWindi } from './MarcoDeCuenta';

export const AYUDA_CONTRASENA = '8 a 64 caracteres con al menos una mayúscula, una minúscula y un número.';

/** Máximos de los contadores (RD-10): los mismos límites que validan los campos (`validaciones.ts`). */
export const MAXIMO = { alias: 30, correo: 64, contrasena: 64 } as const;

export const PASOS_DE_REGISTRO = ['Formulario', 'Verificar correo'] as const;
export const PASOS_DE_RECUPERACION = ['Correo', 'Código', 'Nueva contraseña'] as const;

export const PANTALLAS = {
  inicio: {
    titulo: 'Bienvenido a Windgets',
    subtitulo: 'Qué bueno verte de nuevo.',
    windi: { lineas: ['Soy Windi.', '¿Qué organizamos hoy?'] } satisfies SaludoDeWindi,
  },
  registro: {
    titulo: 'Crea tu cuenta',
    subtitulo: 'Solo te toma un minuto.',
    windi: { lineas: ['¡Soy Windi!', '¿Creamos tu cuenta?'], pose: 'registro' } satisfies SaludoDeWindi,
  },
  verificar: {
    titulo: 'Verifica tu correo',
    windi: { lineas: ['¡Revisa tu correo!', 'Te espero aquí.'], pose: 'registro' } satisfies SaludoDeWindi,
  },
  recuperar: {
    titulo: 'Recupera tu contraseña',
    windi: { lineas: ['Tranquilo,', 'te ayudo a recuperarla.'] } satisfies SaludoDeWindi,
  },
  nueva: {
    titulo: 'Recupera tu contraseña',
    windi: { lineas: ['Elige una', 'que recuerdes.'] } satisfies SaludoDeWindi,
  },
} as const;

/** RD-15: la paleta del modo no se pudo aplicar al tema de una cuenta nueva. */
export const TEMA_INICIAL_NO_APLICADO = (paleta: 'Claro' | 'Oscuro') =>
  `No pudimos aplicar el tema ${paleta}. Puedes elegirlo en Personalización.`;
