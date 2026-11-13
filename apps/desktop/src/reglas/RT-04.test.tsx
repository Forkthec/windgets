// RT-04 · Mensajes, opciones deshabilitadas y alineación. Una prueba por CA (criterio de aceptación).
// Las pantallas de las HU (Tablero Kanban, Etiquetas, Agregar widget…) llegan en sus pasos; aquí cada CA se
// prueba con una pantalla de prueba mínima que usa la biblioteca de interfaz y las reglas de `src/reglas/`
// (plan_construccion.md, P02, «Se prueba al terminar»). Los textos de esas pantallas son los del CA.
// RT-04-CA11 (alineación vertical) necesita el diseño real del navegador: está en e2e/RT-04.spec.ts.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppError } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import {
  DURACION_RESULTADO_MS,
  ProveedorDeResultado,
  useMensajeDeResultado,
} from '@/ui/MensajeResultado/MensajeResultado';
import { useEnvioUnico } from './envio';
import { estaVacio, useMensajesDeCampo, type Validador } from './formulario';

const OBLIGATORIO = 'Este campo es obligatorio.';
const FECHA_INVALIDA = 'Diligencia una fecha válida.';

// Validación de la Fecha límite de la pantalla de prueba: DD/MM/AAAA y que exista en el calendario
// (RT-04-ET08; la regla completa es de HE-07-HU01).
function fechaExiste(texto: string): boolean {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return false;
  const [dia, mes, anio] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

const CAMPOS_TARJETA = ['titulo', 'fecha'] as const;
type CampoTarjeta = (typeof CAMPOS_TARJETA)[number];
const VALIDADORES_TARJETA: Record<CampoTarjeta, Validador> = {
  titulo: (v) => (estaVacio(v) ? OBLIGATORIO : undefined),
  fecha: (v) => (estaVacio(v) || fechaExiste(v) ? undefined : FECHA_INVALIDA),
};

/** Pantalla de prueba: Tablero Kanban con el Formulario de tarjeta abierto. */
function KanbanDePrueba({ alCrear }: { alCrear: () => void }) {
  const mostrar = useMensajeDeResultado();
  const [valores, setValores] = useState<Record<CampoTarjeta, string>>({ titulo: '', fecha: '' });
  const [opcionMenu, setOpcionMenu] = useState('Tablero Kanban');
  const { mensajes, ids, validarTodo, alCorregir } = useMensajesDeCampo(CAMPOS_TARJETA, VALIDADORES_TARJETA);
  const cambiar = (campo: CampoTarjeta) => (valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    alCorregir(campo, valor);
  };
  return (
    <>
      <nav aria-label="Menú principal">
        <button type="button" onClick={() => setOpcionMenu('Calendario')}>
          Calendario
        </button>
        <span data-testid="pantalla">{opcionMenu}</span>
      </nav>
      <CampoTexto
        id={ids.titulo}
        etiqueta="Título"
        valor={valores.titulo}
        alCambiar={cambiar('titulo')}
        mensaje={mensajes.titulo}
      />
      <CampoTexto
        id={ids.fecha}
        etiqueta="Fecha límite"
        valor={valores.fecha}
        alCambiar={cambiar('fecha')}
        mensaje={mensajes.fecha}
      />
      <Boton
        principal
        onClick={() => {
          if (!validarTodo(valores)) return;
          alCrear();
          mostrar('Tarjeta creada.');
        }}
      >
        Guardar
      </Boton>
    </>
  );
}

function renderKanban(alCrear = vi.fn()) {
  render(
    <ProveedorDeResultado>
      <KanbanDePrueba alCrear={alCrear} />
    </ProveedorDeResultado>,
  );
  return alCrear;
}

function diligenciar(etiqueta: string, valor: string) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
}

describe('RT-04 · Mensajes, opciones deshabilitadas y alineación', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('RT-04-CA01 · Mensaje de resultado', () => {
    const alCrear = renderKanban();
    diligenciar('Título', 'Preparar la exposición');
    diligenciar('Fecha límite', '20/11/2026');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(alCrear).toHaveBeenCalledOnce();
    const mensaje = screen.getByRole('status');
    expect(mensaje.textContent).toContain('Tarjeta creada.');
    expect(mensaje.className).toContain('wg-resultado'); // esquina inferior derecha (tokens.css)
    // No bloquea: se puede seguir seleccionando opciones mientras está visible.
    fireEvent.click(screen.getByRole('button', { name: 'Calendario' }));
    expect(screen.getByTestId('pantalla').textContent).toBe('Calendario');
    act(() => vi.advanceTimersByTime(DURACION_RESULTADO_MS - 1));
    expect(screen.queryByRole('status')).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('RT-04-CA02 · Cerrar el mensaje de resultado', () => {
    renderKanban();
    diligenciar('Título', 'Preparar la exposición');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar mensaje' }));
    expect(screen.queryByText('Tarjeta creada.')).toBeNull();
  });

  it('RT-04-CA03 · Mensaje de campo', () => {
    const alCrear = renderKanban();
    diligenciar('Fecha límite', '31/02/2026');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const titulo = screen.getByLabelText('Título');
    const fecha = screen.getByLabelText('Fecha límite');
    // Los dos mensajes a la vez, cada uno debajo de su campo y con el borde resaltado.
    expect(document.getElementById(titulo.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      OBLIGATORIO,
    );
    expect(document.getElementById(fecha.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      FECHA_INVALIDA,
    );
    expect(titulo.getAttribute('aria-invalid')).toBe('true');
    expect(fecha.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(titulo);
    expect(alCrear).not.toHaveBeenCalled();
  });

  it('RT-04-CA04 · Corregir el valor de un campo con mensaje', () => {
    renderKanban();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText(OBLIGATORIO)).toBeTruthy();
    diligenciar('Título', 'Preparar la exposición');
    expect(screen.queryByText(OBLIGATORIO)).toBeNull();
    expect(screen.getByLabelText('Título').getAttribute('aria-invalid')).toBeNull();
  });

  it('RT-04-CA05 · Opción deshabilitada con el motivo', () => {
    const alSeleccionar = vi.fn();
    const { rerender } = render(
      <Boton disabled motivo="Ya agregaste este widget." onClick={alSeleccionar}>
        Noticias
      </Boton>,
    );
    const opcion = screen.getByRole('button', { name: 'Noticias' });
    expect((opcion as HTMLButtonElement).disabled).toBe(true); // en gris: .wg-boton:disabled (tokens.css)
    fireEvent.click(opcion);
    expect(alSeleccionar).not.toHaveBeenCalled();
    expect(screen.getByText('Ya agregaste este widget.')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    // Sin espacio junto a la opción, el motivo aparece al pasar el mouse (RT-04-ET11).
    rerender(
      <Boton disabled motivo="Ya agregaste este widget." motivoAlPasar onClick={alSeleccionar}>
        Noticias
      </Boton>,
    );
    expect(screen.getByRole('button', { name: 'Noticias' }).getAttribute('title')).toBe(
      'Ya agregaste este widget.',
    );
  });

  it('RT-04-CA06 · Aviso por error de un servicio externo', () => {
    const texto = 'No pudimos cargar las noticias. Intenta de nuevo más tarde.';
    const alSeleccionarReloj = vi.fn();
    render(
      <>
        <section aria-label="Noticias">
          <Aviso texto={texto} />
          <p>contenido del widget</p>
        </section>
        <section aria-label="Reloj">
          <button type="button" onClick={alSeleccionarReloj}>
            Reloj
          </button>
        </section>
      </>,
    );
    const noticias = screen.getByRole('region', { name: 'Noticias' });
    const aviso = screen.getByRole('alert');
    expect(aviso.textContent).toBe(texto);
    expect(noticias.firstElementChild).toBe(aviso); // en la parte superior del widget
    fireEvent.click(screen.getByRole('button', { name: 'Reloj' }));
    expect(alSeleccionarReloj).toHaveBeenCalled(); // no bloquea el resto
  });

  it('RT-04-CA07 · Quitar el aviso cuando se resuelve el problema', () => {
    const sinConexion = 'Sin conexión. El widget se actualizará al reconectarte.';
    function NoticiasDePrueba({ conectado }: { conectado: boolean }) {
      return (
        <section>
          {!conectado && <Aviso texto={sinConexion} />}
          <p>{conectado ? 'noticias actualizadas' : 'noticias guardadas'}</p>
        </section>
      );
    }
    const { rerender } = render(<NoticiasDePrueba conectado={false} />);
    expect(screen.getByRole('alert').textContent).toBe(sinConexion);
    rerender(<NoticiasDePrueba conectado />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('noticias actualizadas')).toBeTruthy();
  });

  it('RT-04-CA08 · Mensaje de confirmación', () => {
    function TemasDePrueba() {
      const [temas, setTemas] = useState(['Oficina']);
      const [confirmando, setConfirmando] = useState(false);
      return (
        <>
          <ul>
            {temas.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Boton onClick={() => setConfirmando(true)}>Eliminar</Boton>
          {confirmando && (
            <Confirmacion
              titulo="Eliminar tema"
              texto="¿Deseas eliminar el tema “Oficina”? Esta acción no se puede deshacer."
              opcionPrincipal="Eliminar"
              alConfirmar={() => {
                setTemas([]);
                setConfirmando(false);
              }}
              alCancelar={() => setConfirmando(false)}
            />
          )}
        </>
      );
    }
    render(<TemasDePrueba />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const ventana = screen.getByRole('dialog');
    expect(ventana.textContent).toContain(
      '¿Deseas eliminar el tema “Oficina”? Esta acción no se puede deshacer.',
    );
    const opciones = Array.from(ventana.querySelectorAll('button')).map((b) => b.textContent);
    expect(opciones).toEqual(['Cancelar', 'Eliminar']);
    expect(ventana.querySelector('.wg-boton--principal')?.textContent).toBe('Eliminar');
    expect(screen.getByText('Oficina')).toBeTruthy(); // sigue en la lista hasta confirmar
  });

  it('RT-04-CA09 · Acción que se puede deshacer sin confirmación', () => {
    function AgendaDePrueba() {
      const mostrar = useMensajeDeResultado();
      const [enBloque, setEnBloque] = useState(true);
      return (
        <>
          <section aria-label="Bloque de las 9:00">{enBloque && <span>Leer el capítulo 3</span>}</section>
          <section aria-label="Tarjetas sin horario">{!enBloque && <span>Leer el capítulo 3</span>}</section>
          <Boton
            onClick={() => {
              setEnBloque(false);
              mostrar('Tarjeta quitada del horario.');
            }}
          >
            Quitar del horario
          </Boton>
        </>
      );
    }
    render(
      <ProveedorDeResultado>
        <AgendaDePrueba />
      </ProveedorDeResultado>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Quitar del horario' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: 'Tarjetas sin horario' }).textContent).toBe(
      'Leer el capítulo 3',
    );
    expect(screen.getByRole('status').textContent).toContain('Tarjeta quitada del horario.');
  });

  it('RT-04-CA10 · Estado vacío', () => {
    const texto = 'Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.';
    const { container } = render(
      <EstadoVacio texto={texto} accion={<Boton principal>Nueva etiqueta</Boton>} />,
    );
    expect(screen.getByText(texto)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nueva etiqueta' })).toBeTruthy();
    expect(container.textContent).not.toMatch(/\d/); // sin ceros que no correspondan
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull(); // ocupa el lugar de la lista
  });

  it('RT-04-CA12 · Formulario de un solo campo obligatorio', () => {
    function ClimaDePrueba() {
      const [ciudad, setCiudad] = useState('   ');
      return (
        <>
          <CampoTexto etiqueta="Ciudad" valor={ciudad} alCambiar={setCiudad} />
          <Boton principal disabled={estaVacio(ciudad)}>
            Agregar
          </Boton>
        </>
      );
    }
    render(<ClimaDePrueba />);
    const agregar = screen.getByRole('button', { name: 'Agregar' }) as HTMLButtonElement;
    expect(agregar.disabled).toBe(true); // solo espacios
    diligenciar('Ciudad', '');
    expect(agregar.disabled).toBe(true); // vacío
    expect(screen.queryByText(OBLIGATORIO)).toBeNull();
    diligenciar('Ciudad', 'Bogotá');
    expect(agregar.disabled).toBe(false);
  });

  it('RT-04-CA13 · Servicio de cuentas sin respuesta', async () => {
    vi.useRealTimers();
    const sinServicio: AppError = {
      code: 'service.unavailable',
      message: 'No pudimos completar la operación. Intenta de nuevo más tarde.',
    };
    const iniciarSesion = vi.fn(async () => ({ ok: false as const, error: sinServicio }));
    function InicioDeSesionDePrueba() {
      const [correo, setCorreo] = useState('usuario.prueba@example.com');
      const [clave, setClave] = useState('Prueba123');
      const [aviso, setAviso] = useState<string>();
      const [pantalla, setPantalla] = useState('Inicio de sesión');
      return (
        <main aria-label={pantalla}>
          {aviso && <Aviso texto={aviso} />}
          <CampoTexto etiqueta="Correo electrónico" valor={correo} alCambiar={setCorreo} />
          <CampoTexto etiqueta="Contraseña" valor={clave} alCambiar={setClave} />
          <Boton
            principal
            onClick={async () => {
              const r = await iniciarSesion();
              if (r.ok) setPantalla('Planificador diario');
              else if (r.error.code === 'service.unavailable') setAviso(r.error.message);
            }}
          >
            Iniciar sesión
          </Boton>
        </main>
      );
    }
    render(<InicioDeSesionDePrueba />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'No pudimos completar la operación. Intenta de nuevo más tarde.',
      ),
    );
    expect(screen.getByRole('main', { name: 'Inicio de sesión' })).toBeTruthy();
    expect((screen.getByLabelText('Correo electrónico') as HTMLInputElement).value).toBe(
      'usuario.prueba@example.com',
    );
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('Prueba123');
  });

  it('RT-04-CA14 · Botón deshabilitado mientras se procesa', async () => {
    vi.useRealTimers();
    let responder: () => void = () => {};
    const iniciarSesion = vi.fn(
      () =>
        new Promise<void>((resolver) => {
          responder = resolver;
        }),
    );
    function InicioDeSesionDePrueba() {
      const { ejecutar, enCurso } = useEnvioUnico(iniciarSesion);
      return (
        <Boton principal disabled={enCurso} onClick={() => void ejecutar()}>
          Iniciar sesión
        </Boton>
      );
    }
    render(<InicioDeSesionDePrueba />);
    const boton = screen.getByRole('button', { name: 'Iniciar sesión' }) as HTMLButtonElement;
    fireEvent.click(boton);
    await waitFor(() => expect(boton.disabled).toBe(true));
    fireEvent.click(boton);
    expect(iniciarSesion).toHaveBeenCalledOnce();
    await act(async () => responder());
    expect(boton.disabled).toBe(false);
  });
});
