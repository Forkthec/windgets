import { useId, type KeyboardEvent } from 'react';

// Control segmentado (docs/rediseno_final_prototipos.md §3.8; docs/rediseno.md RD-75): reemplaza el `<select>` nativo
// cuando hay pocas opciones (Tipo y Prioridad del Formulario de tarjeta). Es un grupo de radios: las flechas
// cambian la opción y solo la elegida entra en el orden del tabulador.

export interface OpcionSegmentada<T extends string> {
  valor: T;
  texto: string;
}

export interface SegmentadoProps<T extends string> {
  etiqueta: string;
  opciones: ReadonlyArray<OpcionSegmentada<T>>;
  valor: T;
  alCambiar: (valor: T) => void;
}

export function Segmentado<T extends string>({ etiqueta, opciones, valor, alCambiar }: SegmentadoProps<T>) {
  const id = useId();
  const mover = (e: KeyboardEvent, paso: number) => {
    e.preventDefault();
    const i = opciones.findIndex((o) => o.valor === valor);
    const siguiente = opciones[(i + paso + opciones.length) % opciones.length];
    if (siguiente) alCambiar(siguiente.valor);
  };
  return (
    <div className="wg-campo">
      <span className="wg-campo__etiqueta" id={id}>
        {etiqueta}
      </span>
      <div
        className="wg-segmentado"
        role="radiogroup"
        aria-labelledby={id}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') mover(e, 1);
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') mover(e, -1);
        }}
      >
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="radio"
            className="wg-segmentado__opcion"
            aria-checked={o.valor === valor}
            aria-pressed={o.valor === valor}
            tabIndex={o.valor === valor ? 0 : -1}
            onClick={() => alCambiar(o.valor)}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
