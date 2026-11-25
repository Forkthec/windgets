// docs/rediseno.md RD-85: un color que el catálogo desactivó con la ventana abierta se dice en el campo Color, los
// colores se vuelven a pedir y lo escrito se conserva. Las reglas del Núcleo: rd_85_* en servicio_del_planificador.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kanban } from '@/screens/kanban/Kanban';
import { abrirPantalla, fijarHoy, llamadasA, screen } from '@/screens/kanban/pruebas';
import { Labels } from '@/screens/labels/Labels';

const TEXTO = 'Este color ya no está disponible. Elige otro.';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const color = (id: string, name: string) => ({
  id,
  name,
  hex: '#3E63DD',
  thumbnail_url: '',
  is_cached: true,
});

describe('RD-85 · Un color desactivado con la ventana abierta', () => {
  it.each([
    ['kanban', 'Tablero Kanban', Kanban, 'Nueva columna', 'column_create'],
    ['labels', 'Etiquetas', Labels, 'Nueva etiqueta', 'label_create'],
  ] as const)(
    'RD-85 · en %s lo dice en Color y recarga los colores',
    async (pantalla, titulo, Vista, abrir, comando) => {
      let desactivado = false;
      const nucleo = await abrirPantalla(pantalla, titulo, Vista, [], (n) => {
        n.responder('catalog_list', () => ({
          ok: true,
          value: [color('gray', 'Gris'), ...(desactivado ? [] : [color('blue', 'Azul')])],
        }));
        n.responder(comando, () => {
          desactivado = true;
          return { ok: false, error: { code: 'color.invalid', message: TEXTO, field: 'color_id' } };
        });
      });
      await act(async () => {
        fireEvent.click(await screen.findByRole('button', { name: abrir }));
      });
      const ventana = screen.getByRole('dialog');
      fireEvent.change(within(ventana).getByLabelText('Nombre'), { target: { value: 'Revisión' } });
      fireEvent.click(within(ventana).getByRole('radio', { name: 'Azul' }));
      await act(async () => {
        fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
      });

      const campo = within(ventana).getByRole('radiogroup', { name: 'Color' });
      const idDelMensaje = campo.getAttribute('aria-describedby') ?? '';
      expect(document.getElementById(idDelMensaje)?.textContent).toBe(TEXTO);
      await vi.waitFor(() => expect(within(ventana).queryByRole('radio', { name: 'Azul' })).toBeNull());
      expect(llamadasA(nucleo, 'catalog_list').length).toBeGreaterThan(1);
      expect((within(ventana).getByLabelText('Nombre') as HTMLInputElement).value).toBe('Revisión');
      // Al elegir otro color, el mensaje se quita.
      await act(async () => {
        fireEvent.click(within(ventana).getByRole('radio', { name: 'Gris' }));
      });
      expect(within(ventana).queryByText(TEXTO)).toBeNull();
    },
  );
});
