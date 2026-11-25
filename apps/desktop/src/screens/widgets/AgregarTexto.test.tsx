// HE-04-HU10 · Agregar el widget Texto. El Núcleo tiene sus pruebas ca_he_04_hu10_* en pruebas_de_agregar_imagen.rs;
// el widget en la capa, en WidgetTexto.test.tsx.
import { fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { abrirPantalla, llamadasA, screen } from '../kanban/pruebas';
import { Widgets } from './Widgets';

async function abrir() {
  const n = await abrirPantalla('widgets', 'Widgets', Widgets, [], (n) => {
    n.responder('widget_list', () => ({ ok: true, value: [] }));
    n.responder('widget_catalog_get', () => ({
      ok: true,
      value: {
        external: [],
        local: [
          { type: 'text', name: 'Texto', description: 'Una nota.', enabled: true, disabled_reason: null },
        ],
      },
    }));
    n.responder('widget_add', () => ({ ok: true, value: {} as never }));
  });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
  const enCatalogo = await screen.findByRole('main', { name: 'Agregar widget' });
  fireEvent.click(await within(enCatalogo).findByRole('button', { name: /Texto/ }));
  const sub = await screen.findByRole('main', { name: 'Texto' });
  const campo = within(sub).getByLabelText('Texto') as HTMLTextAreaElement;
  const agregar = within(sub).getByRole('button', { name: 'Agregar' }) as HTMLButtonElement;
  return { n, sub, campo, agregar };
}

describe('HE-04-HU10 · Agregar el widget Texto', () => {
  it('HE-04-HU10-CA01 · Agregar el texto', async () => {
    const { n, sub, campo, agregar } = await abrir();
    // ET01: miga de pan, contador y las opciones.
    expect(within(sub).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Widgets>Agregar widget>Texto',
    );
    expect(within(sub).getByText('0 / 200')).toBeTruthy();
    fireEvent.change(campo, { target: { value: 'Estudiar redes a las 6' } });
    expect(within(sub).getByText('22 / 200')).toBeTruthy();
    fireEvent.click(agregar);
    expect(await screen.findByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(llamadasA(n, 'widget_add')).toEqual([
      { type: 'text', config: { text: 'Estudiar redes a las 6' } },
    ]);
  });

  it('HE-04-HU10-CA02 · Texto vacío', async () => {
    const { campo, agregar } = await abrir();
    expect(agregar.disabled).toBe(true);
    fireEvent.change(campo, { target: { value: '   ' } });
    expect(agregar.disabled).toBe(true);
  });

  it('HE-04-HU10-CA03 · Texto de más de 200 caracteres', async () => {
    const { sub, campo, agregar } = await abrir();
    fireEvent.change(campo, { target: { value: 'a'.repeat(201) } });
    expect(within(sub).getByText('El texto no puede superar los 200 caracteres.')).toBeTruthy();
    expect(agregar.disabled).toBe(true);
  });

  it('RD-91 · el único campo muestra su error y «Agregar» no envía nada', async () => {
    const { n, sub, campo, agregar } = await abrir();
    fireEvent.change(campo, { target: { value: 'a'.repeat(201) } });
    expect(sub.querySelectorAll('.wg-campo__mensaje')).toHaveLength(1);
    expect(agregar.disabled).toBe(true);
    fireEvent.click(agregar);
    expect(llamadasA(n, 'widget_add')).toEqual([]);
  });

  it('HE-04-HU10-CA04 · la subpantalla no ofrece opciones de fuente ni de tamaño', async () => {
    const { sub } = await abrir();
    expect(within(sub).queryByLabelText(/Fuente|Tamaño/)).toBeNull();
    expect(within(sub).queryByRole('combobox')).toBeNull();
  });
});
