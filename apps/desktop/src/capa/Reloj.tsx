import { useEffect, useState } from 'react';

// Widget Reloj de la capa (P-WAL-02, HE-04-HU03): la hora del sistema, que se actualiza cuando cambia el minuto
// (ET01). No es interactivo (HE-06-HU01-ET01).
// DUDA: HE-04-HU03 el formato de la hora no está definido. Valor usado: «HH:MM» de 24 horas, como las horas de
// los bloques horarios (D-169) (docs/DUDAS.md).

/** «08:05»: la hora y el minuto locales. */
export function horaDelReloj(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

export function Reloj() {
  const [ahora, setAhora] = useState(() => new Date());
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
      {horaDelReloj(ahora)}
    </time>
  );
}
