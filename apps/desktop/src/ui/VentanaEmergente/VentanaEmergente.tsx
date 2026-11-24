import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
}

/** Avisa a la ventana principal que hay una ventana emergente abierta, para bloquear el fondo (RT-02-ET08). */
export const ContextoDeBloqueo = createContext<((abierta: boolean) => void) | null>(null);

/** Ventanas emergentes abiertas, de la de abajo a la de arriba: Esc cierra solo la de arriba (RT-02-ET05). */
const abiertas: symbol[] = [];

// Se abre sobre la pantalla actual (RT-02-ET02). docs/rediseno.md RD-72 (rediseno_final_prototipos.md §3.7, D-23): el
// fondo se oscurece con una sola capa del color del marco, la ventana queda al centro con «×» arriba a la derecha y
// sus acciones abajo a la derecha, la principal a la derecha; si el contenido no cabe (85 % del alto), solo el cuerpo
// se desplaza. La capa recibe la selección: la pantalla de fondo y el menú no responden (ET08). Se dibuja fuera de la
// pantalla para que el bloqueo no la alcance.
export function VentanaEmergente({
  titulo,
  children,
  alSalir,
  acciones,
  clase,
  tituloOculto = false,
}: VentanaEmergenteProps) {
  const ventana = useRef<HTMLDivElement>(null);
  const salir = useRef(alSalir);
  const bloquear = useContext(ContextoDeBloqueo);
  useEffect(() => {
    salir.current = alSalir;
  }, [alSalir]);
  useEffect(() => {
    bloquear?.(true);
    return () => bloquear?.(false);
  }, [bloquear]);
  useEffect(() => {
    ventana.current?.focus();
    const propia = Symbol('ventana');
    abiertas.push(propia);
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abiertas[abiertas.length - 1] === propia) salir.current();
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      abiertas.splice(abiertas.indexOf(propia), 1);
    };
  }, []);
  return createPortal(
    <div className="wg-fondo-emergente">
      <div
        ref={ventana}
        className={clase ? `wg-emergente ${clase}` : 'wg-emergente'}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
      >
        <div className="wg-emergente__cabecera">
          <h2 className={tituloOculto ? 'wg-oculto' : undefined}>{titulo}</h2>
          <button
            type="button"
            className="wg-emergente__cerrar"
            aria-label="Cerrar"
            title="Cerrar"
            onClick={() => salir.current()}
          >
            ×
          </button>
        </div>
        <div className="wg-emergente__cuerpo">{children}</div>
        {acciones && <div className="wg-fila wg-emergente__acciones">{acciones}</div>}
      </div>
    </div>,
    document.body,
  );
}
