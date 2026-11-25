import { useId, type KeyboardEvent } from 'react';

// Control segmentado (docs/rediseno_final_prototipos.md §3.8; docs/rediseno.md RD-75): reemplaza el `<select>` nativo
// cuando hay pocas opciones (Tipo y Prioridad del Formulario de tarjeta). Es un grupo de radios: las flechas
// cambian la opción, llevan el foco a ella (docs/rediseno.md RD-99) y solo la elegida entra en el orden del tabulador.

export interface OpcionSegmentada<T extends string> {
  valor: T;
  texto: string;
  deshabilitada?: boolean;
}

export interface SegmentadoProps<T extends string> {
  etiqueta: string;
  opciones: ReadonlyArray<OpcionSegmentada<T>>;
  valor: T;
  alCambiar: (valor: T) => void;
  mensaje?: string;
  deshabilitado?: boolean;
  /** Va en la opción que recibe el foco, para llevar el cursor a ella con un error (RT-04-ET06). */
  id?: string;
}

export function Segmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  alCambiar,
  mensaje,
  deshabilitado = false,
  id,
}: SegmentadoProps<T>) {
  const idGrupo = useId();
  const habilitadas = deshabilitado ? [] : opciones.filter((o) => !o.deshabilitada);
  // La parada del tabulador es la elegida; si no se puede elegir, la primera que sí.
  const conFoco = habilitadas.find((o) => o.valor === valor) ?? habilitadas[0];
  const mover = (e: KeyboardEvent<HTMLDivElement>, paso: number) => {
    e.preventDefault();
    const i = habilitadas.findIndex((o) => o.valor === valor);
    const siguiente = habilitadas[(i + paso + habilitadas.length) % habilitadas.length];
    if (!siguiente) return;
    e.currentTarget.querySelectorAll('button')[opciones.indexOf(siguiente)]?.focus();
    alCambiar(siguiente.valor);
  };
  return (
    <div className="wg-campo">
      <span className="wg-campo__etiqueta" id={idGrupo}>
        {etiqueta}
      </span>
      <div
        className="wg-segmentado"
        role="radiogroup"
        aria-labelledby={idGrupo}
        aria-invalid={mensaje ? true : undefined}
        aria-describedby={mensaje ? `${idGrupo}-mensaje` : undefined}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') mover(e, 1);
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') mover(e, -1);
        }}
      >
        {opciones.map((o) => (
          <button
            key={o.valor}
            id={o.valor === conFoco?.valor ? id : undefined}
            type="button"
            disabled={deshabilitado || o.deshabilitada}
            role="radio"
            className="wg-segmentado__opcion"
            aria-checked={o.valor === valor}
            aria-pressed={o.valor === valor}
            tabIndex={o.valor === conFoco?.valor ? 0 : -1}
            onClick={() => alCambiar(o.valor)}
          >
            {o.texto}
          </button>
        ))}
      </div>
      {mensaje && (
        <span id={`${idGrupo}-mensaje`} className="wg-campo__mensaje">
          {mensaje}
        </span>
      )}
    </div>
  );
}
