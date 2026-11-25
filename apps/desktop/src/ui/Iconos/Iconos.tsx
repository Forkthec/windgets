// Íconos de estado (interfaz.md, R-12: el significado no depende solo del color). Vencida lleva el ícono de alerta
// y pendiente el de reloj (HE-10-HU05-ET13, ET17).
// DUDA: HE-10-HU05 el dibujo de los íconos no está definido. Valor usado: un triángulo de alerta y un reloj
// simples, en el color del texto (docs/DUDAS.md).
// Íconos de acciones (docs/rediseno.md RD-101, IM-03), para los botones de solo ícono: 18 × 18 con trazo de 1,44 px,
// como los del menú principal, en el color del texto. Dentro de `Boton variante="icono"` se ven de 20 px
// (tokens.css).
// DUDA: P44 el dibujo de los íconos de acciones no está definido. Valor usado: trazos simples (docs/DUDAS.md).

import { TRAZO_DEL_MENU } from '../MenuPrincipal/IconosDelMenu';

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

function IconoDeTrazo({ trazo, nombre }: IconoProps & { trazo: string }) {
  return (
    <svg className="wg-icono" viewBox="0 0 18 18" width="1em" height="1em" {...propiedades(nombre)}>
      <path
        d={trazo}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.44"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconoMas(props: IconoProps) {
  return <IconoDeTrazo trazo="M9 3.6V14.4M3.6 9H14.4" {...props} />;
}

/** «×»: solo cierra o quita algo de una selección; eliminar es la papelera (IM-03). */
export function IconoCerrar(props: IconoProps) {
  return <IconoDeTrazo trazo="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" {...props} />;
}

/** «←» */
export function IconoRegresar(props: IconoProps) {
  return <IconoDeTrazo trazo="M15.3 9H2.7M7.2 4.5L2.7 9L7.2 13.5" {...props} />;
}

export function IconoLupa(props: IconoProps) {
  return (
    <IconoDeTrazo
      trazo="M2.25 7.65a5.4 5.4 0 1 0 10.8 0a5.4 5.4 0 1 0 -10.8 0M11.5 11.5L15.75 15.75"
      {...props}
    />
  );
}

export function IconoPapelera(props: IconoProps) {
  return (
    <IconoDeTrazo
      trazo="M2.7 4.5H15.3M6.75 4.5V2.7H11.25V4.5M4.5 4.5L5.4 15.3H12.6L13.5 4.5M7.2 7.2V12.6M10.8 7.2V12.6"
      {...props}
    />
  );
}

export function IconoLapiz(props: IconoProps) {
  return <IconoDeTrazo trazo="M2.7 15.3L3.6 11.7L12.6 2.7L15.3 5.4L6.3 14.4ZM10.8 4.5L13.5 7.2" {...props} />;
}

/** «⋯»: tres puntos en horizontal. */
export function IconoOpciones({ nombre }: IconoProps) {
  return (
    <svg className="wg-icono" viewBox="0 0 18 18" width="1em" height="1em" {...propiedades(nombre)}>
      {[3.6, 9, 14.4].map((x) => (
        <circle key={x} cx={x} cy="9" r="1.35" fill="currentColor" />
      ))}
    </svg>
  );
}

export function IconoCarpeta(props: IconoProps) {
  return <IconoDeTrazo trazo="M1.8 3.6H7.2L9 5.4H16.2V14.4H1.8Z" {...props} />;
}

/** El engranaje de «Configurar». */
export function IconoEngranaje(props: IconoProps) {
  return (
    <IconoDeTrazo
      trazo="M7.69 3.76L7.87 1.89H10.13L10.31 3.76L11.78 4.37L13.23 3.18L14.82 4.77L13.63 6.22L14.24 7.69L16.11 7.87V10.13L14.24 10.31L13.63 11.78L14.82 13.23L13.23 14.82L11.78 13.63L10.31 14.24L10.13 16.11H7.87L7.69 14.24L6.22 13.63L4.77 14.82L3.18 13.23L4.37 11.78L3.76 10.31L1.89 10.13V7.87L3.76 7.69L4.37 6.22L3.18 4.77L4.77 3.18L6.22 4.37ZM6.75 9a2.25 2.25 0 1 0 4.5 0a2.25 2.25 0 1 0 -4.5 0"
      {...props}
    />
  );
}

/** Flechas en las cuatro direcciones, para «Organizar widgets». */
export function IconoOrganizar(props: IconoProps) {
  return (
    <IconoDeTrazo
      trazo="M9 1.8V16.2M1.8 9H16.2M6.75 4.05L9 1.8L11.25 4.05M6.75 13.95L9 16.2L11.25 13.95M4.05 6.75L1.8 9L4.05 11.25M13.95 6.75L16.2 9L13.95 11.25"
      {...props}
    />
  );
}

/** Avión de papel (`rediseno_final_prototipos.md` §3.6). */
export function IconoEnviar(props: IconoProps) {
  return <IconoDeTrazo trazo="M16.2 1.8L1.8 7.2L7.65 10.35L10.8 16.2ZM16.2 1.8L7.65 10.35" {...props} />;
}

/** El mismo dibujo de «Reportes» en el menú principal (Figma 85:317). */
export function IconoReportes(props: IconoProps) {
  return <IconoDeTrazo trazo={TRAZO_DEL_MENU.reports} {...props} />;
}
