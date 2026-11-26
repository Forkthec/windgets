import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Boton } from '../Boton/Boton';
import { TRAZO_DEL_MENU } from '../MenuPrincipal/IconosDelMenu';
import {
  IconoAlerta,
  IconoCarpeta,
  IconoCerrar,
  IconoEngranaje,
  IconoEnviar,
  IconoLapiz,
  IconoLupa,
  IconoMas,
  IconoOpciones,
  IconoOrganizar,
  IconoPapelera,
  IconoRegresar,
  IconoReloj,
  IconoReportes,
} from './Iconos';

afterEach(cleanup);

const ACCIONES = [
  ['IconoMas', IconoMas],
  ['IconoCerrar', IconoCerrar],
  ['IconoRegresar', IconoRegresar],
  ['IconoLupa', IconoLupa],
  ['IconoPapelera', IconoPapelera],
  ['IconoLapiz', IconoLapiz],
  ['IconoOpciones', IconoOpciones],
  ['IconoCarpeta', IconoCarpeta],
  ['IconoEngranaje', IconoEngranaje],
  ['IconoOrganizar', IconoOrganizar],
  ['IconoEnviar', IconoEnviar],
  ['IconoReportes', IconoReportes],
] as const;

const TODOS = [['IconoAlerta', IconoAlerta], ['IconoReloj', IconoReloj], ...ACCIONES] as const;

const dibujo = (contenedor: HTMLElement) => {
  const svg = contenedor.querySelector('svg');
  if (!svg) throw new Error('El ícono no pintó un svg');
  return svg;
};

describe('RD-101 · Íconos de acciones', () => {
  it.each(TODOS)('%s es decorativo si no recibe nombre', (_, Icono) => {
    const { container } = render(<Icono />);
    const svg = dibujo(container);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.hasAttribute('role')).toBe(false);
    expect(svg.hasAttribute('aria-label')).toBe(false);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it.each(TODOS)('%s es una imagen con nombre si lo recibe', (_, Icono) => {
    render(<Icono nombre="Nombre del ícono" />);
    const imagen = screen.getByRole('img', { name: 'Nombre del ícono' });
    expect(imagen.tagName.toLowerCase()).toBe('svg');
    expect(imagen.hasAttribute('aria-hidden')).toBe(false);
  });

  it.each(TODOS)('%s se pinta con el color del texto (currentColor)', (_, Icono) => {
    const { container } = render(<Icono />);
    const trazos = [...dibujo(container).querySelectorAll('*')];
    expect(trazos.length).toBeGreaterThan(0);
    for (const trazo of trazos) {
      const colores = [trazo.getAttribute('fill'), trazo.getAttribute('stroke')].filter(
        (color) => color !== null && color !== 'none',
      );
      expect(colores.length).toBeGreaterThan(0);
      expect(new Set(colores)).toEqual(new Set(['currentColor']));
    }
  });

  it.each(ACCIONES)('%s va en Boton de ícono sin quitarle el nombre al botón', (_, Icono) => {
    render(
      <Boton variante="icono" aria-label="Acción">
        <Icono />
      </Boton>,
    );
    const boton = screen.getByRole('button', { name: 'Acción' });
    expect(boton.classList.contains('wg-boton--icono')).toBe(true);
    const svg = dibujo(boton);
    expect(svg.getAttribute('class')).toBe('wg-icono');
    expect([svg.getAttribute('width'), svg.getAttribute('height')]).toEqual(['1em', '1em']);
    expect(svg.getAttribute('viewBox')).toBe('0 0 18 18');
  });

  it('cada ícono tiene su propio dibujo: la papelera no es la «×»', () => {
    const dibujos = TODOS.map(([, Icono]) => dibujo(render(<Icono />).container).innerHTML);
    expect(new Set(dibujos).size).toBe(TODOS.length);
  });

  it('Reportes usa el mismo trazo que el menú principal', () => {
    const { container } = render(<IconoReportes />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe(TRAZO_DEL_MENU.reports);
  });
});
