// RD-100 · Nombre emergente de los botones (docs/rediseno.md; IM-03). La posición en el navegador, el foco que deja
// el puntero y los botones deshabilitados de verdad se prueban en e2e/rediseno-nombres.spec.ts.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { ProveedorDeResultado, useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { NavegacionDeFecha } from '@/ui/NavegacionDeFecha/NavegacionDeFecha';
import { SelectorFecha } from '@/ui/SelectorFecha/SelectorFecha';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { PanelDeWindi } from '@/ventana_principal/PanelDeWindi';
import { NombreEmergente, posicionDelNombre, RETRASO_DEL_NOMBRE_MS } from './NombreEmergente';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const avanzar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const enfocar = (e: HTMLElement) => act(() => e.focus());
const desenfocar = (e: HTMLElement) => act(() => e.blur());

/** Los nombres emergentes que se ven. */
const visibles = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.wg-nombre-emergente:not([hidden])'));
const textoVisible = () => visibles().map((n) => n.textContent);

const descripcion = (e: HTMLElement) =>
  document.getElementById(e.getAttribute('aria-describedby') ?? '')?.textContent;

function pasarElPuntero(e: HTMLElement) {
  fireEvent.pointerEnter(e);
  avanzar(RETRASO_DEL_NOMBRE_MS);
}

function Muestra({ alSeleccionar = () => {} }: { alSeleccionar?: () => void }) {
  return (
    <NombreEmergente texto="Nueva tarjeta">
      <button type="button" aria-label="Nueva tarjeta" onClick={alSeleccionar}>
        +
      </button>
    </NombreEmergente>
  );
}

const boton = (nombre: string) => screen.getByRole('button', { name: nombre });

describe('RD-100 · Cuándo aparece y cuándo se oculta', () => {
  it('con el puntero aparece a los 400 ms, no antes, y se oculta al salir', () => {
    render(<Muestra />);
    expect(RETRASO_DEL_NOMBRE_MS).toBe(400);
    fireEvent.pointerEnter(boton('Nueva tarjeta'));
    avanzar(399);
    expect(textoVisible()).toEqual([]);
    avanzar(1);
    expect(textoVisible()).toEqual(['Nueva tarjeta']);
    fireEvent.pointerLeave(boton('Nueva tarjeta'));
    expect(textoVisible()).toEqual([]);
  });

  it('si el puntero sale antes de los 400 ms no aparece', () => {
    render(<Muestra />);
    fireEvent.pointerEnter(boton('Nueva tarjeta'));
    avanzar(200);
    fireEvent.pointerLeave(boton('Nueva tarjeta'));
    avanzar(1000);
    expect(textoVisible()).toEqual([]);
  });

  it('con el foco del teclado aparece sin retraso y se oculta al perderlo', () => {
    render(<Muestra />);
    enfocar(boton('Nueva tarjeta'));
    expect(textoVisible()).toEqual(['Nueva tarjeta']);
    desenfocar(boton('Nueva tarjeta'));
    expect(textoVisible()).toEqual([]);
  });

  it('Esc lo oculta sin consumir la tecla', () => {
    const recibida = vi.fn((e: KeyboardEvent) => e.defaultPrevented);
    document.addEventListener('keydown', recibida);
    render(<Muestra />);
    enfocar(boton('Nueva tarjeta'));
    fireEvent.keyDown(boton('Nueva tarjeta'), { key: 'Escape' });
    expect(textoVisible()).toEqual([]);
    expect(recibida).toHaveBeenCalledTimes(1);
    expect(recibida).toHaveReturnedWith(false);
    document.removeEventListener('keydown', recibida);
  });

  it('otra tecla no lo oculta', () => {
    render(<Muestra />);
    enfocar(boton('Nueva tarjeta'));
    fireEvent.keyDown(boton('Nueva tarjeta'), { key: 'ArrowDown' });
    expect(textoVisible()).toEqual(['Nueva tarjeta']);
  });

  it('al seleccionar el botón se oculta y la acción se ejecuta', () => {
    const alSeleccionar = vi.fn();
    render(<Muestra alSeleccionar={alSeleccionar} />);
    pasarElPuntero(boton('Nueva tarjeta'));
    fireEvent.click(boton('Nueva tarjeta'));
    expect(textoVisible()).toEqual([]);
    expect(alSeleccionar).toHaveBeenCalledTimes(1);
    // El puntero sigue encima: no vuelve a salir solo.
    avanzar(1000);
    expect(textoVisible()).toEqual([]);
  });

  it('presionar antes de los 400 ms cancela la espera', () => {
    render(<Muestra />);
    fireEvent.pointerEnter(boton('Nueva tarjeta'));
    fireEvent.pointerDown(boton('Nueva tarjeta'));
    avanzar(1000);
    expect(textoVisible()).toEqual([]);
  });

  it('conserva los manejadores que el botón ya tenía', () => {
    const usos = { entrar: vi.fn(), salir: vi.fn(), presionar: vi.fn(), foco: vi.fn(), desenfoque: vi.fn() };
    render(
      <NombreEmergente texto="Cerrar">
        <button
          type="button"
          aria-label="Cerrar"
          onPointerEnter={usos.entrar}
          onPointerLeave={usos.salir}
          onPointerDown={usos.presionar}
          onFocus={usos.foco}
          onBlur={usos.desenfoque}
        />
      </NombreEmergente>,
    );
    const b = boton('Cerrar');
    fireEvent.pointerEnter(b);
    fireEvent.pointerLeave(b);
    fireEvent.pointerDown(b);
    enfocar(b);
    desenfocar(b);
    for (const uso of Object.values(usos)) expect(uso).toHaveBeenCalledTimes(1);
  });

  it('nunca hay dos a la vez', () => {
    render(
      <>
        <Muestra />
        <NombreEmergente texto="Cerrar">
          <button type="button" aria-label="Cerrar" />
        </NombreEmergente>
      </>,
    );
    enfocar(boton('Nueva tarjeta'));
    pasarElPuntero(boton('Cerrar'));
    expect(textoVisible()).toEqual(['Cerrar']);
  });

  it('al desaparecer el botón desaparece su nombre', () => {
    const { rerender } = render(<Muestra />);
    enfocar(boton('Nueva tarjeta'));
    rerender(<p />);
    expect(document.querySelector('.wg-nombre-emergente')).toBeNull();
  });

  it('se dibuja fuera de su contenedor; en las pantallas de cuenta, dentro de la raíz con `data-modo`', () => {
    render(
      <>
        <div data-testid="recorta" style={{ overflow: 'hidden' }}>
          <Muestra />
        </div>
        <div data-testid="cuenta" data-modo="oscuro">
          <NombreEmergente texto="Cerrar">
            <button type="button" aria-label="Cerrar" />
          </NombreEmergente>
        </div>
      </>,
    );
    enfocar(boton('Nueva tarjeta'));
    expect(screen.getByTestId('recorta').contains(visibles()[0] as HTMLElement)).toBe(false);
    enfocar(boton('Cerrar'));
    expect(screen.getByTestId('cuenta').contains(visibles()[0] as HTMLElement)).toBe(true);
  });
});

describe('RD-100 · Nombre accesible y descripción', () => {
  it('si repite el nombre no es un tooltip ni describe al botón, y no hay `title`', () => {
    render(<Muestra />);
    const b = boton('Nueva tarjeta');
    pasarElPuntero(b);
    expect(b.getAttribute('title')).toBeNull();
    expect(b.getAttribute('aria-describedby')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(visibles()[0]?.getAttribute('aria-hidden')).toBe('true');
  });

  it('un botón de ícono sin `aria-label` toma el texto como nombre', () => {
    render(
      <NombreEmergente texto="Eliminar">
        <Boton variante="icono">
          <svg aria-hidden="true" />
        </Boton>
      </NombreEmergente>,
    );
    expect(boton('Eliminar').getAttribute('aria-label')).toBe('Eliminar');
    expect(boton('Eliminar').getAttribute('aria-describedby')).toBeNull();
  });

  it('si agrega algo es un tooltip que describe al botón, también sin verse, y el nombre no cambia', () => {
    render(
      <NombreEmergente texto="Elegir un día">
        <button type="button">sábado 14 de noviembre</button>
      </NombreEmergente>,
    );
    const b = boton('sábado 14 de noviembre');
    expect(descripcion(b)).toBe('Elegir un día');
    expect(screen.queryByRole('tooltip')).toBeNull();
    pasarElPuntero(b);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toBe('Elegir un día');
    expect(b.getAttribute('aria-describedby')).toBe(tooltip.id);
    fireEvent.pointerLeave(b);
    expect(descripcion(b)).toBe('Elegir un día');
    expect(b.getAttribute('aria-label')).toBeNull();
  });

  it('sin texto no hay nombre emergente', () => {
    render(
      <NombreEmergente>
        <button type="button">Guardar</button>
      </NombreEmergente>,
    );
    pasarElPuntero(boton('Guardar'));
    enfocar(boton('Guardar'));
    expect(document.querySelector('.wg-nombre-emergente')).toBeNull();
    expect(boton('Guardar').getAttribute('aria-describedby')).toBeNull();
  });
});

describe('RD-100 · Botón deshabilitado con motivo', () => {
  const motivo = 'No hay tarjetas en este estado.';

  it('muestra el motivo al pasar el puntero y lo conserva como descripción', () => {
    const alSeleccionar = vi.fn();
    render(
      <Boton disabled motivo={motivo} motivoAlPasar onClick={alSeleccionar}>
        Vencidas
      </Boton>,
    );
    const b = boton('Vencidas');
    expect(b.getAttribute('title')).toBeNull();
    expect(descripcion(b)).toBe(motivo);
    pasarElPuntero(b);
    expect(screen.getByRole('tooltip').textContent).toBe(motivo);
    // El navegador no emite `click` en un botón deshabilitado: lo que oculta el nombre es la pulsación.
    fireEvent.pointerDown(b);
    fireEvent.click(b);
    expect(alSeleccionar).not.toHaveBeenCalled();
    expect(textoVisible()).toEqual([]);
  });

  it('al habilitarse sigue siendo el mismo botón, sin nombre emergente', () => {
    const pintar = (disabled: boolean) => (
      <Boton disabled={disabled} motivo={motivo} motivoAlPasar>
        Vencidas
      </Boton>
    );
    const { rerender } = render(pintar(true));
    const b = boton('Vencidas');
    rerender(pintar(false));
    expect(boton('Vencidas')).toBe(b);
    pasarElPuntero(b);
    expect(document.querySelector('.wg-nombre-emergente')).toBeNull();
    expect(b.getAttribute('aria-describedby')).toBeNull();
  });

  it('con la descripción que ya trae el botón, no la repite en el documento', () => {
    render(
      <>
        <Boton disabled motivo={motivo} motivoAlPasar aria-describedby="propia">
          Vencidas
        </Boton>
        <span id="propia" className="wg-oculto">
          {motivo}
        </span>
      </>,
    );
    expect(screen.getAllByText(motivo)).toHaveLength(1);
    expect(boton('Vencidas').getAttribute('aria-describedby')).toBe('propia');
    pasarElPuntero(boton('Vencidas'));
    expect(screen.getByRole('tooltip').textContent).toBe(motivo);
  });
});

describe('RD-100 · Componentes que tenían `title`', () => {
  it('ningún componente usa el `title` nativo', () => {
    const fuentes = import.meta.glob<string>(['/src/**/*.tsx', '!/src/**/*.test.tsx'], {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    expect(Object.keys(fuentes).length).toBeGreaterThan(50);
    const conTitle = Object.entries(fuentes)
      .filter(([, codigo]) => /\stitle=[{"']/.test(codigo))
      .map(([archivo]) => archivo);
    expect(conTitle).toEqual([]);
  });

  /** Nombre accesible, texto del nombre emergente y descripción (solo si agrega algo). */
  function comprobar(nombre: string, texto = nombre, describe?: string) {
    const b = boton(nombre);
    expect(b.getAttribute('title')).toBeNull();
    pasarElPuntero(b);
    expect(textoVisible()).toEqual([texto]);
    expect(descripcion(b)).toBe(describe);
    fireEvent.pointerLeave(b);
  }

  it('«×» de la ventana emergente: «Cerrar», y un solo Esc la sigue cerrando', () => {
    const alSalir = vi.fn();
    render(
      <VentanaEmergente titulo="Nueva columna" alSalir={alSalir}>
        <p />
      </VentanaEmergente>,
    );
    comprobar('Cerrar');
    enfocar(boton('Cerrar'));
    fireEvent.keyDown(boton('Cerrar'), { key: 'Escape' });
    expect(alSalir).toHaveBeenCalledTimes(1);
    expect(textoVisible()).toEqual([]);
  });

  it('ojo de la contraseña: el nombre cambia con el estado', () => {
    render(<CampoTexto etiqueta="Contraseña" type="password" valor="" alCambiar={() => {}} />);
    comprobar('Mostrar contraseña');
    fireEvent.click(boton('Mostrar contraseña'));
    comprobar('Ocultar contraseña');
  });

  it('navegación de fechas', () => {
    render(
      <NavegacionDeFecha
        titulo="Noviembre"
        anterior="Mes anterior"
        siguiente="Mes siguiente"
        alAnterior={() => {}}
        alSiguiente={() => {}}
        alIrAHoy={() => {}}
        diaDeHoy={25}
      />,
    );
    for (const nombre of ['Mes anterior', 'Mes siguiente', 'Ir a hoy']) comprobar(nombre);
  });

  it('abrir el calendario: conserva su nombre y «Elegir en el calendario» lo describe', () => {
    render(<SelectorFecha etiqueta="Fecha límite" valor={undefined} alCambiar={() => {}} flotante />);
    comprobar('Abrir fecha límite', 'Elegir en el calendario', 'Elegir en el calendario');
  });

  it('cerrar un mensaje: se llama «Cerrar mensaje» y muestra «Cerrar»', () => {
    function Disparador() {
      const mostrar = useMensajeDeResultado();
      return (
        <button type="button" onClick={() => mostrar('Tema guardado.')}>
          Mostrar
        </button>
      );
    }
    render(
      <ProveedorDeResultado>
        <Disparador />
      </ProveedorDeResultado>,
    );
    fireEvent.click(boton('Mostrar'));
    comprobar('Cerrar mensaje', 'Cerrar');
  });

  it('botón flotante de Windi y «×» de su panel', () => {
    const { rerender } = render(<PanelDeWindi abierto={false} alAbrir={() => {}} alCerrar={() => {}} />);
    comprobar('Windi');
    rerender(<PanelDeWindi abierto alAbrir={() => {}} alCerrar={() => {}} />);
    comprobar('Cerrar');
  });
});

describe('RD-100 · Posición', () => {
  const ventana = { width: 1000, height: 600 };
  const nombre = { width: 100, height: 30 };
  const en = (left: number, top: number) => ({ left, top, bottom: top + 36, width: 36 });

  it('debajo y centrado, a 8 px', () => {
    expect(posicionDelNombre(en(400, 100), nombre, ventana)).toEqual({
      top: 144,
      left: 368,
      lado: 'abajo',
      flecha: 50,
    });
  });

  it('arriba si no cabe debajo', () => {
    expect(posicionDelNombre(en(400, 560), nombre, ventana)).toMatchObject({ top: 522, lado: 'arriba' });
  });

  it('no se sale por la izquierda y la flecha sigue al botón', () => {
    expect(posicionDelNombre(en(0, 100), nombre, ventana)).toMatchObject({ left: 4, flecha: 14 });
  });

  it('no se sale por la derecha y la flecha sigue al botón', () => {
    expect(posicionDelNombre(en(964, 100), nombre, ventana)).toMatchObject({ left: 896, flecha: 86 });
  });

  it('la flecha no pasa de la esquina redondeada', () => {
    expect(posicionDelNombre({ left: 0, top: 100, bottom: 120, width: 4 }, nombre, ventana).flecha).toBe(12);
  });

  it('si no cabe en ningún lado, debajo', () => {
    expect(posicionDelNombre(en(400, 10), nombre, { width: 1000, height: 60 }).lado).toBe('abajo');
  });
});
