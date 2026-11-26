import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { VistaPrevia } from '@/screens/personalization/VistaPrevia';
import type { Invoke, Monitor, ThemeContent, WidgetRect } from '@/types';
import { contraste, derivarTokens, tokensDeLosColores } from './derivar';
import { modoDeLosTokens, tokensDelTema } from './temaAplicado';
import { aplicarTokens } from './tokens';

// IM-01 · «Windgets claro» y «Windgets oscuro» (docs/rediseno.md RD-94). La tabla de aquí es la de la especificación,
// copiada aparte del código.
const TABLA = [
  // token, Windgets claro, Windgets oscuro
  ['principal', '#00D9E2', '#00D9E2'],
  ['secundario', '#6604E6', '#D3B2FF'],
  ['marco', '#F5F0FF', '#201B2B'],
  ['sobre_marco', '#17131D', '#F8F5FF'],
  ['superficie', '#FFFFFF', '#2B2534'],
  ['superficie_alta', '#FFFBEA', '#302D38'],
  ['superficie_baja', '#EDE3FF', '#433258'],
  ['linea', '#D9D0E6', '#5D566B'],
  ['tinta', '#17131D', '#F8F5FF'],
  ['texto', '#554F5E', '#CEC7D6'],
  ['accion', '#00D9E2', '#00D9E2'],
  ['sobre_accion', '#17131D', '#17131D'],
  ['borde', '#241C30', '#AFA1C0'],
  ['sombra', '3px 5px 0 #241C30', '3px 5px 0 #100D15'],
  ['error', '#B3261E', '#FF8A80'],
] as const;

const letra = { fuente: 'x', tamano: '16px' };
const CLARO = { primary: '#F5F0FF', secondary: '#B6A560', text: '#17131D' };
const OSCURO = { primary: '#201B2B', secondary: '#5D566B', text: '#F8F5FF' };
const TEMAS = [
  ['Windgets claro', CLARO, 1],
  ['Windgets oscuro', OSCURO, 2],
] as const;

const contenido = (colors: ThemeContent['colors']): ThemeContent => ({
  template_id: 'claro',
  background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
  colors,
  palette_id: null,
  font: { id: 'rubik', size: 'medium' },
});

afterEach(cleanup);

describe('RD-94 · Tokens fijos de Windgets claro y Windgets oscuro', () => {
  it.each(TEMAS)('%s usa los valores de la tabla', (_, colores, columna) => {
    const tokens = tokensDeLosColores({ ...colores, ...letra });
    for (const fila of TABLA) expect(tokens[fila[0]], fila[0]).toBe(fila[columna]);
    expect(tokens.fuente).toBe('x');
    expect(tokens.tamano_fuente).toBe('16px');
  });

  it('reconoce el tema aunque los colores lleguen en minúsculas', () => {
    const tokens = tokensDeLosColores({
      primary: '#f5f0ff',
      secondary: '#b6a560',
      text: '#17131d',
      ...letra,
    });
    expect(tokens.superficie).toBe('#FFFFFF');
  });

  it.each(TEMAS)('%s: los estados salen sobre la superficie fija y llegan a 3:1', (_, colores) => {
    const t = tokensDeLosColores({ ...colores, ...letra });
    for (const estado of [t.estado_vencida, t.estado_pendiente, t.estado_completada]) {
      expect(contraste(estado, t.superficie)).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(TEMAS)('%s: con cualquier color cambiado se vuelve a derivar todo', (_, colores) => {
    for (const color of ['primary', 'secondary', 'text'] as const) {
      const cambiado = { ...colores, [color]: '#336699', ...letra };
      const tokens = tokensDeLosColores(cambiado);
      expect(tokens, color).toEqual(derivarTokens(cambiado));
      expect(tokens.secundario, color).toBeUndefined();
    }
  });

  it('los tokens propios de Windgets se quitan al pasar a otro tema', () => {
    const raiz = document.createElement('div');
    aplicarTokens(tokensDeLosColores({ ...CLARO, ...letra }), raiz);
    expect(raiz.style.getPropertyValue('--wg-principal')).toBe('#00D9E2');
    expect(raiz.style.getPropertyValue('--wg-secundario')).toBe('#6604E6');
    expect(raiz.style.getPropertyValue('--wg-sombra')).toBe('3px 5px 0 #241C30');
    expect(raiz.style.getPropertyValue('--wg-error')).toBe('#B3261E');
    aplicarTokens(tokensDeLosColores({ ...CLARO, primary: '#336699', ...letra }), raiz);
    for (const variable of ['--wg-principal', '--wg-secundario', '--wg-sombra', '--wg-error']) {
      expect(raiz.style.getPropertyValue(variable), variable).toBe('');
    }
  });

  it('la ventana principal y los widgets del escritorio toman la tabla del tema aplicado', async () => {
    const invocar = (async () => ({ ok: true, value: [] })) as unknown as Invoke;
    const tokens = await tokensDelTema(invocar, contenido(OSCURO));
    expect(tokens.superficie).toBe('#2B2534');
    expect(tokens.accion).toBe('#00D9E2');
    expect(modoDeLosTokens(tokens)).toBe('oscuro');
    expect(modoDeLosTokens(await tokensDelTema(invocar, contenido(CLARO)))).toBe('claro');
  });

  it('la vista previa de Personalización pinta los widgets con la tabla', () => {
    const monitor = { x: 0, y: 0, width: 1920, height: 1080 } as Monitor;
    const reloj = {
      widget_id: 'reloj',
      type: 'clock',
      is_active: true,
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    } as WidgetRect;
    render(<VistaPrevia contenido={contenido(CLARO)} tamano="16px" widgets={[reloj]} monitor={monitor} />);
    const widget = screen.getByRole('img');
    expect(widget.style.background).toBe('rgb(255, 255, 255)');
    expect(widget.style.color).toBe('rgb(23, 19, 29)');
    expect(widget.style.borderColor).toBe('rgb(36, 28, 48)');
  });

  // DI-02. Solo los dos temas que la aplicación define; «Rosa pastel» y «Enfoque rojo y negro» no existen todavía
  // (docs/DUDAS.md).
  it.each(TEMAS)('%s: contraste de tinta y texto (4,5:1) y de borde (3:1)', (_, colores) => {
    const t = tokensDeLosColores({ ...colores, ...letra });
    for (const fondo of [t.marco, t.superficie, t.superficie_alta]) {
      expect(contraste(t.tinta, fondo), `tinta sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t.texto, fondo), `texto sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t.borde, fondo), `borde sobre ${fondo}`).toBeGreaterThanOrEqual(3);
    }
  });
});
