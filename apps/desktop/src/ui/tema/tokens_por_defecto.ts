import type { NombreToken, NombreTokenDeWindgets, Tokens } from './tokens';

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

// docs/rediseno.md RD-94 (IM-01): «Windgets claro» y «Windgets oscuro» no derivan sus colores; usan esta tabla.
type NombreFijo =
  | Exclude<NombreToken, `estado_${string}` | `relleno_${string}` | 'fuente' | 'tamano_fuente'>
  | NombreTokenDeWindgets;

export interface TemaDeWindgets {
  /** Los tres colores de la plantilla y de la paleta del mismo nombre (0007, 0008). */
  colores: { primary: string; secondary: string; text: string };
  tokens: Record<NombreFijo, string>;
}

export const TEMAS_DE_WINDGETS: Record<'claro' | 'oscuro', TemaDeWindgets> = {
  claro: {
    colores: { primary: '#F5F0FF', secondary: '#B6A560', text: '#17131D' },
    tokens: {
      principal: '#00D9E2',
      secundario: '#6604E6',
      marco: '#F5F0FF',
      sobre_marco: '#17131D',
      superficie: '#FFFFFF',
      superficie_alta: '#FFFBEA',
      superficie_baja: '#EDE3FF',
      linea: '#D9D0E6',
      tinta: '#17131D',
      texto: '#554F5E',
      accion: '#00D9E2',
      sobre_accion: '#17131D',
      borde: '#241C30',
      sombra: '3px 5px 0 #241C30',
      error: '#B3261E',
      // TK-01: las 11 variables nuevas, columna «claro» de TEMAS_Y_TOKENS.md §1.
      seleccion: '#6604E6',
      velo: '#17131D66',
      borde_campo: '#766B81',
      burbuja_propia: '#BFF5F8',
      fondo: '#FFFFFF',
      detalle: '#6604E6',
      sobre_detalle: '#17131D',
      principal_legible: '#6604E6',
      sobre_seleccion: '#FFFFFF',
      perilla: '#FFFFFF',
      informacion: '#00D9E2',
    },
  },
  oscuro: {
    colores: { primary: '#201B2B', secondary: '#5D566B', text: '#F8F5FF' },
    tokens: {
      principal: '#00D9E2',
      secundario: '#D3B2FF',
      marco: '#201B2B',
      sobre_marco: '#F8F5FF',
      superficie: '#2B2534',
      superficie_alta: '#302D38',
      superficie_baja: '#433258',
      linea: '#5D566B',
      tinta: '#F8F5FF',
      texto: '#CEC7D6',
      accion: '#00D9E2',
      sobre_accion: '#17131D',
      borde: '#AFA1C0',
      sombra: '3px 5px 0 #100D15',
      error: '#FF8A80',
      // TK-01: las 11 variables nuevas, columna «oscuro» de TEMAS_Y_TOKENS.md §1.
      seleccion: '#00D9E2',
      velo: '#0000008C',
      borde_campo: '#948B9E',
      burbuja_propia: '#0E4A4D',
      fondo: '#201B2B',
      detalle: '#D3B2FF',
      sobre_detalle: '#17131D',
      principal_legible: '#00D9E2',
      sobre_seleccion: '#0B2A2E',
      perilla: '#FFFFFF',
      informacion: '#00D9E2',
    },
  },
};

/**
 * El tema de Windgets cuyos tres colores son estos, si lo hay: con cualquier color cambiado ya no es ninguno y todos
 * los tokens se vuelven a derivar (RD-94).
 */
export const temaDeWindgets = (colores: TemaDeWindgets['colores']): TemaDeWindgets | undefined =>
  Object.values(TEMAS_DE_WINDGETS).find((tema) =>
    (['primary', 'secondary', 'text'] as const).every((c) => tema.colores[c] === colores[c].toUpperCase()),
  );
