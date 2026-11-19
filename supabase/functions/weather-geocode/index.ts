// EF-02 `weather-geocode` (contratos.md; HE-04-HU05; INT-04). Exige el JWT del usuario (`verify_jwt = true`) y
// busca la ciudad en Open-Meteo, que no pide clave (DP-17). Solo envía el nombre de la ciudad. Corta a los 8 s.
import { type CodigoDeError, ESPERA_MS, ESTADO_DEL_ERROR, leerBusqueda, leerCiudades, urlDeBusqueda } from '../_compartido/clima.ts';

declare const Deno: { serve(manejador: (peticion: Request) => Promise<Response>): void };

function json(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

const fallo = (codigo: CodigoDeError) => json(ESTADO_DEL_ERROR[codigo], { error: { code: codigo, message: codigo } });

Deno.serve(async (peticion) => {
  if (!peticion.headers.get('Authorization')) return fallo('unauthorized');
  const query = leerBusqueda(await peticion.json().catch(() => null));
  if (!query) return fallo('invalid_request');
  const tiempo = new AbortController();
  const corte = setTimeout(() => tiempo.abort(), ESPERA_MS);
  try {
    const respuesta = await fetch(urlDeBusqueda(query), { signal: tiempo.signal });
    if (!respuesta.ok) return fallo('provider_error');
    return json(200, { results: leerCiudades(await respuesta.json()) });
  } catch {
    return fallo(tiempo.signal.aborted ? 'timeout' : 'provider_error');
  } finally {
    clearTimeout(corte);
  }
});
