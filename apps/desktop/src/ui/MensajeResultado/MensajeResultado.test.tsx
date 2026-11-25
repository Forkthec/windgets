import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VentanaEmergente } from '../VentanaEmergente/VentanaEmergente';
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

  it('Éxito se oculta a los 4 s, advertencia a los 6 s y el error se queda hasta «×» (RD-104)', () => {
    vi.useFakeTimers();
    abrir([
      ['Tarjeta creada.', 'exito'],
      ['Sin conexión. Los cambios se guardarán en este computador.', 'advertencia'],
      ['No pudimos completar la operación. Intenta de nuevo más tarde.', 'error'],
    ]);
    expect(screen.getByRole('alert').textContent).toContain('No pudimos completar');
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText('Tarjeta creada.')).toBeNull();
    expect(screen.getByText(/Sin conexión/)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText(/Sin conexión/)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(600_000);
    });
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Cerrar mensaje' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('El foco dentro del mensaje pausa el cierre y al salir el foco se reanuda (RD-104)', () => {
    vi.useFakeTimers();
    abrir([['Etiqueta creada.']]);
    const cerrar = screen.getByRole('button', { name: 'Cerrar mensaje' });
    act(() => {
      cerrar.focus();
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('status')).toBeTruthy();
    // Con el puntero encima y luego fuera, el foco sigue pausando.
    fireEvent.mouseEnter(screen.getByRole('status'));
    fireEvent.mouseLeave(screen.getByRole('status'));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => {
      cerrar.blur();
    });
    act(() => {
      vi.advanceTimersByTime(3900);
    });
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('Un mensaje nuevo no toma el foco (RD-104)', () => {
    abrir([['Uno.']]);
    const mostrar = screen.getByRole('button', { name: 'Mostrar' });
    act(() => {
      mostrar.focus();
    });
    fireEvent.click(mostrar);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(mostrar);
  });

  it('Con una ventana emergente abierta el mensaje no queda inerte y se cierra con «×» (RD-104)', () => {
    vi.useFakeTimers();
    render(
      <ProveedorDeResultado>
        <Disparador textos={[['No pudimos completar la operación. Intenta de nuevo más tarde.', 'error']]} />
        <VentanaEmergente titulo="Ventana" alSalir={() => undefined}>
          <input aria-label="Campo" />
        </VentanaEmergente>
      </ProveedorDeResultado>,
    );
    // Con el mensaje ya visible cuando se abre otra ventana, y con la ventana ya abierta antes que el mensaje.
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    const alerta = screen.getByRole('alert');
    expect(alerta.closest('[inert]')).toBeNull();
    expect(screen.getByRole('dialog').closest('[inert]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mostrar', hidden: true }).closest('[inert]')).not.toBeNull();
    // El mensaje no le quita el foco a la ventana.
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    fireEvent.mouseEnter(alerta);
    fireEvent.click(within(alerta).getByRole('button', { name: 'Cerrar mensaje' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Un mensaje que ya estaba visible al abrirse la ventana tampoco queda inerte (RD-104)', () => {
    function Escena() {
      const mostrar = useMensajeDeResultado();
      const [abierta, setAbierta] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              mostrar('Tarjeta creada.', 'error');
              setAbierta(true);
            }}
          >
            Ir
          </button>
          {abierta && (
            <VentanaEmergente titulo="Ventana" alSalir={() => setAbierta(false)}>
              <input aria-label="Campo" />
            </VentanaEmergente>
          )}
        </>
      );
    }
    render(
      <ProveedorDeResultado>
        <Escena />
      </ProveedorDeResultado>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ir' }));
    expect(screen.getByRole('alert').closest('[inert]')).toBeNull();
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Cerrar mensaje' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Máximo 3 a la vez, el más nuevo arriba; el cuarto reemplaza al más antiguo', () => {
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
