// docs/rediseno.md RD-09: los pasos de Registro y de Recuperar contraseña, con el actual resaltado y marcado.
export function IndicadorDePasos({ pasos, actual }: { pasos: readonly string[]; actual: number }) {
  return (
    <ol className="wg-pasos" aria-label="Pasos">
      {pasos.map((paso, i) => (
        <li
          key={paso}
          className={i === actual ? 'wg-pasos__paso wg-pasos__paso--actual' : 'wg-pasos__paso'}
          aria-current={i === actual ? 'step' : undefined}
        >
          <span className="wg-pasos__numero">{i + 1}</span>
          {paso}
        </li>
      ))}
    </ol>
  );
}

/** El divisor «o» entre la acción principal y «Continuar con Google» (docs/rediseno.md RD-12, RD-13). */
export function Divisor() {
  return (
    <p className="wg-divisor">
      <span>o</span>
    </p>
  );
}
