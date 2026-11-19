// EF-04 `news-headlines` (supabase/functions/_compartido/noticias.ts) con GNews simulado (INT-05).
import { describe, expect, it } from 'vitest';
import {
  claveDeCache,
  leerEdicion,
  leerTitulares,
  urlDeTitulares,
  vigente,
} from '../../../../supabase/functions/_compartido/noticias';

const articulo = (i: number) => ({
  title: `Titular ${i}`,
  url: `https://example.com/${i}`,
  publishedAt: `2026-11-14T1${i}:00:00Z`,
  source: { name: `Medio ${i}` },
});

describe('EF-04 news-headlines · HE-04-HU06', () => {
  it('HE-04-HU06-CA01 · los 5 titulares más recientes con su fuente (ET02)', () => {
    expect(leerEdicion({})).toBe('co');
    expect(urlDeTitulares('co', 'clave')).toBe(
      'https://gnews.io/api/v4/top-headlines?category=general&lang=es&country=co&max=5&apikey=clave',
    );
    const t = leerTitulares({ articles: [1, 6, 3, 2, 5, 4].map(articulo) });
    expect(t?.map((x) => `${x.title} · ${x.source}`)).toEqual([
      'Titular 6 · Medio 6',
      'Titular 5 · Medio 5',
      'Titular 4 · Medio 4',
      'Titular 3 · Medio 3',
      'Titular 2 · Medio 2',
    ]);
  });

  it('HE-04-HU06-CA02 · la caché compartida vale 60 minutos (ET03, RNF-09)', () => {
    const ahora = new Date('2026-11-14T12:00:00.000Z');
    const payload = { headlines: [], fetched_at: '' };
    expect(claveDeCache('co')).toBe('news:co');
    expect(vigente({ payload, expires_at: '2026-11-14T12:59:00.000Z' }, ahora)).toEqual(payload);
    expect(vigente({ payload, expires_at: '2026-11-14T11:59:00.000Z' }, ahora)).toBeNull();
  });

  it('HE-04-HU06-CA03 · una respuesta sin artículos es una falla del proveedor', () => {
    expect(leerTitulares({ errors: ['quota'] })).toBeNull();
  });
});
