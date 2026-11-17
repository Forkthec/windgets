import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/ui/tema/tokens.css';
import { aplicarTokens } from '@/ui/tema/tokens';
import { TOKENS_POR_DEFECTO } from '@/ui/tema/tokens_por_defecto';

// La ventana arranca con el tema por defecto; con la sesión iniciada toma el tema aplicado (HE-03-HU06,
// `useTemaAplicado` en VentanaPrincipal).
aplicarTokens(TOKENS_POR_DEFECTO);

const raiz = document.getElementById('root');
if (raiz) {
  ReactDOM.createRoot(raiz).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
