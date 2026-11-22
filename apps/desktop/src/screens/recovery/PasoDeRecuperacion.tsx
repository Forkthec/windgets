import type { ReactNode } from 'react';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import { Aviso } from '@/ui/Aviso/Aviso';
import { useNavegacion } from '@/ventana_principal/VentanaPrincipal';
import { TEXTOS } from '../cuenta/textos';

/** Paso de Recuperar contraseña con su encabezado de ruta y, sin conexión, el aviso arriba del paso. */
export function PasoDeRecuperacion({
  nombre,
  enLinea,
  alRegresar,
  children,
}: {
  nombre: string;
  enLinea: boolean;
  alRegresar: () => void;
  children: ReactNode;
}) {
  const { abrirCuenta } = useNavegacion();
  return (
    <section className="wg-formulario" aria-label={nombre}>
      {/* HE-01-HU06-CA07, ET04: «Inicio de sesión» en la miga de pan abre Inicio de sesión sin cambiar la
          contraseña. */}
      <EncabezadoDeRuta
        niveles={[{ texto: 'Inicio de sesión', alElegir: () => abrirCuenta('sign_in') }, { texto: 'Recuperar contraseña' }]}
        alRegresar={alRegresar}
      />
      {/* HE-01-HU06-ET11, HE-01-HU07-ET13: sin conexión, el aviso va en la parte superior del paso. */}
      {!enLinea && <Aviso texto={TEXTOS.SIN_CONEXION_RECUPERAR} />}
      {children}
    </section>
  );
}
