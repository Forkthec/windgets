import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import textos from '@/types/messages.es.json';
import { MenuDeAcciones } from '@/ui/MenuDeAcciones/MenuDeAcciones';
import { ATRIBUTO_SIN_INERTE } from '../MensajeResultado/MensajeResultado';
import { VentanaEmergente } from './VentanaEmergente';

afterEach(cleanup);

describe('Ventana emergente', () => {
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
});

describe('RD-72 · Ventana emergente', () => {
  it('«×» arriba a la derecha la cierra; el contenido va en un cuerpo con su propio desplazamiento', () => {
    const alSalir = vi.fn();
    const { getByRole, getByText } = render(
      <VentanaEmergente titulo="Ventana" alSalir={alSalir} acciones={<button type="button">Guardar</button>}>
        contenido
      </VentanaEmergente>,
    );
    fireEvent.click(getByRole('button', { name: 'Cerrar' }));
    expect(alSalir).toHaveBeenCalled();
    expect(getByText('contenido').classList.contains('wg-emergente__cuerpo')).toBe(true);
    expect(getByRole('dialog').parentElement?.classList.contains('wg-fondo-emergente')).toBe(true);
  });
});

// RD-103 (IM-04): foco atrapado, foco inicial y devuelto, fondo inerte, velo y descarte.
describe('RD-103 · Ventana emergente: foco, fondo y descarte', () => {
  const formulario = (extra: Partial<Parameters<typeof VentanaEmergente>[0]> = {}) => (
    <VentanaEmergente
      titulo="Ventana"
      alSalir={vi.fn()}
      acciones={<button type="button">Guardar</button>}
      {...extra}
    >
      <input aria-label="Nombre" />
      <input aria-label="Detalle" />
    </VentanaEmergente>
  );

  it('el foco inicial va al primer campo', () => {
    const { getByLabelText } = render(formulario());
    expect(document.activeElement).toBe(getByLabelText('Nombre'));
  });

  it('sin campos, el foco inicial va a «×»', () => {
    const { getByRole } = render(
      <VentanaEmergente titulo="Ventana" alSalir={vi.fn()}>
        solo texto
      </VentanaEmergente>,
    );
    expect(document.activeElement).toBe(getByRole('button', { name: 'Cerrar' }));
  });

  it('Tab en el último elemento vuelve al primero y Shift+Tab en el primero va al último', () => {
    const { getByRole, getByLabelText } = render(formulario());
    getByRole('button', { name: 'Guardar' }).focus();
    const tab = fireEvent.keyDown(document, { key: 'Tab' });
    expect(tab).toBe(false); // preventDefault: el foco lo mueve la ventana
    expect(document.activeElement).toBe(getByRole('button', { name: 'Cerrar' }));
    const atras = fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(atras).toBe(false);
    expect(document.activeElement).toBe(getByRole('button', { name: 'Guardar' }));
    getByLabelText('Nombre').focus();
    expect(fireEvent.keyDown(document, { key: 'Tab' })).toBe(true); // en medio, Tab sigue su camino
  });

  it('si el foco quedó fuera de la ventana, Tab lo trae de vuelta', () => {
    const fuera = document.createElement('button');
    document.body.appendChild(fuera);
    const { getByRole } = render(formulario());
    fuera.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(getByRole('button', { name: 'Cerrar' }));
    fuera.remove();
  });

  it('al cerrar, el foco vuelve a quien tenía el foco al abrir', () => {
    const boton = document.createElement('button');
    document.body.appendChild(boton);
    boton.focus();
    const { unmount } = render(formulario());
    expect(document.activeElement).not.toBe(boton);
    unmount();
    expect(document.activeElement).toBe(boton);
    boton.remove();
  });

  it('el fondo queda inert mientras está abierta y se restaura al cerrar; con ventanas apiladas, lo último gana', () => {
    const fondo = document.createElement('main');
    document.body.appendChild(fondo);
    const primera = render(formulario());
    expect(fondo.hasAttribute('inert')).toBe(true);
    expect(primera.getByRole('dialog', { name: 'Ventana' }).closest('[inert]')).toBeNull();
    const segunda = render(
      <VentanaEmergente titulo="Segunda" alSalir={vi.fn()}>
        otra
      </VentanaEmergente>,
    );
    expect(primera.getByRole('dialog', { name: 'Ventana', hidden: true }).closest('[inert]')).not.toBeNull();
    expect(segunda.getByRole('dialog', { name: 'Segunda' }).closest('[inert]')).toBeNull();
    segunda.unmount();
    expect(primera.getByRole('dialog', { name: 'Ventana' }).closest('[inert]')).toBeNull();
    expect(fondo.hasAttribute('inert')).toBe(true);
    primera.unmount();
    expect(fondo.hasAttribute('inert')).toBe(false);
    fondo.remove();
  });

  it('un hijo de body con el atributo de los mensajes emergentes no queda inert (RD-104)', () => {
    const mensajes = document.createElement('div');
    mensajes.setAttribute(ATRIBUTO_SIN_INERTE, '');
    const fondo = document.createElement('main');
    document.body.append(mensajes, fondo);
    const abierta = render(formulario());
    expect(mensajes.hasAttribute('inert')).toBe(false);
    expect(fondo.hasAttribute('inert')).toBe(true);
    abierta.unmount();
    mensajes.remove();
    fondo.remove();
  });

  it('el clic en el velo cierra; un clic dentro de la ventana no', () => {
    const alSalir = vi.fn();
    const { getByRole } = render(formulario({ alSalir }));
    fireEvent.click(getByRole('dialog'));
    expect(alSalir).not.toHaveBeenCalled();
    fireEvent.click(getByRole('dialog').parentElement as HTMLElement);
    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it('arrastrar desde dentro de la ventana hasta el velo no la cierra', () => {
    const alSalir = vi.fn();
    const { getByRole } = render(formulario({ alSalir }));
    fireEvent.mouseDown(getByRole('dialog'));
    fireEvent.click(getByRole('dialog').parentElement as HTMLElement);
    expect(alSalir).not.toHaveBeenCalled();
  });

  it('sin cambios, «×», Esc y el velo cierran sin preguntar', () => {
    const alSalir = vi.fn();
    const { getByRole, queryByText } = render(formulario({ alSalir, hayCambios: false }));
    fireEvent.click(getByRole('button', { name: 'Cerrar' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(getByRole('dialog').parentElement as HTMLElement);
    expect(alSalir).toHaveBeenCalledTimes(3);
    expect(queryByText(textos.SALIR_SIN_GUARDAR)).toBeNull();
  });

  it.each([
    ['«×»', () => fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))],
    ['Esc', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['el velo', () => fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)],
  ])('con cambios, %s pide el descarte y «Seguir editando» no cierra', async (_nombre, cerrar) => {
    const alSalir = vi.fn();
    render(formulario({ alSalir, hayCambios: true }));
    cerrar();
    expect(alSalir).not.toHaveBeenCalled();
    expect(screen.getByText(textos.SALIR_SIN_GUARDAR)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));
    // AN-01 (A-02): el mensaje sale del árbol accesible en el acto y su copia se quita al terminar la salida.
    expect(screen.queryByRole('dialog', { name: 'Salir' })).toBeNull();
    await waitFor(() => expect(screen.queryByText(textos.SALIR_SIN_GUARDAR)).toBeNull());
    expect(alSalir).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Ventana' })).toBeTruthy();
  });

  it('con cambios, «Salir sin guardar» cierra', () => {
    const alSalir = vi.fn();
    render(formulario({ alSalir, hayCambios: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salir sin guardar' }));
    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it('con el descarte abierto, Esc cierra solo el mensaje', async () => {
    const alSalir = vi.fn();
    render(formulario({ alSalir, hayCambios: true }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(alSalir).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Salir' })).toBeNull();
    await waitFor(() => expect(screen.queryByText(textos.SALIR_SIN_GUARDAR)).toBeNull());
  });
});

// RD-103: un menú en un portal abierto desde dentro de la ventana sigue siendo «de la ventana».
describe('RD-103 · Ventana emergente con un menú de acciones dentro', () => {
  const conMenu = (alSalir = vi.fn(), alElegir = vi.fn()) =>
    render(
      <VentanaEmergente titulo="Ventana" alSalir={alSalir}>
        <input aria-label="Nombre" />
        <MenuDeAcciones
          nombre="tarjeta"
          opciones={[
            { etiqueta: 'Uno', alElegir },
            { etiqueta: 'Dos', alElegir },
          ]}
        />
      </VentanaEmergente>,
    );

  it('el menú abierto no queda inerte, las flechas lo recorren y Tab lo cierra sin sacar el foco de la ventana', () => {
    conMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de tarjeta' }));
    const uno = screen.getByRole('menuitem', { name: 'Uno' });
    expect(uno.closest('[inert]')).toBeNull();
    expect(document.activeElement).toBe(uno);
    fireEvent.keyDown(uno, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Dos' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Ventana' }).contains(document.activeElement)).toBe(true);
  });

  it('elegir una opción no cuenta como clic en el velo; Esc cierra solo el menú', () => {
    const alSalir = vi.fn();
    const alElegir = vi.fn();
    conMenu(alSalir, alElegir);
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de tarjeta' }));
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Uno' }), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(alSalir).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de tarjeta' }));
    fireEvent.mouseDown(screen.getByRole('menuitem', { name: 'Dos' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Dos' }));
    expect(alElegir).toHaveBeenCalledTimes(1);
    expect(alSalir).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Ventana' })).toBeTruthy();
  });
});

// AN-01 · Entrada y salida de la ventana emergente (docs/implementacion/ANIMACIONES.md A-01, A-02, A-02b; §7).
describe('AN-01 · A-01, A-02 y A-02b ventana emergente', () => {
  afterEach(() => vi.useRealTimers());

  it('A-01: tras montar recibe la clase `--abierta` (la ventana y el velo); el foco no espera', async () => {
    render(
      <VentanaEmergente titulo="Ventana" alSalir={vi.fn()}>
        <input aria-label="Nombre" />
      </VentanaEmergente>,
    );
    const ventana = screen.getByRole('dialog', { name: 'Ventana' });
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Nombre' }));
    await waitFor(() => expect(ventana.classList.contains('wg-emergente--abierta')).toBe(true));
    expect(ventana.parentElement?.classList.contains('wg-fondo-emergente--abierta')).toBe(true);
  });

  it('A-02: al desmontarla, una copia inerte sale con `--saliendo` y se quita a +200 ms (150 + 50)', () => {
    vi.useFakeTimers();
    const boton = document.createElement('button');
    document.body.append(boton);
    boton.focus();
    const { unmount } = render(
      <VentanaEmergente titulo="Ventana" alSalir={vi.fn()}>
        contenido
      </VentanaEmergente>,
    );
    unmount();
    // El foco vuelve al empezar la salida; la copia no está en el árbol accesible.
    expect(document.activeElement).toBe(boton);
    expect(screen.queryByRole('dialog')).toBeNull();
    const copia = document.querySelector('[data-saliendo]');
    expect(copia?.getAttribute('aria-hidden')).toBe('true');
    expect(copia?.hasAttribute('inert')).toBe(true);
    expect(copia?.classList.contains('wg-fondo-emergente--saliendo')).toBe(true);
    expect(copia?.querySelector('.wg-emergente')?.classList.contains('wg-emergente--saliendo')).toBe(true);
    expect(copia?.querySelector('[id]')).toBeNull();
    // En jsdom no hay transitionend: corre el seguro (duración calculada + 50 ms; aquí la hoja no está cargada).
    vi.advanceTimersByTime(200);
    expect(document.querySelector('[data-saliendo]')).toBeNull();
    boton.remove();
  });

  it('A-02: si se vuelve a abrir mientras sale, la salida se cancela', () => {
    const { unmount } = render(
      <VentanaEmergente titulo="Ventana" alSalir={vi.fn()}>
        contenido
      </VentanaEmergente>,
    );
    unmount();
    expect(document.querySelector('[data-saliendo]')).not.toBeNull();
    render(
      <VentanaEmergente titulo="Otra" alSalir={vi.fn()}>
        contenido
      </VentanaEmergente>,
    );
    expect(document.querySelector('[data-saliendo]')).toBeNull();
  });

  it('A-02b: la ventana apilada pinta su velo transparente; la de abajo no cambia', () => {
    render(
      <VentanaEmergente titulo="Ventana" alSalir={vi.fn()} hayCambios>
        contenido
      </VentanaEmergente>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    const abajo = screen.getByRole('dialog', { name: 'Ventana' }).parentElement;
    const encima = screen.getByRole('dialog', { name: 'Salir' }).parentElement;
    expect(abajo?.classList.contains('wg-fondo-emergente--apilado')).toBe(false);
    expect(encima?.classList.contains('wg-fondo-emergente--apilado')).toBe(true);
  });
});
