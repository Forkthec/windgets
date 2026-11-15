import { useId } from 'react';

export interface ColorDelCatalogo {
  id: string;
  name: string;
  hex: string;
}

export interface CatalogoColoresProps {
  /** Id del primer color: el cursor va ahí cuando el campo tiene un mensaje (RT-04). */
  id?: string;
  etiqueta: string;
  colores: ColorDelCatalogo[];
  /** Id del color elegido; vacío si no hay ninguno (sin valor por defecto, D-162). */
  valor: string;
  alCambiar: (id: string) => void;
  mensaje?: string;
}

/**
 * Selector del catálogo de colores (opciones con nombre, HE-08-HU02-ET05). Cada opción muestra la muestra del
 * color y su nombre: el significado no depende solo del color (interfaz.md). A diferencia de `SelectorColores`
 * (hexadecimal libre para los temas), solo deja elegir colores del catálogo.
 */
export function CatalogoColores({ id, etiqueta, colores, valor, alCambiar, mensaje }: CatalogoColoresProps) {
  const nombre = useId();
  const idMensaje = `${nombre}-mensaje`;
  return (
    <div
      className="wg-campo"
      role="radiogroup"
      aria-label={etiqueta}
      aria-invalid={mensaje ? true : undefined}
      aria-describedby={mensaje ? idMensaje : undefined}
    >
      <span className="wg-campo__etiqueta">{etiqueta}</span>
      <span className="wg-fila wg-catalogo-colores">
        {colores.map((c, i) => {
          const idOpcion = i === 0 && id ? id : `${nombre}-${c.id}`;
          return (
            <span key={c.id} className="wg-fila">
              <input
                id={idOpcion}
                type="radio"
                name={nombre}
                value={c.id}
                checked={valor === c.id}
                onChange={() => alCambiar(c.id)}
              />
              <label htmlFor={idOpcion} className="wg-fila">
                <span className="wg-muestra-color" style={{ background: c.hex }} aria-hidden="true" />
                {c.name}
              </label>
            </span>
          );
        })}
      </span>
      {mensaje && (
        <span id={idMensaje} className="wg-campo__mensaje">
          {mensaje}
        </span>
      )}
    </div>
  );
}
