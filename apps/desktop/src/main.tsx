import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/ui/tema/tokens.css';
import { aplicarTokens } from '@/ui/tema/tokens';
import { TOKENS_POR_DEFECTO } from '@/ui/tema/tokens_por_defecto';

// Hasta que el Núcleo entregue el tema aplicado (theme_get_applied, P13), la ventana usa el tema por defecto.
aplicarTokens(TOKENS_POR_DEFECTO);

const raiz = document.getElementById('root');
if (raiz) {
  ReactDOM.createRoot(raiz).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
