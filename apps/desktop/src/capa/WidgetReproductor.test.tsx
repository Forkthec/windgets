// HE-04-HU11 · El widget Reproductor de música en la capa, con la sesión de Windows simulada (IPC-MED-01, EV-19).
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LayerInitialState, MediaSession } from '@/types';
import { crearNucleo } from '../screens/kanban/pruebas';
import { Capa } from './Capa';

const ESTADO: LayerInitialState = {
  applied: {
    template_id: 'default',
    background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
    colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
    palette_id: null,
    font: { id: 'nunito', size: 'medium' },
  },
  widgets: [{ widget_id: 'w-m', type: 'music_player', x: 0, y: 0, width: 320, height: 160, is_active: true }],
  monitors: [],
  wallpaper_state: 'ok',
  wallpaper_fit: [],
};

const SONANDO: MediaSession = {
  has_session: true,
  title: 'Canción',
  artist: 'Artista',
  thumbnail_url: 'caratula.jpg',
  status: 'playing',
  can_previous: true,
  can_next: true,
  can_play_pause: true,
};

const SIN_SESION: MediaSession = {
  has_session: false,
  title: null,
  artist: null,
  thumbnail_url: null,
  status: 'stopped',
  can_previous: false,
  can_next: false,
  can_play_pause: false,
};

async function pintar(sesion: MediaSession) {
  const n = crearNucleo();
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  n.nucleo.responder('media_get_session', () => ({ ok: true, value: sesion }));
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
  const widget = await screen.findByRole('region', { name: 'Reproductor de música' });
  await act(async () => {});
  return { ...n, widget };
}

const boton = (w: HTMLElement, nombre: string) =>
  within(w).getByRole('button', { name: nombre }) as HTMLButtonElement;

describe('HE-04-HU11 · Widget Reproductor de música', () => {
  it('HE-04-HU11-CA01 · Agregar el widget con música en reproducción', async () => {
    const { widget } = await pintar(SONANDO);
    // ET03: título, artista, carátula y los tres controles.
    expect(within(widget).getByText('Canción')).toBeTruthy();
    expect(within(widget).getByText('Artista')).toBeTruthy();
    expect(widget.querySelector('img')?.getAttribute('src')).toBe('caratula.jpg');
    for (const nombre of ['Anterior', 'Pausar', 'Siguiente'])
      expect(boton(widget, nombre).disabled).toBe(false);
  });

  it('HE-04-HU11-CA02 · Varias aplicaciones de música en reproducción', async () => {
    // ET06: el Núcleo da la sesión que Windows marca como actual; al cambiarla avisa con EV-19.
    const { widget, nucleo } = await pintar(SONANDO);
    nucleo.emitir('media_session_changed', { ...SONANDO, title: 'De YouTube Music', artist: 'Otro' });
    expect(within(widget).getByText('De YouTube Music')).toBeTruthy();
  });

  it('HE-04-HU11-CA03 · Sin música en reproducción', async () => {
    const { widget } = await pintar(SIN_SESION);
    expect(within(widget).getByText('No hay música en reproducción.')).toBeTruthy();
    for (const nombre of ['Anterior', 'Reproducir', 'Siguiente'])
      expect(boton(widget, nombre).disabled).toBe(true);
  });

  it('HE-04-HU11-CA04 · Cambio de canción o de aplicación', async () => {
    const { widget, nucleo } = await pintar(SONANDO);
    nucleo.emitir('media_session_changed', { ...SONANDO, title: 'Otra canción', status: 'paused' });
    expect(within(widget).getByText('Otra canción')).toBeTruthy();
    expect(boton(widget, 'Reproducir')).toBeTruthy();
  });

  it('HE-04-HU11-CA05 · Carátula no disponible', async () => {
    const { widget } = await pintar({ ...SONANDO, thumbnail_url: null });
    expect(within(widget).getByRole('img', { name: 'Música' })).toBeTruthy();
    expect(within(widget).getByText('Canción')).toBeTruthy();
  });

  it('HE-04-HU11-CA06 · Reproductor de música sin conexión', async () => {
    const { widget, nucleo } = await pintar(SONANDO);
    nucleo.emitir('connectivity_changed', { online: false });
    expect(within(widget).queryByText(/Sin conexión/)).toBeNull();
    expect(boton(widget, 'Pausar').disabled).toBe(false);
  });
});

describe('HE-06-HU09 · Controlar la reproducción desde el widget', () => {
  it('HE-06-HU09-CA01 · Controlar la reproducción', async () => {
    const { widget, nucleo } = await pintar(SONANDO);
    // El widget es interactivo: la capa le reenvía las selecciones (HE-06-HU01).
    expect(widget.getAttribute('data-interactivo')).toBe('true');
    nucleo.responder('media_toggle_play_pause', () => ({ ok: true, value: null }));
    boton(widget, 'Pausar').click();
    boton(widget, 'Siguiente').click();
    boton(widget, 'Anterior').click();
    // ET03: cada control envía su acción a la sesión actual de Windows (SMTC).
    expect(
      nucleo.llamadas
        .map((l) => l.comando)
        .filter((c) => c.startsWith('media_') && c !== 'media_get_session'),
    ).toEqual(['media_toggle_play_pause', 'media_skip_next', 'media_skip_previous']);
    // ET02: tras la acción, EV-19 trae el estado nuevo y el botón dice «Reproducir».
    nucleo.emitir('media_session_changed', { ...SONANDO, status: 'paused' });
    expect(boton(widget, 'Reproducir')).toBeTruthy();
    // ET04: si la aplicación no admite «Anterior», ese control queda deshabilitado.
    nucleo.emitir('media_session_changed', { ...SONANDO, can_previous: false });
    expect(boton(widget, 'Anterior').disabled).toBe(true);
  });
});
