// Movimiento de la landing (CD-01-HU01). Solo CSS, la API de animación del navegador y este archivo: sin
// librerías. Solo se animan `transform` y `clip-path`. Todo cuelga de la clase `con-movimiento` de `<html>`,
// que se pone solo si `prefers-reduced-motion` no es `reduce`. El botón y el aviso se animan en estilos.css.
import { aplicarTema, type Panel, type Tema } from './panel';

const CLASE = 'con-movimiento';
const CURVA = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
// Caída con un solo rebote. Si el navegador no entiende `linear()`, cae sin rebotar.
const CON_REBOTE = 'linear(0, 0.12 20%, 0.5 38%, 1 52%, 0.84 68%, 1 86%, 1)';
const REBOTE = CSS.supports('animation-timing-function', CON_REBOTE) ? CON_REBOTE : 'ease-in';

// Tiempos de la entrada, en milisegundos desde la carga.
const TRAZO = 300;
const ANCLAJE = 4 * TRAZO; // Termina el momento de marca (1200 ms) y empiezan el anclaje y el texto.
const DURACION_ANCLAJE = 600;
const CAPAS = ANCLAJE + DURACION_ANCLAJE; // Empiezan las capas del escritorio.

// Barrido a 18°: el borde inclinado recorre el lienzo de izquierda a derecha (tan 18° × 750 ≈ 21 % del ancho).
const BARRIDO = [
  { clipPath: 'polygon(0 0, 0% 0, -21% 100%, 0 100%)' },
  { clipPath: 'polygon(0 0, 121% 0, 100% 100%, 0 100%)' },
];
// Fuera del borde quedan la sombra y el foco: el recorte final los deja ver.
const SIN_RECORTE = 'inset(-12px)';

// Isotipo con las medidas de la guía de identidad, con w = 24: trazos de ancho w y radio w/3; exteriores de
// 4w y interiores de 3,25w; ±18° alternados; centros a ±1,625w y ±0,5w; el magenta baja 0,75w.
const W = 24;
const TRAZOS = [
  { color: '#00D9E2', x: -1.625, y: 0, largo: 4, giro: -18 },
  { color: '#DC026C', x: -0.5, y: 0.75, largo: 3.25, giro: 18 },
  { color: '#DCBA04', x: 0.5, y: 0, largo: 3.25, giro: -18 },
  { color: '#6604E6', x: 1.625, y: 0, largo: 4, giro: 18 },
] as const;
// Cada cruce es un color sólido propio: la parte del trazo que se apoya sobre el de su izquierda.
const CRUCES = ['#D6258C', '#F7B212', '#7A14E3'] as const;
/** Parte del ancho del logo horizontal oficial que ocupa el isotipo (695 de 2400 px). */
const ISOTIPO_EN_LOGO = 695 / 2400;

export interface Escena {
  logo: HTMLImageElement;
  /** Bloques de texto en orden de lectura: suben escalonados al terminar el momento de marca. */
  texto: HTMLElement[];
  /** Las cinco funciones, en el orden de FUNCIONES. */
  funciones: HTMLElement[];
  panel: Panel;
}

const conMovimiento = () => document.documentElement.classList.contains(CLASE);

function barra({ x, y, largo, giro }: (typeof TRAZOS)[number], clase: string, color: string) {
  const posicion = `translate(${x * W} ${y * W}) rotate(${giro})`;
  const forma = `x="${-W / 2}" y="${(-largo * W) / 2}" width="${W}" height="${largo * W}" rx="${W / 3}"`;
  // Dentro de un `<clipPath>` no cabe un grupo: ahí la posición va en el propio rectángulo. En los demás va
  // en el grupo, para que la animación del rectángulo se mueva a lo largo del eje del trazo.
  if (!clase) return `<rect transform="${posicion}" ${forma}/>`;
  return `<g transform="${posicion}"><rect class="${clase}" ${forma} fill="${color}"/></g>`;
}

function crearIsotipo() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'isotipo-animado');
  svg.setAttribute('viewBox', '-65.25 -49.4 130.5 108.2');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = TRAZOS.map((trazo, i) => {
    const anterior = TRAZOS[i - 1];
    const cruce = CRUCES[i - 1];
    if (!anterior || !cruce) return barra(trazo, 'isotipo-animado__trazo', trazo.color);
    const recorte = `<clipPath id="apoyo-${i}">${barra(anterior, '', '')}</clipPath>`;
    const apoyo = `<g clip-path="url(#apoyo-${i})">${barra(trazo, 'isotipo-animado__cruce', cruce)}</g>`;
    return barra(trazo, 'isotipo-animado__trazo', trazo.color) + recorte + apoyo;
  }).join('');
  return svg;
}

/**
 * Animaciones 1 a 4, una sola vez por carga: el isotipo se construye en el centro de la página en blanco,
 * viaja a su lugar en el logo, sube el texto y el escritorio aparece capa por capa (wallpaper, widgets,
 * información). Lo que aún no entra queda recortado por el primer cuadro de su animación (`fill: backwards`);
 * al terminar, cada elemento vuelve a su estilo propio, sin `transform` ni `clip-path`.
 */
function entrada({ logo, texto, panel }: Escena) {
  const svg = crearIsotipo();
  document.body.append(svg);
  const antes = { fill: 'backwards' } as const;

  // 1 · Momento de marca: cada trazo cae 1w a lo largo de su eje y rebota una vez; su cruce aparece como
  // forma sólida cuando el trazo llega.
  svg.querySelectorAll('.isotipo-animado__trazo').forEach((trazo, i) => {
    const caida = [{ transform: `translateY(${-W}px)` }, { transform: 'translateY(0)' }];
    trazo.animate(caida, { duration: TRAZO, delay: i * TRAZO, easing: REBOTE, fill: 'forwards' });
  });
  svg.querySelectorAll('.isotipo-animado__cruce').forEach((cruce, i) => {
    const quieto = [{ transform: 'none' }, { transform: 'none' }];
    cruce.animate(quieto, { duration: 1, delay: (i + 1.52) * TRAZO, fill: 'forwards' });
  });

  // 2 · Anclaje: el isotipo viaja y se reduce hasta su lugar en el logo; la palabra se descubre de izquierda
  // a derecha. Al terminar se retira el SVG y queda solo la imagen oficial.
  const destino = logo.getBoundingClientRect();
  const origen = svg.getBoundingClientRect();
  const dx = destino.left + (destino.width * ISOTIPO_EN_LOGO) / 2 - (origen.left + origen.width / 2);
  const dy = destino.top + destino.height / 2 - (origen.top + origen.height / 2);
  const viaje = svg.animate(
    [
      { transform: 'none' },
      { transform: `translate(${dx}px, ${dy}px) scale(${destino.height / origen.height})` },
    ],
    { duration: DURACION_ANCLAJE, delay: ANCLAJE, easing: CURVA, fill: 'forwards' },
  );
  const retirar = () => svg.remove();
  viaje.finished.then(retirar, retirar);
  logo.animate([{ clipPath: 'inset(0 100% 0 30%)' }, { clipPath: 'inset(0 0 0 30%)' }], {
    duration: DURACION_ANCLAJE,
    delay: ANCLAJE,
    easing: CURVA,
    ...antes,
  });

  // 3 · Texto: sube 16 px, escalonado cada 60 ms. Dura 460 ms y no 500: con 500, la zona de descarga
  // (tercera del escalón) terminaría a los 1820 ms y el botón debe quedar listo antes de 1,8 s.
  const subida = [
    { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(16px)' },
    { clipPath: SIN_RECORTE, offset: 0.6 },
    { clipPath: SIN_RECORTE, transform: 'none' },
  ];
  texto.forEach((bloque, i) => {
    bloque.animate(subida, { duration: 460, delay: ANCLAJE + i * 60, easing: CURVA, ...antes });
  });

  // 4 · Capas del escritorio: el panel entra en diagonal desde abajo a la derecha, el wallpaper lo cubre con
  // un barrido a 18° y aterrizan los widgets y, al final, la ventana, cada 90 ms.
  panel.raiz.animate(
    [
      { clipPath: 'inset(100% -12px -12px 100%)', transform: 'translate(48px, 72px)' },
      { clipPath: SIN_RECORTE, transform: 'none' },
    ],
    { duration: 400, delay: CAPAS, easing: CURVA, ...antes },
  );
  const tema = panel.raiz.dataset.tema as Tema;
  panel.fondo(tema).animate(BARRIDO, { duration: 450, delay: CAPAS + 200, easing: CURVA, ...antes });
  const aterrizaje = [
    { clipPath: 'inset(0 0 100% 0)', transform: `translateY(${-W}px)` },
    { clipPath: SIN_RECORTE, transform: 'none' },
  ];
  panel.piezas.forEach((pieza, i) => {
    pieza.animate(aterrizaje, { duration: 240, delay: CAPAS + 600 + i * 90, easing: CURVA, ...antes });
  });
}

/**
 * 5 · Cambio de tema: el wallpaper nuevo barre a 18° y los widgets se deslizan a la posición de su
 * plantilla. Con «reducir movimiento», el cambio es inmediato.
 */
function cambiarTema(panel: Panel, tema: Tema) {
  const piezas = [...panel.piezas];
  const partida = piezas.map((pieza) => pieza.getBoundingClientRect());
  const { entrante, saliente } = aplicarTema(panel, tema);
  const retirar = () => saliente?.classList.remove('fondo--saliente');
  if (!conMovimiento() || !saliente) {
    retirar();
    return;
  }
  const opciones = { duration: 700, easing: CURVA };
  entrante.animate(BARRIDO, opciones).finished.then(retirar, retirar);
  // El lienzo está escalado: el desplazamiento medido en pantalla se pasa a medidas del lienzo.
  const escala = panel.lienzo.getBoundingClientRect().width / panel.lienzo.offsetWidth || 1;
  piezas.forEach((pieza, i) => {
    const llegada = pieza.getBoundingClientRect();
    const dx = ((partida[i]?.left ?? llegada.left) - llegada.left) / escala;
    const dy = ((partida[i]?.top ?? llegada.top) - llegada.top) / escala;
    if (dx !== 0 || dy !== 0) {
      pieza.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], opciones);
    }
  });
}

/**
 * 6 · Pieza activa. En escritorio, la pieza del panel ligada a la función que tiene el puntero encima o, si
 * no hay ninguna, a la más cercana al centro de la ventana. Aquí solo se marca la pieza con una clase; cómo
 * se nota (sube y pasa a sombra de nivel 2, o borde de 3 px con «reducir movimiento») lo decide estilos.css.
 */
function seguirPiezaActiva({ funciones, panel }: Escena) {
  const [reloj, tareas, calendario, kanban, ventana] = panel.piezas;
  // Wallpaper personalizable → el marco del panel; Widgets → Reloj, Tareas del día y Calendario;
  // Planificador → el Kanban; Windi → la ventana; Sincronización → la etiqueta «Sincronizado».
  const ligadas = [[panel.raiz], [reloj, tareas, calendario], [kanban], [ventana], [panel.sincronizado]];
  const escritorio = matchMedia('(min-width: 1024px)');
  let conPuntero = -1;
  let activa = -1;

  const masCercana = () => {
    const centro = innerHeight / 2;
    let indice = -1;
    let distancia = Infinity;
    funciones.forEach((funcion, i) => {
      const { top, bottom } = funcion.getBoundingClientRect();
      const d = Math.abs((top + bottom) / 2 - centro);
      if (bottom > 0 && top < innerHeight && d < distancia) [indice, distancia] = [i, d];
    });
    return indice;
  };
  const actualizar = () => {
    const nueva = !escritorio.matches ? -1 : conPuntero >= 0 ? conPuntero : masCercana();
    if (nueva === activa) return;
    ligadas[activa]?.forEach((pieza) => pieza?.classList.remove('activa'));
    ligadas[nueva]?.forEach((pieza) => pieza?.classList.add('activa'));
    activa = nueva;
  };

  funciones.forEach((funcion, i) => {
    funcion.addEventListener('pointerenter', () => {
      conPuntero = i;
      actualizar();
    });
    funcion.addEventListener('pointerleave', () => {
      conPuntero = -1;
      actualizar();
    });
  });
  // Solo se lee la posición: la página se desplaza como siempre.
  let pendiente = false;
  const alDesplazar = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      actualizar();
    });
  };
  addEventListener('scroll', alDesplazar, { passive: true });
  addEventListener('resize', alDesplazar);
  escritorio.addEventListener('change', actualizar);
  actualizar();
}

/** Prepara el movimiento de la página y devuelve la función que cambia el tema del panel. */
export function iniciarMovimiento(escena: Escena): (tema: Tema) => void {
  const reducir = matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.toggle(CLASE, !reducir.matches);
  reducir.addEventListener('change', () => {
    document.documentElement.classList.toggle(CLASE, !reducir.matches);
    // Si la preferencia cambia a mitad de camino, todo salta a su estado final y queda quieto.
    if (reducir.matches) document.getAnimations().forEach((animacion) => animacion.cancel());
  });
  // Si la pestaña carga en segundo plano, se salta al estado final.
  if (!reducir.matches && document.visibilityState === 'visible') entrada(escena);
  seguirPiezaActiva(escena);
  return (tema) => cambiarTema(escena.panel, tema);
}
