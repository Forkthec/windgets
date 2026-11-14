import type { ReactNode } from 'react';
import isotipo from './isotipo.png';

// Disposición de las pantallas de cuenta según los mockups del equipo (figuras 1 a 3): el isotipo centrado
// arriba y el contenido en una tarjeta centrada. Colores, tipografía y radios salen de los tokens de ui/tema.
// El isotipo usa los colores fijos de la marca (interfaz.md, «Colores de marca fijos»).
export function MarcoDeCuenta({ nombre, children }: { nombre: string; children: ReactNode }) {
  return (
    <main aria-label={nombre} className="wg-cuenta">
      <img className="wg-cuenta__isotipo" src={isotipo} alt="" />
      <div className="wg-cuenta__tarjeta">{children}</div>
    </main>
  );
}
