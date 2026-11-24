import { useCallback, useEffect, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import textos from '@/types/messages.es.json';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { Interruptor } from '@/ui/Interruptor/Interruptor';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { CerrarSesion } from './CerrarSesion';
import './configuracion.css';

// P-CFG-01 Configuración (Menú principal > Configuración).
// - HE-16-HU02 (inicio automático): el interruptor muestra siempre el estado que tiene Windows (ET06) y al
//   alternarlo muestra el resultado o el aviso de CA05.
// - HE-16-HU03 (cerrar sesión): el botón «Cerrar sesión» abre M-11 o, con cambios sin sincronizar, M-12 (ET01, ET02,
//   ET05).
// - HE-16-HU01 (indicador de sincronización): es el de la ventana principal, junto al menú (D-203).

export function Settings() {
  const { invocar } = useNucleo();
  const mostrar = useMensajeDeResultado();
  const [inicio, setInicio] = useState<boolean | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // IPC-DESK-10: el estado real de Windows, al abrir la pantalla (CA03).
  const leerInicio = useCallback(async () => {
    const r = await invocar('autostart_get', {});
    if (r.ok) setInicio(r.value.enabled);
  }, [invocar]);
  // Al volver a la ventana se lee de nuevo: la persona pudo cambiarlo en las aplicaciones de arranque de Windows.
  useEffect(() => {
    void leerInicio();
    const alVolver = () => void leerInicio();
    window.addEventListener('focus', alVolver);
    return () => window.removeEventListener('focus', alVolver);
  }, [leerInicio]);

  // IPC-DESK-11: guarda la preferencia en Windows (ET03). Con `autostart.failed` el interruptor vuelve al estado que
  // tiene Windows y se ve el aviso (CA05, ET09).
  const alternarInicio = useCallback(
    async (enabled: boolean) => {
      const r = await invocar('autostart_set', { enabled });
      if (r.ok) {
        setAviso(null);
        setInicio(r.value.enabled);
        if (r.result_message) mostrar(r.result_message.message);
        return;
      }
      setAviso(r.error.message || textos.NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO);
      await leerInicio();
    },
    [invocar, leerInicio, mostrar],
  );
  const cambiarInicio = useEnvioUnico(alternarInicio);

  return (
    <main aria-label="Configuración" aria-busy={inicio === null} className="wg-configuracion">
      {aviso && <Aviso texto={aviso} />}
      {/* ET01 (HE-16-HU02): el interruptor «Inicio automático». docs/rediseno.md RD-41 (Figma 81:200, 81:201): el
          nombre a la izquierda y el interruptor a la derecha. */}
      <div className="wg-configuracion__fila wg-configuracion__inicio">
        {inicio !== null && (
          <Interruptor
            etiqueta="Inicio automático"
            activo={inicio}
            deshabilitado={cambiarInicio.enCurso}
            alCambiar={(activo) => void cambiarInicio.ejecutar(activo)}
          />
        )}
      </div>
      <hr className="wg-configuracion__divisor" />
      {/* RD-41 (81:204, 81:205): la sección «Sesión» con «Cerrar sesión» a la derecha. */}
      <section className="wg-configuracion__fila" aria-labelledby="wg-configuracion-sesion">
        <h2 id="wg-configuracion-sesion" className="wg-configuracion__nombre">
          Sesión
        </h2>
        <CerrarSesion
          alFallar={setAviso}
          disparador={(abrir, enCurso) => (
            <Boton disabled={enCurso} onClick={abrir}>
              Cerrar sesión
            </Boton>
          )}
        />
      </section>
    </main>
  );
}
