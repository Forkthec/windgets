// Ayudas de las pruebas de las pantallas de cuenta: la ventana principal sin sesión con un Núcleo de prueba.
import { act, render, screen } from '@testing-library/react';
import { useEffect, type ComponentType } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { CommandMap, CommandName, EventMap, Invoke, Result } from '@/types';
import { type PantallaDeCuenta, useNavegacion, VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

type Respuesta = (params: unknown) => Result<unknown> | Promise<Result<unknown>>;

export interface NucleoDePrueba {
  llamadas: Array<{ comando: string; params: unknown }>;
  responder: <K extends CommandName>(
    comando: K,
    respuesta: (params: CommandMap[K]['params']) => Result<CommandMap[K]['result']>,
  ) => void;
  emitir: <E extends keyof EventMap>(evento: E, carga: EventMap[E]) => void;
}

/** Pantalla de cuenta de prueba: muestra el correo con el que se abrió (HE-01-HU01-CA09, CA10). */
export function Destino({ nombre }: { nombre: string }) {
  const { correoDeCuenta } = useNavegacion();
  return <main aria-label={nombre}>{correoDeCuenta && <p>Correo: {correoDeCuenta}</p>}</main>;
}

/** Abre la ventana principal sin sesión en la pantalla de cuenta indicada. */
export async function abrirCuenta(
  inicial: PantallaDeCuenta,
  pantallas: Partial<Record<PantallaDeCuenta, ComponentType>>,
  conectado = true,
): Promise<NucleoDePrueba> {
  const llamadas: NucleoDePrueba['llamadas'] = [];
  const respuestas = new Map<string, Respuesta>([
    ['auth_get_session', () => ({ ok: true, value: { state: 'signed_out', token: 'valid' } })],
    ['connectivity_get', () => ({ ok: true, value: { online: conectado } })],
  ]);
  const oyentes = new Map<string, Array<(c: unknown) => void>>();
  const invocar = ((comando: string, params: unknown) => {
    llamadas.push({ comando, params });
    const r = respuestas.get(comando);
    return Promise.resolve(
      r ? r(params) : { ok: false, error: { code: 'internal.unexpected', message: '' } },
    );
  }) as unknown as Invoke;
  const escuchar = ((evento: string, alRecibir: (c: unknown) => void) => {
    const lista = oyentes.get(evento) ?? [];
    lista.push(alRecibir);
    oyentes.set(evento, lista);
    return () => lista.splice(lista.indexOf(alRecibir), 1);
  }) as unknown as Escuchar;
  // Sin sesión la ventana abre Inicio de sesión (RT-01-ET06); si la prueba empieza en otra pantalla de cuenta,
  // una pantalla de arranque la abre una sola vez.
  let abierta = false;
  function Arranque() {
    const { abrirCuenta: abrir } = useNavegacion();
    useEffect(() => {
      if (abierta) return;
      abierta = true;
      abrir(inicial);
    }, [abrir]);
    return <Destino nombre="Inicio de sesión" />;
  }
  const deCuenta = inicial === 'sign_in' ? pantallas : { sign_in: Arranque, ...pantallas };
  render(<VentanaPrincipal invocar={invocar} escuchar={escuchar} pantallasDeCuenta={deCuenta} />);
  await act(async () => {});
  return {
    llamadas,
    responder: (comando, respuesta) => respuestas.set(comando, respuesta as Respuesta),
    emitir: (evento, carga) => act(() => (oyentes.get(evento) ?? []).forEach((o) => o(carga))),
  };
}

export const llamadasA = (nucleo: NucleoDePrueba, comando: string) =>
  nucleo.llamadas.filter((l) => l.comando === comando);

export { screen };
