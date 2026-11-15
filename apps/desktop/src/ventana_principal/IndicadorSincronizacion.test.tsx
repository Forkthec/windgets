// HE-15-HU02 · Trabajar con la aplicación offline. Una prueba por CA en la vista; el motor tiene sus pruebas
// ca_he_15_hu02_* en motor_de_sincronizacion.rs.
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { AuthSessionState, Invoke, Result, SyncStatus } from '@/types';
import { VentanaPrincipal } from './VentanaPrincipal';

const CON_SESION: Result<AuthSessionState> = {
  ok: true,
  value: { state: 'signed_in', user_id: 'u-1', alias: 'Paula', token: 'valid' },
};
// Sin conexión la sesión recordada sigue iniciada con el token por renovar (IPC-AUTH-12).
const CON_SESION_SIN_CONEXION: Result<AuthSessionState> = {
  ok: true,
  value: { state: 'signed_in', user_id: 'u-1', alias: 'Paula', token: 'refresh_pending' },
};

function estado(status: SyncStatus['status'], pending_count = 0): SyncStatus {
  return { status, pending_count, last_sync_at: null };
}

/** Núcleo de prueba: sesión, estado de sincronización y eventos. */
function nucleo(sesion: Result<AuthSessionState>, sincronizacion: SyncStatus) {
  const oyentes = new Map<string, Array<(c: unknown) => void>>();
  const invocar = ((comando: string) => {
    if (comando === 'auth_get_session') return Promise.resolve(sesion);
    if (comando === 'sync_get_status') return Promise.resolve({ ok: true, value: sincronizacion });
    return Promise.resolve({ ok: false, error: { code: 'internal.unexpected' } });
  }) as unknown as Invoke;
  const escuchar = ((evento: string, alRecibir: (c: unknown) => void) => {
    oyentes.set(evento, [...(oyentes.get(evento) ?? []), alRecibir]);
    return () =>
      oyentes.set(
        evento,
        (oyentes.get(evento) ?? []).filter((o) => o !== alRecibir),
      );
  }) as unknown as Escuchar;
  const emitir = (evento: string, carga: unknown) =>
    act(() => (oyentes.get(evento) ?? []).forEach((o) => o(carga)));
  return { invocar, escuchar, emitir };
}

function PlanificadorDiario() {
  return <main aria-label="Planificador diario">Tus tarjetas de hoy</main>;
}

async function abrir(sesion: Result<AuthSessionState>, sincronizacion: SyncStatus) {
  const n = nucleo(sesion, sincronizacion);
  render(
    <VentanaPrincipal
      invocar={n.invocar}
      escuchar={n.escuchar}
      pantallas={{ planner_daily: PlanificadorDiario }}
    />,
  );
  const indicador = await screen.findByRole('status', { name: 'Indicador de sincronización' });
  return { ...n, indicador };
}

describe('HE-15-HU02 · Trabajar offline', () => {
  it('HE-15-HU02-CA01 · Pérdida de conexión', async () => {
    const { indicador, emitir } = await abrir(CON_SESION, estado('synced'));
    expect(within(indicador).getByText('Sincronizado')).toBeTruthy();
    emitir('connectivity_changed', { online: false });
    // ET04, ET05
    expect(within(indicador).getByText('Sin conexión')).toBeTruthy();
    expect(
      screen.getByText('Estás sin conexión. Tus cambios se guardarán y se sincronizarán al reconectarte.'),
    ).toBeTruthy();
  });

  it('HE-15-HU02-CA02 · Trabajar offline con varios cambios', async () => {
    const { indicador, emitir } = await abrir(CON_SESION, estado('offline', 1));
    // ET06, ET11: cada cambio guardado actualiza la cantidad (EV-04).
    emitir('sync_status_changed', estado('offline', 3));
    expect(within(indicador).getByText('3 cambios pendientes de sincronizar')).toBeTruthy();
  });

  it('HE-15-HU02-CA03 · Trabajar offline con un solo cambio', async () => {
    const { indicador } = await abrir(CON_SESION, estado('offline', 1));
    expect(within(indicador).getByText('1 cambio pendiente de sincronizar')).toBeTruthy();
  });

  it('HE-15-HU02-CA04 · Abrir la aplicación offline', async () => {
    const { indicador } = await abrir(CON_SESION_SIN_CONEXION, estado('offline'));
    // ET01, ET07: la pantalla principal con lo guardado en el computador y «Sin conexión», sin cantidad (D-160).
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(within(indicador).getByText('Sin conexión')).toBeTruthy();
    expect(within(indicador).queryByText(/pendiente/)).toBeNull();
  });

  // ET08: el agente de IA (HE-14, P19) y los widgets externos (HE-04-HU05, HU06) aún no existen; su aviso de
  // falta de conexión se prueba con sus HU.
  it.todo('HE-15-HU02-CA05 · Funciones que requieren conexión (se prueba con HE-14-HU01 y HE-04-HU05)');
  // ET09, ET10: los widgets externos dependen del spike P01.
  it.todo('HE-15-HU02-CA06 · Widgets externos offline (se prueba con HE-04-HU05 y HE-04-HU06)');
});
