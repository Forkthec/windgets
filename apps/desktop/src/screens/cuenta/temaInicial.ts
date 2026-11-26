import { useEffect } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke } from '@/types';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import type { ModoDeCuenta } from './apariencia';
import { TEMA_INICIAL_NO_APLICADO, type NombreDelTemaInicial } from './textosDelRediseno';

// docs/rediseno.md RD-15: el primer tema de una cuenta nueva toma la paleta del modo elegido en las pantallas de
// cuenta («claro» u «oscuro», migración 0007) y la tipografía Rubik, y se aplica. Usa el flujo de Personalización
// (theme_draft_open → theme_draft_update → theme_draft_apply con «save_and_apply»), sin contratos nuevos.
// La paleta y la fuente llegan con la primera descarga del catálogo: si aún no están, se espera a
// `catalog_updated` o `sync_completed`. Si no llegan a tiempo o el Núcleo rechaza el cambio, la cuenta sigue con
// su tema y se muestra el mensaje de resultado; la entrada a la aplicación nunca se bloquea.

export const FUENTE_INICIAL = 'rubik';
/** Cuánto se espera la primera descarga del catálogo antes de avisar que el tema no se aplicó. */
export const ESPERA_DEL_CATALOGO_MS = 60_000;

/** El nombre del tema de cada modo en el catálogo (migración 0010; RD-94). */
export const NOMBRE_DEL_MODO: Record<ModoDeCuenta, NombreDelTemaInicial> = {
  claro: 'Windgets claro',
  oscuro: 'Windgets oscuro',
};

type Intento = 'aplicado' | 'sin_catalogo' | 'fallo';

async function catalogoListo(invocar: Invoke, paleta: ModoDeCuenta): Promise<boolean> {
  const [paletas, fuentes] = await Promise.all([
    invocar('catalog_list', { kind: 'palette' }),
    invocar('catalog_list', { kind: 'font' }),
  ]);
  return (
    paletas.ok &&
    fuentes.ok &&
    paletas.value.some((p) => p.id === paleta) &&
    fuentes.value.some((f) => f.id === FUENTE_INICIAL)
  );
}

/**
 * Un intento de aplicar la paleta del modo al tema de la cuenta: con `conFuente`, también Rubik (RD-15); sin ella,
 * solo la paleta (selector «Apariencia» con sesión, RD-29).
 */
export async function aplicarTemaInicial(
  invocar: Invoke,
  paleta: ModoDeCuenta,
  conFuente = true,
): Promise<Intento> {
  if (!(await catalogoListo(invocar, paleta))) return 'sin_catalogo';
  const abierto = await invocar('theme_draft_open', {});
  if (!abierto.ok) return 'fallo';
  const cambiado = await invocar('theme_draft_update', {
    patch: conFuente ? { palette_id: paleta, font_id: FUENTE_INICIAL } : { palette_id: paleta },
  });
  if (!cambiado.ok) {
    void invocar('theme_draft_discard', {});
    return 'fallo';
  }
  const aplicado = await invocar('theme_draft_apply', { mode: 'save_and_apply' });
  if (!aplicado.ok) {
    void invocar('theme_draft_discard', {});
    return 'fallo';
  }
  return 'aplicado';
}

/**
 * Aplica el tema inicial una sola vez para `paleta` (null: no es una cuenta nueva) y avisa con `alTerminar`.
 * Va dentro del proveedor de mensajes de resultado.
 */
export function useTemaInicial(
  invocar: Invoke,
  escuchar: Escuchar,
  paleta: ModoDeCuenta | null,
  alTerminar: () => void,
) {
  const mostrarResultado = useMensajeDeResultado();
  useEffect(() => {
    if (!paleta) return;
    let vigente = true;
    let enCurso = false;
    const dejar: Array<() => void> = [];
    const terminar = (exito: boolean) => {
      if (!vigente) return;
      vigente = false;
      dejar.forEach((d) => d());
      clearTimeout(limite);
      if (!exito) mostrarResultado(TEMA_INICIAL_NO_APLICADO(NOMBRE_DEL_MODO[paleta]), 'advertencia');
      alTerminar();
    };
    // Un aviso del catálogo que llega durante un intento se atiende al terminar ese intento.
    let otraVez = false;
    const intentar = async () => {
      if (!vigente) return;
      if (enCurso) {
        otraVez = true;
        return;
      }
      enCurso = true;
      const r = await aplicarTemaInicial(invocar, paleta);
      enCurso = false;
      if (r !== 'sin_catalogo') terminar(r === 'aplicado');
      else if (otraVez) {
        otraVez = false;
        void intentar();
      }
    };
    const limite = setTimeout(() => terminar(false), ESPERA_DEL_CATALOGO_MS);
    dejar.push(
      escuchar('catalog_updated', () => void intentar()),
      escuchar('sync_completed', () => void intentar()),
    );
    void intentar();
    return () => {
      // Se cerró la sesión antes de terminar: no se aplica ni se avisa.
      vigente = false;
      dejar.forEach((d) => d());
      clearTimeout(limite);
    };
  }, [alTerminar, escuchar, invocar, mostrarResultado, paleta]);
}
