// EF-01 `windi-chat` (contratos.md; HE-14). Exige el JWT del usuario (`verify_jwt = true` en config.toml) y lee
// `GEMINI_API_KEY` y `GEMINI_MODEL` de los secretos de Supabase: el ejecutable no tiene la clave (D-192). Corta a
// los 13 s (RNF-11; D-172). No habilita CORS (la llama el Núcleo) ni registra el contenido (D-196): el log lleva
// solo el resumen de cada respuesta de Gemini y reintenta una vez la que llega vacía (P27) o con 500, 503 o 504, con el
// modelo `GEMINI_MODEL_RESPALDO` si está (P36, `responderConGemini`).
import {
  type CodigoDeError,
  cuerpoParaGemini,
  ESPERA_MS,
  ESTADO_DEL_ERROR,
  leerPeticion,
  MODELO_POR_DEFECTO,
  type Registro,
  responderConGemini,
} from './logica.ts';

declare const Deno: {
  env: { get(nombre: string): string | undefined };
  serve(manejador: (peticion: Request) => Promise<Response>): void;
};

const MENSAJES: Record<CodigoDeError, string> = {
  unauthorized: 'Missing or invalid JWT',
  invalid_request: 'The message must have 1 to 2000 characters',
  quota_exceeded: 'Gemini quota exceeded',
  provider_error: 'Gemini error',
  timeout: 'Gemini did not answer in time',
};

function json(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Una línea JSON por respuesta de Gemini, sin el texto de la persona (D-196).
const registrar: Registro = (nivel, datos) =>
  (nivel === 'error' ? console.error : console.log)(JSON.stringify({ funcion: 'windi-chat', ...datos }));

const fallo = (codigo: CodigoDeError) =>
  json(ESTADO_DEL_ERROR[codigo], { error: { code: codigo, message: MENSAJES[codigo] } });

Deno.serve(async (peticion) => {
  if (!peticion.headers.get('Authorization')) return fallo('unauthorized');
  const cuerpo = leerPeticion(await peticion.json().catch(() => null));
  if (!cuerpo) return fallo('invalid_request');
  const clave = Deno.env.get('GEMINI_API_KEY');
  if (!clave) return fallo('provider_error');
  const modelo = Deno.env.get('GEMINI_MODEL') || MODELO_POR_DEFECTO;
  // P36: un segundo modelo para reintentar cuando el principal está saturado (503); opcional.
  const respaldo = Deno.env.get('GEMINI_MODEL_RESPALDO') || '';
  const tiempo = new AbortController();
  const corte = setTimeout(() => tiempo.abort(), ESPERA_MS);
  try {
    const cuerpoGemini = JSON.stringify(cuerpoParaGemini(cuerpo));
    const llamarA = (nombre: string) => () =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${nombre}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
        body: cuerpoGemini,
        signal: tiempo.signal,
      });
    const leida = await responderConGemini(llamarA(modelo), registrar, {
      llamarRespaldo: respaldo && respaldo !== modelo ? llamarA(respaldo) : undefined,
    });
    return typeof leida === 'string' ? fallo(leida) : json(200, leida);
  } catch {
    return fallo(tiempo.signal.aborted ? 'timeout' : 'provider_error');
  } finally {
    clearTimeout(corte);
  }
});
