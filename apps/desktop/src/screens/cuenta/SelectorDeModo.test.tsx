// docs/rediseno.md RD-02, RD-03 y RD-09: la apariencia Claro u Oscuro de las pantallas de cuenta y el marco con
// Windi, la nota y el indicador de pasos.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLAVE_DEL_MODO, ProveedorDeApariencia, RaizDeCuenta } from './apariencia';
import { MarcoDeCuenta } from './MarcoDeCuenta';
import { abrirCuenta } from './pruebas';

function Pantalla() {
  return (
    <ProveedorDeApariencia>
      <RaizDeCuenta>
        <MarcoDeCuenta
          nombre="Registro"
          titulo="Crea tu cuenta"
          subtitulo="Solo te toma un minuto."
          windi={{ lineas: ['¡Soy Windi!', '¿Creamos tu cuenta?'], pose: 'registro' }}
          pasos={{ lista: ['Formulario', 'Verificar correo'], actual: 0 }}
        >
          <p>Contenido</p>
        </MarcoDeCuenta>
      </RaizDeCuenta>
    </ProveedorDeApariencia>
  );
}

const raiz = () => document.querySelector('.wg-cuenta-raiz');
const opcion = (nombre: 'Claro' | 'Oscuro') => screen.getByRole('radio', { name: nombre });

function windowsEnModo(oscuro: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => ({ matches: oscuro && consulta.includes('dark'), media: consulta })),
  );
}

describe('Apariencia de las pantallas de cuenta', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('RD-03: la primera vez toma el modo de Windows', () => {
    windowsEnModo(true);
    render(<Pantalla />);
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
    expect(opcion('Oscuro').getAttribute('aria-checked')).toBe('true');
    expect(opcion('Claro').getAttribute('aria-checked')).toBe('false');
  });

  it('RD-02, RD-03: elegir un modo lo aplica y lo guarda en este computador', () => {
    windowsEnModo(false);
    render(<Pantalla />);
    expect(raiz()?.getAttribute('data-modo')).toBe('claro');
    fireEvent.click(opcion('Oscuro'));
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
    expect(window.localStorage.getItem(CLAVE_DEL_MODO)).toBe('oscuro');
    cleanup();
    // Al volver a abrir, el modo guardado gana sobre el de Windows.
    render(<Pantalla />);
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
  });

  it('RD-03: sin almacenamiento disponible la pantalla funciona con el modo de Windows', () => {
    windowsEnModo(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    render(<Pantalla />);
    expect(raiz()?.getAttribute('data-modo')).toBe('claro');
    fireEvent.click(opcion('Oscuro'));
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
  });

  it('RD-22: con el teclado, solo la opción elegida se tabula y las flechas cambian de modo', () => {
    windowsEnModo(false);
    render(<Pantalla />);
    expect(opcion('Claro').tabIndex).toBe(0);
    expect(opcion('Oscuro').tabIndex).toBe(-1);
    opcion('Claro').focus();
    fireEvent.keyDown(opcion('Claro'), { key: 'ArrowRight' });
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
    expect(document.activeElement).toBe(opcion('Oscuro'));
    expect(opcion('Oscuro').tabIndex).toBe(0);
    expect(opcion('Claro').tabIndex).toBe(-1);
    // Al final del grupo, la flecha vuelve a la primera opción.
    fireEvent.keyDown(opcion('Oscuro'), { key: 'ArrowDown' });
    expect(raiz()?.getAttribute('data-modo')).toBe('claro');
    expect(document.activeElement).toBe(opcion('Claro'));
    fireEvent.keyDown(opcion('Claro'), { key: 'ArrowLeft' });
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
    // Otras teclas no cambian el modo.
    fireEvent.keyDown(opcion('Oscuro'), { key: 'a' });
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
  });

  it('RD-07, RD-08, RD-09: el marco muestra el globo de Windi, el título, el subtítulo y el paso actual', () => {
    render(<Pantalla />);
    expect(screen.getByRole('complementary', { name: 'Windi' }).textContent).toBe(
      '¡Soy Windi!¿Creamos tu cuenta?',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeTruthy();
    expect(screen.getByText('Solo te toma un minuto.')).toBeTruthy();
    const pasos = screen.getByRole('list', { name: 'Pasos' });
    const actual = pasos.querySelector('[aria-current="step"]');
    expect(actual?.textContent).toBe('1Formulario');
    expect(pasos.textContent).toContain('2Verificar correo');
  });

  it('RD-02: con la ventana principal sin sesión, la pantalla de cuenta lleva la apariencia', async () => {
    windowsEnModo(false);
    await abrirCuenta('sign_in', {
      sign_in: () => (
        <MarcoDeCuenta nombre="Inicio de sesión">
          <p>Contenido</p>
        </MarcoDeCuenta>
      ),
    });
    expect(raiz()?.getAttribute('data-modo')).toBe('claro');
    await act(async () => {
      fireEvent.click(opcion('Oscuro'));
    });
    expect(raiz()?.getAttribute('data-modo')).toBe('oscuro');
    expect(window.localStorage.getItem(CLAVE_DEL_MODO)).toBe('oscuro');
  });
});
