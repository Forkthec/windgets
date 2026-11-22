import { useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, TimeFormat } from '@/types';

// Widget Reloj de la capa (P-WAL-02, HE-04-HU03): la hora del sistema, que se actualiza cuando cambia el minuto
// (ET01), con el formato de hora corta de Windows (ET02; IPC-DESK-14 `system_time_format_get`). Cuando la persona
// lo cambia en Windows, el Núcleo avisa con EV-28 `time_format_changed` y el Reloj lo refleja sin reiniciar la
// aplicación (CA04, ET03). D-214: no tiene opción propia. No es interactivo (HE-06-HU01-ET01).

/** ET02: si no se puede leer el formato de Windows, 24 horas (como el Núcleo, `formato_de_hora::por_defecto`). */
export const FORMATO_POR_DEFECTO: TimeFormat = { hour_cycle: 'h23', two_digit_hour: true };

/**
 * «15:05», «08:05» o «3:05 p. m.»: la hora y el minuto locales con el formato de Windows. `Intl` separa con
 * espacios especiales (U+00A0, U+202F); se muestran como espacios normales.
 */
export function horaDelReloj(fecha: Date, formato: TimeFormat = FORMATO_POR_DEFECTO): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: formato.two_digit_hour ? '2-digit' : 'numeric',
    minute: '2-digit',
    hourCycle: formato.hour_cycle,
  })
    .format(fecha)
    .replace(/[\u00A0\u202F]/g, ' ');
}

export interface RelojProps {
  invocar: Invoke;
  escuchar: Escuchar;
}

export function Reloj({ invocar, escuchar }: RelojProps) {
  const [ahora, setAhora] = useState(() => new Date());
  const [formato, setFormato] = useState<TimeFormat>(FORMATO_POR_DEFECTO);

  useEffect(() => {
    let vigente = true;
    void invocar('system_time_format_get', {}).then((r) => {
      if (vigente) setFormato(r.ok ? r.value : FORMATO_POR_DEFECTO);
    });
    const dejarFormato = escuchar('time_format_changed', (nuevo) => setFormato(nuevo));
    return () => {
      vigente = false;
      dejarFormato();
    };
  }, [invocar, escuchar]);

  useEffect(() => {
    // Espera al próximo cambio de minuto y desde ahí vuelve a leer la hora cada minuto.
    let intervalo: ReturnType<typeof setInterval> | undefined;
    const hastaElMinuto = 60_000 - (Date.now() % 60_000);
    const espera = setTimeout(() => {
      setAhora(new Date());
      intervalo = setInterval(() => setAhora(new Date()), 60_000);
    }, hastaElMinuto);
    return () => {
      clearTimeout(espera);
      if (intervalo) clearInterval(intervalo);
    };
  }, []);
  return (
    <time className="wg-reloj" dateTime={ahora.toISOString()}>
      {horaDelReloj(ahora, formato)}
    </time>
  );
}
