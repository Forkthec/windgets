import { useEffect, useState, type ReactNode } from 'react';
import type { ThemeColors } from '@/types';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { SelectorColores } from '@/ui/SelectorColores/SelectorColores';

// Sección «Colores» de Personalización del wallpaper (HE-02-HU05-ET01): los tres colores del tema, cada uno con
// su muestra, el selector de colores y su valor hexadecimal, y «Restablecer colores» (HE-02-HU08).

export type CampoDeColor = keyof ThemeColors;

/** Los tres colores del tema (ET02), en este orden. */
export const CAMPOS_DE_COLOR: ReadonlyArray<readonly [CampoDeColor, string]> = [
  ['primary', 'Color principal'],
  ['secondary', 'Color secundario'],
  ['text', 'Color del texto'],
];

export interface ColoresProps {
  colores: ThemeColors;
  /** Mensaje de campo de cada color (RT-04), del Núcleo. */
  mensajes: Partial<Record<CampoDeColor, string>>;
  alCambiar: (campo: CampoDeColor, valor: string) => void;
  /** La opción «Restablecer colores» (HE-02-HU08). */
  restablecer: ReactNode;
}

/** Un color: muestra, selector de colores y valor hexadecimal. */
function Color({
  nombre,
  valor,
  mensaje,
  alCambiar,
}: {
  nombre: string;
  valor: string;
  mensaje?: string;
  alCambiar: (valor: string) => void;
}) {
  // El valor que se diligencia se envía al salir del campo o con Enter (ET03, ET04).
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  return (
    <div className="wg-fila">
      <span className="wg-muestra-color" aria-hidden="true" style={{ background: valor }} />
      <SelectorColores etiqueta={nombre} valor={valor} alCambiar={alCambiar} />
      <CampoTexto
        etiqueta={nombre}
        valor={texto}
        alCambiar={setTexto}
        mensaje={mensaje}
        maxLength={7}
        onBlur={() => {
          if (texto !== valor || mensaje) alCambiar(texto);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') alCambiar(texto);
        }}
      />
    </div>
  );
}

export function Colores({ colores, mensajes, alCambiar, restablecer }: ColoresProps) {
  return (
    <>
      {CAMPOS_DE_COLOR.map(([campo, nombre]) => (
        <Color
          key={campo}
          nombre={nombre}
          // ET13: el color del tema en edición, «#RRGGBB» en mayúsculas.
          valor={colores[campo]}
          mensaje={mensajes[campo]}
          alCambiar={(valor) => alCambiar(campo, valor)}
        />
      ))}
      {restablecer}
    </>
  );
}
