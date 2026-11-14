// Landing page (CD-01, C-04): descripción, funciones, requisitos y descarga del instalador.
import './estilos.css';
import { enlaceDeDescarga, instaladorDisponible, repositorioValido } from './descarga';
import { ICONO_DESCARGA, ICONO_VERIFICACION, MINIATURAS } from './iconos';
import logo from './marca/logo_horizontal.png';
import { activarPanel } from './interaccion';
import { iniciarMovimiento } from './movimiento';
import { crearPanel, TEMAS, type Tema } from './panel';
import { detectarCompatibilidad, type Navegador } from './sistema';
import {
  AVISO_ARQUITECTURA,
  AVISO_DESCARGA,
  AVISO_SIN_WINDOWS,
  BOTON_DESCARGA,
  DESCRIPCION,
  FUNCIONES,
  NOMBRE,
  REQUISITOS,
} from './textos';

// Textos nuevos del rediseño visual, aprobados por Paula el 14-nov-2026. No se agrega ningún otro.
// DUDA: CD-01-HU01 el nombre del primer tema («Windgets», en panel.ts) está por confirmar.
const TITULAR = 'Tu escritorio también te organiza.';
const ELEGIR_TEMA = 'Elige un tema';
const CIERRE = ['Capas que se adaptan a ti.', 'Hecho por ForkTech.'];
const VOLVER = 'Volver a la descarga';

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
  const aviso = crear('p', 'aviso', texto);
  aviso.setAttribute('role', 'alert');
  contenedor.append(aviso);
  return aviso;
}

/** El logo horizontal oficial es el único identificador de la página; el nombre se lee, no se ve. */
function identificador() {
  const h1 = crear('h1', 'identificador');
  const imagen = crear('img', 'identificador__logo');
  imagen.src = logo;
  imagen.alt = '';
  imagen.width = 2400;
  imagen.height = 572;
  h1.append(imagen, crear('span', 'solo-lectores', NOMBRE));
  return { h1, imagen };
}

function zonaDeDescarga() {
  const descarga = crear('section', 'descarga');
  descarga.id = 'descarga';
  descarga.setAttribute('aria-label', 'Descarga');
  const boton = crear('button', 'boton');
  boton.type = 'button';
  boton.innerHTML = ICONO_DESCARGA;
  boton.append(crear('span', 'boton__texto', BOTON_DESCARGA));
  const avisos = crear('div', 'avisos');
  descarga.append(boton, crear('p', 'requisitos', REQUISITOS), avisos);
  return { descarga, boton, avisos };
}

/** Grupo de radios nativo: se anuncia el nombre del tema, no un color. */
function selectorDeTema() {
  const grupo = crear('fieldset', 'temas');
  grupo.append(crear('legend', 'temas__titulo', ELEGIR_TEMA));
  const opciones = crear('div', 'temas__opciones');
  const radios = TEMAS.map(({ id, nombre }, i) => {
    const opcion = crear('label', 'tema');
    const radio = crear('input', 'tema__radio');
    radio.type = 'radio';
    radio.name = 'tema';
    radio.value = id;
    radio.checked = i === 0;
    const muestra = crear('span', 'tema__muestra');
    muestra.dataset.muestra = id;
    opcion.append(radio, muestra, crear('span', 'tema__nombre', nombre));
    opcion.insertAdjacentHTML('beforeend', ICONO_VERIFICACION);
    opciones.append(opcion);
    return { id, radio };
  });
  grupo.append(opciones);
  return { grupo, radios };
}

/** Cada función: el nombre hasta «:» en negrita y el resto seguido. El texto del `<li>` es el literal. */
function listaDeFunciones() {
  const lista = crear('ul', 'funciones');
  lista.setAttribute('aria-label', 'Funciones principales');
  const elementos = FUNCIONES.map((funcion, i) => {
    const corte = funcion.indexOf(':') + 1;
    const li = crear('li', 'funcion');
    li.innerHTML = MINIATURAS[i] ?? '';
    const texto = crear('p', 'funcion__texto');
    texto.append(crear('strong', 'funcion__nombre', funcion.slice(0, corte)), funcion.slice(corte));
    li.append(texto);
    return li;
  });
  lista.append(...elementos);
  return { lista, elementos };
}

function cierre() {
  const pie = crear('footer', 'cierre');
  const enlace = crear('a', 'cierre__enlace', VOLVER);
  enlace.href = '#descarga';
  pie.append(...CIERRE.map((linea) => crear('p', 'cierre__linea', linea)), enlace);
  return pie;
}

function dibujar(raiz: HTMLElement) {
  const { h1, imagen } = identificador();
  const titular = crear('p', 'titular', TITULAR);
  const descripcion = crear('p', 'descripcion', DESCRIPCION);
  const { descarga, boton, avisos } = zonaDeDescarga();
  const panel = crearPanel();
  const { grupo: selector, radios } = selectorDeTema();
  const { lista, elementos } = listaDeFunciones();
  const pie = cierre();

  // El orden del DOM es el orden de lectura; el panel va al final y se coloca con CSS.
  raiz.append(h1, titular, descripcion, descarga, selector, lista, pie, panel.raiz);
  const cambiarTema = iniciarMovimiento({
    logo: imagen,
    texto: [titular, descripcion, descarga, selector, lista, pie],
    funciones: elementos,
    panel,
  });
  for (const { id, radio } of radios) radio.addEventListener('change', () => cambiarTema(id));
  // Elegir un tema en la pestaña «Personalización» del panel es lo mismo que elegirlo en «Elige un tema».
  activarPanel(panel, (tema: Tema) => {
    for (const { id, radio } of radios) radio.checked = id === tema;
    cambiarTema(tema);
  });
  return { boton, avisos };
}

/**
 * «Descargar para Windows» (CD-01-HU02): comprueba el instalador y deja que el navegador lo descargue; si no
 * está disponible, muestra el aviso y el botón sigue habilitado (ET03, ET05). El aviso se quita cuando una
 * descarga posterior sí inicia (RT-04: el aviso desaparece cuando el problema se resuelve).
 */
function prepararDescarga(boton: HTMLButtonElement, avisos: HTMLElement) {
  const repo: string | undefined = import.meta.env.WINDGETS_GITHUB_REPO;
  let aviso: HTMLElement | null = null;
  let enCurso = false;
  boton.addEventListener('click', () => {
    if (enCurso) return;
    enCurso = true;
    // Solo mientras se comprueba el instalador, el ícono del botón baja en bucle.
    boton.classList.add('boton--comprobando');
    const comprobacion = repositorioValido(repo) ? instaladorDisponible(repo) : Promise.resolve(false);
    void comprobacion
      .then((disponible) => {
        if (disponible && repositorioValido(repo)) {
          aviso?.remove();
          aviso = null;
          window.location.assign(enlaceDeDescarga(repo));
        } else if (!aviso) {
          aviso = mostrarAviso(avisos, AVISO_DESCARGA);
        }
      })
      .finally(() => {
        enCurso = false;
        boton.classList.remove('boton--comprobando');
      });
  });
}

const raiz = document.getElementById('app');
if (raiz) {
  const { boton, avisos } = dibujar(raiz);
  prepararDescarga(boton, avisos);
  // El botón sigue habilitado con cualquier resultado (CD-01-HU01-CA03; INT-12).
  void detectarCompatibilidad(navigator as Navegador).then((resultado) => {
    if (resultado === 'sin_windows') mostrarAviso(avisos, AVISO_SIN_WINDOWS);
    else if (resultado === 'arquitectura_distinta') mostrarAviso(avisos, AVISO_ARQUITECTURA);
  });
}
