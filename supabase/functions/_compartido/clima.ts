// Lógica de EF-02 `weather-geocode` y EF-03 `weather-current` (contratos.md; HE-04-HU05; INT-04 Open-Meteo, DP-17).
// Es TS puro: las Edge Functions la usan en Deno y Vitest la prueba con el proveedor simulado.

/** Tiempo máximo de cada Edge Function del clima (contratos.md: `timeout` a los 8 s). */
export const ESPERA_MS = 8_000;
/** Caché compartida de 30 min (RNF-09; `external_cache.expires_at = now + 30 min`). */
export const VIGENCIA_MS = 30 * 60 * 1000;
/** INT-04: hasta 5 resultados; el Núcleo toma el primero (HE-04-HU05-ET15). */
export const MAXIMO_DE_CIUDADES = 5;

export type CodigoDeError = 'unauthorized' | 'invalid_request' | 'provider_error' | 'timeout';
export const ESTADO_DEL_ERROR: Record<CodigoDeError, number> = {
  unauthorized: 401,
  invalid_request: 400,
  provider_error: 502,
  timeout: 504,
};

export interface Ciudad {
  geo_id: string;
  name: string;
  admin1: string | null;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ClimaActual {
  geo_id: string;
  temperature_c: number;
  condition_code: string;
  condition_text: string;
  observed_at: string;
}

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** EF-02: `{ query }` de 1 a 100 caracteres, recortado. */
export function leerBusqueda(cuerpo: unknown): string | null {
  if (!esObjeto(cuerpo) || typeof cuerpo.query !== 'string') return null;
  const query = cuerpo.query.trim();
  return [...query].length >= 1 && [...query].length <= 100 ? query : null;
}

export function urlDeBusqueda(query: string): string {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${MAXIMO_DE_CIUDADES}&language=es&format=json`;
}

/** Las ciudades de Open-Meteo; sin `results`, lista vacía (ciudad no reconocida). */
export function leerCiudades(respuesta: unknown): Ciudad[] {
  if (!esObjeto(respuesta) || !Array.isArray(respuesta.results)) return [];
  return respuesta.results
    .filter(esObjeto)
    .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number' && typeof r.name === 'string')
    .slice(0, MAXIMO_DE_CIUDADES)
    .map((r) => ({
      geo_id: String(r.id),
      name: String(r.name),
      admin1: typeof r.admin1 === 'string' ? r.admin1 : null,
      country: typeof r.country === 'string' ? r.country : '',
      latitude: r.latitude as number,
      longitude: r.longitude as number,
    }));
}

/** EF-03: `{ geo_id, latitude, longitude }` con coordenadas válidas. */
export function leerPeticionDeClima(cuerpo: unknown): { geo_id: string; latitude: number; longitude: number } | null {
  if (!esObjeto(cuerpo)) return null;
  const { geo_id, latitude, longitude } = cuerpo;
  if (typeof geo_id !== 'string' || !geo_id) return null;
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) return null;
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) return null;
  return { geo_id, latitude, longitude };
}

export function urlDelClima(latitud: number, longitud: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&current=temperature_2m,weather_code&timezone=auto`;
}

/** HE-04-HU05-ET13 (INT-04): la condición en español según el código WMO. */
export function condicion(codigo: number): string {
  if (codigo === 0) return 'Despejado';
  if (codigo === 1) return 'Mayormente despejado';
  if (codigo === 2) return 'Parcialmente nublado';
  if (codigo === 3) return 'Nublado';
  if ([45, 48].includes(codigo)) return 'Niebla';
  if ([51, 53, 55, 56, 57].includes(codigo)) return 'Llovizna';
  if ([61, 63, 65, 66, 67].includes(codigo)) return 'Lluvia';
  if ([71, 73, 75, 77].includes(codigo)) return 'Nieve';
  if ([80, 81, 82].includes(codigo)) return 'Chubascos';
  if ([85, 86].includes(codigo)) return 'Chubascos de nieve';
  if ([95, 96, 99].includes(codigo)) return 'Tormenta';
  return 'Condición no disponible';
}

/** El clima actual de Open-Meteo; `null` si la respuesta no trae temperatura y código. */
export function leerClima(respuesta: unknown, geoId: string, ahora: Date): ClimaActual | null {
  if (!esObjeto(respuesta) || !esObjeto(respuesta.current)) return null;
  const { temperature_2m, weather_code } = respuesta.current;
  if (typeof temperature_2m !== 'number' || typeof weather_code !== 'number') return null;
  return {
    geo_id: geoId,
    temperature_c: temperature_2m,
    condition_code: String(weather_code),
    condition_text: condicion(weather_code),
    observed_at: ahora.toISOString(),
  };
}

/** La clave de la caché compartida (`external_cache.key`). */
export const claveDeCache = (geoId: string) => `weather:${geoId}`;

/** ¿Sigue vigente la fila de la caché? */
export function vigente(fila: unknown, ahora: Date): ClimaActual | null {
  if (!esObjeto(fila) || typeof fila.expires_at !== 'string' || !esObjeto(fila.payload)) return null;
  return new Date(fila.expires_at).getTime() > ahora.getTime() ? (fila.payload as unknown as ClimaActual) : null;
}
