// Dibujos de la landing (CD-01-HU01). Todos son decorativos: van sin `<text>` ni `<title>` y con
// `aria-hidden`, para no agregar texto al elemento que los contiene. Trazo de 2 px sobre retícula de 24.
const TRAZO =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const OCULTO = 'aria-hidden="true" focusable="false"';

/** Ícono del botón «Descargar para Windows». La flecha es la parte que baja mientras se comprueba. */
export const ICONO_DESCARGA = `<svg class="icono" viewBox="0 0 24 24" ${TRAZO} ${OCULTO}><g class="icono__flecha"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/></g><path d="M5 20h14"/></svg>`;

/** Marca de la opción elegida en «Elige un tema»: la elección no depende solo del color. */
export const ICONO_VERIFICACION = `<svg class="icono tema__marca" viewBox="0 0 24 24" ${TRAZO} ${OCULTO}><path d="M5 13l4 4 10-11"/></svg>`;

const miniatura = (dibujo: string) =>
  `<svg class="miniatura" viewBox="0 0 48 48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${OCULTO}>${dibujo}</svg>`;

/**
 * Miniaturas de las cinco funciones, en el orden de FUNCIONES: la pieza del escritorio ligada a cada una.
 * Solo se ven por debajo de 1024 px y toman los colores del tema elegido (clases `m-…` de estilos.css).
 */
export const MINIATURAS = [
  // Wallpaper personalizable: el marco del escritorio con su fondo.
  miniatura(
    '<rect class="m-pieza" x="4" y="8" width="40" height="30" rx="4"/><path class="m-principal" d="M5 29c7-5 12 3 20-1s12-5 18-2v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path class="m-linea" d="M17 43h14"/>',
  ),
  // Widgets: Reloj, Tareas del día y Calendario.
  miniatura(
    '<rect class="m-pieza" x="4" y="6" width="18" height="12" rx="4"/><rect class="m-pieza" x="26" y="6" width="18" height="24" rx="4"/><rect class="m-pieza" x="4" y="22" width="18" height="20" rx="4"/><path class="m-linea" d="M30 13h10M30 19h10M30 25h6"/><rect class="m-principal" x="8" y="27" width="5" height="5" rx="1.5"/>',
  ),
  // Planificador: el tablero Kanban con sus tres columnas.
  miniatura(
    '<rect class="m-pieza" x="4" y="7" width="40" height="34" rx="4"/><rect class="m-columna" x="9" y="13" width="8" height="22" rx="2.5"/><rect class="m-columna" x="20" y="13" width="8" height="15" rx="2.5"/><rect class="m-columna" x="31" y="13" width="8" height="22" rx="2.5"/>',
  ),
  // Windi: la ventana de la aplicación con la conversación.
  miniatura(
    '<rect class="m-pieza" x="4" y="7" width="40" height="34" rx="4"/><path class="m-linea" d="M5 15h38"/><rect class="m-columna" x="9" y="20" width="18" height="6" rx="2"/><rect class="m-principal" x="23" y="30" width="16" height="6" rx="2"/>',
  ),
  // Sincronización: la etiqueta «Sincronizado».
  miniatura(
    '<rect class="m-principal" x="4" y="12" width="40" height="24" rx="8"/><path class="m-linea" d="M16 31a5 5 0 0 1 0-10 7 7 0 0 1 13.5 1.5A4.4 4.4 0 0 1 29 31z"/><path class="m-linea" d="M19 26l2.5 2.5L26 23"/>',
  ),
] as const;
