// Pantallas de prueba de las reglas transversales (ver rt.html). Usan solo la biblioteca de interfaz y los
// textos de los CA (criterios de aceptación) que se prueban en e2e/RT-*.spec.ts.
import { StrictMode, useState, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import '@/ui/tema/tokens.css';
import { Boton } from '@/ui/Boton/Boton';
import { Casilla } from '@/ui/Casilla/Casilla';
import { ProveedorDeResultado, useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import type { Invoke } from '@/types';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

function CrearTarjeta() {
  const mostrar = useMensajeDeResultado();
  return (
    <Boton principal onClick={() => mostrar('Tarjeta creada.')}>
      Guardar
    </Boton>
  );
}

// RT-02-CA08 y CA09: Tablero Kanban con una tarjeta cuyo detalle se abre en una ventana emergente.
function TableroDePrueba() {
  const [detalle, setDetalle] = useState(false);
  const [selecciones, setSelecciones] = useState(0);
  return (
    <main aria-label="Tablero Kanban">
      <p>Selecciones del fondo: {selecciones}</p>
      <Boton onClick={() => setSelecciones((n) => n + 1)}>Nueva columna</Boton>
      <button type="button" onClick={() => setDetalle(true)}>
        Leer el capítulo 3
      </button>
      {detalle && (
        <VentanaEmergente
          titulo="Detalle de tarjeta"
          alSalir={() => setDetalle(false)}
          acciones={<Boton onClick={() => setDetalle(false)}>Cerrar</Boton>}
        >
          <p>Leer el capítulo 3</p>
        </VentanaEmergente>
      )}
    </main>
  );
}

const conSesion = (() =>
  Promise.resolve({
    ok: true,
    value: { state: 'signed_in', user_id: 'u-1', alias: 'Paula', token: 'valid' },
  })) as unknown as Invoke;

const casos: Record<string, () => ReactElement> = {
  // RT-04-CA11: casilla de completada y título de cada tarjeta en la misma línea (Planificador diario).
  alineacion: () => (
    <ul>
      {['Leer el capítulo 3', 'Preparar la exposición'].map((titulo) => (
        <li key={titulo}>
          <Casilla etiqueta={titulo} marcada={false} alCambiar={() => {}} />
        </li>
      ))}
    </ul>
  ),
  // RT-04-CA01 y ET01: mensaje de resultado en la esquina inferior derecha de la ventana.
  resultado: () => (
    <ProveedorDeResultado>
      <CrearTarjeta />
    </ProveedorDeResultado>
  ),
  emergente: () => <VentanaPrincipal invocar={conSesion} pantallas={{ kanban: TableroDePrueba }} />,
};

const caso = new URLSearchParams(window.location.search).get('caso') ?? '';
const Caso = casos[caso];
const raiz = document.getElementById('root');
if (raiz && Caso) {
  createRoot(raiz).render(
    <StrictMode>
      <Caso />
    </StrictMode>,
  );
}
