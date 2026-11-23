import { createContext, forwardRef, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import './cuenta.css';

// docs/rediseno.md RD-02 y RD-03: la apariencia de las pantallas de cuenta (sin sesión iniciada) es «Claro» u
// «Oscuro». Se guarda solo en este computador, en el almacenamiento local de la ventana: no se sincroniza y no se
// borra al cerrar sesión (la tabla local `device_setting` sí se borra). La primera vez se usa el modo de
// aplicaciones de Windows, que WebView2 entrega como `prefers-color-scheme`.

export type ModoDeCuenta = 'claro' | 'oscuro';

export const CLAVE_DEL_MODO = 'wg.modo_cuenta';

function modoGuardado(): ModoDeCuenta | null {
  try {
    const valor = window.localStorage.getItem(CLAVE_DEL_MODO);
    return valor === 'claro' || valor === 'oscuro' ? valor : null;
  } catch {
    // Sin almacenamiento disponible la pantalla funciona igual, con el modo de Windows.
    return null;
  }
}

function modoDeWindows(): ModoDeCuenta {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  } catch {
    return 'claro';
  }
}

/** El modo guardado en este computador o, si no hay ninguno, el de Windows. */
export function modoInicial(): ModoDeCuenta {
  return modoGuardado() ?? modoDeWindows();
}

interface Apariencia {
  modo: ModoDeCuenta;
  cambiar: (modo: ModoDeCuenta) => void;
}

const ContextoDeApariencia = createContext<Apariencia>({ modo: 'claro', cambiar: () => undefined });

export function ProveedorDeApariencia({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoDeCuenta>(modoInicial);
  const cambiar = useCallback((nuevo: ModoDeCuenta) => {
    setModo(nuevo);
    try {
      window.localStorage.setItem(CLAVE_DEL_MODO, nuevo);
    } catch {
      // Si no se puede guardar, el modo vale mientras la ventana siga abierta.
    }
  }, []);
  const valor = useMemo(() => ({ modo, cambiar }), [cambiar, modo]);
  return <ContextoDeApariencia.Provider value={valor}>{children}</ContextoDeApariencia.Provider>;
}

export function useApariencia(): Apariencia {
  return useContext(ContextoDeApariencia);
}

/** Contenedor de las pantallas de cuenta: sus colores salen de `data-modo` (tokens.css, RD-04). */
export const RaizDeCuenta = forwardRef<HTMLDivElement, { children: ReactNode }>(function RaizDeCuenta(
  { children },
  ref,
) {
  const { modo } = useApariencia();
  return (
    <div ref={ref} className="wg-cuenta-raiz" data-modo={modo}>
      {children}
    </div>
  );
});
