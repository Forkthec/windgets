// docs/rediseno.md RD-90: cada largo máximo de la base local tiene su constante en `limites.ts`. Una columna nueva
// con límite, o un límite que cambie en un solo lado, falla aquí.
import { describe, expect, it } from 'vitest';
import esquema from '../../src-tauri/sqlite_esquema.sql?raw';
import * as limites from './limites';

/** `tabla.columna` → largo máximo, de cada `length(columna) BETWEEN 1 AND n` o `length(columna) <= n`. */
function largosDelEsquema() {
  const largos: Record<string, number> = {};
  for (const [, tabla, cuerpo] of esquema.matchAll(/^CREATE TABLE (\w+) \(([\s\S]*?)^\)/gm)) {
    for (const [, columna, n] of (cuerpo ?? '').matchAll(/length\((\w+)\) (?:BETWEEN 1 AND|<=) (\d+)/g)) {
      largos[`${tabla}.${columna}`] = Number(n);
    }
  }
  return largos;
}

describe('RD-90 · Límites de largo', () => {
  it('RD-90 · cada largo de la base local es el de su constante', () => {
    const { 'catalog_font.display_name': fuente, ...resto } = largosDelEsquema();
    // Los nombres de los catálogos los fija el equipo: ningún formulario los escribe.
    expect(fuente).toBe(60);
    expect(resto).toEqual({
      'catalog_template.name': 60,
      'catalog_palette.name': 40,
      'catalog_image.name': 60,
      'catalog_animation.name': 60,
      'profile.alias': limites.ALIAS_MAX,
      'kanban_column.name': limites.COLUMNA_NOMBRE_MAX,
      'card.title': limites.TARJETA_TITULO_MAX,
      'card.description': limites.TARJETA_DESCRIPCION_MAX,
      'label.name': limites.ETIQUETA_NOMBRE_MAX,
      'theme.name': limites.TEMA_NOMBRE_MAX,
      'widget.weather_city': limites.CIUDAD_MAX,
      'widget.text_content': limites.TEXTO_WIDGET_MAX,
    });
  });
});
