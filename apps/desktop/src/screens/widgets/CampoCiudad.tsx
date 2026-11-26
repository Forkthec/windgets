import { CIUDAD_MAX } from '@/reglas/limites';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { GeocodeResult, Invoke } from '@/types';
import textos from '@/types/messages.es.json';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { textoDelError } from '@/ipc/textoDelError';

// Campo Ciudad con sugerencias (HE-04-HU05-ET18, HE-04-HU12; P29). Desde 2 caracteres y tras una pausa de 400 ms
// pide al Núcleo hasta 5 lugares (IPC-WID-08 `weather_city_search`) y los muestra debajo del campo como
// «Popayán, Cauca, Colombia». La persona elige uno con el mouse o con las flechas y Enter; «Agregar» y «Guardar» se
// habilitan solo con un lugar elegido. Es un combobox de ARIA: el foco se queda en el campo y la opción activa se
// anuncia con `aria-activedescendant`.

/** ET18: las sugerencias empiezan con 2 caracteres, tras 400 ms sin escribir. */
export const BUSQUEDA_MINIMA = 2;
export const PAUSA_MS = 400;

/** «Popayán, Cauca, Colombia»: el nombre, la región si la hay y el país. */
export function nombreDelLugar(lugar: GeocodeResult): string {
  return [lugar.name, lugar.admin1, lugar.country].filter(Boolean).join(', ');
}

export interface CampoCiudadProps {
  invocar: Invoke;
  valor: string;
  alCambiar: (valor: string) => void;
  /** El lugar elegido, o `null` si la persona escribió después de elegir. */
  elegido: GeocodeResult | null;
  alElegir: (lugar: GeocodeResult | null) => void;
  /** Mensaje del Núcleo al agregar o guardar (CA04, CA05). */
  mensaje?: string;
}

export function CampoCiudad({ invocar, valor, alCambiar, elegido, alElegir, mensaje }: CampoCiudadProps) {
  const idLista = useId();
  const [lugares, setLugares] = useState<GeocodeResult[]>([]);
  const [abierta, setAbierta] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [aviso, setAviso] = useState('');
  const consulta = useRef(0);

  const largo = [...valor.trim()].length;
  useEffect(() => {
    // Mientras haya un lugar elegido no se busca: el texto es su nombre.
    if (elegido) return;
    if (largo > CIUDAD_MAX) {
      setAviso(textos.CIUDAD_MUY_LARGA);
      setAbierta(false);
      return;
    }
    setAviso('');
    if (largo < BUSQUEDA_MINIMA) {
      setLugares([]);
      setAbierta(false);
      return;
    }
    const numero = ++consulta.current;
    const espera = setTimeout(() => {
      void invocar('weather_city_search', { query: valor.trim() }).then((r) => {
        // Solo la última consulta pinta: una respuesta vieja no reemplaza las sugerencias de lo escrito ahora.
        if (numero !== consulta.current) return;
        if (!r.ok) {
          // Sin conexión o con el servicio caído: el mensaje claro va en el campo (RT-04).
          setLugares([]);
          setAbierta(false);
          setAviso(textoDelError(r.error));
          return;
        }
        setLugares(r.value);
        setActiva(r.value.length > 0 ? 0 : -1);
        setAbierta(r.value.length > 0);
        // CA04: sin coincidencias, el mismo mensaje que al agregar una ciudad que no existe.
        setAviso(r.value.length === 0 ? textos.CIUDAD_NO_ENCONTRADA : '');
      });
    }, PAUSA_MS);
    return () => clearTimeout(espera);
  }, [elegido, invocar, largo, valor]);

  const elegir = (lugar: GeocodeResult) => {
    alElegir(lugar);
    alCambiar(nombreDelLugar(lugar));
    setAbierta(false);
    setAviso('');
  };

  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!abierta || lugares.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiva((i) => (i + 1) % lugares.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiva((i) => (i <= 0 ? lugares.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activa >= 0) {
      // Enter elige la sugerencia activa y no envía el formulario.
      e.preventDefault();
      const lugar = lugares[activa];
      if (lugar) elegir(lugar);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAbierta(false);
    }
  };

  const idOpcion = (i: number) => `${idLista}-${i}`;
  return (
    <div className="wg-ciudad">
      <CampoTexto
        etiqueta="Ciudad"
        valor={valor}
        alCambiar={(v) => {
          alElegir(null);
          alCambiar(v);
        }}
        mensaje={mensaje || aviso || undefined}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={abierta}
        aria-controls={idLista}
        aria-activedescendant={abierta && activa >= 0 ? idOpcion(activa) : undefined}
        onKeyDown={alTeclear}
      />
      {abierta && (
        <ul id={idLista} role="listbox" aria-label="Sugerencias de ciudad" className="wg-ciudad__lista">
          {lugares.map((lugar, i) => (
            <li
              key={lugar.geo_id}
              id={idOpcion(i)}
              role="option"
              aria-selected={i === activa}
              className="wg-ciudad__opcion"
              // mousedown: elige antes de que el campo pierda el foco.
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(lugar);
              }}
            >
              {nombreDelLugar(lugar)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
