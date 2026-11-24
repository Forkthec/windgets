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
import type { Invoke, ScreenId, ScreenParams } from '@/types';
import textos from '@/types/messages.es.json';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { ProveedorDeResultado, useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import {
  IconoDelMenu,
  TRAZO_ABRIR,
  TRAZO_CERRAR_SESION,
  TRAZO_CONTRAER,
} from '@/ui/MenuPrincipal/IconosDelMenu';
import { MenuPrincipal } from '@/ui/MenuPrincipal/MenuPrincipal';
import { useTemaAplicado } from '@/ui/tema/temaAplicado';
import { AvisoDelWallpaper } from './AvisoDelWallpaper';
import { bloquearZoom } from './bloquearZoom';
import { EncabezadoDePantalla } from './EncabezadoDePantalla';
import { IndicadorSincronizacion } from './IndicadorSincronizacion';
import { AMPLIAR_MENU, OCULTAR_MENU, TITULO_DE_PANTALLA } from './textosDelMarco';
import simbolo from '@/screens/cuenta/activos/simbolo.svg';
import './marco.css';
import { ContextoDeBloqueo } from '@/ui/VentanaEmergente/VentanaEmergente';
import { ProveedorDeApariencia, RaizDeCuenta, type ModoDeCuenta } from '@/screens/cuenta/apariencia';
import { useTemaInicial } from '@/screens/cuenta/temaInicial';
import { CerrarSesion } from '@/screens/settings/CerrarSesion';

// Ventana principal (C-01, interfaz.md): RT-01 (menú principal y pantalla principal) y el bloqueo del fondo de
// RT-02 (ventanas emergentes). Las pantallas de cada HU se registran en `pantallas` a medida que se construyen.

/** La pantalla principal (RT-01-ET04, D-014). */
export const PANTALLA_PRINCIPAL: ScreenId = 'planner_daily';

/** Pantallas disponibles sin sesión iniciada (RT-01-ET06). */
export type PantallaDeCuenta = 'sign_in' | 'register' | 'recovery';

const NOMBRE_DE_CUENTA: Record<PantallaDeCuenta, string> = {
  sign_in: 'Inicio de sesión',
  register: 'Registro',
  recovery: 'Recuperar contraseña',
};

/**
 * Pregunta a la pantalla actual si se puede salir de ella; `false` la mantiene abierta. La usa, por ejemplo,
 * Personalización del wallpaper con cambios sin guardar (RT-01-ET05; mensajes de HE-02-HU13).
 */
export type GuardiaDeSalida = () => Promise<boolean>;

interface Navegacion {
  /** Abre una pantalla con sesión iniciada, después de consultar la guardia de la pantalla actual. */
  abrir: (pantalla: ScreenId) => Promise<void>;
  /**
   * Abre Inicio de sesión, Registro o Recuperar contraseña; solo sin sesión iniciada. `correo` llega ya
   * diligenciado en la pantalla de destino (HE-01-HU01-CA09, CA10).
   */
  abrirCuenta: (pantalla: PantallaDeCuenta, correo?: string) => void;
  /** Correo con el que se abrió la pantalla de cuenta actual (vacío si no se pasó ninguno). */
  correoDeCuenta: string;
  /**
   * La pantalla de cuenta inició la sesión o creó la cuenta: abre la pantalla principal (RT-01-ET04). Dentro de
   * Tauri llega también `session_changed` (EV-01); fuera de Tauri (Núcleo simulado) no llega ningún evento.
   * Con `cuentaNueva`, el primer tema de la cuenta toma la paleta del modo de las pantallas de cuenta
   * (docs/rediseno.md RD-15).
   */
  sesionIniciada: (cuentaNueva?: { paleta: ModoDeCuenta }) => void;
  /**
   * Se cerró la sesión (HE-16-HU03): abre Inicio de sesión. Dentro de Tauri llega también `session_changed`
   * (EV-01) con `reason: 'sign_out'`; fuera de Tauri (Núcleo simulado) no llega ningún evento.
   */
  sesionCerrada: () => void;
  registrarGuardia: (guardia: GuardiaDeSalida | null) => void;
}

const ContextoDeNavegacion = createContext<Navegacion | null>(null);

/** Un pedido de EV-23 con parámetros (HE-06-HU08): el detalle de una tarjeta, el Panel de un día o la vista mensual. */
interface PedidoDeNavegacion {
  pantalla: ScreenId;
  params: ScreenParams;
}

const ContextoDePedido = createContext<{
  pedido: PedidoDeNavegacion | null;
  atender: () => void;
}>({ pedido: null, atender: () => undefined });

/**
 * Los parámetros con los que se pidió abrir `pantalla` desde un widget (IPC-DESK-03, EV-23). `alRecibir` corre una
 * sola vez por pedido, también si la pantalla se monta después de llegar el pedido.
 */
export function useParametrosDeNavegacion(pantalla: ScreenId, alRecibir: (params: ScreenParams) => void) {
  const { pedido, atender } = useContext(ContextoDePedido);
  useEffect(() => {
    if (!pedido || pedido.pantalla !== pantalla) return;
    atender();
    alRecibir(pedido.params);
  }, [alRecibir, atender, pantalla, pedido]);
}

interface Nucleo {
  invocar: Invoke;
  escuchar: Escuchar;
}

const ContextoDelNucleo = createContext<Nucleo>({ invocar: invocarNucleo, escuchar: escucharNucleo });

/** El cliente IPC y los eventos del Núcleo de la ventana principal (las pruebas pasan uno simulado). */
export function useNucleo(): Nucleo {
  return useContext(ContextoDelNucleo);
}

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
  const [correoDeCuenta, setCorreoDeCuenta] = useState('');
  const [emergentes, setEmergentes] = useState(0);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  // docs/rediseno.md RD-15: la paleta que espera aplicarse al tema de una cuenta recién creada.
  const [paletaInicial, setPaletaInicial] = useState<ModoDeCuenta | null>(null);
  const temaInicialTerminado = useCallback(() => setPaletaInicial(null), []);
  const guardia = useRef<GuardiaDeSalida | null>(null);
  const fondo = useRef<HTMLDivElement>(null);

  const iniciada = useCallback(() => {
    guardia.current = null;
    setSesion('con_sesion');
    setPantalla(PANTALLA_PRINCIPAL); // RT-01-ET04: siempre se abre la pantalla principal
  }, []);
  const cerrada = useCallback(() => {
    guardia.current = null;
    setSesion('sin_sesion');
    setPaletaInicial(null);
    setCuenta('sign_in');
    setCorreoDeCuenta('');
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

  // RT-02-ET08: con una ventana emergente abierta, la pantalla de fondo y el menú no responden.
  useEffect(() => {
    fondo.current?.toggleAttribute('inert', emergentes > 0);
  }, [emergentes, sesion]);
  const bloquear = useCallback(
    (abierta: boolean) => setEmergentes((n) => Math.max(0, n + (abierta ? 1 : -1))),
    [],
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
      abrirCuenta: (destino, correo = '') => {
        if (sesion !== 'sin_sesion') return;
        setCuenta(destino);
        setCorreoDeCuenta(correo);
      },
      correoDeCuenta,
      sesionIniciada: (cuentaNueva) => {
        if (cuentaNueva) setPaletaInicial(cuentaNueva.paleta);
        iniciada();
      },
      sesionCerrada: cerrada,
      registrarGuardia: (nueva) => {
        guardia.current = nueva;
      },
    }),
    [cerrada, correoDeCuenta, iniciada, pantalla, sesion],
  );
  const nucleo = useMemo(() => ({ invocar, escuchar }), [escuchar, invocar]);

  // HE-03-HU06: los colores y la tipografía del tema aplicado en toda la aplicación (ET01, ET02, ET05).
  // docs/rediseno.md RD-62 (D-01; reemplaza RD-28 y RD-29): con la sesión iniciada no hay colores fijos por modo; la
  // ventana usa los tokens del tema. `body[data-sesion]` deriva de ellos los tonos de las áreas (`marco.css`) y
  // alcanza también las ventanas emergentes.
  useTemaAplicado(invocar, escuchar, sesion === 'con_sesion');
  useEffect(() => {
    if (sesion !== 'con_sesion') return;
    document.body.dataset.sesion = '';
    return () => {
      delete document.body.dataset.sesion;
    };
  }, [sesion]);
  // RD-69 (D-04): sin zoom de la página.
  useEffect(() => bloquearZoom(), []);
  // D-25 (RD-65): el menú contraído se recuerda en este computador (IPC-DESK-17, IPC-DESK-18).
  const [menuContraido, setMenuContraido] = useState(false);
  useEffect(() => {
    if (sesion !== 'con_sesion') return;
    let vigente = true;
    void invocar('app_get_menu_collapsed', {}).then((r) => {
      if (vigente && r.ok) setMenuContraido(r.value.collapsed);
    });
    return () => {
      vigente = false;
    };
  }, [invocar, sesion]);
  const contraerMenu = useCallback(
    (contraido: boolean) => {
      setMenuContraido(contraido);
      void invocar('app_set_menu_collapsed', { collapsed: contraido });
    },
    [invocar],
  );
  // docs/rediseno.md RD-42: Personalización del wallpaper ocupa la ventana sin el menú lateral (Figma 91:1638);
  // «Personalización» en su encabezado vuelve al marco con el menú. Se reinicia al cambiar de pantalla.
  const [marcoEnWallpaper, setMarcoEnWallpaper] = useState(false);
  useEffect(() => setMarcoEnWallpaper(false), [pantalla]);
  const pantallaCompleta = pantalla === 'personalization' && !marcoEnWallpaper;

  // HE-17-HU02-ET05 (D-156): cada pantalla que se abre queda como la última visitada en este computador.
  useEffect(() => {
    if (sesion === 'con_sesion') void invocar('app_set_last_screen', { screen: pantalla });
  }, [invocar, pantalla, sesion]);

  // EV-23: al abrir la ventana desde el ícono del área de notificación, el Núcleo pide la última pantalla visitada
  // (HE-17-HU02-CA01, CA02).
  const ultimaNavegacion = useRef(navegacion);
  useEffect(() => {
    ultimaNavegacion.current = navegacion;
  }, [navegacion]);
  // HE-06-HU08: un widget pide además el detalle de una tarjeta, el Panel de un día o la vista mensual.
  const [pedido, setPedido] = useState<PedidoDeNavegacion | null>(null);
  const atender = useCallback(() => setPedido(null), []);
  const contextoDePedido = useMemo(() => ({ pedido, atender }), [atender, pedido]);
  useEffect(
    () =>
      escuchar('navigate_requested', (carga) => {
        setPedido(carga.params ? { pantalla: carga.screen, params: carga.params } : null);
        void ultimaNavegacion.current.abrir(carga.screen);
      }),
    [escuchar],
  );

  // EV-24: «Salir» en el menú del ícono con cambios sin guardar en la vista previa (HE-17-HU03-CA02, ET06, ET07).
  useEffect(
    () =>
      escuchar('exit_requested', (carga) => {
        if (carga.requires_confirmation) setConfirmarSalida(true);
        else void invocar('app_exit', { discard_changes: false });
      }),
    [escuchar, invocar],
  );

  let contenido = null;
  if (sesion === 'con_sesion' && pantallaCompleta) {
    const Pantalla = pantallas[pantalla];
    contenido = (
      // Figma 91:1639 «windgets», 91:1640 «Personalización» y 91:1641 «Sincronizado».
      <div ref={fondo} className="wg-ventana-principal wg-ventana-principal--completa">
        <header className="wg-cabecera-completa">
          <span className="wg-cabecera-completa__marca">windgets</span>
          <button
            type="button"
            className="wg-cabecera-completa__seccion"
            aria-expanded="false"
            onClick={() => setMarcoEnWallpaper(true)}
          >
            Personalización
          </button>
          <IndicadorSincronizacion />
        </header>
        <div className="wg-ventana-principal__completa">
          {Pantalla ? <Pantalla /> : <PantallaSinConstruir nombre={TITULO_DE_PANTALLA[pantalla]} />}
        </div>
      </div>
    );
  } else if (sesion === 'con_sesion') {
    const Pantalla = pantallas[pantalla];
    contenido = (
      <div
        ref={fondo}
        className={`wg-ventana-principal${menuContraido ? ' wg-ventana-principal--menu-contraido' : ''}`}
      >
        {/* RD-65 (rediseno_final_prototipos.md §4.1): el logo con el botón de contraer o ampliar a su lado; contraído
            quedan solo los íconos (56 px). */}
        <div className="wg-ventana-principal__menu wg-menu">
          <div className="wg-menu__cabeza">
            {!menuContraido && (
              <div className="wg-menu__marca">
                <img className="wg-menu__simbolo" src={simbolo} alt="" />
                windgets
              </div>
            )}
            <button
              type="button"
              className="wg-menu__ocultar"
              aria-label={menuContraido ? AMPLIAR_MENU : OCULTAR_MENU}
              title={menuContraido ? AMPLIAR_MENU : OCULTAR_MENU}
              aria-expanded={!menuContraido}
              onClick={() => contraerMenu(!menuContraido)}
            >
              <IconoDelMenu trazo={menuContraido ? TRAZO_ABRIR : TRAZO_CONTRAER} className="wg-menu__icono" />
            </button>
          </div>
          <MenuPrincipal
            actual={pantalla}
            alElegir={(p) => void navegacion.abrir(p)}
            contraido={menuContraido}
            pie={<CerrarSesionDelMenu contraido={menuContraido} />}
          />
        </div>
        <div className="wg-ventana-principal__principal">
          {/* RD-43: Personalización del wallpaper lleva su propio título y «Tema en edición». */}
          {pantalla !== 'personalization' && <EncabezadoDePantalla pantalla={pantalla} />}
          <div className="wg-ventana-principal__pantalla">
            {Pantalla ? <Pantalla /> : <PantallaSinConstruir nombre={TITULO_DE_PANTALLA[pantalla]} />}
          </div>
        </div>
      </div>
    );
  } else if (sesion === 'sin_sesion') {
    // Sin sesión no hay menú principal (RT-01-ET06).
    const Cuenta = pantallasDeCuenta[cuenta];
    // docs/rediseno.md RD-02, RD-04: las pantallas de cuenta llevan la apariencia Claro u Oscuro, no el tema.
    contenido = (
      <RaizDeCuenta ref={fondo}>
        {Cuenta ? (
          <Cuenta key={`${cuenta}-${correoDeCuenta}`} />
        ) : (
          <PantallaSinConstruir nombre={NOMBRE_DE_CUENTA[cuenta]} />
        )}
      </RaizDeCuenta>
    );
  }

  return (
    <ContextoDelNucleo.Provider value={nucleo}>
      <ProveedorDeApariencia>
        <ContextoDeNavegacion.Provider value={navegacion}>
          <ContextoDePedido.Provider value={contextoDePedido}>
            <ContextoDeBloqueo.Provider value={bloquear}>
              <ProveedorDeResultado>
                {sesion === 'con_sesion' && paletaInicial && (
                  <TemaInicial
                    invocar={invocar}
                    escuchar={escuchar}
                    paleta={paletaInicial}
                    alTerminar={temaInicialTerminado}
                  />
                )}
                {sesion === 'con_sesion' && <AvisoDelWallpaper />}
                {contenido}
                {confirmarSalida && (
                  // DUDA: HE-17-HU03 el título de la confirmación no está definido; se usa «Salir».
                  <Confirmacion
                    titulo="Salir"
                    texto={textos.SALIR_SIN_GUARDAR}
                    opcionPrincipal="Salir sin guardar"
                    opcionSalir="Seguir editando"
                    // CA03: descarta los cambios y cierra la aplicación sin cerrar la sesión.
                    alConfirmar={() => void invocar('app_exit', { discard_changes: true })}
                    // CA04: cierra el mensaje; la vista previa conserva sus cambios.
                    alCancelar={() => setConfirmarSalida(false)}
                  />
                )}
              </ProveedorDeResultado>
            </ContextoDeBloqueo.Provider>
          </ContextoDePedido.Provider>
        </ContextoDeNavegacion.Provider>
      </ProveedorDeApariencia>
    </ContextoDelNucleo.Provider>
  );
}

/** RD-65 (P09): «Cerrar sesión» como ícono al pie del menú, con el flujo de HE-16-HU03. */
function CerrarSesionDelMenu({ contraido }: { contraido: boolean }) {
  const mostrar = useMensajeDeResultado();
  return (
    <CerrarSesion
      alFallar={(mensaje) => mostrar(mensaje, 'error')}
      disparador={(abrir, enCurso) => (
        <button
          type="button"
          className="wg-boton wg-menu__opcion wg-menu__cerrar-sesion"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          disabled={enCurso}
          onClick={abrir}
        >
          <IconoDelMenu trazo={TRAZO_CERRAR_SESION} />
          {!contraido && <span aria-hidden="true">Cerrar sesión</span>}
        </button>
      )}
    />
  );
}

/** docs/rediseno.md RD-15: aplica la paleta del modo al tema de una cuenta nueva, con su mensaje si falla. */
function TemaInicial({
  invocar,
  escuchar,
  paleta,
  alTerminar,
}: {
  invocar: Invoke;
  escuchar: Escuchar;
  paleta: ModoDeCuenta;
  alTerminar: () => void;
}) {
  useTemaInicial(invocar, escuchar, paleta, alTerminar);
  return null;
}
