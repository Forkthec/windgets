import { useCallback, useEffect, useState } from 'react';
import type { ThemeSummary } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { escribirFecha } from '../tarjeta/fechas';

// P-TEM-01 Temas (Menú principal > Personalización > Temas; HE-03-HU01): la colección de temas guardados. Es la
// entrada de «Aplicar» (HE-03-HU03), «Renombrar» (HE-03-HU04) y «Eliminar» (HE-03-HU05) (ET06; D-065).

/** «dd/mm/aaaa» de la fecha local de un instante. DUDA: HE-03-HU01 el formato no está definido (docs/DUDAS.md). */
function fechaDeModificacion(instante: string): string {
  return escribirFecha(new Date(instante));
}

export function Themes() {
  const { invocar, escuchar } = useNucleo();
  const [temas, setTemas] = useState<ThemeSummary[] | null>(null);

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
                <Boton>Aplicar</Boton>
                <Boton>Renombrar</Boton>
                <Boton>Eliminar</Boton>
              </li>
            ))}
          </ul>
          {/* ET03: con solo el tema aplicado, el estado de ayuda debajo de la lista. */}
          {temas.length === 1 && (
            <p>Guarda otra personalización con “Guardar como tema” para tener más temas.</p>
          )}
        </>
      )}
    </main>
  );
}
