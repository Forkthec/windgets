// EF-03 `weather-current` (contratos.md; HE-04-HU05; INT-04). Exige el JWT del usuario (`verify_jwt = true`). Lee
// primero la caché compartida `external_cache` (30 min, RNF-09) con la clave de servicio que Supabase da a las Edge
// Functions; si no está vigente, consulta Open-Meteo y la guarda. Corta a los 8 s.
import {
  type CodigoDeError,
  claveDeCache,
  ESPERA_MS,
  ESTADO_DEL_ERROR,
  leerClima,
  leerPeticionDeClima,
  urlDelClima,
  VIGENCIA_MS,
  vigente,
} from '../_compartido/clima.ts';

declare const Deno: {
  env: { get(nombre: string): string | undefined };
  serve(manejador: (peticion: Request) => Promise<Response>): void;
};

function json(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

const fallo = (codigo: CodigoDeError) => json(ESTADO_DEL_ERROR[codigo], { error: { code: codigo, message: codigo } });

/** PostgREST con la clave de servicio: `external_cache` no tiene políticas para los usuarios (0002_rls.sql). */
function cache() {
  const url = Deno.env.get('SUPABASE_URL');
  const clave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !clave) return null;
  const cabeceras = { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' };
  return {
    leer: async (key: string) => {
      const r = await fetch(`${url}/rest/v1/external_cache?key=eq.${encodeURIComponent(key)}&select=payload,expires_at`, {
        headers: cabeceras,
      });
      const filas = r.ok ? ((await r.json()) as unknown[]) : [];
      return filas[0] ?? null;
    },
    guardar: async (key: string, payload: unknown, ahora: Date) => {
      await fetch(`${url}/rest/v1/external_cache`, {
        method: 'POST',
        headers: { ...cabeceras, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({
          key,
          payload,
          fetched_at: ahora.toISOString(),
          expires_at: new Date(ahora.getTime() + VIGENCIA_MS).toISOString(),
        }),
      });
    },
  };
}

Deno.serve(async (peticion) => {
  if (!peticion.headers.get('Authorization')) return fallo('unauthorized');
  const datos = leerPeticionDeClima(await peticion.json().catch(() => null));
  if (!datos) return fallo('invalid_request');
  const ahora = new Date();
  const compartida = cache();
  const key = claveDeCache(datos.geo_id);
  const guardado = compartida ? vigente(await compartida.leer(key).catch(() => null), ahora) : null;
  if (guardado) return json(200, { ...guardado, cache: 'hit' });
  const tiempo = new AbortController();
  const corte = setTimeout(() => tiempo.abort(), ESPERA_MS);
  try {
    const respuesta = await fetch(urlDelClima(datos.latitude, datos.longitude), { signal: tiempo.signal });
    if (!respuesta.ok) return fallo('provider_error');
    const clima = leerClima(await respuesta.json(), datos.geo_id, ahora);
    if (!clima) return fallo('provider_error');
    await compartida?.guardar(key, clima, ahora).catch(() => undefined);
    return json(200, { ...clima, cache: 'miss' });
  } catch {
    return fallo(tiempo.signal.aborted ? 'timeout' : 'provider_error');
  } finally {
    clearTimeout(corte);
  }
});
