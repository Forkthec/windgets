// RT-03 · Miga de pan y Regresar. Una prueba por CA (criterio de aceptación), con pantallas de prueba que
// usan EncabezadoDeRuta y useRuta (plan_construccion.md, P02). Los textos son los de los CA.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { estaVacio } from './formulario';
import { EncabezadoDeRuta, useRuta } from './ruta';

type PosicionWidgets = 'widgets' | 'agregar' | 'clima';

/** Ruta «Widgets > Agregar widget > <widget>» con el widget Clima. */
function WidgetsDePrueba({ inicio = 'widgets' }: { inicio?: PosicionWidgets }) {
  const recorridos: Record<PosicionWidgets, readonly [PosicionWidgets, ...PosicionWidgets[]]> = {
    widgets: ['widgets'],
    agregar: ['widgets', 'agregar'],
    clima: ['widgets', 'agregar', 'clima'],
  };
  const ruta = useRuta<PosicionWidgets>(...recorridos[inicio]);
  const [lista, setLista] = useState<string[]>([]);
  const [ciudad, setCiudad] = useState('Bogotá');
  const aWidgets = { texto: 'Widgets', alElegir: () => ruta.ir('widgets') };
  switch (ruta.actual) {
    case 'widgets':
      return (
        <main aria-label="Widgets">
          <ul aria-label="Lista de widgets">
            {lista.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <Boton onClick={() => ruta.avanzar('agregar')}>Agregar widget</Boton>
        </main>
      );
    case 'agregar':
      return (
        <main aria-label="Agregar widget">
          <EncabezadoDeRuta niveles={[aWidgets, { texto: 'Agregar widget' }]} alRegresar={ruta.regresar} />
          <section aria-label="Catálogo de widgets">
            <Boton onClick={() => ruta.avanzar('clima')}>Clima</Boton>
          </section>
        </main>
      );
    case 'clima':
      return (
        <main aria-label="Clima">
          <EncabezadoDeRuta
            niveles={[
              aWidgets,
              { texto: 'Agregar widget', alElegir: () => ruta.ir('agregar') },
              { texto: 'Clima' },
            ]}
            alRegresar={ruta.regresar}
          />
          <CampoTexto etiqueta="Ciudad" valor={ciudad} alCambiar={setCiudad} />
          <Boton
            principal
            disabled={estaVacio(ciudad)}
            onClick={() => {
              setLista((l) => [...l, 'Clima']);
              ruta.ir('widgets');
            }}
          >
            Agregar
          </Boton>
        </main>
      );
  }
}

function nivelesDeLaMiga(): string[] {
  const miga = screen.getByRole('navigation', { name: 'Miga de pan' });
  return within(miga)
    .getAllByRole('listitem')
    .map((li) => li.textContent?.replace('>', '').trim() ?? '');
}

describe('RT-03 · Miga de pan y Regresar', () => {
  it('RT-03-CA01 · Mostrar la miga de pan', () => {
    render(<WidgetsDePrueba inicio="agregar" />);
    fireEvent.click(screen.getByRole('button', { name: 'Clima' }));
    const pantalla = screen.getByRole('main', { name: 'Clima' });
    expect(nivelesDeLaMiga()).toEqual(['Widgets', 'Agregar widget', 'Clima']);
    expect(
      pantalla.firstElementChild?.contains(screen.getByRole('navigation', { name: 'Miga de pan' })),
    ).toBe(true); // en la parte superior
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Regresar' })).toBeTruthy();
  });

  it('RT-03-CA02 · Volver a la pantalla Widgets con la miga de pan', () => {
    render(<WidgetsDePrueba inicio="clima" />);
    fireEvent.click(screen.getByRole('button', { name: 'Widgets' }));
    expect(screen.getByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Lista de widgets' }).children).toHaveLength(0);
  });

  it('RT-03-CA03 · Volver a un punto intermedio de la ruta con la miga de pan', () => {
    render(<WidgetsDePrueba inicio="clima" />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
    expect(screen.getByRole('main', { name: 'Agregar widget' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Catálogo de widgets' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Widgets' }));
    expect(screen.getByRole('list', { name: 'Lista de widgets' }).children).toHaveLength(0);
  });

  it('RT-03-CA04 · Regresar al paso anterior', () => {
    render(<WidgetsDePrueba inicio="clima" />);
    fireEvent.click(screen.getByRole('button', { name: 'Regresar' }));
    expect(screen.getByRole('main', { name: 'Agregar widget' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Catálogo de widgets' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Regresar' }));
    expect(screen.getByRole('list', { name: 'Lista de widgets' }).children).toHaveLength(0);
  });

  it('RT-03-CA05 · Terminar la ruta', () => {
    render(<WidgetsDePrueba inicio="clima" />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Lista de widgets' })).getByText('Clima')).toBeTruthy();
  });

  type Paso = 'Correo electrónico' | 'Diligenciar código' | 'Nueva contraseña';

  /** Ruta «Inicio de sesión > Recuperar contraseña» con sus tres pasos. */
  function RecuperarDePrueba() {
    const [en, setEn] = useState<'inicio' | Paso>('Correo electrónico');
    const pasos: Paso[] = ['Correo electrónico', 'Diligenciar código', 'Nueva contraseña'];
    if (en === 'inicio') return <main aria-label="Inicio de sesión" />;
    const indice = pasos.indexOf(en);
    return (
      <main aria-label={`Recuperar contraseña, paso ${en}`}>
        <EncabezadoDeRuta
          niveles={[
            { texto: 'Inicio de sesión', alElegir: () => setEn('inicio') },
            { texto: 'Recuperar contraseña' },
          ]}
          alRegresar={() => setEn(indice > 0 ? (pasos[indice - 1] ?? 'inicio') : 'inicio')}
        />
        {indice < pasos.length - 1 && (
          <Boton onClick={() => setEn(pasos[indice + 1] ?? en)}>Siguiente paso</Boton>
        )}
      </main>
    );
  }

  it('RT-03-CA06 · Miga de pan en Recuperar contraseña', () => {
    render(<RecuperarDePrueba />);
    for (const paso of ['Correo electrónico', 'Diligenciar código', 'Nueva contraseña']) {
      expect(screen.getByRole('main', { name: `Recuperar contraseña, paso ${paso}` })).toBeTruthy();
      expect(nivelesDeLaMiga()).toEqual(['Inicio de sesión', 'Recuperar contraseña']);
      expect(screen.getByRole('button', { name: 'Regresar' })).toBeTruthy();
      const siguiente = screen.queryByRole('button', { name: 'Siguiente paso' });
      if (siguiente) fireEvent.click(siguiente);
    }
    // «Regresar» vuelve al paso inmediatamente anterior (RT-03-ET05).
    fireEvent.click(screen.getByRole('button', { name: 'Regresar' }));
    expect(screen.getByRole('main', { name: 'Recuperar contraseña, paso Diligenciar código' })).toBeTruthy();
  });

  it('RT-03-CA07 · Registro sin miga de pan', () => {
    render(
      <main aria-label="Registro, paso Verificar correo">
        <EncabezadoDeRuta alRegresar={() => {}} />
      </main>,
    );
    expect(screen.getByRole('button', { name: 'Regresar' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Miga de pan' })).toBeNull();
  });
});
