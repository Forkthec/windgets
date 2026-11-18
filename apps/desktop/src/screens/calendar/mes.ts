// El mes del calendario: nombres de los meses, días de lunes a domingo y semanas del mes. Lo usan la pantalla
// Calendario (HE-10-HU01-ET02) y el widget Calendario de la capa (HE-06-HU07).

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Los días de la semana, de lunes a domingo. */
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** «Noviembre 2026». `mes` va de 0 (enero) a 11. */
export function nombreDelMes(anio: number, mes: number): string {
  return `${MESES[mes]} ${anio}`;
}

/** Las semanas del mes, de lunes a domingo; `null` en los días que no son del mes. `mes` va de 0 a 11. */
export function semanasDelMes(anio: number, mes: number): (number | null)[][] {
  // getDay(): 0 es domingo; con lunes primero, el domingo va en la posición 6.
  const hueco = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const dias = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(hueco).fill(null),
    ...Array.from({ length: dias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}
