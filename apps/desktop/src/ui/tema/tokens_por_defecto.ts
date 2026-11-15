import type { Tokens } from './tokens';

// Tokens del tema por defecto (interfaz.md, «Tema a tokens»): principal #96B2B2, secundario #829890, texto
// #14201C, tipografía Nunito, tamaño mediano. Son el resultado de las fórmulas de la tabla, calculado una vez.
// Provisional: el Núcleo los entregará con `theme_get_applied` (IPC-THEME-02, HE-03-HU06, P13); mientras el
// comando no exista, la ventana arranca con estos para que las pantallas de cuenta no queden sin estilo.
// Ver docs/DUDAS.md («P05b»).
export const TOKENS_POR_DEFECTO: Tokens = {
  marco: '#96B2B2',
  sobre_marco: '#121216',
  superficie: '#CDD6D3',
  superficie_alta: '#D3DBD8',
  superficie_baja: '#BAC6C2',
  linea: '#A1BABA',
  tinta: '#14201C',
  texto: '#303B37',
  accion: '#61746D',
  sobre_accion: '#FFFFFF',
  borde: '#485A58',
  estado_vencida: '#D93226',
  estado_pendiente: '#8F7219',
  estado_completada: '#18863D',
  relleno_vencida: '#D5635A',
  relleno_pendiente: '#A29051',
  relleno_completada: '#4E9E6A',
  fuente: "'Nunito', 'Segoe UI', sans-serif",
  tamano_fuente: '16px', // «Mediano»: el valor en píxeles no está definido (HE-02, tabla de tipografía)
};
