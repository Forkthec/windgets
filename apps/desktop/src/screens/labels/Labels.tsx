import { useCallback, useEffect, useState } from 'react';
import type { Label } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { FormularioEtiqueta } from './FormularioEtiqueta';

// P-ETQ-01 Etiquetas (Menú principal > Planificador > Etiquetas; HE-08-HU01). «Nueva etiqueta» abre el
// Formulario de etiqueta (HE-08-HU02); «Editar» y «Eliminar» de cada etiqueta actúan con HE-08-HU03 y HU04.

/** Máximo de etiquetas por usuario (HE-08-HU02-ET06). */
const ETIQUETAS_MAX = 20;

export function Labels() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [etiquetas, setEtiquetas] = useState<Label[] | null>(null);
  const [creando, setCreando] = useState(false);

  const leer = useCallback(async () => {
    const r = await invocar('label_list', {});
    if (r.ok) setEtiquetas(r.value);
  }, [invocar]);

  useEffect(() => {
    void leer();
    return escuchar('labels_changed', () => void leer());
  }, [escuchar, leer]);

  // HE-08-HU01-ET03; HE-08-HU02-ET07: con 20 etiquetas, deshabilitada con su texto (RT-04).
  const enElMaximo = (etiquetas?.length ?? 0) >= ETIQUETAS_MAX;
  const nueva = (
    <Boton
      principal
      disabled={enElMaximo}
      motivo={enElMaximo ? textos.MAXIMO_DE_ETIQUETAS_CREADAS : undefined}
      onClick={() => setCreando(true)}
    >
      Nueva etiqueta
    </Boton>
  );

  return (
    <main aria-label="Etiquetas" aria-busy={etiquetas === null}>
      {etiquetas &&
        (etiquetas.length === 0 ? (
          // ET04: en lugar de la lista, el estado vacío con «Nueva etiqueta».
          <EstadoVacio
            texto="Aún no tienes etiquetas. Crea una para clasificar tus tarjetas."
            accion={nueva}
          />
        ) : (
          <>
            <div className="wg-fila">{nueva}</div>
            {/* ET02, ET05: nombre y color de cada una, de la A a la Z, con «Editar» y «Eliminar». */}
            <ul className="wg-lista" aria-label="Lista de etiquetas">
              {etiquetas.map((e) => (
                <li key={e.id} className="wg-fila wg-lista__elemento">
                  <span className="wg-muestra-color" style={{ background: e.color_hex }} aria-hidden="true" />
                  <span className="wg-lista__nombre">{e.name}</span>
                  <Boton>Editar</Boton>
                  <Boton>Eliminar</Boton>
                </li>
              ))}
            </ul>
          </>
        ))}
      {creando && (
        <FormularioEtiqueta
          alCancelar={() => setCreando(false)}
          alGuardar={(_, mensaje) => {
            // HE-08-HU02-CA01: cierra el formulario, muestra la etiqueta en la lista y el mensaje (RT-04).
            setCreando(false);
            mostrarResultado(mensaje);
            void leer();
          }}
        />
      )}
    </main>
  );
}
