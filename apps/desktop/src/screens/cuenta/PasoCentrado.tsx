import type { ReactNode } from 'react';
import { MigaDePan, type NivelDeMiga } from '@/ui/MigaDePan/MigaDePan';

// docs/rediseno.md RD-16 a RD-18 (Figma «01 · Acceso»: Verificar correo, Recuperar contraseña, Diligenciar
// código y Nueva contraseña): dentro de la nota centrada, la miga de pan arriba, el título y el subtítulo, y al
// final «Regresar» a la izquierda del botón principal.

export interface PasoCentradoProps {
  /** Nombre accesible del paso (región). */
  nombre: string;
  /** Miga de pan (RT-03), con «/» entre niveles como en el Figma. */
  niveles: readonly NivelDeMiga[];
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

export function PasoCentrado({ nombre, niveles, titulo, subtitulo, children }: PasoCentradoProps) {
  return (
    <section className="wg-paso-centrado" aria-label={nombre}>
      <MigaDePan niveles={niveles} separador="/" />
      <h1 className="wg-nota__titulo">{titulo}</h1>
      <p className="wg-nota__subtitulo">{subtitulo}</p>
      {children}
    </section>
  );
}

export interface AccionesDelPasoProps {
  /** Vuelve al paso o la pantalla anterior sin completar la acción (RT-03-ET05). */
  alRegresar: () => void;
  /** El botón principal del paso. */
  children: ReactNode;
  /** Sin conexión: por qué el botón principal está deshabilitado (RD-18). */
  motivoSinConexion?: string | null;
}

/** «Regresar» a la izquierda y el botón principal a la derecha (RD-17). */
export function AccionesDelPaso({ alRegresar, children, motivoSinConexion }: AccionesDelPasoProps) {
  return (
    <>
      <div className="wg-acciones">
        <button type="button" className="wg-enlace wg-acciones__regresar" onClick={alRegresar}>
          Regresar
        </button>
        {children}
      </div>
      {motivoSinConexion && <p className="wg-acciones__motivo">{motivoSinConexion}</p>}
    </>
  );
}
