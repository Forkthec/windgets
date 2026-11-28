import { COLOR_DE_LOS_OJOS, OjosDeWindi, type EstadoDeLosOjos } from './OjosDeWindi';

// El dibujo de Windi de 48×48 (SPEC_Marco_y_componentes_base.md MB-05 §3, Figma `2004:334`, F0b §3) con sus ojos
// (MB-27). Colores fijos (D2/C7): cuerpo «Amarillo» #FFCA22 con trazo `borde` 1,5 (la única variable), boca #27152B.
// Sin conexión o con error, la boca es recta. Las ondas, el punto de propuesta y el botón de 48 son de MB-05 (C3-03).
export const AMARILLO_DE_WINDI = '#FFCA22';

export interface DibujoDeWindiProps {
  tamano: number;
  estado?: EstadoDeLosOjos;
  parpadeando?: boolean;
  className?: string;
}

export function DibujoDeWindi({
  tamano,
  estado = 'reposo',
  parpadeando = false,
  className = '',
}: DibujoDeWindiProps) {
  return (
    <svg
      className={`wg-dibujo-de-windi ${className}`.trim()}
      data-testid="windi-dibujo"
      width={tamano}
      height={tamano}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        className="wg-dibujo-de-windi__cuerpo"
        d="M0.8 30.3119C0.996434 20.417 9.05023 13.8205 20.6398 14.0037C30.658 14.0037 36.9438 18.4014 41.069 24.4483C42.5095 26.525 43.819 27.4412 44.9976 27.1968C39.8904 32.3275 40.2832 37.4582 44.6048 43.3218C50.6942 51.7507 49.1228 57.9808 42.444 60.3629C35.3724 62.9282 27.1221 60.5461 22.997 55.4155C18.6755 49.7351 18.2826 44.4212 13.1753 40.39C9.24666 37.0917 2.37147 35.6258 0.8 30.3119Z"
        fill={AMARILLO_DE_WINDI}
        strokeWidth="1.5"
      />
      <path
        className="wg-dibujo-de-windi__boca"
        d={
          estado === 'cerrados'
            ? 'M20.0505 30.0292H24.5685'
            : 'M20.0505 29.3957C21.3601 30.9838 22.8661 30.8616 24.5685 29.0292'
        }
        fill="none"
        stroke={COLOR_DE_LOS_OJOS}
        strokeWidth={estado === 'cerrados' ? 1.2 : 0.995366}
        strokeLinecap="round"
      />
      <OjosDeWindi tamano={48} estado={estado} parpadeando={parpadeando} />
    </svg>
  );
}
