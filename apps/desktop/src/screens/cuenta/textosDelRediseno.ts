// Textos del rediseño de las pantallas de cuenta (docs/rediseno.md RD-08 a RD-12, RD-15 a RD-18). No salen de un CA: los
// fija docs/rediseno.md, que gana sobre las HU mientras dure el rediseño.
import type { SaludoDeWindi } from './MarcoDeCuenta';

export const AYUDA_CONTRASENA = '8 a 64 caracteres con al menos una mayúscula, una minúscula y un número.';

export const PASOS_DE_REGISTRO = ['Formulario', 'Verificar correo'] as const;

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
} as const;

/**
 * RD-16: los pasos con la nota centrada (Figma «01 · Acceso»). Título y subtítulo literales del Figma; sin Windi
 * ni indicador de pasos.
 */
export const PASOS_CENTRADOS = {
  verificar: { titulo: 'Verifica tu correo', subtitulo: 'Escribe el código que enviamos a tu correo.' },
  recuperar: {
    titulo: 'Recupera tu contraseña',
    subtitulo: 'Te enviaremos un código a tu correo electrónico.',
  },
  codigo: { titulo: 'Verifica el código', subtitulo: 'Ingresa el código que recibiste por correo.' },
  nueva: { titulo: 'Nueva contraseña', subtitulo: 'Elige una contraseña para volver a entrar.' },
} as const;

/** RD-16: la ayuda fija de Nueva contraseña, literal del Figma (distinta de la de Registro). */
export const AYUDA_NUEVA_CONTRASENA = '8 a 64 caracteres, una mayúscula, una minúscula y un número.';
/** RD-18: el aviso sin conexión del paso Correo electrónico, literal del Figma. */
export const SIN_CONEXION_ENVIAR_CODIGO = 'Sin conexión. Conéctate para enviar el código.';
/** RD-18: debajo de las acciones, por qué el botón principal está deshabilitado sin conexión. */
export const REQUIERE_CONEXION = (accion: string) => `${accion} requiere conexión a internet.`;

/**
 * RD-15: la paleta del modo no se pudo aplicar al tema de una cuenta nueva. RD-67 (rediseno_final_backend.md §2):
 * «paleta», no «tema», y el paso donde se elige. DUDA: texto a confirmar en la v13.
 */
export const TEMA_INICIAL_NO_APLICADO = (paleta: 'Claro' | 'Oscuro') =>
  `No pudimos aplicar la paleta ${paleta}. Puedes elegirla en Personalización › 3 Colores y tipografía.`;

/**
 * RD-24: aviso de las pantallas de cuenta cuando el Núcleo responde un error sin texto (`internal.unexpected`,
 * DP-02), para que la persona no se quede sin respuesta. Texto elegido por Paula (23-nov-2026).
 */
export const ERROR_INESPERADO = 'Ocurrió un error inesperado. Intenta de nuevo.';
