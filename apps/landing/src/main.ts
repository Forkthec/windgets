// Landing page (CD-01, C-04): descripción, funciones, requisitos y descarga del instalador.
import './estilos.css';
import { detectarCompatibilidad, type Navegador } from './sistema';
import {
  AVISO_ARQUITECTURA,
  AVISO_SIN_WINDOWS,
  BOTON_DESCARGA,
  DESCRIPCION,
  FUNCIONES,
  NOMBRE,
  REQUISITOS,
} from './textos';

function crear<K extends keyof HTMLElementTagNameMap>(
  etiqueta: K,
  clase: string,
  texto?: string,
): HTMLElementTagNameMap[K] {
  const elemento = document.createElement(etiqueta);
  elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

/** Aviso junto al botón «Descargar para Windows» (RT-04; CD-01-HU01-ET12). */
export function mostrarAviso(contenedor: HTMLElement, texto: string) {
  const aviso = crear('p', 'landing__aviso', texto);
  aviso.setAttribute('role', 'alert');
  contenedor.append(aviso);
  return aviso;
}

function dibujar(raiz: HTMLElement) {
  const encabezado = crear('header', 'landing__encabezado');
  encabezado.append(crear('h1', 'landing__nombre', NOMBRE), crear('p', 'landing__descripcion', DESCRIPCION));

  const funciones = crear('ul', 'landing__funciones');
  funciones.setAttribute('aria-label', 'Funciones principales');
  funciones.append(...FUNCIONES.map((f) => crear('li', 'landing__funcion', f)));

  const descarga = crear('section', 'landing__descarga');
  descarga.setAttribute('aria-label', 'Descarga');
  const boton = crear('button', 'landing__boton', BOTON_DESCARGA);
  boton.type = 'button';
  const avisos = crear('div', 'landing__avisos');
  descarga.append(boton, crear('p', 'landing__requisitos', REQUISITOS), avisos);

  raiz.append(encabezado, funciones, descarga);
  return { boton, avisos };
}

const raiz = document.getElementById('app');
if (raiz) {
  const { avisos } = dibujar(raiz);
  // El botón sigue habilitado con cualquier resultado (CD-01-HU01-CA03; INT-12).
  void detectarCompatibilidad(navigator as Navegador).then((resultado) => {
    if (resultado === 'sin_windows') mostrarAviso(avisos, AVISO_SIN_WINDOWS);
    else if (resultado === 'arquitectura_distinta') mostrarAviso(avisos, AVISO_ARQUITECTURA);
  });
}
