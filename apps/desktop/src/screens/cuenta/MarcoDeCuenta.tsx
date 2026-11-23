import type { ReactNode } from 'react';
import simbolo from './activos/simbolo.svg';
import windiRegistro from './activos/windi-registro.svg';
import windiSaludo from './activos/windi-saludo.svg';
import { IndicadorDePasos } from './IndicadorDePasos';
import { SelectorDeModo } from './SelectorDeModo';

// Pantallas de cuenta del rediseño (docs/rediseno.md RD-04 a RD-09; Figma «Nota de Windi · Inicio de sesión» y
// «Saludo junto a la nota · Registro»): cabecera con el logo y el selector «Apariencia», Windi con su globo a la
// izquierda y el formulario como una nota a la derecha. Por debajo de 1000 px de ancho Windi se oculta (RD-07).
// Sin `windi`, la nota va centrada debajo del logo centrado (RD-16, Figma «Verificar correo», «Recuperar
// contraseña»): el paso pone su miga de pan, su título y su subtítulo (PasoCentrado).
// Los colores salen de `.wg-cuenta-raiz[data-modo]` (cuenta.css), no del tema.

export interface SaludoDeWindi {
  /** Las dos líneas del globo (RD-08). */
  lineas: readonly [string, string];
  /** «saludo» (Inicio de sesión y Recuperar contraseña) o «registro» (Registro, con el guiño). */
  pose?: 'saludo' | 'registro';
}

export interface MarcoDeCuentaProps {
  /** Nombre accesible de la pantalla (`main`). */
  nombre: string;
  titulo?: string;
  subtitulo?: ReactNode;
  windi?: SaludoDeWindi;
  /** Indicador de pasos (RD-09): la lista y el índice del paso actual. */
  pasos?: { lista: readonly string[]; actual: number };
  children: ReactNode;
}

function EsquinaDoblada() {
  // Trazos del Figma («Esquina doblada»); los colores van por CSS según el modo.
  return (
    <svg
      className="wg-nota__esquina"
      width="38"
      height="38"
      viewBox="0 0 38 38"
      fill="none"
      aria-hidden="true"
    >
      <path className="wg-nota__esquina-fondo" d="M1 1H37V37L1 1Z" />
      <path className="wg-nota__esquina-pliegue" d="M1 1V36H36L1 1Z" strokeLinejoin="round" />
    </svg>
  );
}

function PuntaDelGlobo() {
  // Trazos del Figma («Punta del globo de Windi»); los colores van por CSS según el modo.
  return (
    <svg
      className="wg-globo__punta"
      width="27"
      height="20"
      viewBox="0 0 27 20"
      fill="none"
      aria-hidden="true"
    >
      <path className="wg-globo__punta-cuerpo" d="M1 1H25L8 18L1 1Z" strokeWidth="1.5" />
      <path className="wg-globo__punta-union" d="M2 1H24" strokeWidth="3" />
    </svg>
  );
}

export function MarcoDeCuenta({ nombre, titulo, subtitulo, windi, pasos, children }: MarcoDeCuentaProps) {
  const pose = windi?.pose ?? 'saludo';
  const cuerpo = windi ? `wg-cuenta__cuerpo--${pose}` : 'wg-cuenta__cuerpo--centrada';
  return (
    <main aria-label={nombre} className={windi ? 'wg-cuenta' : 'wg-cuenta wg-cuenta--centrada'}>
      <header className="wg-cuenta__cabecera">
        <span className="wg-cuenta__logo">
          <img className="wg-cuenta__simbolo" src={simbolo} alt="" />
          windgets
        </span>
        <SelectorDeModo />
      </header>
      <div className={`wg-cuenta__cuerpo ${cuerpo}`}>
        {windi && (
          <aside className="wg-cuenta__windi" aria-label="Windi">
            <div className="wg-globo">
              <p className="wg-globo__texto">
                {windi.lineas[0]}
                <br />
                {windi.lineas[1]}
              </p>
              <PuntaDelGlobo />
            </div>
            <img
              className="wg-cuenta__ilustracion"
              src={pose === 'registro' ? windiRegistro : windiSaludo}
              alt=""
            />
          </aside>
        )}
        <section className="wg-nota" aria-label={titulo ?? nombre}>
          <EsquinaDoblada />
          {pasos && <IndicadorDePasos pasos={pasos.lista} actual={pasos.actual} />}
          {titulo && <h1 className="wg-nota__titulo">{titulo}</h1>}
          {subtitulo && <p className="wg-nota__subtitulo">{subtitulo}</p>}
          {children}
        </section>
      </div>
    </main>
  );
}
