// docs/rediseno.md RD-90: los límites de los campos, en un solo lugar. `limites.test.ts` compara los largos con las
// columnas de `src-tauri/sqlite_esquema.sql`. El Núcleo los vuelve a comprobar (D-188).

// Cuenta (HE-01-HU01, HE-01-HU02). El correo y la contraseña no se guardan en la base local.
export const ALIAS_MAX = 30;
export const CORREO_MAX = 64;
export const CONTRASENA_MIN = 8;
export const CONTRASENA_MAX = 64;

// Planificador.
export const COLUMNA_NOMBRE_MAX = 30;
export const ETIQUETA_NOMBRE_MAX = 30;
/** Etiquetas por usuario (HE-08-HU02-ET06). */
export const ETIQUETAS_MAX = 20;
export const TARJETA_TITULO_MAX = 100;
export const TARJETA_DESCRIPCION_MAX = 1000;
/** Etiquetas por tarjeta (HE-07-HU02-ET04). */
export const TARJETA_ETIQUETAS_MAX = 5;
/** Rango personalizado de Reportes, contando el inicio y el fin (HE-13-HU01). */
export const RANGO_DIAS_MAXIMOS = 366;

// Personalización y widgets.
export const TEMA_NOMBRE_MAX = 40;
export const CIUDAD_MAX = 100;
export const TEXTO_WIDGET_MAX = 200;
/** HE-04: de 2 a 10 imágenes (D-040). */
export const CARRUSEL_IMAGENES_MIN = 2;
export const CARRUSEL_IMAGENES_MAX = 10;
export const CARRUSEL_INTERVALO_MIN = 3;
export const CARRUSEL_INTERVALO_MAX = 60;

// Windi (HE-14-HU01-ET03).
export const WINDI_MENSAJE_MAX = 2000;
