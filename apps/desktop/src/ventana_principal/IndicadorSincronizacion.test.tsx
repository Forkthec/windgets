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

  // CA05 y CA06 (ET08 a ET10) se prueban con el agente de IA y los widgets externos: screens/windi/Windi.test.tsx
  // y capa/WidgetClima.test.tsx.
});

describe('HE-15-HU03 · Sincronizar al volver la conexión', () => {
  it('HE-15-HU03-CA01 · Sincronización al reconectarse', async () => {
    const { indicador, emitir } = await abrir(CON_SESION, estado('offline', 2));
    // ET08: «Sincronizando…» y luego «Sincronizado».
    emitir('sync_status_changed', estado('syncing', 2));
    expect(within(indicador).getByText('Sincronizando…')).toBeTruthy();
    emitir('sync_status_changed', estado('synced'));
    expect(within(indicador).getByText('Sincronizado')).toBeTruthy();
    // ET09
    emitir('sync_completed', { pushed: 2, pulled: 0, after_reconnect: true });
    expect(screen.getByText('Tus cambios se sincronizaron.')).toBeTruthy();
  });

  it('sin cambios hechos offline no muestra el mensaje de sincronización', async () => {
    const { emitir } = await abrir(CON_SESION, estado('synced'));
    emitir('sync_completed', { pushed: 0, pulled: 3, after_reconnect: false });
    expect(screen.queryByText('Tus cambios se sincronizaron.')).toBeNull();
  });

  // CA02, CA05 y CA06: la nube decidió con la hora más reciente (pruebas ca_he_15_hu03_ca02, ca05 y ca06 del
  // motor) y avisa con EV-06.
  for (const ca of [
    'HE-15-HU03-CA02 · Conflicto en el mismo campo entre computadores',
    'HE-15-HU03-CA05 · Tarjeta eliminada en un computador y modificada en otro, con eliminación más reciente',
    'HE-15-HU03-CA06 · Tarjeta eliminada en un computador y modificada en otro, con modificación más reciente',
  ]) {
    it(ca, async () => {
      const { emitir } = await abrir(CON_SESION, estado('synced'));
      emitir('sync_conflicts_resolved', { count: 1 });
      expect(
        screen.getByText('Algunas tarjetas se actualizaron con cambios más recientes de otro computador.'),
      ).toBeTruthy();
    });
  }

  it('HE-15-HU03-CA04 · Cambios en campos distintos de la misma tarjeta', async () => {
    // ET02: se combinan sin conflicto (ca_he_15_hu03_ca04): no llega EV-06 y no hay mensaje.
    const { emitir } = await abrir(CON_SESION, estado('synced'));
    emitir('sync_completed', { pushed: 1, pulled: 0, after_reconnect: false });
    expect(screen.queryByText(/cambios más recientes de otro computador/)).toBeNull();
  });
});

// HE-16-HU01 · El indicador en la pantalla Configuración (ET01, ET08: junto al menú principal en todas las pantallas
// que lo muestran, D-203). El Núcleo calcula el estado (motor_de_sincronizacion.rs, pruebas ca_he_15_hu01_*).
function Configuracion() {
  return <main aria-label="Configuración">Configuración</main>;
}

async function enConfiguracion(sincronizacion: SyncStatus) {
  const n = nucleo(CON_SESION, sincronizacion);
  render(
    <VentanaPrincipal
      invocar={n.invocar}
      escuchar={n.escuchar}
      pantallas={{ planner_daily: PlanificadorDiario, settings: Configuracion }}
    />,
  );
  const [opcion] = await screen.findAllByRole('button', { name: 'Configuración' });
  act(() => (opcion as HTMLElement).click());
  await screen.findByRole('main', { name: 'Configuración' });
  return { ...n, indicador: screen.getByRole('status', { name: 'Indicador de sincronización' }) };
}

describe('HE-16-HU01 · Indicador de sincronización en Configuración', () => {
  it('HE-16-HU01-CA01 · Indicador Sincronizado', async () => {
    const { indicador } = await enConfiguracion(estado('synced'));
    expect(within(indicador).getByText('Sincronizado')).toBeTruthy();
    expect(within(indicador).queryByText(/pendiente/)).toBeNull();
  });

  it('HE-16-HU01-CA02 · Indicador Sincronizando', async () => {
    const { indicador, emitir } = await enConfiguracion(estado('synced'));
    emitir('sync_status_changed', estado('syncing', 2));
    expect(within(indicador).getByText('Sincronizando…')).toBeTruthy();
  });

  it('HE-16-HU01-CA03 · Indicador Sin conexión con cambios pendientes', async () => {
    const { indicador } = await enConfiguracion(estado('offline', 4));
    expect(within(indicador).getByText('Sin conexión')).toBeTruthy();
    expect(within(indicador).getByText('4 cambios pendientes de sincronizar')).toBeTruthy();
  });

  it('HE-16-HU01-CA04 · Indicador Sin conexión con un solo cambio pendiente', async () => {
    const { indicador } = await enConfiguracion(estado('offline', 1));
    expect(within(indicador).getByText('1 cambio pendiente de sincronizar')).toBeTruthy();
  });

  it('HE-16-HU01-CA05 · Indicador Error de sincronización', async () => {
    const { indicador } = await enConfiguracion(estado('error', 1));
    expect(
      within(indicador).getByText('Error de sincronización. Reintentaremos automáticamente.'),
    ).toBeTruthy();
  });
});
