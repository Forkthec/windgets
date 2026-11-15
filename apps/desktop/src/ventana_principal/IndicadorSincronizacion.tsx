import { useEffect, useState } from 'react';
import type { SyncState, SyncStatus } from '@/types';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from './VentanaPrincipal';

// P-SIN-01 Indicador de sincronización: siempre visible junto al menú principal (interfaz.md; EV-04, D-203). Lo
// construyen HE-15-HU01 a HU03 y HE-16-HU01. El estado lo calcula el Núcleo (IPC-SYNC-01, EV-04).

// HE-15-HU01-ET03, ET05.
const TEXTO: Record<SyncState, string> = {
  synced: 'Sincronizado',
  syncing: 'Sincronizando…',
  offline: 'Sin conexión',
  error: 'Error de sincronización. Reintentaremos automáticamente.',
};

// HE-15-HU02-ET05.
export const AVISO_SIN_CONEXION =
  'Estás sin conexión. Tus cambios se guardarán y se sincronizarán al reconectarte.';

// HE-15-HU03-ET09.
export const SINCRONIZADOS = 'Tus cambios se sincronizaron.';
// HE-15-HU03-CA02, CA05, CA06 (EV-06).
export const CONFLICTOS = 'Algunas tarjetas se actualizaron con cambios más recientes de otro computador.';

/** HE-15-HU02-ET11 (D-160): «<cantidad> cambios pendientes de sincronizar»; con 1, en singular; con 0, nada. */
export function textoDePendientes(cantidad: number): string | null {
  if (cantidad <= 0) return null;
  return cantidad === 1
    ? '1 cambio pendiente de sincronizar'
    : `${cantidad} cambios pendientes de sincronizar`;
}

export function IndicadorSincronizacion() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [estado, setEstado] = useState<SyncStatus | null>(null);

  useEffect(() => {
    let vigente = true;
    void invocar('sync_get_status', {}).then((r) => {
      if (vigente && r.ok) setEstado(r.value);
    });
    const dejar = escuchar('sync_status_changed', setEstado);
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar]);

  // HE-15-HU02-ET05: al perder la conexión, el aviso (mensaje de resultado, RT-04).
  useEffect(
    () =>
      escuchar('connectivity_changed', (carga) => {
        if (!carga.online) {
          mostrarResultado(AVISO_SIN_CONEXION);
          setEstado((e) => (e ? { ...e, status: 'offline' } : e));
        }
      }),
    [escuchar, mostrarResultado],
  );

  // HE-15-HU03: al terminar de sincronizar los cambios hechos offline (EV-05) y cuando la nube conservó una
  // versión más reciente de una tarjeta (EV-06).
  useEffect(() => {
    const dejarCompletado = escuchar('sync_completed', (carga) => {
      if (carga.after_reconnect) mostrarResultado(SINCRONIZADOS);
    });
    const dejarConflictos = escuchar('sync_conflicts_resolved', (carga) => {
      if (carga.count > 0) mostrarResultado(CONFLICTOS);
    });
    return () => {
      dejarCompletado();
      dejarConflictos();
    };
  }, [escuchar, mostrarResultado]);

  if (!estado) return null;
  // HE-15-HU02-ET06: offline, la cantidad de cambios pendientes.
  const pendientes = estado.status === 'offline' ? textoDePendientes(estado.pending_count) : null;
  return (
    <div className="wg-indicador-sincronizacion" role="status" aria-label="Indicador de sincronización">
      <span>{TEXTO[estado.status]}</span>
      {pendientes && <span>{pendientes}</span>}
    </div>
  );
}
