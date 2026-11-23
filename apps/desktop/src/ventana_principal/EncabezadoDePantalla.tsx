import { useState } from 'react';
import type { ScreenId } from '@/types';
import { SelectorDeModo } from '@/screens/cuenta/SelectorDeModo';
import type { ModoDeCuenta } from '@/screens/cuenta/apariencia';
import { aplicarTemaInicial, NOMBRE_DEL_MODO } from '@/screens/cuenta/temaInicial';
import { TEMA_INICIAL_NO_APLICADO } from '@/screens/cuenta/textosDelRediseno';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import type { ModoDelTema } from '@/ui/tema/temaAplicado';
import { IndicadorSincronizacion } from './IndicadorSincronizacion';
import { SECCION_DE_PANTALLA, TITULO_DE_PANTALLA } from './textosDelMarco';
import { useNucleo } from './VentanaPrincipal';

// Figma 81:2 «Planificador diario · Claro» (81:17 sección, 81:18 título, 81:19 «Apariencia») y 76:24 «Cambiar
// apariencia»: el encabezado de cada pantalla con sesión (docs/rediseno.md RD-29, RD-32).

export interface EncabezadoDePantallaProps {
  pantalla: ScreenId;
  /** El modo del tema aplicado (RD-28); null mientras no se conoce. */
  modo: ModoDelTema | null;
  /** Vuelve a leer el tema aplicado después de cambiarle la paleta. */
  alAplicar: () => void;
}

export function EncabezadoDePantalla({ pantalla, modo, alAplicar }: EncabezadoDePantallaProps) {
  const { invocar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  // Mientras se aplica, el selector ya muestra la opción elegida.
  const [elegido, setElegido] = useState<ModoDeCuenta | null>(null);

  // RD-29: aplica al tema la paleta del modo con el flujo de RD-15, sin cambiar la tipografía.
  const cambiar = async (nuevo: ModoDeCuenta) => {
    if (nuevo === (elegido ?? modo)) return;
    setElegido(nuevo);
    const resultado = await aplicarTemaInicial(invocar, nuevo, false);
    setElegido(null);
    if (resultado === 'aplicado') alAplicar();
    else mostrarResultado(TEMA_INICIAL_NO_APLICADO(NOMBRE_DEL_MODO[nuevo]));
  };

  const actual = elegido ?? modo;
  return (
    <header className="wg-encabezado-pantalla">
      <p className="wg-encabezado-pantalla__seccion">{SECCION_DE_PANTALLA[pantalla]}</p>
      <h1 className="wg-encabezado-pantalla__titulo">{TITULO_DE_PANTALLA[pantalla]}</h1>
      <div className="wg-encabezado-pantalla__derecha">
        <IndicadorSincronizacion />
        {/* RD-29: no va en Personalización del wallpaper, que tiene un tema en edición. */}
        {actual && pantalla !== 'personalization' && (
          <SelectorDeModo conSesion={{ modo: actual, cambiar: (m) => void cambiar(m) }} />
        )}
      </div>
    </header>
  );
}
