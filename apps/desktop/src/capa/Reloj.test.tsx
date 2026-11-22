// HE-04-HU03 · Consultar la hora del sistema en el widget Reloj. Prueba de la capa (C-02). El traductor del patrón
// de Windows (`LOCALE_SSHORTTIME`) tiene sus pruebas ca_he_04_hu03_* en integracion_con_el_sistema/formato_de_hora.rs.
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, TimeFormat } from '@/types';
import { Reloj } from './Reloj';

const H23: TimeFormat = { hour_cycle: 'h23', two_digit_hour: true };
const H12: TimeFormat = { hour_cycle: 'h12', two_digit_hour: false };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 14, 15, 5, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

/** Pinta el Reloj con el formato que devuelve el Núcleo (o un error) y devuelve cómo emitir EV-28. */
async function pintar(formato: TimeFormat | null) {
  const invocar = vi.fn((comando: string) =>
    Promise.resolve(
      comando === 'system_time_format_get' && formato
        ? { ok: true, value: formato }
        : { ok: false, error: { code: 'internal.unexpected', message: '' } },
    ),
  ) as unknown as Invoke;
  const oyentes: Array<(f: TimeFormat) => void> = [];
  const escuchar = ((evento: string, alRecibir: (f: TimeFormat) => void) => {
    if (evento === 'time_format_changed') oyentes.push(alRecibir);
    return () => {};
  }) as unknown as Escuchar;
  render(<Reloj invocar={invocar} escuchar={escuchar} />);
  await act(async () => {});
  const cambiarEnWindows = (f: TimeFormat) => act(() => oyentes.forEach((o) => o(f)));
  const hora = () => screen.getByRole('time').textContent;
  return { invocar, cambiarEnWindows, hora };
}

describe('HE-04-HU03 · Widget Reloj', () => {
  it('HE-04-HU03-CA01 · Widget Reloj', async () => {
    vi.setSystemTime(new Date(2026, 10, 14, 8, 59, 30));
    const { hora } = await pintar(H23);
    // ET01: la hora actual del sistema…
    expect(hora()).toBe('08:59');
    // …que se actualiza cuando cambia el minuto (30 s después) y en cada minuto siguiente.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(hora()).toBe('09:00');
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(hora()).toBe('09:01');
  });

  it('HE-04-HU03-CA02 · Formato de 24 horas', async () => {
    const { invocar, hora } = await pintar(H23);
    expect(invocar).toHaveBeenCalledWith('system_time_format_get', {});
    expect(hora()).toBe('15:05');
  });

  it('HE-04-HU03-CA03 · Formato de 12 horas', async () => {
    // ET02: con «a. m.» y «p. m.»; sin el cero inicial si Windows no lo pide.
    const { hora } = await pintar(H12);
    expect(hora()).toBe('3:05 p. m.');
  });

  it('HE-04-HU03-CA04 · Formato de hora cambiado en Windows', async () => {
    // ET03: el Núcleo avisa con EV-28 al recibir el cambio de Windows y el Reloj lo refleja sin reiniciar.
    const { cambiarEnWindows, hora } = await pintar(H23);
    expect(hora()).toBe('15:05');
    await cambiarEnWindows(H12);
    expect(hora()).toBe('3:05 p. m.');
  });

  it('HE-04-HU03-ET02 · El cero inicial de Windows y las 24 horas si no se puede leer', async () => {
    vi.setSystemTime(new Date(2026, 10, 14, 8, 5, 0));
    const sinCero = await pintar({ hour_cycle: 'h23', two_digit_hour: false });
    expect(sinCero.hora()).toBe('8:05');
    document.body.innerHTML = '';
    const conCero = await pintar({ hour_cycle: 'h12', two_digit_hour: true });
    expect(conCero.hora()).toBe('08:05 a. m.');
    document.body.innerHTML = '';
    const sinFormato = await pintar(null);
    expect(sinFormato.hora()).toBe('08:05');
  });
});
