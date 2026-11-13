// Pantallas de prueba de las reglas transversales (ver rt.html). Usan solo la biblioteca de interfaz y los
// textos de los CA (criterios de aceptación) que se prueban en e2e/RT-*.spec.ts.
import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import '@/ui/tema/tokens.css';
import { Boton } from '@/ui/Boton/Boton';
import { Casilla } from '@/ui/Casilla/Casilla';
import { ProveedorDeResultado, useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';

function CrearTarjeta() {
  const mostrar = useMensajeDeResultado();
  return (
    <Boton principal onClick={() => mostrar('Tarjeta creada.')}>
      Guardar
    </Boton>
  );
}

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
