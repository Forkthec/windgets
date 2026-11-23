// Fechas de los formularios del planificador: la vista muestra DD/MM/AAAA (HE-07-HU01-ET09) y el Núcleo
// recibe `DateIso` (AAAA-MM-DD, contratos.md). La fecha actual es la del computador (ET08).

/** Fecha DD/MM/AAAA que existe en el calendario, o `undefined`. */
export function leerFecha(texto: string): Date | undefined {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) return undefined;
  const [dia, mes, anio] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(anio, mes - 1, dia);
  const existe = fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  return existe ? fecha : undefined;
}

const dosCifras = (n: number) => String(n).padStart(2, '0');

/** DD/MM/AAAA (ET27: el selector de fecha muestra la fecha elegida con ese formato). */
export function escribirFecha(fecha: Date): string {
  return `${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/** AAAA-MM-DD para el Núcleo. */
export function fechaIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
}

/** Hoy a las 00:00 del computador. */
export function hoy(): Date {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

/** «AAAA-MM-DD» (DateIso) como DD/MM/AAAA. */
export function fechaVisible(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return anio && mes && dia ? escribirFecha(new Date(anio, mes - 1, dia)) : iso;
}

/**
 * docs/rediseno.md RD-40 (Figma 81:22 «Domingo, 22 de noviembre»): el día de la semana con mayúscula inicial, el día
 * y el mes. Solo en el Planificador diario.
 */
export function fechaLarga(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return iso;
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
