import { createContext, useContext, useEffect, useState, type ComponentType } from 'react';
import { DibujoDeWindi } from '@/ui/OjosDeWindi/DibujoDeWindi';
import { NombreEmergente } from '@/ui/NombreEmergente/NombreEmergente';

// Windi en la ventana principal (docs/rediseno_final_prototipos.md §4.3; rediseno_final_backend.md §4.10 y §5.5, D-07;
// docs/rediseno.md RD-70). Ya no es una opción del menú: un botón flotante de 40 px con los ojos, abajo a la derecha,
// en todas las pantallas con sesión, abre un panel lateral derecho de 360 px de todo el alto, encima de la pantalla
// actual y sin cambiar la pantalla ni la miga. «×» y Esc lo cierran. El chat reutiliza la conversación de HE-14
// (IPC-WIN-01 a 04) y conserva el historial y la propuesta activa al cerrar y volver a abrir.

/** Avisa al botón y al encabezado del panel que Windi está «Escribiendo…», para que los ojos parpadeen. */
export const ContextoDeWindiEscribiendo = createContext<(escribiendo: boolean) => void>(() => undefined);

/** Lo usa la conversación de Windi para que los ojos parpadeen mientras responde. */
export function useAvisarEscribiendo(escribiendo: boolean) {
  const avisar = useContext(ContextoDeWindiEscribiendo);
  useEffect(() => {
    avisar(escribiendo);
    return () => avisar(false);
  }, [avisar, escribiendo]);
}

export interface PanelDeWindiProps {
  abierto: boolean;
  alAbrir: () => void;
  alCerrar: () => void;
  /** La conversación (P-IA-01, `screens/windi/Windi`). */
  Conversacion?: ComponentType;
}

export function PanelDeWindi({ abierto, alAbrir, alCerrar, Conversacion }: PanelDeWindiProps) {
  const [escribiendo, setEscribiendo] = useState(false);
  // Se monta al abrirlo la primera vez y queda montado: el historial y la propuesta se conservan al cerrar.
  const [montado, setMontado] = useState(abierto);
  useEffect(() => {
    if (abierto) setMontado(true);
  }, [abierto]);

  // Esc cierra el panel, salvo que haya una ventana emergente encima (la cierra ella).
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[role="dialog"]')) return;
      alCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, alCerrar]);

  return (
    <ContextoDeWindiEscribiendo.Provider value={setEscribiendo}>
      {!abierto && (
        <NombreEmergente texto="Windi">
          <button
            type="button"
            className="wg-windi-flotante"
            aria-label="Windi"
            aria-expanded="false"
            onClick={alAbrir}
          >
            <DibujoDeWindi
              tamano={28}
              estado={escribiendo ? 'escribiendo' : 'reposo'}
              parpadeando={escribiendo}
            />
          </button>
        </NombreEmergente>
      )}
      {montado && (
        <aside className="wg-panel-windi" aria-label="Windi" hidden={!abierto}>
          <header className="wg-panel-windi__cabecera">
            <DibujoDeWindi
              tamano={28}
              estado={escribiendo ? 'escribiendo' : 'reposo'}
              parpadeando={escribiendo}
              className="wg-panel-windi__ojos"
            />
            <h2 className="wg-panel-windi__titulo">Windi</h2>
            <NombreEmergente texto="Cerrar">
              <button type="button" className="wg-panel-windi__cerrar" aria-label="Cerrar" onClick={alCerrar}>
                ×
              </button>
            </NombreEmergente>
          </header>
          <div className="wg-panel-windi__cuerpo">{Conversacion ? <Conversacion /> : null}</div>
        </aside>
      )}
    </ContextoDeWindiEscribiendo.Provider>
  );
}
