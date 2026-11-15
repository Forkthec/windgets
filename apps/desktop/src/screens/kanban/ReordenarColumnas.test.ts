// HE-09-HU05 · Reordenar las columnas. La regla del orden se prueba aquí; el arrastre real del encabezado, que
// necesita un navegador (dnd-kit mide las cajas), está en e2e/HE-09-HU05.spec.ts, y la del Núcleo en
// ca_he_09_hu05_* (pruebas_del_tablero.rs).
import { describe, expect, it } from 'vitest';
import { ordenDelArrastre } from './arrastre';

const ORDEN = ['por-hacer', 'en-progreso', 'hecho'];

describe('HE-09-HU05 · Reordenar las columnas', () => {
  it('HE-09-HU05-CA01 · Reordenar las columnas', () => {
    // Hecho sobre Por hacer (o sobre una de sus tarjetas): Hecho, Por hacer, En progreso (ET01, ET03).
    expect(ordenDelArrastre(ORDEN, 'hecho', { columna: 'por-hacer' })).toEqual([
      'hecho',
      'por-hacer',
      'en-progreso',
    ]);
    expect(ordenDelArrastre(ORDEN, 'hecho', { columna: 'por-hacer', tarjeta: 't1' })).toEqual([
      'hecho',
      'por-hacer',
      'en-progreso',
    ]);
    // Hacia la derecha: Por hacer sobre Hecho queda al final.
    expect(ordenDelArrastre(ORDEN, 'por-hacer', { columna: 'hecho' })).toEqual([
      'en-progreso',
      'hecho',
      'por-hacer',
    ]);
  });

  it('HE-09-HU05-CA02 · Soltar una columna fuera del tablero', () => {
    // ET02: fuera del área de columnas, o sobre sí misma, se mantiene el orden anterior.
    expect(ordenDelArrastre(ORDEN, 'hecho', undefined)).toBeNull();
    expect(ordenDelArrastre(ORDEN, 'hecho', { columna: 'hecho' })).toBeNull();
  });
});
