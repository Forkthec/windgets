import { useCallback } from 'react';
import { useVentanasEmergentes } from '@/reglas/emergentes';
import { Boton } from '@/ui/Boton/Boton';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { FormularioTarjeta } from '../tarjeta/FormularioTarjeta';

// P-KAN-01 Tablero Kanban (Menú principal > Planificador > Tablero Kanban). Por ahora solo «Nueva tarjeta»
// (HE-07-HU01-ET01); las columnas y las tarjetas del tablero llegan con HE-09-HU01.

type Ventana = 'formulario';

export function Kanban() {
  const emergentes = useVentanasEmergentes<Ventana>();
  const mostrarResultado = useMensajeDeResultado();

  // CA01: al guardar, cierra el formulario, sigue en el Tablero Kanban y muestra «Tarjeta creada.».
  const creada = useCallback(
    (_: unknown, mensaje: string) => {
      emergentes.volver();
      mostrarResultado(mensaje);
    },
    [emergentes, mostrarResultado],
  );

  return (
    <main aria-label="Tablero Kanban">
      <div className="wg-fila">
        <Boton principal onClick={() => emergentes.abrir('formulario')}>
          Nueva tarjeta
        </Boton>
      </div>
      {emergentes.actual === 'formulario' && (
        <FormularioTarjeta alCrear={creada} alCancelar={emergentes.volver} />
      )}
    </main>
  );
}
