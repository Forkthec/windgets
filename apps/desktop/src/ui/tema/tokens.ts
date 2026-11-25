// Tokens de la interfaz (interfaz.md, «Tema a tokens»). El Núcleo los calcula a partir del tema aplicado;
// la vista solo los escribe como variables CSS. Ningún color de interfaz se fija en el código.
export const NOMBRES_TOKEN = [
  'marco',
  'sobre_marco',
  'superficie',
  'superficie_alta',
  'superficie_baja',
  'linea',
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

/**
 * Tokens que solo definen «Windgets claro» y «Windgets oscuro» (docs/rediseno.md RD-94). `sombra` es la sombra
 * completa: en los demás temas queda la de `tokens.css`.
 */
export const NOMBRES_TOKEN_DE_WINDGETS = ['principal', 'secundario', 'sombra', 'error'] as const;

export type NombreToken = (typeof NOMBRES_TOKEN)[number];
export type NombreTokenDeWindgets = (typeof NOMBRES_TOKEN_DE_WINDGETS)[number];
export type Tokens = Record<NombreToken, string> & Partial<Record<NombreTokenDeWindgets, string>>;

export const variableCss = (nombre: NombreToken | NombreTokenDeWindgets): string =>
  `--wg-${nombre.replace(/_/g, '-')}`;

export function aplicarTokens(tokens: Tokens, raiz: HTMLElement = document.documentElement): void {
  for (const nombre of NOMBRES_TOKEN) raiz.style.setProperty(variableCss(nombre), tokens[nombre]);
  // Al pasar a un tema que no los define, se quitan los del tema anterior.
  for (const nombre of NOMBRES_TOKEN_DE_WINDGETS) {
    const valor = tokens[nombre];
    if (valor) raiz.style.setProperty(variableCss(nombre), valor);
    else raiz.style.removeProperty(variableCss(nombre));
  }
  // RD-99: sobre `secundario` se escribe con la superficie del mismo tema. Sin `secundario`, la hoja de estilos usa la
  // pareja de la acción.
  if (tokens.secundario) raiz.style.setProperty('--wg-sobre-secundario', tokens.superficie);
  else raiz.style.removeProperty('--wg-sobre-secundario');
}
