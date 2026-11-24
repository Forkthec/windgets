import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MensajeResultado,
  ProveedorDeResultado,
  tipoDelTexto,
  useMensajeDeResultado,
  type TipoDeMensaje,
} from './MensajeResultado';

afterEach(() => {
  vi.useRealTimers();
});

function Disparador({ textos }: { textos: Array<[string, TipoDeMensaje?]> }) {
  const mostrar = useMensajeDeResultado();
  return (
    <button type="button" onClick={() => textos.forEach(([t, tipo]) => mostrar(t, tipo))}>
      Mostrar
    </button>
  );
}

function abrir(textos: Array<[string, TipoDeMensaje?]>) {
  render(
    <ProveedorDeResultado>
      <Disparador textos={textos} />
    </ProveedorDeResultado>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
}

describe('RD-63 · Mensajes de resultado', () => {
  it('MensajeResultado muestra su texto y se cierra con «×»', () => {
    const alOcultar = vi.fn();
    render(<MensajeResultado texto="Tarjeta creada." alOcultar={alOcultar} />);
    expect(screen.getByRole('status').textContent).toContain('Tarjeta creada.');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar mensaje' }));
    expect(alOcultar).toHaveBeenCalled();
  });

  it('Éxito se oculta a los 4 s y error a los 6 s; el error se anuncia como alerta', () => {
    vi.useFakeTimers();
    abrir([
      ['Tarjeta creada.', 'exito'],
      ['No pudimos completar la operación. Intenta de nuevo más tarde.', 'error'],
    ]);
    expect(screen.getByRole('alert').textContent).toContain('No pudimos completar');
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText('Tarjeta creada.')).toBeNull();
    expect(screen.getByRole('alert')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Máximo 3 a la vez, el más nuevo arriba', () => {
    abrir([['Uno.'], ['Dos.'], ['Tres.'], ['Cuatro.']]);
    const textos = screen.getAllByRole('status').map((m) => m.textContent?.replace(/[✓×]/g, ''));
    expect(textos).toEqual(['Cuatro.', 'Tres.', 'Dos.']);
  });

  it('Pasar el mouse pausa el tiempo', () => {
    vi.useFakeTimers();
    abrir([['Etiqueta creada.']]);
    fireEvent.mouseEnter(screen.getByRole('status'));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('status')).toBeTruthy();
    fireEvent.mouseLeave(screen.getByRole('status'));
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('El tipo sale del texto cuando la pantalla no lo da', () => {
    expect(tipoDelTexto('Tarjeta creada.')).toBe('exito');
    expect(tipoDelTexto('No pudimos completar la operación. Intenta de nuevo más tarde.')).toBe('error');
    expect(tipoDelTexto('No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.')).toBe(
      'advertencia',
    );
    expect(tipoDelTexto('Sin conexión. Los cambios se guardarán en este computador.')).toBe('advertencia');
  });
});
