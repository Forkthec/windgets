import { useCallback, useEffect, useState } from 'react';
import type { ThemeSummary } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { MenuDeAcciones } from '@/ui/MenuDeAcciones/MenuDeAcciones';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { escribirFecha } from '../tarjeta/fechas';
import { RenombrarTema } from './RenombrarTema';

// P-TEM-01 Temas (Menú principal > Personalización > Temas; HE-03-HU01): la colección de temas guardados. Es la
// entrada de «Aplicar» (HE-03-HU03), «Renombrar» (HE-03-HU04) y «Eliminar» (HE-03-HU05) (ET06; D-065).

/** «dd/mm/aaaa» de la fecha local de un instante. DUDA: HE-03-HU01 el formato no está definido (docs/DUDAS.md). */
function fechaDeModificacion(instante: string): string {
  return escribirFecha(new Date(instante));
}

export function Themes() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [temas, setTemas] = useState<ThemeSummary[] | null>(null);
  // HE-03-HU03: el tema que se va a aplicar (M-05) y el aviso de cambios sin guardar en la vista previa (M-15).
  const [porAplicar, setPorAplicar] = useState<ThemeSummary | null>(null);
  const [sinGuardar, setSinGuardar] = useState<{ tema: ThemeSummary; mensaje: string } | null>(null);
  // HE-03-HU04: el tema que se está renombrando.
  const [porRenombrar, setPorRenombrar] = useState<ThemeSummary | null>(null);
  // HE-03-HU05: el tema que se va a eliminar (M-06).
  const [porEliminar, setPorEliminar] = useState<ThemeSummary | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('theme_list', {});
    if (r.ok) setTemas(r.value);
  }, [invocar]);

  useEffect(() => {
    void leer();
    // EV-10 al guardar, crear, renombrar o eliminar temas; EV-11 al aplicar uno.
    const dejarTemas = escuchar('themes_changed', () => void leer());
    const dejarAplicado = escuchar('applied_theme_changed', () => void leer());
    return () => {
      dejarTemas();
      dejarAplicado();
    };
  }, [escuchar, leer]);

  // HE-03-HU03-CA01, CA04: aplica la última versión guardada del tema; con cambios sin guardar en la vista
  // previa, el Núcleo pide M-15 (CA05, ET08).
  const aplicar = async (tema: ThemeSummary, descartar = false) => {
    setPorAplicar(null);
    setSinGuardar(null);
    const r = await invocar('theme_apply', {
      theme_id: tema.id,
      ...(descartar ? { discard_draft: true } : {}),
    });
    if (r.ok) {
      mostrarResultado(r.result_message?.message ?? '');
      void leer();
    } else if (r.error.code === 'draft.unsaved_changes') {
      setSinGuardar({ tema, mensaje: r.error.message });
    } else if (r.error.message) {
      mostrarResultado(r.error.message);
    }
  };

  // HE-03-HU05-CA01: elimina el tema; el escritorio no cambia (ET02).
  const eliminar = async (tema: ThemeSummary) => {
    setPorEliminar(null);
    const r = await invocar('theme_delete', { theme_id: tema.id });
    if (r.ok) {
      mostrarResultado(r.result_message?.message ?? '');
      void leer();
    } else if (r.error.message) {
      mostrarResultado(r.error.message);
    }
  };

  // M-15 «Guardar y aplicar»: guarda los cambios de la vista previa en el tema en edición y aplica el tema.
  const guardarYAplicar = async (tema: ThemeSummary) => {
    const r = await invocar('theme_draft_save', {});
    if (r.ok) await aplicar(tema);
    else if (r.error.message) mostrarResultado(r.error.message);
  };

  return (
    <main aria-label="Temas" aria-busy={temas === null}>
      {temas && (
        <>
          {/* ET01, ET02: del más reciente al más antiguo, como los ordena el Núcleo. */}
          <ul className="wg-lista" aria-label="Lista de temas">
            {temas.map((t) => (
              <li key={t.id} className="wg-fila wg-lista__elemento">
                <span className="wg-lista__nombre">{t.name}</span>
                <span>{fechaDeModificacion(t.last_modified_at)}</span>
                {t.is_applied && <span className="wg-indicador">Aplicado</span>}
                {/* ET05: cambios guardados que aún no se ven en el escritorio ni en la aplicación. */}
                {t.is_applied && t.has_unapplied_changes && (
                  <span className="wg-indicador">Cambios sin aplicar</span>
                )}
                {/* ET07: cambios aplicados que no se guardaron en el tema. */}
                {t.is_applied && t.has_unsaved_changes && (
                  <span className="wg-indicador">Cambios sin guardar</span>
                )}
                {/* HE-03-HU03-ET05: deshabilitada en el tema aplicado, salvo con cambios sin aplicar. */}
                <Boton
                  disabled={t.is_applied && !t.has_unapplied_changes}
                  motivo={textos.TEMA_YA_APLICADO}
                  onClick={() => setPorAplicar(t)}
                >
                  Aplicar
                </Boton>
                {/* ET01 (RT-02-ET10): «Renombrar» y «Eliminar» en el botón de acciones «⋮» del tema. «Eliminar»
                    está deshabilitada en el tema aplicado, con su texto al pasar el mouse (HE-03-HU05-ET04, D-037). */}
                <MenuDeAcciones
                  nombre={t.name}
                  opciones={[
                    { etiqueta: 'Renombrar', alElegir: () => setPorRenombrar(t) },
                    {
                      etiqueta: 'Eliminar',
                      deshabilitada: t.is_applied,
                      motivo: textos.TEMA_APLICADO_NO_SE_ELIMINA,
                      alElegir: () => setPorEliminar(t),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
          {/* ET03: con solo el tema aplicado, el estado de ayuda debajo de la lista. */}
          {temas.length === 1 && (
            <p>Guarda otra personalización con “Guardar como tema” para tener más temas.</p>
          )}
        </>
      )}
      {porAplicar && (
        // M-05 (HE-03-HU03-CA01, CA02, CA06; ET01). DUDA: HE-03-HU03 M-05 no define el título. Valor usado:
        // «Aplicar».
        <Confirmacion
          titulo="Aplicar"
          texto={textos.CONFIRMAR_APLICAR_TEMA.replace('<nombre del tema>', porAplicar.name)}
          opcionPrincipal="Aplicar"
          alConfirmar={() => void aplicar(porAplicar)}
          alCancelar={() => setPorAplicar(null)}
        />
      )}
      {porRenombrar && (
        <RenombrarTema
          tema={porRenombrar}
          alGuardar={(mensaje) => {
            setPorRenombrar(null);
            mostrarResultado(mensaje);
            void leer();
          }}
          alCancelar={() => setPorRenombrar(null)}
        />
      )}
      {porEliminar && (
        // M-06 (HE-03-HU05-ET01). DUDA: HE-03-HU05 M-06 no define el título. Valor usado: «Eliminar».
        <Confirmacion
          titulo="Eliminar"
          texto={textos.CONFIRMAR_ELIMINAR_TEMA.replace('<nombre del tema>', porEliminar.name)}
          opcionPrincipal="Eliminar"
          alConfirmar={() => void eliminar(porEliminar)}
          alCancelar={() => setPorEliminar(null)}
        />
      )}
      {sinGuardar && (
        // M-15 (HE-03-HU03-CA05, ET08), igual que al aplicar la vista previa (HE-02-HU12-CA02).
        <Confirmacion
          titulo="Aplicar"
          texto={sinGuardar.mensaje}
          opcionPrincipal="Guardar y aplicar"
          opcionSecundaria="Aplicar sin guardar"
          alConfirmar={() => void guardarYAplicar(sinGuardar.tema)}
          alElegirSecundaria={() => void aplicar(sinGuardar.tema, true)}
          alCancelar={() => setSinGuardar(null)}
        />
      )}
    </main>
  );
}
