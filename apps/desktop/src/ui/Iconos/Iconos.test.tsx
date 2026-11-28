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
  IconoSinConexion,
  IconoSincronizado,
  IconoSincronizando,
} from './Iconos';
import estilos from '../tema/tokens.css?raw';

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

const ESTADO = [
  ['IconoAlerta', IconoAlerta],
  ['IconoSincronizado', IconoSincronizado],
  ['IconoSinConexion', IconoSinConexion],
  ['IconoSincronizando', IconoSincronizando],
] as const;

const TODOS = [...ESTADO, ['IconoReloj', IconoReloj], ...ACCIONES] as const;

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
    const svg = dibujo(container);
    const trazos = [...svg.querySelectorAll('*')];
    expect(trazos.length).toBeGreaterThan(0);
    // El color va en cada trazo o, en los íconos de estado (MB-28), en el svg, del que lo heredan.
    const color = (e: Element) =>
      [e.getAttribute('fill'), e.getAttribute('stroke')].filter((c) => c !== null && c !== 'none');
    for (const trazo of trazos) {
      const colores = color(trazo).length > 0 ? color(trazo) : color(svg);
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

// C3-06 · Íconos de estado (docs/implementacion/SPEC_Marco_y_componentes_base.md MB-28; Figma 2003:187, 2251:4951,
// 80:57).
describe('C3-06 · Íconos de estado (MB-28)', () => {
  it.each(ESTADO)('%s mide 20×20 con trazo de 1,6 y se escala con la letra', (_, Icono) => {
    const svg = dibujo(render(<Icono />).container);
    expect(svg.getAttribute('viewBox')).toBe('0 0 20 20');
    expect(svg.getAttribute('stroke-width')).toBe('1.6');
    expect([svg.getAttribute('width'), svg.getAttribute('height')]).toEqual(['1em', '1em']);
  });

  it('Sincronizado y Sin conexión son los trazos del Figma', () => {
    const trazos = (Icono: typeof IconoSincronizado) =>
      [...dibujo(render(<Icono />).container).querySelectorAll('path')].map((p) => p.getAttribute('d'));
    expect(trazos(IconoSincronizado)[0]).toMatch(/^M7\.6 11\.4L9\.4 13\.2L12\.6 9\.8M6 15\.5H14\.5/);
    const sinConexion = trazos(IconoSinConexion);
    expect(sinConexion).toHaveLength(2);
    expect(sinConexion[1]).toBe('M3.5 3.5L16.5 16.5');
  });

  it('Alerta es el triángulo del Figma llevado de 32 a 20 (incoherencia 4)', () => {
    const d = dibujo(render(<IconoAlerta />).container)
      .querySelector('path')
      ?.getAttribute('d');
    expect(d).toBe('M10 7.5V12.5M10 14.375V15.875M10 1.875L18.75 18.125H1.25L10 1.875Z');
  });

  it('Sincronizando gira en 1 s lineal; con «reducir movimiento», quieto (A-31)', () => {
    const svg = dibujo(render(<IconoSincronizando />).container);
    expect(svg.getAttribute('class')).toBe('wg-icono wg-icono--girando');
    expect(dibujo(render(<IconoSincronizado />).container).getAttribute('class')).toBe('wg-icono');
    expect(estilos).toMatch(/\.wg-icono--girando \{\s*animation: wg-girar 1s linear infinite;/);
    expect(estilos).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.wg-icono--girando \{\s*animation: none;/,
    );
  });
});
