// Tokens de la interfaz (interfaz.md, «Tema a tokens»). El Núcleo los calcula a partir del tema aplicado;
// la vista solo los escribe como variables CSS. Ningún color de interfaz se fija en el código.
export const NOMBRES_TOKEN = [
  'superficie',
  'superficie_alta',
  'tinta',
  'texto',
  'accion',
  'sobre_accion',
  'borde',
  'estado_vencida',
  'estado_pendiente',
  'estado_completada',
  'relleno_vencida',
  'relleno_pendiente',
  'relleno_completada',
  'fuente',
  'tamano_fuente',
] as const;

export type NombreToken = (typeof NOMBRES_TOKEN)[number];
export type Tokens = Record<NombreToken, string>;

export const variableCss = (nombre: NombreToken): string => `--wg-${nombre.replace(/_/g, '-')}`;

export function aplicarTokens(tokens: Tokens, raiz: HTMLElement = document.documentElement): void {
  for (const nombre of NOMBRES_TOKEN) raiz.style.setProperty(variableCss(nombre), tokens[nombre]);
}
