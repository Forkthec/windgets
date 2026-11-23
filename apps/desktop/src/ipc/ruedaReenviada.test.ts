import { describe, expect, it, vi } from 'vitest';
import { desplazarConLaRueda, PIXELES_POR_MUESCA } from './ruedaReenviada';

// HE-06-HU01-CA09 (P29) · Desplazar el contenido de un widget con la rueda del mouse. El Núcleo reenvía el giro
// (`seleccion::rueda`, prueba Rust ca_he_06_hu01_ca09); aquí la capa desplaza el contenedor bajo el cursor.

function desplazable(eje: 'x' | 'y', clase = '') {
  const el = document.createElement('div');
  if (clase) el.className = clase;
  el.style[eje === 'y' ? 'overflowY' : 'overflowX'] = 'auto';
  Object.defineProperty(el, eje === 'y' ? 'scrollHeight' : 'scrollWidth', { value: 500 });
  Object.defineProperty(el, eje === 'y' ? 'clientHeight' : 'clientWidth', { value: 100 });
  el.scrollBy = vi.fn() as unknown as typeof el.scrollBy;
  return el;
}

function documentoCon(elemento: Element | null) {
  return { elementFromPoint: () => elemento } as unknown as Document;
}

describe('HE-06-HU01-CA09 · Rueda del mouse en un widget', () => {
  it('HE-06-HU01-CA09 desplaza hacia abajo la lista de Noticias que no cabe', () => {
    const lista = desplazable('y');
    const titular = document.createElement('a');
    lista.appendChild(titular);
    document.body.appendChild(lista);
    // Un giro hacia el usuario (delta negativo) baja el contenido una muesca.
    expect(desplazarConLaRueda({ x: 10, y: 10, delta_x: 0, delta_y: -120 }, documentoCon(titular))).toBe(
      true,
    );
    expect(lista.scrollBy).toHaveBeenCalledWith({ top: PIXELES_POR_MUESCA });
    lista.remove();
  });

  it('HE-06-HU01-CA09 sin contenedor vertical, el giro vertical desplaza el tablero horizontal del Kanban', () => {
    const tablero = desplazable('x');
    const columna = document.createElement('div');
    tablero.appendChild(columna);
    document.body.appendChild(tablero);
    expect(desplazarConLaRueda({ x: 0, y: 0, delta_x: 0, delta_y: 240 }, documentoCon(columna))).toBe(true);
    expect(tablero.scrollBy).toHaveBeenCalledWith({ left: -2 * PIXELES_POR_MUESCA });
    tablero.remove();
  });

  it('HE-06-HU01-CA09 un widget sin desborde no se desplaza y no sale del widget', () => {
    const fuera = desplazable('y');
    const widget = document.createElement('section');
    widget.className = 'wg-widget';
    const texto = document.createElement('p');
    widget.appendChild(texto);
    fuera.appendChild(widget);
    document.body.appendChild(fuera);
    expect(desplazarConLaRueda({ x: 0, y: 0, delta_x: 0, delta_y: -120 }, documentoCon(texto))).toBe(false);
    expect(fuera.scrollBy).not.toHaveBeenCalled();
    fuera.remove();
  });
});
