import type { ReactNode } from 'react';
import { Aviso } from '@/ui/Aviso/Aviso';
import { useNavegacion } from '@/ventana_principal/VentanaPrincipal';
import { PasoCentrado } from '../cuenta/PasoCentrado';
import { TEXTOS } from '../cuenta/textos';

// Un paso de Recuperar contraseña con la disposición del rediseño (docs/rediseno.md RD-16, RD-17): la miga de pan
// «Inicio de sesión / Recuperar contraseña», el título, el subtítulo y, sin conexión, el aviso debajo. «Regresar»
// va con el botón principal (AccionesDelPaso).
export function PasoDeRecuperacion({
  nombre,
  titulo,
  subtitulo,
  enLinea,
  avisoSinConexion = TEXTOS.SIN_CONEXION_RECUPERAR,
  children,
}: {
  nombre: string;
  titulo: string;
  subtitulo: string;
  enLinea: boolean;
  avisoSinConexion?: string;
  children: ReactNode;
}) {
  const { abrirCuenta } = useNavegacion();
  return (
    <PasoCentrado
      nombre={nombre}
      // HE-01-HU06-CA07, ET04: «Inicio de sesión» en la miga de pan abre Inicio de sesión sin cambiar la
      // contraseña.
      niveles={[
        { texto: 'Inicio de sesión', alElegir: () => abrirCuenta('sign_in') },
        { texto: 'Recuperar contraseña' },
      ]}
      titulo={titulo}
      subtitulo={subtitulo}
    >
      {/* HE-01-HU06-ET11, HE-01-HU07-ET13: sin conexión, el aviso va en la parte superior del paso. */}
      {!enLinea && <Aviso texto={avisoSinConexion} />}
      {children}
    </PasoCentrado>
  );
}
