import type { Tokens } from './tokens';

// Tokens del tema por defecto (interfaz.md, «Tema a tokens»): la plantilla «Windgets» con los colores de la marca
// (P29, 0008; decisión de Paula, 23-nov-2026): principal #201B2B, secundario #DC026C, texto #FFFFFF, tipografía
// Rubik, tamaño mediano. Antes de P29 eran los de WG-MK-01 (#96B2B2, #829890, #14201C, Nunito). Son el resultado
// de las fórmulas de la tabla, calculado una vez. La ventana arranca con estos (y los usa sin sesión, en las
// pantallas de cuenta); con la sesión iniciada toma los del tema aplicado (HE-03-HU06, `temaAplicado.ts`).
// `derivar.ts` da estos mismos valores.
export const TOKENS_POR_DEFECTO: Tokens = {
  marco: '#201B2B',
  sobre_marco: '#FFFFFF',
  superficie: '#630C38',
  superficie_alta: '#590C34',
  superficie_baja: '#810945',
  linea: '#1F1A29',
  tinta: '#FFFFFF',
  texto: '#E8DBE1',
  accion: '#E74E98',
  sobre_accion: '#121216',
  borde: '#A6A4AA',
  estado_vencida: '#DD473C',
  estado_pendiente: '#D9AC26',
  estado_completada: '#26D962',
  relleno_vencida: '#B8353B',
  relleno_pendiente: '#B67C2B',
  relleno_completada: '#389B55',
  fuente: "'Rubik', 'Segoe UI', sans-serif",
  tamano_fuente: '16px', // «Mediano»: el valor en píxeles no está definido (HE-02, tabla de tipografía)
};
