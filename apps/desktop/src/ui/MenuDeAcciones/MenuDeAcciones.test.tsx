// RT-02 · Ventanas emergentes y menús de acciones. Prueba del menú común «⋮» (RT-02-CA10; ET10 a ET12). La
// pantalla Etiquetas lo prueba con sus datos en screens/labels/Labels.test.tsx (HE-08-HU01-CA01).
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MenuDeAcciones, posicionDelMenu } from './MenuDeAcciones';

function menuDeTrabajo(alEditar = vi.fn(), alEliminar = vi.fn()) {
  render(
    <div>
      <p>Fuera del menú</p>
      <MenuDeAcciones
        nombre="Trabajo"
        opciones={[
          { etiqueta: 'Editar', alElegir: alEditar },
          { etiqueta: 'Eliminar', alElegir: alEliminar },
        ]}
      />
    </div>,
  );
  return screen.getByRole('button', { name: 'Acciones de Trabajo' });
}

describe('RT-02 · Menú de acciones', () => {
  it('RT-02-CA10 · Agrupar las acciones de un elemento', () => {
    // ET10: el botón «⋮» se llama «Acciones de <nombre del elemento>».
    const boton = menuDeTrabajo();
    expect(boton.textContent).toBe('⋮');
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(boton);
    const menu = screen.getByRole('menu', { name: 'Acciones de Trabajo' });
    expect(Array.from(menu.querySelectorAll('[role="menuitem"]')).map((o) => o.textContent)).toEqual([
      'Editar',
      'Eliminar',
    ]);
    // ET11: Esc lo cierra y el foco vuelve al botón.
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(boton);
    // ET11: seleccionar fuera también lo cierra.
    fireEvent.click(boton);
    expect(document.body.contains(screen.getByRole('menu'))).toBe(true);
    fireEvent.mouseDown(screen.getByText('Fuera del menú'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('RT-02-ET11 · Elegir una opción cierra el menú y la ejecuta', () => {
    const alEditar = vi.fn();
    const boton = menuDeTrabajo(alEditar);
    fireEvent.click(boton);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(alEditar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(boton);
  });

  it('RT-02-ET11 · Las flechas recorren las opciones habilitadas', () => {
    render(
      <MenuDeAcciones
        nombre="Por hacer"
        opciones={[
          { etiqueta: 'Editar' },
          {
            etiqueta: 'Eliminar',
            deshabilitada: true,
            motivo: 'Las columnas por defecto no se pueden eliminar.',
          },
          { etiqueta: 'Otra' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de Por hacer' }));
    const menu = screen.getByRole('menu');
    // Al abrir, el foco va a la primera opción habilitada.
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Editar' }));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Otra' }));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Editar' }));
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Otra' }));
  });

  it('RT-02-ET11 · Una opción deshabilitada muestra su motivo al pasar el mouse', async () => {
    const alEliminar = vi.fn();
    render(
      <MenuDeAcciones
        nombre="Mi tema"
        opciones={[
          { etiqueta: 'Renombrar' },
          {
            etiqueta: 'Eliminar',
            deshabilitada: true,
            motivo: 'No puedes eliminar el tema aplicado.',
            alElegir: alEliminar,
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de Mi tema' }));
    const eliminar = screen.getByRole('menuitem', { name: 'Eliminar' });
    expect((eliminar as HTMLButtonElement).disabled).toBe(true);
    expect(document.getElementById(eliminar.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      'No puedes eliminar el tema aplicado.',
    );
    fireEvent.pointerEnter(eliminar);
    expect((await screen.findByRole('tooltip')).textContent).toBe('No puedes eliminar el tema aplicado.');
    fireEvent.click(eliminar);
    expect(alEliminar).not.toHaveBeenCalled();
  });

  it('RT-02-ET12 · El menú se dibuja fuera de su contenedor y no lo recorta', () => {
    render(
      <div data-testid="contenedor" style={{ overflow: 'hidden', height: 20 }}>
        <MenuDeAcciones nombre="Entregar informe" opciones={[{ etiqueta: 'Editar' }]} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de Entregar informe' }));
    const menu = screen.getByRole('menu');
    expect(screen.getByTestId('contenedor').contains(menu)).toBe(false);
    expect(menu.parentElement).toBe(document.body);
    expect(menu.classList.contains('wg-menu-acciones__lista')).toBe(true);
  });

  it('RT-02-ET12 · El menú se abre encima del botón si no cabe debajo', () => {
    const ventana = { width: 800, height: 600 };
    const boton = { top: 560, bottom: 590, left: 760 } as DOMRect;
    expect(posicionDelMenu(boton, { width: 120, height: 200 }, ventana)).toEqual({ top: 356, left: 676 });
    const arriba = { top: 10, bottom: 40, left: 10 } as DOMRect;
    expect(posicionDelMenu(arriba, { width: 120, height: 200 }, ventana)).toEqual({ top: 44, left: 10 });
  });

  it('RT-02-ET11 · Un submenú reemplaza las opciones, como «Mover a»', async () => {
    const alMover = vi.fn();
    render(
      <MenuDeAcciones
        nombre="Entregar informe"
        opciones={[
          { etiqueta: 'Editar' },
          {
            etiqueta: 'Mover a',
            submenu: [
              { etiqueta: 'Por hacer', marcada: true, deshabilitada: true },
              { etiqueta: 'En progreso', marcada: false, alElegir: alMover },
            ],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de Entregar informe' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Mover a' }));
    });
    expect(document.body.contains(screen.getByRole('menu', { name: 'Mover a' }))).toBe(true);
    expect(screen.getByRole('menuitemradio', { name: 'Por hacer' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'En progreso' }));
    expect(alMover).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('RT-02-ET11 · Presionar el botón o una opción no llega al elemento arrastrable de debajo', () => {
    const alPresionar = vi.fn();
    render(
      <div onPointerDown={alPresionar}>
        <MenuDeAcciones nombre="Entregar informe" opciones={[{ etiqueta: 'Editar' }]} />
      </div>,
    );
    const boton = screen.getByRole('button', { name: 'Acciones de Entregar informe' });
    fireEvent.pointerDown(boton);
    fireEvent.click(boton);
    fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(alPresionar).not.toHaveBeenCalled();
  });
});

// AN-01 · Abrir y cerrar el menú (docs/implementacion/ANIMACIONES.md A-03, A-04; regla 13; §7).
describe('AN-01 · A-03 y A-04 menú de acciones', () => {
  it('A-03: tras abrir recibe la clase `--abierta`', async () => {
    fireEvent.click(menuDeTrabajo());
    const menu = screen.getByRole('menu');
    await waitFor(() => expect(menu.classList.contains('wg-menu-acciones__lista--abierta')).toBe(true));
  });

  it('A-04: la acción y el foco no esperan a la salida; el menú sale inerte y luego se desmonta', async () => {
    const alEditar = vi.fn();
    const boton = menuDeTrabajo(alEditar);
    fireEvent.click(boton);
    const lista = screen.getByRole('menu');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));
    // Antes de que termine la salida: la acción ya corrió y el foco ya volvió.
    expect(alEditar).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(boton);
    expect(lista.isConnected).toBe(true);
    expect(lista.classList.contains('wg-menu-acciones__lista--saliendo')).toBe(true);
    expect(lista.hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(lista.isConnected).toBe(false));
  });

  it('A-04: si se vuelve a abrir mientras sale, cancela la salida', () => {
    const boton = menuDeTrabajo();
    fireEvent.click(boton);
    const lista = screen.getByRole('menu');
    fireEvent.click(boton);
    expect(lista.classList.contains('wg-menu-acciones__lista--saliendo')).toBe(true);
    fireEvent.click(boton);
    expect(screen.getByRole('menu')).toBe(lista);
    expect(lista.classList.contains('wg-menu-acciones__lista--abierta')).toBe(true);
    expect(lista.hasAttribute('inert')).toBe(false);
  });
});
