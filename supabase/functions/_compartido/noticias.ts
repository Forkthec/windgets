// Lógica de EF-04 `news-headlines` (contratos.md; HE-04-HU06; INT-05 GNews, DP-18). TS puro: la Edge Function la
// usa en Deno y Vitest la prueba con el proveedor simulado.

/** Caché compartida de 60 min (RNF-09; `external_cache.expires_at = now + 60 min`). */
export const VIGENCIA_MS = 60 * 60 * 1000;
/** HE-04-HU06-ET02: los 5 titulares más recientes. */
export const TITULARES = 5;
/** DP-18: la edición por defecto. */
export const EDICION_POR_DEFECTO = 'co';

export interface Titular {
  title: string;
  source: string;
  url: string;
  published_at: string;
}

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** `{ edition? }`: dos letras de país; sin ella, la edición por defecto. */
export function leerEdicion(cuerpo: unknown): string {
  const edicion = esObjeto(cuerpo) ? cuerpo.edition : undefined;
  return typeof edicion === 'string' && /^[a-z]{2}$/.test(edicion) ? edicion : EDICION_POR_DEFECTO;
}

/** INT-05: la petición a GNews (la clave va en el secreto `NEWS_API_KEY`). */
export function urlDeTitulares(edicion: string, clave: string): string {
  return `https://gnews.io/api/v4/top-headlines?category=general&lang=es&country=${edicion}&max=${TITULARES}&apikey=${encodeURIComponent(clave)}`;
}

/** Los 5 titulares más recientes, con su fuente; `null` si la respuesta no trae artículos. */
export function leerTitulares(respuesta: unknown): Titular[] | null {
  if (!esObjeto(respuesta) || !Array.isArray(respuesta.articles)) return null;
  return respuesta.articles
    .filter(esObjeto)
    .filter((a) => typeof a.title === 'string' && typeof a.url === 'string' && typeof a.publishedAt === 'string')
    .map((a) => ({
      title: a.title as string,
      source: esObjeto(a.source) && typeof a.source.name === 'string' ? a.source.name : '',
      url: a.url as string,
      published_at: new Date(a.publishedAt as string).toISOString(),
    }))
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, TITULARES);
}

export const claveDeCache = (edicion: string) => `news:${edicion}`;

/** ¿Sigue vigente la fila de la caché? */
export function vigente(fila: unknown, ahora: Date): { headlines: Titular[]; fetched_at: string } | null {
  if (!esObjeto(fila) || typeof fila.expires_at !== 'string' || !esObjeto(fila.payload)) return null;
  if (new Date(fila.expires_at).getTime() <= ahora.getTime()) return null;
  return fila.payload as unknown as { headlines: Titular[]; fetched_at: string };
}
