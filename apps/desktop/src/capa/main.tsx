import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/ui/tema/tokens.css';
import { Capa } from './Capa';

// Entrada de la capa del wallpaper (C-02, capa.html). El Host del wallpaper la ancla a WorkerW (D-131).
const raiz = document.getElementById('root');
if (raiz) {
  ReactDOM.createRoot(raiz).render(
    <React.StrictMode>
      <Capa />
    </React.StrictMode>,
  );
}
