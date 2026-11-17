import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/ui/tema/tokens.css';
import { aplicarTokens } from '@/ui/tema/tokens';
import { TOKENS_POR_DEFECTO } from '@/ui/tema/tokens_por_defecto';
import { Edicion } from './Edicion';

// Entrada de la ventana de edición de la distribución (C-03, edicion.html). El Núcleo la crea al abrir la
// pantalla de edición y la destruye al guardar o cancelar (HE-05).
aplicarTokens(TOKENS_POR_DEFECTO);

const raiz = document.getElementById('root');
if (raiz) {
  ReactDOM.createRoot(raiz).render(
    <React.StrictMode>
      <Edicion />
    </React.StrictMode>,
  );
}
