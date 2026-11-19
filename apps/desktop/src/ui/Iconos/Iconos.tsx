// Íconos de estado (interfaz.md, R-12: el significado no depende solo del color). Vencida lleva el ícono de alerta
// y pendiente el de reloj (HE-10-HU05-ET13, ET17).
// DUDA: HE-10-HU05 el dibujo de los íconos no está definido. Valor usado: un triángulo de alerta y un reloj
// simples, en el color del texto (docs/DUDAS.md).

interface IconoProps {
  /** Texto para los lectores de pantalla; sin él, el ícono es decorativo. */
  nombre?: string;
}

function propiedades(nombre: string | undefined) {
  return nombre ? { role: 'img', 'aria-label': nombre } : { 'aria-hidden': true };
}

export function IconoAlerta({ nombre }: IconoProps) {
  return (
    <svg className="wg-icono" viewBox="0 0 16 16" width="1em" height="1em" {...propiedades(nombre)}>
      <path
        d="M8 1.5 15 14.5H1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 6v4M8 11.5v1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconoReloj({ nombre }: IconoProps) {
  return (
    <svg className="wg-icono" viewBox="0 0 16 16" width="1em" height="1em" {...propiedades(nombre)}>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
