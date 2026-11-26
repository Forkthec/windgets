import { useCallback, useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { FontSize, Invoke, ThemeContent } from '@/types';
import { contraste, tokensDeLosColores } from './derivar';
import { aplicarTokens, type Tokens } from './tokens';
import { TOKENS_POR_DEFECTO } from './tokens_por_defecto';

// HE-03-HU06: los tokens de la aplicación salen del tema aplicado (ET01). Con la sesión iniciada, la ventana
// principal los redefine con los colores fijos del Figma según el modo del tema (docs/rediseno.md RD-28,
// `ventana_principal/marco.css`).

/** Modo de la ventana principal con sesión (RD-28). */
export type ModoDelTema = 'claro' | 'oscuro';

/** RD-28: claro si el texto que mejor contrasta con el principal del tema (el marco) es el oscuro. */
export const modoDeLosTokens = (tokens: Tokens): ModoDelTema =>
  contraste('#121216', tokens.marco) >= contraste('#FFFFFF', tokens.marco) ? 'claro' : 'oscuro';

/** HE-02-HU06-ET05: 14 px en «Pequeño», 16 px en «Mediano» y 20 px en «Grande». */
export const PIXELES_DEL_TAMANO: Record<FontSize, string> = { small: '14px', medium: '16px', large: '20px' };

/** La familia CSS de una fuente del catálogo (declarada en `ui/tema/tokens.css`). */
export const familia = (nombre: string): string => `'${nombre}', 'Segoe UI', sans-serif`;

/** Los tokens de un tema: sus colores, su fuente del catálogo de tipografías y su tamaño. */
export async function tokensDelTema(invocar: Invoke, contenido: ThemeContent): Promise<Tokens> {
  const fuentes = await invocar('catalog_list', { kind: 'font' });
  const nombre = fuentes.ok ? fuentes.value.find((f) => f.id === contenido.font.id)?.name : undefined;
  return tokensDeLosColores({
    ...contenido.colors,
    fuente: nombre ? familia(nombre) : TOKENS_POR_DEFECTO.fuente,
    tamano: PIXELES_DEL_TAMANO[contenido.font.size],
  });
}

/**
 * Escribe en la ventana los tokens del tema aplicado (IPC-THEME-02) y los vuelve a escribir con EV-11
 * `applied_theme_changed`, en 5 s o menos (ET04; RNF-01). Los cambios de la vista previa, guardados o no, no
 * cambian la aplicación hasta aplicarlos (ET06). Sin sesión, los tokens del tema por defecto.
 */
export function useTemaAplicado(
  invocar: Invoke,
  escuchar: Escuchar,
  conSesion: boolean,
): { modo: ModoDelTema | null; releer: () => void } {
  // RD-28: el modo del tema aplicado; null mientras no se conoce o sin sesión.
  const [modo, setModo] = useState<ModoDelTema | null>(null);
  // RD-29: después de aplicar una paleta desde el selector se vuelve a leer, también si EV-11 no llega (Núcleo
  // simulado).
  const [lectura, setLectura] = useState(0);
  const releer = useCallback(() => setLectura((n) => n + 1), []);
  useEffect(() => {
    if (!conSesion) {
      aplicarTokens(TOKENS_POR_DEFECTO);
      setModo(null);
      return;
    }
    let vigente = true;
    const leer = async () => {
      const r = await invocar('theme_get_applied', {});
      if (!r.ok) return;
      const tokens = await tokensDelTema(invocar, r.value.content);
      if (!vigente) return;
      aplicarTokens(tokens);
      setModo(modoDeLosTokens(tokens));
    };
    void leer();
    const dejar = escuchar('applied_theme_changed', () => void leer());
    return () => {
      vigente = false;
      dejar();
    };
  }, [conSesion, escuchar, invocar, lectura]);
  return { modo, releer };
}
