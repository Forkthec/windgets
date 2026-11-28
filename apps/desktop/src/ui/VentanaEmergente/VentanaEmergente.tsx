import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import textos from '@/types/messages.es.json';
import { Confirmacion } from '../Confirmacion/Confirmacion';
import { ATRIBUTO_SIN_INERTE } from '../MensajeResultado/MensajeResultado';
import { NombreEmergente } from '../NombreEmergente/NombreEmergente';
import {
  ATRIBUTO_DE_SALIDA,
  cancelarSalidas,
  salirConCopia,
  useEntradaAnimada,
} from '../movimiento/useSalidaAnimada';

export interface VentanaEmergenteProps {
  titulo: string;
  children: ReactNode;
  /** «Cerrar» o «Cancelar»; también lo ejecuta la tecla Esc (RT-02-ET05). */
  alSalir: () => void;
  acciones?: ReactNode;
  /** Clase de la ventana, por ejemplo `wg-confirmacion` (docs/rediseno.md RD-34). */
  clase?: string;
  /** RD-34: el título no se ve; sigue siendo el nombre accesible de la ventana. */
  tituloOculto?: boolean;
  /**
   * RD-103 (IM-04): hay datos escritos sin guardar. Cerrar con «×», Esc o el velo pide primero la confirmación de
   * descarte (M-02, `SALIR_SIN_GUARDAR`) y el clic en el velo no cierra.
   */
  hayCambios?: boolean;
}

/** Avisa a la ventana principal que hay una ventana emergente abierta, para bloquear el fondo (RT-02-ET08). */
export const ContextoDeBloqueo = createContext<((abierta: boolean) => void) | null>(null);

/** Ventanas emergentes abiertas, de la de abajo a la de arriba: Esc cierra solo la de arriba (RT-02-ET05). */
const abiertas: symbol[] = [];

/** Fondo `inert` (RD-103): cuántas ventanas tienen inerte cada elemento y si ya lo estaba antes de la primera. */
const inertes = new Map<Element, { cuenta: number; previo: boolean }>();

function volverInerte(excepto: Element): Element[] {
  const tocados: Element[] = [];
  for (const el of Array.from(document.body.children)) {
    // RD-104: los mensajes emergentes quedan operables encima del velo.
    if (el === excepto || el.hasAttribute(ATRIBUTO_SIN_INERTE) || el.hasAttribute(ATRIBUTO_DE_SALIDA))
      continue;
    const registro = inertes.get(el);
    if (registro) registro.cuenta += 1;
    else {
      inertes.set(el, { cuenta: 1, previo: el.hasAttribute('inert') });
      el.setAttribute('inert', '');
    }
    tocados.push(el);
  }
  return tocados;
}

function soltarInerte(tocados: Element[]) {
  for (const el of tocados) {
    const registro = inertes.get(el);
    if (!registro) continue;
    registro.cuenta -= 1;
    if (registro.cuenta > 0) continue;
    inertes.delete(el);
    if (!registro.previo) el.removeAttribute('inert');
  }
}

const CAMPOS = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
const ENFOCABLES = `a[href], button:not([disabled]), ${CAMPOS}, [tabindex]:not([tabindex="-1"])`;

function enfocables(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>(ENFOCABLES)).filter(
    (el) => !el.closest('[hidden], [inert]'),
  );
}

// Se abre sobre la pantalla actual (RT-02-ET02). docs/rediseno.md RD-72 (rediseno_final_prototipos.md §3.7, D-23): el
// fondo se oscurece con una sola capa del color del marco, la ventana queda al centro con «×» arriba a la derecha y
// sus acciones abajo a la derecha, la principal a la derecha; si el contenido no cabe (85 % del alto), solo el cuerpo
// se desplaza. La capa recibe la selección: la pantalla de fondo y el menú no responden (ET08). Se dibuja fuera de la
// pantalla para que el bloqueo no la alcance.
// AN-01 (ANIMACIONES.md A-01, A-02, A-02b): entra con fundido y sube `--mov-corto` en 200 ms (clase `--abierta` en el
// fotograma siguiente); al cerrar, quien la abre la desmonta en el acto y una copia inerte sale en 150 ms. Una ventana
// encima de otra pinta su velo transparente: el de abajo ya oscurece el fondo.
export function VentanaEmergente({
  titulo,
  children,
  alSalir,
  acciones,
  clase,
  tituloOculto = false,
  hayCambios = false,
}: VentanaEmergenteProps) {
  const fondo = useRef<HTMLDivElement>(null);
  const ventana = useRef<HTMLDivElement>(null);
  const salir = useRef(alSalir);
  const conCambios = useRef(hayCambios);
  const [descartando, setDescartando] = useState(false);
  // RD-103: quien tenía el foco al abrir; se lee al dibujar, antes de que algo de la ventana lo tome.
  const quienAbrio = useRef<Element | null | undefined>(undefined);
  if (quienAbrio.current === undefined)
    quienAbrio.current = typeof document === 'undefined' ? null : document.activeElement;
  const empezoDentro = useRef(false);
  const bloquear = useContext(ContextoDeBloqueo);
  // A-02b: si ya hay otra abierta debajo, esta es la apilada.
  const apilada = useRef<boolean | undefined>(undefined);
  if (apilada.current === undefined) apilada.current = abiertas.length > 0;
  const abierta = useEntradaAnimada(ventana);
  // A-02: antes de que React la quite, su copia empieza a salir.
  useLayoutEffect(() => {
    const velo = fondo.current;
    return () =>
      salirConCopia(
        velo,
        [
          {
            selector: '.wg-fondo-emergente',
            abierta: 'wg-fondo-emergente--abierta',
            saliendo: 'wg-fondo-emergente--saliendo',
          },
          { selector: '.wg-emergente', abierta: 'wg-emergente--abierta', saliendo: 'wg-emergente--saliendo' },
        ],
        '.wg-emergente',
      );
  }, []);
  useEffect(() => {
    salir.current = alSalir;
    conCambios.current = hayCambios;
  }, [alSalir, hayCambios]);
  /** «×», Esc y el velo: con cambios sin guardar piden primero el descarte. */
  const pedirSalir = useRef(() => {
    if (conCambios.current) setDescartando(true);
    else salir.current();
  }).current;
  useEffect(() => {
    bloquear?.(true);
    return () => bloquear?.(false);
  }, [bloquear]);
  useEffect(() => {
    const raiz = ventana.current;
    const propia = Symbol('ventana');
    // A-02: si se vuelve a abrir mientras otra sale, la salida se cancela.
    cancelarSalidas();
    abiertas.push(propia);
    const tocados = fondo.current ? volverInerte(fondo.current) : [];
    // RD-103: el foco inicial va al primer campo; sin campos, a «×».
    const primerCampo = raiz?.querySelector<HTMLElement>(`.wg-emergente__cuerpo :is(${CAMPOS})`);
    (primerCampo ?? raiz?.querySelector<HTMLElement>('.wg-emergente__cerrar') ?? raiz)?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (abiertas[abiertas.length - 1] !== propia) return;
      if (e.key === 'Escape') pedirSalir();
      if (e.key !== 'Tab' || !raiz) return;
      // RD-103: el foco queda atrapado; Tab y Shift+Tab ciclan dentro de la ventana.
      const lista = enfocables(raiz);
      if (lista.length === 0) {
        e.preventDefault();
        raiz.focus();
        return;
      }
      const primero = lista[0] ?? raiz;
      const ultimo = lista[lista.length - 1] ?? raiz;
      const actual = document.activeElement;
      if (!raiz.contains(actual) || (actual === raiz && !e.shiftKey)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
      } else if (e.shiftKey && (actual === primero || actual === raiz)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && actual === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      abiertas.splice(abiertas.indexOf(propia), 1);
      soltarInerte(tocados);
      // RD-103: al cerrar, el foco vuelve a quien abrió la ventana, si sigue en pantalla.
      const quien = quienAbrio.current;
      if (quien instanceof HTMLElement && quien.isConnected && quien !== document.body) quien.focus();
    };
  }, [pedirSalir]);
  return createPortal(
    <div
      ref={fondo}
      className={[
        'wg-fondo-emergente',
        apilada.current && 'wg-fondo-emergente--apilado',
        abierta && 'wg-fondo-emergente--abierta',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={(e) => {
        empezoDentro.current = e.target !== e.currentTarget;
      }}
      onClick={(e) => {
        // RD-103: el clic en el velo cierra (con cambios, pide el descarte); si se empezó dentro de la ventana, no.
        const dentro = empezoDentro.current;
        empezoDentro.current = false;
        if (e.target === e.currentTarget && !dentro) pedirSalir();
      }}
    >
      <div
        ref={ventana}
        className={['wg-emergente', abierta && 'wg-emergente--abierta', clase].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
      >
        <div className="wg-emergente__cabecera">
          <h2 className={tituloOculto ? 'wg-oculto' : undefined}>{titulo}</h2>
          <NombreEmergente texto="Cerrar">
            <button type="button" className="wg-emergente__cerrar" aria-label="Cerrar" onClick={pedirSalir}>
              ×
            </button>
          </NombreEmergente>
        </div>
        <div className="wg-emergente__cuerpo">{children}</div>
        {acciones && <div className="wg-fila wg-emergente__acciones">{acciones}</div>}
      </div>
      {descartando && (
        // M-02. DUDA: no define título propio (docs/DUDAS.md). Valor usado: «Salir», como en la pantalla de edición.
        <Confirmacion
          titulo="Salir"
          texto={textos.SALIR_SIN_GUARDAR}
          opcionPrincipal="Salir sin guardar"
          opcionSalir="Seguir editando"
          alConfirmar={() => {
            setDescartando(false);
            salir.current();
          }}
          alCancelar={() => setDescartando(false)}
        />
      )}
    </div>,
    document.body,
  );
}
