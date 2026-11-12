import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './ui/tokens.css';

const raiz = document.getElementById('root');
if (raiz) {
  ReactDOM.createRoot(raiz).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
