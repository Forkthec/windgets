// Detección del sistema operativo y la arquitectura solo con la información del navegador (CD-01-HU01-ET08;
// INT-12). No siempre indica la versión exacta: la comprobación definitiva la hace el instalador (CD-02-HU01).

export type Compatibilidad = 'compatible' | 'sin_windows' | 'arquitectura_distinta';

interface DatosDelAgente {
  platform: string;
  getHighEntropyValues?: (pistas: string[]) => Promise<{ architecture?: string; bitness?: string }>;
}

/** Lo que el navegador informa: `userAgentData` cuando existe y, si no, `userAgent`. */
export interface Navegador {
  userAgent: string;
  userAgentData?: DatosDelAgente;
}

function desdeUserAgent(ua: string): Compatibilidad {
  if (!/Windows/i.test(ua)) return 'sin_windows';
  if (/ARM/i.test(ua)) return 'arquitectura_distinta';
  return /Win64|WOW64|x64|amd64/i.test(ua) ? 'compatible' : 'arquitectura_distinta';
}

export async function detectarCompatibilidad(navegador: Navegador): Promise<Compatibilidad> {
  const datos = navegador.userAgentData;
  if (!datos?.platform) return desdeUserAgent(navegador.userAgent);
  if (datos.platform !== 'Windows') return 'sin_windows';
  if (!datos.getHighEntropyValues) return desdeUserAgent(navegador.userAgent);
  try {
    const { architecture, bitness } = await datos.getHighEntropyValues(['architecture', 'bitness']);
    if (architecture === undefined || bitness === undefined) return desdeUserAgent(navegador.userAgent);
    return architecture === 'x86' && bitness === '64' ? 'compatible' : 'arquitectura_distinta';
  } catch {
    // El navegador no entregó las pistas: se usa lo que dice el userAgent.
    return desdeUserAgent(navegador.userAgent);
  }
}
