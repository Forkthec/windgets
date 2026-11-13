import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { invocar as invocarNucleo } from '@/ipc/cliente';
import { escuchar as escucharNucleo, type Escuchar } from '@/ipc/eventos';
import type { Invoke, ScreenId } from '@/types';
import { ProveedorDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { MenuPrincipal, SECCIONES_MENU } from '@/ui/MenuPrincipal/MenuPrincipal';

// Ventana principal (C-01, interfaz.md): RT-01 (menú principal y pantalla principal). Las pantallas de cada
// HU se registran en `pantallas` a medida que se construyen.

/** La pantalla principal (RT-01-ET04, D-014). */
export const PANTALLA_PRINCIPAL: ScreenId = 'planner_daily';

/** Pantallas disponibles sin sesión iniciada (RT-01-ET06). */
export type PantallaDeCuenta = 'sign_in' | 'register' | 'recovery';

const NOMBRE_DE_CUENTA: Record<PantallaDeCuenta, string> = {
  sign_in: 'Inicio de sesión',
  register: 'Registro',
  recovery: 'Recuperar contraseña',
};

const NOMBRE_DE_PANTALLA = Object.fromEntries(
  SECCIONES_MENU.flatMap(({ opciones }) => opciones.map((o) => [o.pantalla, o.texto])),
) as Record<ScreenId, string>;

/**
 * Pregunta a la pantalla actual si se puede salir de ella; `false` la mantiene abierta. La usa, por ejemplo,
 * Personalización del wallpaper con cambios sin guardar (RT-01-ET05; mensajes de HE-02-HU13).
 */
export type GuardiaDeSalida = () => Promise<boolean>;

interface Navegacion {
  /** Abre una pantalla con sesión iniciada, después de consultar la guardia de la pantalla actual. */
  abrir: (pantalla: ScreenId) => Promise<void>;
  /** Abre Inicio de sesión, Registro o Recuperar contraseña; solo sin sesión iniciada. */
  abrirCuenta: (pantalla: PantallaDeCuenta) => void;
  registrarGuardia: (guardia: GuardiaDeSalida | null) => void;
}

const ContextoDeNavegacion = createContext<Navegacion | null>(null);

export function useNavegacion(): Navegacion {
  const navegacion = useContext(ContextoDeNavegacion);
  if (!navegacion) throw new Error('useNavegacion necesita VentanaPrincipal');
  return navegacion;
}

/** Registra la guardia de salida de la pantalla mientras está montada. */
export function useGuardiaDeSalida(guardia: GuardiaDeSalida | null) {
  const { registrarGuardia } = useNavegacion();
  useEffect(() => {
    registrarGuardia(guardia);
    return () => registrarGuardia(null);
  }, [guardia, registrarGuardia]);
}

function PantallaSinConstruir({ nombre }: { nombre: string }) {
  return <main aria-label={nombre} />;
}

export interface VentanaPrincipalProps {
  invocar?: Invoke;
  escuchar?: Escuchar;
  pantallas?: Partial<Record<ScreenId, ComponentType>>;
  pantallasDeCuenta?: Partial<Record<PantallaDeCuenta, ComponentType>>;
}

type Sesion = 'consultando' | 'sin_sesion' | 'con_sesion';

export function VentanaPrincipal({
  invocar = invocarNucleo,
  escuchar = escucharNucleo,
  pantallas = {},
  pantallasDeCuenta = {},
}: VentanaPrincipalProps) {
  const [sesion, setSesion] = useState<Sesion>('consultando');
  const [pantalla, setPantalla] = useState<ScreenId>(PANTALLA_PRINCIPAL);
  const [cuenta, setCuenta] = useState<PantallaDeCuenta>('sign_in');
  const guardia = useRef<GuardiaDeSalida | null>(null);

  const iniciada = useCallback(() => {
    guardia.current = null;
    setSesion('con_sesion');
    setPantalla(PANTALLA_PRINCIPAL); // RT-01-ET04: siempre se abre la pantalla principal
  }, []);
  const cerrada = useCallback(() => {
    guardia.current = null;
    setSesion('sin_sesion');
    setCuenta('sign_in');
  }, []);

  // Al abrir la aplicación: con la sesión recordada, con o sin conexión, abre la pantalla principal
  // (RT-01-CA04, CA05; IPC-AUTH-12 auth_get_session no pide credenciales).
  useEffect(() => {
    let vigente = true;
    void invocar('auth_get_session', {}).then((r) => {
      if (!vigente) return;
      if (r.ok && r.value.state === 'signed_in') iniciada();
      else cerrada();
    });
    return () => {
      vigente = false;
    };
  }, [cerrada, iniciada, invocar]);

  // Al iniciar sesión (correo o Google) y al crear la cuenta llega session_changed (EV-01).
  useEffect(
    () => escuchar('session_changed', (carga) => (carga.state === 'signed_in' ? iniciada() : cerrada())),
    [cerrada, escuchar, iniciada],
  );

  const navegacion = useMemo<Navegacion>(
    () => ({
      abrir: async (destino) => {
        if (sesion !== 'con_sesion' || destino === pantalla) return;
        const puedeSalir = guardia.current ? await guardia.current() : true;
        if (!puedeSalir) return;
        guardia.current = null;
        setPantalla(destino);
      },
      abrirCuenta: (destino) => {
        if (sesion === 'sin_sesion') setCuenta(destino);
      },
      registrarGuardia: (nueva) => {
        guardia.current = nueva;
      },
    }),
    [pantalla, sesion],
  );

  let contenido = null;
  if (sesion === 'con_sesion') {
    const Pantalla = pantallas[pantalla];
    contenido = (
      <div className="wg-ventana-principal">
        <MenuPrincipal actual={pantalla} alElegir={(p) => void navegacion.abrir(p)} />
        <div className="wg-ventana-principal__pantalla">
          {Pantalla ? <Pantalla /> : <PantallaSinConstruir nombre={NOMBRE_DE_PANTALLA[pantalla]} />}
        </div>
      </div>
    );
  } else if (sesion === 'sin_sesion') {
    // Sin sesión no hay menú principal (RT-01-ET06).
    const Cuenta = pantallasDeCuenta[cuenta];
    contenido = <div>{Cuenta ? <Cuenta /> : <PantallaSinConstruir nombre={NOMBRE_DE_CUENTA[cuenta]} />}</div>;
  }

  return (
    <ContextoDeNavegacion.Provider value={navegacion}>
      <ProveedorDeResultado>{contenido}</ProveedorDeResultado>
    </ContextoDeNavegacion.Provider>
  );
}
