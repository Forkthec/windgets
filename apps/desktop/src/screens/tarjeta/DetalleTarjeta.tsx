import { useEffect, useState } from 'react';
import type { CardDetail } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from './fechas';
import { NOMBRE_DE_PRIORIDAD, NOMBRE_DE_TIPO } from './nombres';

// P-TAR-01 Detalle de tarjeta (HE-07-HU03): ventana emergente sobre la pantalla actual (ET01, RT-02).

export interface DetalleTarjetaProps {
  id: string;
  /** «Cerrar» (o Esc): vuelve a la pantalla desde la que se abrió (CA04, ET08). */
  alCerrar: () => void;
  /** La tarjeta ya no existe (DP-04): la pantalla cierra el detalle y muestra el mensaje. */
  alNoExistir: (mensaje: string) => void;
  /** «Editar» (HE-07-HU04). */
  alEditar?: (detalle: CardDetail) => void;
  /** «Eliminar» (HE-07-HU05). */
  alEliminar?: (detalle: CardDetail) => void;
}

/** Un dato del detalle: su nombre y su valor. */
function Dato({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    // docs/rediseno.md RD-50 (Figma 84:514): cada dato en una fila «Tipo · Tarea».
    <div className="wg-detalle__fila">
      <dt className="wg-campo__etiqueta">{nombre}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function DetalleTarjeta({ id, alCerrar, alNoExistir, alEditar, alEliminar }: DetalleTarjetaProps) {
  const { invocar } = useNucleo();
  const [detalle, setDetalle] = useState<CardDetail | null>(null);

  useEffect(() => {
    let vigente = true;
    void invocar('card_get', { id }).then((r) => {
      if (!vigente) return;
      if (r.ok) setDetalle(r.value);
      // DP-04: «Esta tarjeta ya no existe.»; cualquier otro error también cierra el detalle con su mensaje, para
      // que no quede una ventana vacía sin explicación.
      else alNoExistir(r.error.message);
    });
    return () => {
      vigente = false;
    };
  }, [alNoExistir, id, invocar]);

  return (
    <VentanaEmergente
      titulo="Detalle de tarjeta"
      alSalir={alCerrar}
      acciones={
        // ET04
        <>
          {/* RD-50 (84:514): «Editar» es la acción principal, primero; «Cerrar» va al final. */}
          <Boton principal disabled={!detalle} onClick={() => detalle && alEditar?.(detalle)}>
            Editar
          </Boton>
          <Boton disabled={!detalle} onClick={() => detalle && alEliminar?.(detalle)}>
            Eliminar
          </Boton>
          <Boton onClick={alCerrar}>Cerrar</Boton>
        </>
      }
    >
      {detalle && (
        // ET03: tipo, título, fecha límite, descripción, prioridad, etiquetas con su color, columna y bloque
        // horario si lo tiene. ET05: «Sin descripción», «Sin prioridad» y «Sin etiquetas».
        <dl className="wg-detalle">
          <Dato nombre="Tipo">{NOMBRE_DE_TIPO[detalle.type]}</Dato>
          <Dato nombre="Título">{detalle.title}</Dato>
          <Dato nombre="Fecha límite">
            <span className="wg-fila">
              <span>{fechaVisible(detalle.due_date)}</span>
              {/* ET06, ET07 */}
              {detalle.is_overdue && <span className="wg-indicador">Vencida</span>}
            </span>
          </Dato>
          <Dato nombre="Descripción">{detalle.description ?? 'Sin descripción'}</Dato>
          <Dato nombre="Prioridad">
            {detalle.priority ? NOMBRE_DE_PRIORIDAD[detalle.priority] : 'Sin prioridad'}
          </Dato>
          <Dato nombre="Etiquetas">
            {detalle.labels.length === 0 ? (
              'Sin etiquetas'
            ) : (
              <ul className="wg-fila wg-lista-en-linea">
                {detalle.labels.map((e) => (
                  <li key={e.id} className="wg-fila">
                    <span
                      className="wg-muestra-color"
                      style={{ background: e.color_hex }}
                      aria-hidden="true"
                    />
                    <span>{e.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Dato>
          <Dato nombre="Columna">
            <span className="wg-fila">
              <span
                className="wg-muestra-color"
                style={{ background: detalle.column.color_hex }}
                aria-hidden="true"
              />
              <span>{detalle.column.name}</span>
            </span>
          </Dato>
          {detalle.time_block && (
            <Dato nombre="Bloque horario">
              {`${fechaVisible(detalle.time_block.date)} ${detalle.time_block.label}`}
            </Dato>
          )}
        </dl>
      )}
    </VentanaEmergente>
  );
}
