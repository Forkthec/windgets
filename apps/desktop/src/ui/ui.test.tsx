import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Aviso,
  Boton,
  CampoTexto,
  Casilla,
  Confirmacion,
  EstadoVacio,
  Interruptor,
  MensajeResultado,
  MenuPrincipal,
  MigaDePan,
  Selector,
  SelectorColores,
  SelectorFecha,
  VentanaEmergente,
  aplicarTokens,
  NOMBRES_TOKEN,
  DURACION_RESULTADO_MS,
  type Tokens,
} from './index';

afterEach(cleanup);

describe('biblioteca de interfaz', () => {
  it('aplica los tokens del tema como variables CSS', () => {
    const tokens = Object.fromEntries(NOMBRES_TOKEN.map((n) => [n, `valor-${n}`])) as Tokens;
    aplicarTokens(tokens);
    expect(document.documentElement.style.getPropertyValue('--wg-superficie-alta')).toBe(
      'valor-superficie_alta',
    );
  });

  it('Botón deshabilitado muestra el motivo y no responde', () => {
    const alSeleccionar = vi.fn();
    render(
      <Boton disabled motivo="Motivo de prueba" onClick={alSeleccionar}>
        Guardar
      </Boton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(alSeleccionar).not.toHaveBeenCalled();
    expect(screen.getByText('Motivo de prueba')).toBeTruthy();
  });

  it('Campo de texto muestra el mensaje de campo y marca el error', () => {
    render(
      <CampoTexto etiqueta="Nombre" valor="" alCambiar={() => {}} mensaje="Este campo es obligatorio." />,
    );
    expect(screen.getByLabelText('Nombre').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Este campo es obligatorio.')).toBeTruthy();
  });

  it('Casilla, Interruptor y Selector informan el cambio', () => {
    const casilla = vi.fn();
    const interruptor = vi.fn();
    const selector = vi.fn();
    render(
      <>
        <Casilla etiqueta="Casilla" marcada={false} alCambiar={casilla} />
        <Interruptor etiqueta="Interruptor" activo={false} alCambiar={interruptor} />
        <Selector
          etiqueta="Selector"
          valor="a"
          alCambiar={selector}
          opciones={[
            { valor: 'a', texto: 'A' },
            { valor: 'b', texto: 'B' },
          ]}
        />
      </>,
    );
    fireEvent.click(screen.getByLabelText('Casilla'));
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(screen.getByLabelText('Selector'), { target: { value: 'b' } });
    expect(casilla).toHaveBeenCalledWith(true);
    expect(interruptor).toHaveBeenCalledWith(true);
    expect(selector).toHaveBeenCalledWith('b');
  });

  it('Selector de colores y Selector de fecha se muestran', () => {
    render(
      <>
        <SelectorColores etiqueta="Color" valor="#00D9E2" alCambiar={() => {}} />
        <SelectorFecha etiqueta="Fecha" valor={undefined} alCambiar={() => {}} />
      </>,
    );
    expect(screen.getByRole('group', { name: 'Color' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Fecha' })).toBeTruthy();
  });

  it('Ventana emergente sale con Esc', () => {
    const alSalir = vi.fn();
    render(
      <VentanaEmergente titulo="Ventana" alSalir={alSalir}>
        contenido
      </VentanaEmergente>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(alSalir).toHaveBeenCalled();
  });

  it('Confirmación tiene la opción principal y «Cancelar»', () => {
    const alConfirmar = vi.fn();
    const alCancelar = vi.fn();
    render(
      <Confirmacion
        titulo="Eliminar"
        texto="¿Seguro?"
        opcionPrincipal="Eliminar"
        alConfirmar={alConfirmar}
        alCancelar={alCancelar}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(alCancelar).toHaveBeenCalled();
    expect(alConfirmar).toHaveBeenCalled();
  });

  it('Mensaje de resultado se oculta a los 4 segundos', () => {
    vi.useFakeTimers();
    const alOcultar = vi.fn();
    render(<MensajeResultado texto="Listo" alOcultar={alOcultar} />);
    act(() => vi.advanceTimersByTime(DURACION_RESULTADO_MS));
    expect(alOcultar).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('Aviso, Estado vacío y Miga de pan muestran su texto', () => {
    render(
      <>
        <Aviso texto="Sin conexión" />
        <EstadoVacio texto="No hay elementos" />
        <MigaDePan ruta={['Menú principal', 'Planificador', 'Etiquetas']} />
      </>,
    );
    expect(screen.getByRole('alert').textContent).toBe('Sin conexión');
    expect(screen.getByText('No hay elementos')).toBeTruthy();
    expect(screen.getByText('Etiquetas').getAttribute('aria-current')).toBe('page');
  });

  it('Menú principal marca solo la pantalla actual', () => {
    render(<MenuPrincipal actual="kanban" alElegir={() => {}} />);
    const marcadas = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
    expect(marcadas.map((b) => b.textContent)).toEqual(['Tablero Kanban']);
  });
});
