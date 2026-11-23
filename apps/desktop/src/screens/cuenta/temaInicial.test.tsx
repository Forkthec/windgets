// docs/rediseno.md RD-15 · El primer tema de una cuenta nueva toma la paleta del modo de las pantallas de cuenta.
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '@/types';
import { useNavegacion } from '@/ventana_principal/VentanaPrincipal';
import { CLAVE_DEL_MODO, useApariencia } from './apariencia';
import { abrirCuenta, llamadasA, type NucleoDePrueba } from './pruebas';
import { ESPERA_DEL_CATALOGO_MS } from './temaInicial';

const item = (id: string): CatalogItem => ({ id, name: id, thumbnail_url: '', is_cached: true });
const CATALOGO_COMPLETO = { palette: [item('claro'), item('oscuro')], font: [item('rubik')] };

/** Pantalla de cuenta de prueba: entra como cuenta nueva o como cuenta existente. */
function Entrada() {
  const { sesionIniciada } = useNavegacion();
  const { modo } = useApariencia();
  return (
    <main aria-label="Inicio de sesión">
      <button type="button" onClick={() => sesionIniciada({ paleta: modo })}>
        Cuenta nueva
      </button>
      <button type="button" onClick={() => sesionIniciada()}>
        Cuenta existente
      </button>
    </main>
  );
}

function conCatalogo(nucleo: NucleoDePrueba, catalogo: { palette: CatalogItem[]; font: CatalogItem[] }) {
  nucleo.responder('catalog_list', ({ kind }) => ({
    ok: true,
    value: kind === 'palette' ? catalogo.palette : kind === 'font' ? catalogo.font : [],
  }));
}

function conBorrador(nucleo: NucleoDePrueba, aplicar: 'bien' | 'mal' = 'bien') {
  const vista = { ok: true as const, value: {} as never };
  nucleo.responder('theme_draft_open', () => vista);
  nucleo.responder('theme_draft_update', () => vista);
  nucleo.responder('theme_draft_discard', () => ({ ok: true, value: {} as never }));
  nucleo.responder('theme_draft_apply', () =>
    aplicar === 'bien'
      ? { ok: true, value: { theme_id: 'tema-1' } as never }
      : { ok: false, error: { code: 'theme.save_failed' as never, message: 'No se pudo guardar.' } },
  );
}

async function entrar(boton: 'Cuenta nueva' | 'Cuenta existente') {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: boton }));
  });
}

const NO_APLICADO = (paleta: string) =>
  `No pudimos aplicar el tema ${paleta}. Puedes elegirlo en Personalización.`;

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('RD-15 · Tema inicial de una cuenta nueva', () => {
  it('Aplica la paleta del modo elegido y Rubik al tema de la cuenta nueva', async () => {
    window.localStorage.setItem(CLAVE_DEL_MODO, 'oscuro');
    const nucleo = await abrirCuenta('sign_in', { sign_in: Entrada });
    conCatalogo(nucleo, CATALOGO_COMPLETO);
    conBorrador(nucleo);
    await entrar('Cuenta nueva');
    expect(llamadasA(nucleo, 'theme_draft_update')[0]?.params).toEqual({
      patch: { palette_id: 'oscuro', font_id: 'rubik' },
    });
    expect(llamadasA(nucleo, 'theme_draft_apply')[0]?.params).toEqual({ mode: 'save_and_apply' });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('Una cuenta existente conserva su tema', async () => {
    const nucleo = await abrirCuenta('sign_in', { sign_in: Entrada });
    conCatalogo(nucleo, CATALOGO_COMPLETO);
    conBorrador(nucleo);
    await entrar('Cuenta existente');
    expect(llamadasA(nucleo, 'theme_draft_open')).toHaveLength(0);
    expect(llamadasA(nucleo, 'theme_draft_apply')).toHaveLength(0);
  });

  it('Espera a que la primera descarga traiga la paleta y la fuente', async () => {
    window.localStorage.setItem(CLAVE_DEL_MODO, 'claro');
    const nucleo = await abrirCuenta('sign_in', { sign_in: Entrada });
    conCatalogo(nucleo, { palette: [], font: [] });
    conBorrador(nucleo);
    await entrar('Cuenta nueva');
    expect(llamadasA(nucleo, 'theme_draft_open')).toHaveLength(0);
    conCatalogo(nucleo, CATALOGO_COMPLETO);
    nucleo.emitir('catalog_updated', { kinds: ['palette', 'font'] });
    await act(async () => {});
    expect(llamadasA(nucleo, 'theme_draft_update')[0]?.params).toEqual({
      patch: { palette_id: 'claro', font_id: 'rubik' },
    });
    expect(llamadasA(nucleo, 'theme_draft_apply')).toHaveLength(1);
  });

  it('Si el Núcleo rechaza el tema, descarta el borrador y muestra el mensaje sin bloquear la entrada', async () => {
    window.localStorage.setItem(CLAVE_DEL_MODO, 'claro');
    const nucleo = await abrirCuenta('sign_in', { sign_in: Entrada });
    conCatalogo(nucleo, CATALOGO_COMPLETO);
    conBorrador(nucleo, 'mal');
    await entrar('Cuenta nueva');
    expect(llamadasA(nucleo, 'theme_draft_discard')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toContain(NO_APLICADO('Claro'));
    expect(screen.queryByRole('main', { name: 'Inicio de sesión' })).toBeNull();
  });

  it('Si el catálogo no llega a tiempo, muestra el mensaje y no lo vuelve a intentar', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    window.localStorage.setItem(CLAVE_DEL_MODO, 'oscuro');
    const nucleo = await abrirCuenta('sign_in', { sign_in: Entrada });
    conCatalogo(nucleo, { palette: [], font: [] });
    conBorrador(nucleo);
    await entrar('Cuenta nueva');
    await act(async () => {
      vi.advanceTimersByTime(ESPERA_DEL_CATALOGO_MS);
    });
    expect(screen.getByRole('status').textContent).toContain(NO_APLICADO('Oscuro'));
    conCatalogo(nucleo, CATALOGO_COMPLETO);
    nucleo.emitir('sync_completed', { pushed: 0, pulled: 1, after_reconnect: false });
    await act(async () => {});
    expect(llamadasA(nucleo, 'theme_draft_open')).toHaveLength(0);
  });
});
