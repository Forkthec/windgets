import { describe, expect, it } from 'vitest';
import type { Monitor, WallpaperFit, WallpaperMonitorFit } from '@/types';
import { ESTILO_DEL_AJUSTE, fondosPorMonitor } from './fondo';

// HE-02-HU14 (P29) · La capa pinta la imagen de fondo en cada monitor con su ajuste. Las reglas de qué ajuste
// tiene cada monitor son del Núcleo (pruebas Rust ca_he_02_hu14_*); aquí, cómo se dibuja.

const monitor = (id: string, x: number, y = 0, escala = 1): Monitor => ({
  id,
  x,
  y,
  width: 1920,
  height: 1080,
  scale_factor: escala,
});
const ajuste = (monitor_id: string, fit: WallpaperFit, is_primary = false): WallpaperMonitorFit => ({
  monitor_id,
  number: Number(monitor_id) + 1,
  is_primary,
  fit,
});

describe('HE-02-HU14 · El fondo en cada monitor', () => {
  it('HE-02-HU14-CA01 · sin ajustes, cada monitor Rellenar con la misma imagen', () => {
    const fondos = fondosPorMonitor([monitor('0', 0), monitor('1', 1920)], [], 1);
    expect(fondos).toHaveLength(2);
    for (const f of fondos ?? []) expect(f.estilo).toMatchObject(ESTILO_DEL_AJUSTE.fill);
  });

  it('HE-02-HU14-CA02 · cada monitor dibuja la imagen con su ajuste', () => {
    const fits: WallpaperFit[] = ['fill', 'fit', 'stretch', 'tile', 'center'];
    const monitores = fits.map((_, i) => monitor(String(i), i * 1920));
    const fondos = fondosPorMonitor(
      monitores,
      fits.map((f, i) => ajuste(String(i), f, i === 0)),
      1,
    );
    expect(fondos?.map((f) => f.estilo.backgroundSize)).toEqual([
      'cover',
      'contain',
      '100% 100%',
      'auto',
      'auto',
    ]);
    expect(fondos?.[3]?.estilo.backgroundRepeat).toBe('repeat');
    expect(fondos?.[4]?.estilo.backgroundPosition).toBe('center');
  });

  it('HE-02-HU14-CA05 · Extender: una sola imagen sobre todo el escritorio virtual', () => {
    const monitores = [monitor('0', 0), monitor('1', 1920)];
    expect(fondosPorMonitor(monitores, [ajuste('0', 'span', true), ajuste('1', 'span')], 1)).toBeNull();
  });

  it('HE-02-HU14-CA08 · cada monitor en su lugar, a la escala de Windows y con monitores a la izquierda', () => {
    // El monitor 2 está a la izquierda del principal: la capa empieza en x = -1920.
    const fondos = fondosPorMonitor([monitor('0', 0, 0, 1.5), monitor('1', -1920, 0, 1.5)], [], 1.5);
    expect(fondos?.[0]?.estilo).toMatchObject({ left: 1280, top: 0, width: 1280, height: 720 });
    expect(fondos?.[1]?.estilo).toMatchObject({ left: 0, top: 0 });
    // Sin monitores, la capa pinta una sola imagen como antes.
    expect(fondosPorMonitor([], [], 1)).toBeNull();
  });
});
