// RT-02 · Ventanas emergentes. Una prueba por CA (criterio de aceptación), con un Tablero Kanban de prueba
// dentro de la ventana principal: el tablero real llega con HE-07 y HE-09. El clic real sobre el fondo
// bloqueado (CA08, CA09) se prueba también en e2e/RT-02.spec.ts, porque jsdom no aplica `inert`.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';
import { useVentanasEmergentes } from './emergentes';

const invocar = (() =>
  Promise.resolve({
    ok: true,
    value: { state: 'signed_in', user_id: 'u-1', alias: 'Paula', token: 'valid' },
  })) as unknown as Invoke;
const escuchar: Escuchar = () => () => {};

type Ventana = 'detalle' | 'nueva' | 'edicion';

function TableroDePrueba() {
  const emergentes = useVentanasEmergentes<Ventana>();
  const [titulo, setTitulo] = useState('Leer el capítulo 3');
  const [borrador, setBorrador] = useState('');
  const [selecciones, setSelecciones] = useState(0);
  const editar = () => {
    setBorrador(titulo);
    emergentes.pasarA('edicion');
  };
  return (
    <main aria-label="Tablero Kanban">
      <p>Selecciones del fondo: {selecciones}</p>
      <Boton onClick={() => setSelecciones((n) => n + 1)}>Nueva columna</Boton>
      <section aria-label="Por hacer">
        <button type="button" onClick={() => emergentes.abrir('detalle')}>
          {titulo}
        </button>
      </section>
      <Boton onClick={() => emergentes.abrir('nueva')}>Nueva tarjeta</Boton>

      {emergentes.actual === 'detalle' && (
        <VentanaEmergente
          titulo="Detalle de tarjeta"
          alSalir={emergentes.volver}
          acciones={
            <>
              <Boton onClick={emergentes.volver}>Cerrar</Boton>
              <Boton principal onClick={editar}>
                Editar
              </Boton>
            </>
          }
        >
          <p>{titulo}</p>
        </VentanaEmergente>
      )}
      {(emergentes.actual === 'nueva' || emergentes.actual === 'edicion') && (
        <VentanaEmergente
          titulo="Formulario de tarjeta"
          alSalir={emergentes.volver}
          acciones={
            <>
              <Boton onClick={emergentes.volver}>Cancelar</Boton>
              <Boton
                principal
                onClick={() => {
                  setTitulo(borrador);
                  emergentes.volver();
                }}
              >
                Guardar
              </Boton>
            </>
          }
        >
          <CampoTexto id="titulo" etiqueta="Título" valor={borrador} alCambiar={setBorrador} />
        </VentanaEmergente>
      )}
    </main>
  );
}

async function abrirTablero() {
  render(<VentanaPrincipal invocar={invocar} escuchar={escuchar} pantallas={{ kanban: TableroDePrueba }} />);
  const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
  fireEvent.click(within(menu).getByRole('button', { name: 'Tablero Kanban' }));
  const tablero = await screen.findByRole('main', { name: 'Tablero Kanban' });
  const desplazable = tablero.parentElement as HTMLElement;
  desplazable.scrollTop = 240;
  return { tablero, desplazable, menu };
}

function abrirDetalle() {
  fireEvent.click(screen.getByRole('button', { name: 'Leer el capítulo 3' }));
  return screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
}

function sigueIgual(tablero: HTMLElement, desplazable: HTMLElement) {
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBe(tablero);
  expect(within(tablero).getByRole('button', { name: 'Leer el capítulo 3' })).toBeTruthy();
  expect(desplazable.scrollTop).toBe(240);
}

describe('RT-02 · Ventanas emergentes', () => {
  it('RT-02-CA01 · Abrir el detalle de una tarjeta', async () => {
    const { tablero } = await abrirTablero();
    const detalle = abrirDetalle();
    expect(detalle.textContent).toContain('Leer el capítulo 3');
    // Sobre la pantalla actual, que sigue en la página de fondo (ET02); la ventana va fuera de ella.
    expect(tablero).toBeTruthy();
    expect(tablero.contains(detalle)).toBe(false);
  });

  it('RT-02-CA02 · Cerrar el detalle de una tarjeta', async () => {
    const { tablero, desplazable } = await abrirTablero();
    const detalle = abrirDetalle();
    fireEvent.click(within(detalle).getByRole('button', { name: 'Cerrar' }));
    sigueIgual(tablero, desplazable);
  });

  it('RT-02-CA03 · Cancelar un formulario en una ventana emergente', async () => {
    const { tablero, desplazable } = await abrirTablero();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva tarjeta' }));
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    fireEvent.change(within(formulario).getByLabelText('Título'), { target: { value: 'Otra tarjeta' } });
    fireEvent.click(within(formulario).getByRole('button', { name: 'Cancelar' }));
    sigueIgual(tablero, desplazable);
    expect(screen.queryByText('Otra tarjeta')).toBeNull();
  });

  it('RT-02-CA04 · Cerrar una ventana emergente con la tecla Esc', async () => {
    const { tablero, desplazable } = await abrirTablero();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva tarjeta' }));
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    fireEvent.change(within(formulario).getByLabelText('Título'), { target: { value: 'Otra tarjeta' } });
    fireEvent.keyDown(document, { key: 'Escape' });
    sigueIgual(tablero, desplazable);
    expect(screen.queryByText('Otra tarjeta')).toBeNull();
  });

  it('RT-02-CA05 · Pasar del detalle al formulario de tarjeta', async () => {
    await abrirTablero();
    const detalle = abrirDetalle();
    fireEvent.click(within(detalle).getByRole('button', { name: 'Editar' }));
    expect(screen.queryByRole('dialog', { name: 'Detalle de tarjeta' })).toBeNull();
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    expect((within(formulario).getByLabelText('Título') as HTMLInputElement).value).toBe(
      'Leer el capítulo 3',
    );
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('RT-02-CA06 · Regresar al detalle al cancelar la edición', async () => {
    await abrirTablero();
    fireEvent.click(within(abrirDetalle()).getByRole('button', { name: 'Editar' }));
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    fireEvent.change(within(formulario).getByLabelText('Título'), { target: { value: 'Título cambiado' } });
    fireEvent.click(within(formulario).getByRole('button', { name: 'Cancelar' }));
    const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
    expect(detalle.textContent).toContain('Leer el capítulo 3');
    expect(screen.queryByText('Título cambiado')).toBeNull();
  });

  it('RT-02-CA07 · Regresar al detalle al guardar la edición', async () => {
    await abrirTablero();
    fireEvent.click(within(abrirDetalle()).getByRole('button', { name: 'Editar' }));
    const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
    fireEvent.change(within(formulario).getByLabelText('Título'), {
      target: { value: 'Leer el capítulo 4' },
    });
    fireEvent.click(within(formulario).getByRole('button', { name: 'Guardar' }));
    const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
    expect(detalle.textContent).toContain('Leer el capítulo 4');
  });

  it('RT-02-CA08 · Pantalla de fondo bloqueada', async () => {
    const { tablero } = await abrirTablero();
    abrirDetalle();
    // La pantalla de fondo queda inerte: el navegador no le entrega la selección (e2e/RT-02.spec.ts).
    expect(tablero.closest('[inert]')).not.toBeNull();
    expect(screen.getByRole('dialog', { name: 'Detalle de tarjeta' }).closest('[inert]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await act(() => Promise.resolve());
    expect(tablero.closest('[inert]')).toBeNull();
  });

  it('RT-02-CA09 · Menú principal bloqueado', async () => {
    const { menu } = await abrirTablero();
    abrirDetalle();
    expect(menu.closest('[inert]')).not.toBeNull();
    expect(screen.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeTruthy();
  });
});
