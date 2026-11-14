// Descarga del instalador (CD-01-HU02; INT-12, DP-14). Antes de iniciar la descarga, y no al cargar la
// página, se consulta la última release en la API de GitHub y se comprueba que tiene el instalador.

export const ACTIVO = 'Windgets-Setup.exe';

/** `<organizacion>/windgets`, leído en la compilación (convenciones.md, «Configuración de la landing»). */
export function repositorioValido(repo: string | undefined): repo is string {
  return repo !== undefined && /^[\w.-]+\/[\w.-]+$/.test(repo);
}

export function enlaceDeDescarga(repo: string): string {
  return `https://github.com/${repo}/releases/latest/download/${ACTIVO}`;
}

/**
 * `true` si la última release tiene el instalador. Con la consulta fallida (sin conexión, 403 por el límite
 * de 60 consultas por hora, 404 sin releases) o sin el activo, `false` (CD-01-HU02-ET03).
 */
export async function instaladorDisponible(repo: string, consultar: typeof fetch = fetch): Promise<boolean> {
  try {
    const respuesta = await consultar(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!respuesta.ok) return false;
    const release = (await respuesta.json()) as { assets?: Array<{ name?: unknown }> };
    return Array.isArray(release.assets) && release.assets.some((a) => a.name === ACTIVO);
  } catch {
    // Sin conexión o respuesta que no es JSON: el instalador no está disponible para esta descarga.
    return false;
  }
}
