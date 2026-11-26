// EF-02 `weather-geocode` y EF-03 `weather-current` (supabase/functions/_compartido/clima.ts). Las Edge Functions
// corren en Deno; su lógica es TS puro y se prueba aquí con Open-Meteo simulado (INT-04).
import { describe, expect, it } from 'vitest';
import {
  claveDeCache,
  condicion,
  leerBusqueda,
  leerCiudades,
  leerClima,
  leerPeticionDeClima,
  urlDeBusqueda,
  urlDelClima,
  vigente,
} from '../../../../supabase/functions/_compartido/clima';

describe('EF-02 weather-geocode · HE-04-HU05', () => {
  it('HE-04-HU05-CA01 · busca la ciudad en Open-Meteo y toma hasta 5 resultados (ET06, ET15)', () => {
    expect(leerBusqueda({ query: '  Popayán ' })).toBe('Popayán');
    expect(urlDeBusqueda('Popayán')).toBe(
      'https://geocoding-api.open-meteo.com/v1/search?name=Popay%C3%A1n&count=5&language=es&format=json',
    );
    const resultado = {
      geo_id: '3673269',
      name: 'Popayán',
      admin1: 'Cauca',
      country: 'Colombia',
      latitude: 2.4448,
      longitude: -76.6147,
    };
    const { geo_id, ...resto } = resultado;
    expect(leerCiudades({ results: [{ id: 3673269, ...resto }] })).toEqual([{ ...resultado, geo_id }]);
  });

  it('HE-04-HU05-CA04 · sin resultados, lista vacía (ciudad no reconocida)', () => {
    expect(leerCiudades({ generationtime_ms: 0.2 })).toEqual([]);
  });

  it('HE-04-HU05-CA09 · la búsqueda tiene de 1 a 100 caracteres', () => {
    expect(leerBusqueda({ query: 'a'.repeat(101) })).toBeNull();
    expect(leerBusqueda({ query: '   ' })).toBeNull();
  });
});

describe('EF-03 weather-current · HE-04-HU05', () => {
  const ahora = new Date('2026-11-14T12:00:00.000Z');

  it('HE-04-HU05-CA01 · la temperatura en °C y la condición en español (ET13)', () => {
    expect(leerPeticionDeClima({ geo_id: '3673269', latitude: 2.44, longitude: -76.61 })).toEqual({
      geo_id: '3673269',
      latitude: 2.44,
      longitude: -76.61,
    });
    expect(leerClima({ current: { temperature_2m: 21.4, weather_code: 2 } }, '3673269', ahora)).toEqual({
      geo_id: '3673269',
      temperature_c: 21.4,
      condition_code: '2',
      condition_text: 'Parcialmente nublado',
      observed_at: '2026-11-14T12:00:00.000Z',
    });
    expect(condicion(96)).toBe('Tormenta');
    expect(condicion(4)).toBe('Condición no disponible');
  });

  it('HE-04-HU05-CA06 · la caché compartida vale 30 minutos (RNF-09)', () => {
    const payload = {
      geo_id: '1',
      temperature_c: 20,
      condition_code: '0',
      condition_text: 'Despejado',
      observed_at: '',
    };
    expect(claveDeCache('1')).toBe('weather:1');
    expect(vigente({ payload, expires_at: '2026-11-14T12:29:59.000Z' }, ahora)).toEqual(payload);
    expect(vigente({ payload, expires_at: '2026-11-14T11:59:59.000Z' }, ahora)).toBeNull();
  });

  it('HE-04-HU05-CA07 · una respuesta sin datos es una falla del proveedor', () => {
    expect(leerClima({ error: true }, '1', ahora)).toBeNull();
  });

  it('RD-97 · pide `is_day` a Open-Meteo y dice si es de día o de noche', () => {
    expect(urlDelClima(2.44, -76.61)).toBe(
      'https://api.open-meteo.com/v1/forecast?latitude=2.44&longitude=-76.61&current=temperature_2m,weather_code,is_day&timezone=auto',
    );
    const actual = { temperature_2m: 21.4, weather_code: 2 };
    expect(leerClima({ current: { ...actual, is_day: 1 } }, '1', ahora)?.is_day).toBe(true);
    expect(leerClima({ current: { ...actual, is_day: 0 } }, '1', ahora)?.is_day).toBe(false);
  });

  it('RD-97 · sin `is_day`, o con un valor que no es 0 ni 1, entrega el clima sin ese campo', () => {
    const actual = { temperature_2m: 21.4, weather_code: 2 };
    const sinDato = {
      geo_id: '1',
      temperature_c: 21.4,
      condition_code: '2',
      condition_text: 'Parcialmente nublado',
      observed_at: '2026-11-14T12:00:00.000Z',
    };
    for (const extra of [{}, { is_day: null }, { is_day: 2 }, { is_day: '1' }]) {
      expect(leerClima({ current: { ...actual, ...extra } }, '1', ahora)).toStrictEqual(sinDato);
    }
    // La caché compartida escrita antes del cambio se entrega como está.
    expect(vigente({ payload: sinDato, expires_at: '2026-11-14T12:29:59.000Z' }, ahora)).toStrictEqual(
      sinDato,
    );
  });
});
