// EF-04 `news-headlines` (contratos.md; HE-04-HU06; INT-05). Exige el JWT del usuario (`verify_jwt = true`) y lee la
// clave de GNews del secreto `NEWS_API_KEY` (D-192). Comparte una caché de 60 min (RNF-09) en `external_cache` con la
// clave de servicio que Supabase da a las Edge Functions. Corta a los 8 s.
import { ESPERA_MS } from '../_compartido/clima.ts';
import {
  claveDeCache,
  leerEdicion,
  leerTitulares,
  urlDeTitulares,
  VIGENCIA_MS,
  vigente,
} from '../_compartido/noticias.ts';

declare const Deno: {
  env: { get(nombre: string): string | undefined };
  serve(manejador: (peticion: Request) => Promise<Response>): void;
};

type CodigoDeError = 'unauthorized' | 'provider_error' | 'timeout';
const ESTADO: Record<CodigoDeError, number> = { unauthorized: 401, provider_error: 502, timeout: 504 };

function json(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

const fallo = (codigo: CodigoDeError) => json(ESTADO[codigo], { error: { code: codigo, message: codigo } });

function cache() {
  const url = Deno.env.get('SUPABASE_URL');
  const clave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !clave) return null;
  const cabeceras = { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' };
  return {
    leer: async (key: string) => {
      const r = await fetch(
        `${url}/rest/v1/external_cache?key=eq.${encodeURIComponent(key)}&select=payload,expires_at`,
        { headers: cabeceras },
      );
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
  const edicion = leerEdicion(await peticion.json().catch(() => null));
  const ahora = new Date();
  const compartida = cache();
  const key = claveDeCache(edicion);
  const guardado = compartida ? vigente(await compartida.leer(key).catch(() => null), ahora) : null;
  if (guardado) return json(200, { ...guardado, cache: 'hit' });
  const clave = Deno.env.get('NEWS_API_KEY');
  if (!clave) return fallo('provider_error');
  const tiempo = new AbortController();
  const corte = setTimeout(() => tiempo.abort(), ESPERA_MS);
  try {
    const respuesta = await fetch(urlDeTitulares(edicion, clave), { signal: tiempo.signal });
    if (!respuesta.ok) return fallo('provider_error');
    const headlines = leerTitulares(await respuesta.json());
    if (!headlines) return fallo('provider_error');
    const datos = { headlines, fetched_at: ahora.toISOString() };
    await compartida?.guardar(key, datos, ahora).catch(() => undefined);
    return json(200, { ...datos, cache: 'miss' });
  } catch {
    return fallo(tiempo.signal.aborted ? 'timeout' : 'provider_error');
  } finally {
    clearTimeout(corte);
  }
});
