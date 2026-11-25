import { ETIQUETAS_MAX } from '@/reglas/limites';
import { useCallback, useEffect, useState } from 'react';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import type { Label } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { MenuDeAcciones } from '@/ui/MenuDeAcciones/MenuDeAcciones';
import { useMensajeDeResultado, useMostrarError } from '@/ui/MensajeResultado/MensajeResultado';
import './etiquetas.css';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { FormularioEtiqueta } from './FormularioEtiqueta';

// P-ETQ-01 Etiquetas (Menú principal > Planificador > Etiquetas; HE-08-HU01). «Nueva etiqueta» abre el
// Formulario de etiqueta (HE-08-HU02); «Editar» y «Eliminar» de cada etiqueta actúan con HE-08-HU03 y HU04.

export function Labels() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const mostrarError = useMostrarError();
  const [etiquetas, setEtiquetas] = useState<Label[] | null>(null);
  const [creando, setCreando] = useState(false);
  // HE-08-HU03: la etiqueta que se edita; HE-08-HU04: la que se va a eliminar con su texto de confirmación.
  const [editando, setEditando] = useState<Label | null>(null);
  const [porEliminar, setPorEliminar] = useState<{ etiqueta: Label; texto: string } | null>(null);

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

  // HE-08-HU04-CA01, CA03, CA04: el texto de la confirmación según en cuántas tarjetas está (M-10 o M-14).
  const preguntarEliminar = async (e: Label) => {
    const r = await invocar('label_get_delete_info', { id: e.id });
    if (!r.ok) {
      mostrarError(r.error);
      void leer();
      return;
    }
    const { name, card_count } = r.value;
    const plantilla =
      card_count === 0
        ? textos.CONFIRMAR_ELIMINAR_ETIQUETA
        : card_count === 1
          ? textos.CONFIRMAR_ELIMINAR_ETIQUETA_EN_UNA_TARJETA
          : textos.CONFIRMAR_ELIMINAR_ETIQUETA_EN_TARJETAS.replace('<cantidad>', String(card_count));
    setPorEliminar({ etiqueta: e, texto: plantilla.replace('<nombre de la etiqueta>', name) });
  };

  // HE-08-HU04-CA02, CA05: la elimina y la quita de las tarjetas, sin eliminarlas.
  const eliminar = async (e: Label) => {
    setPorEliminar(null);
    const r = await invocar('label_delete', { id: e.id });
    if (r.ok) mostrarResultado(r.result_message?.message ?? textos.ETIQUETA_ELIMINADA);
    else mostrarError(r.error);
    void leer();
  };

  return (
    <main className="wg-etiquetas" aria-label="Etiquetas" aria-busy={etiquetas === null}>
      {etiquetas &&
        (etiquetas.length === 0 ? (
          // ET04: en lugar de la lista, el estado vacío con «Nueva etiqueta».
          <EstadoVacio
            texto="Aún no tienes etiquetas. Crea una para clasificar tus tarjetas."
            accion={nueva}
          />
        ) : (
          <>
            {/* ET02, ET05: nombre y color de cada una, de la A a la Z, con «Editar» y «Eliminar» en su botón de
                acciones «⋮» (RT-02-ET10). */}
            <ul className="wg-lista" aria-label="Lista de etiquetas">
              {etiquetas.map((e) => (
                <li key={e.id} className="wg-fila wg-lista__elemento">
                  <span className="wg-muestra-color" style={{ background: e.color_hex }} aria-hidden="true" />
                  <span className="wg-lista__nombre">{e.name}</span>
                  <MenuDeAcciones
                    nombre={e.name}
                    opciones={[
                      { etiqueta: 'Editar', alElegir: () => setEditando(e) },
                      { etiqueta: 'Eliminar', alElegir: () => void preguntarEliminar(e) },
                    ]}
                  />
                </li>
              ))}
            </ul>
            {/* docs/rediseno.md RD-54 (Figma 84:461): «Nueva etiqueta» abajo a la izquierda, como acción principal. */}
            <div className="wg-fila wg-etiquetas__acciones">{nueva}</div>
          </>
        ))}
      {editando && (
        <FormularioEtiqueta
          etiqueta={editando}
          alCancelar={() => setEditando(null)}
          alGuardar={(_, mensaje) => {
            // HE-08-HU03-CA01: cierra el formulario y muestra «Etiqueta actualizada.» (RT-04).
            setEditando(null);
            mostrarResultado(mensaje);
            void leer();
          }}
        />
      )}
      {porEliminar && (
        // M-10 o M-14. DUDA: HE-08-HU04 las ventanas no definen título. Valor usado: «Eliminar».
        <Confirmacion
          titulo="Eliminar"
          destructiva
          texto={porEliminar.texto}
          opcionPrincipal="Confirmar"
          alConfirmar={() => void eliminar(porEliminar.etiqueta)}
          alCancelar={() => setPorEliminar(null)}
        />
      )}
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
