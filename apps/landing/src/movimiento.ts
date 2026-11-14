// Movimiento de la landing (CD-01-HU01). Solo CSS, la API de animación del navegador y este archivo: sin
// librerías. Solo se animan `transform` y `clip-path`. Todo cuelga de la clase `con-movimiento` de `<html>`,
// que se pone solo si `prefers-reduced-motion` no es `reduce`. El botón y el aviso se animan en estilos.css.
//
// La página cuenta una sola secuencia, lenta y encadenada, con dos gestos que se repiten en todo:
//   · destapar: una capa se descubre con un barrido a 18°, el ángulo de la marca;
//   · acomodar: una capa se desliza hasta su sitio y se apoya, como al cambiar de tema.
// El isotipo se construye trazo a trazo en el centro, como quien escribe la W, y se desliza a su lugar en el
// logo; entonces se destapa el texto, y el escritorio se arma en el orden de la marca: wallpaper, widgets, información.
import { aplicarTema, type Panel, type Tema } from './panel';

const CLASE = 'con-movimiento';
/** Destapar: sale rápido y frena largo. */
const SUAVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** Acomodar: arranca y frena despacio. */
const DESLIZ = 'cubic-bezier(0.65, 0, 0.35, 1)';
const TAN_18 = Math.tan((18 * Math.PI) / 180);

// Tiempos de la entrada, en milisegundos desde que empieza. Cada tramo arranca antes de que termine el
// anterior, para que se lea como un solo movimiento.
const T = {
  // Momento de marca: el isotipo se construye en el centro de la página en blanco y viaja a su sitio.
  trazo: { inicio: 0, paso: 300, dura: 720 },
  viaje: { inicio: 1500, dura: 1100 },
  palabra: { inicio: 1800, dura: 900 },
  // El texto espera al momento de marca: la zona de descarga, tercer bloque, termina a los 3700 ms.
  texto: { inicio: 2300, paso: 150, dura: 1100 },
  marco: { inicio: 2700, dura: 1200 },
  fondo: { inicio: 3300, dura: 1100 },
  capas: { inicio: 3500, paso: 170, dura: 1400 },
  piezas: { inicio: 4300, paso: 130, dura: 2000 },
  chat: { inicio: 6700, paso: 520, dura: 800 },
} as const;

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

export interface Escena {
  logo: HTMLImageElement;
  /** Bloques de texto en orden de lectura. */
  texto: HTMLElement[];
  /** Las cinco funciones, en el orden de FUNCIONES. */
  funciones: HTMLElement[];
  panel: Panel;
}

const conMovimiento = () => document.documentElement.classList.contains(CLASE);
const escalaDe = (panel: Panel) => panel.lienzo.getBoundingClientRect().width / panel.lienzo.offsetWidth || 1;

/**
 * Destapar: fotogramas de un barrido a 18° sobre el elemento. El borde inclinado lo recorre de izquierda a
 * derecha; el recorte deja un margen para que la sombra y el foco no queden cortados al final.
 */
function destapar(ancho: number, alto: number, desde?: number) {
  const m = 24;
  // Con `desde`, lo que queda a su izquierda no se descubre nunca (en el logo, el lugar del isotipo).
  const borde = desde ?? -m;
  const caida = TAN_18 * (alto + 2 * m);
  // El pie del borde inclinado no retrocede más allá del borde izquierdo: al empezar no asoma nada.
  const forma = (x: number) =>
    `polygon(${borde}px ${-m}px, ${x + caida}px ${-m}px, ${Math.max(x, borde)}px ${alto + m}px, ${borde}px ${alto + m}px)`;
  return [{ clipPath: forma(borde - caida) }, { clipPath: forma(ancho + m) }];
}

function barra({ x, y, largo, giro }: (typeof TRAZOS)[number], i: number, clase: string, color: string) {
  const posicion = `translate(${x * W} ${y * W}) rotate(${giro})`;
  const forma = `x="${-W / 2}" y="${(-largo * W) / 2}" width="${W}" height="${largo * W}" rx="${W / 3}"`;
  // Dentro de un `<clipPath>` no cabe un grupo: ahí la posición va en el propio rectángulo.
  if (!clase) return `<rect transform="${posicion}" ${forma}/>`;
  return `<g transform="${posicion}"><rect class="${clase}" data-trazo="${i}" ${forma} fill="${color}"/></g>`;
}

function crearIsotipo() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'isotipo-animado');
  svg.setAttribute('viewBox', '-65.25 -49.4 130.5 108.2');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = TRAZOS.map((trazo, i) => {
    const anterior = TRAZOS[i - 1];
    const cruce = CRUCES[i - 1];
    const propio = barra(trazo, i, 'isotipo-animado__trazo', trazo.color);
    if (!anterior || !cruce) return propio;
    const recorte = `<clipPath id="apoyo-${i}">${barra(anterior, i, '', '')}</clipPath>`;
    return `${propio}${recorte}<g clip-path="url(#apoyo-${i})">${barra(trazo, i, 'isotipo-animado__trazo', cruce)}</g>`;
  }).join('');
  return svg;
}

/**
 * La entrada, una sola vez por carga. Lo que aún no entra queda oculto por el primer fotograma de su
 * animación (`fill: backwards`); al terminar, cada elemento vuelve a su estilo propio, sin `transform` ni
 * `clip-path`.
 */
function entrada({ logo, texto, panel }: Escena) {
  const antes = { fill: 'backwards' } as const;

  // El isotipo se construye grande, en el centro de la página en blanco. Los trazos se escriben como una W, en un solo gesto: el cian baja, el
  // magenta sube, el amarillo baja y el púrpura sube. El cruce de cada trazo crece con él, así que aparece
  // justo cuando se apoya en el anterior. Después la palabra se destapa a 18°.
  const svg = crearIsotipo();
  document.body.append(svg);
  svg.querySelectorAll<SVGElement>('[data-trazo]').forEach((trazo) => {
    const i = Number(trazo.dataset.trazo);
    trazo.style.transformOrigin = i % 2 === 0 ? '50% 0' : '50% 100%';
    trazo.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
      duration: T.trazo.dura,
      delay: T.trazo.inicio + i * T.trazo.paso,
      easing: SUAVE,
      fill: 'forwards',
    });
  });
  const caja = logo.getBoundingClientRect();
  // La palabra empieza al 30 % del ancho del logo: lo anterior es el isotipo, que por ahora dibuja el SVG.
  const palabra = logo.animate(destapar(caja.width, caja.height, caja.width * 0.3), {
    duration: T.palabra.dura,
    delay: T.palabra.inicio,
    easing: SUAVE,
    ...antes,
  });
  // Al terminar se retira el SVG y queda solo la imagen oficial, que es idéntica.
  // Escrito el isotipo, se desliza y se reduce hasta su lugar en el logo (el 28,96 % izquierdo de la imagen).
  const origen = svg.getBoundingClientRect();
  const dx = caja.left + (caja.width * 0.2896) / 2 - (origen.left + origen.width / 2);
  const dy = caja.top + caja.height / 2 - (origen.top + origen.height / 2);
  const viaje = svg.animate(
    [
      { transform: 'none' },
      { transform: `translate(${dx}px, ${dy}px) scale(${caja.height / origen.height})` },
    ],
    { duration: T.viaje.dura, delay: T.viaje.inicio, easing: DESLIZ, fill: 'forwards' },
  );
  const retirar = () => svg.remove();
  Promise.allSettled([viaje.finished, palabra.finished]).then(retirar);

  // El texto se destapa con el mismo barrido mientras el logo se escribe, y se apoya subiendo 12 px.
  texto.forEach((bloque, i) => {
    const [oculto, visible] = destapar(bloque.offsetWidth, bloque.offsetHeight);
    bloque.animate(
      [
        { ...oculto, transform: 'translateY(12px)' },
        { ...visible, transform: 'none' },
      ],
      {
        duration: T.texto.dura,
        delay: T.texto.inicio + i * T.texto.paso,
        easing: SUAVE,
        ...antes,
      },
    );
  });

  // El escritorio se arma por capas. Primero el marco, vacío.
  const { raiz, lienzo } = panel;
  raiz.animate(destapar(raiz.offsetWidth, raiz.offsetHeight), {
    duration: T.marco.dura,
    delay: T.marco.inicio,
    easing: SUAVE,
    ...antes,
  });

  // Capa 1 · Wallpaper: el cielo se destapa y cada forma del paisaje sube desde abajo, una tras otra, cada
  // una por delante de la anterior. La barra de tareas sube con ellas.
  const alto = lienzo.offsetHeight;
  const fondo = panel.fondo(raiz.dataset.tema as Tema);
  fondo.animate(destapar(lienzo.offsetWidth, alto), {
    duration: T.fondo.dura,
    delay: T.fondo.inicio,
    easing: SUAVE,
    ...antes,
  });
  [...fondo.children].slice(1).forEach((forma, i) => {
    const escondida = `translateY(${alto - (forma as SVGGraphicsElement).getBBox().y}px)`;
    forma.animate([{ transform: escondida }, { transform: 'none' }], {
      duration: T.capas.dura,
      delay: T.capas.inicio + i * T.capas.paso,
      easing: SUAVE,
      ...antes,
    });
  });
  panel.barra.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], {
    duration: T.capas.dura,
    delay: T.capas.inicio,
    easing: SUAVE,
    ...antes,
  });

  // Capa 2 · Widgets: suben juntos, apilados como capas (cada uno apoyado a 18° sobre el anterior), y
  // después cada uno se desliza a su lugar en la plantilla. La ventana es la última.
  const centro = (panel.piezas.length - 1) / 2;
  panel.piezas.forEach((pieza, i) => {
    const dx = lienzo.offsetWidth / 2 - (pieza.offsetLeft + pieza.offsetWidth / 2) + (i - centro) * 10;
    const dy = alto / 2 - (pieza.offsetTop + pieza.offsetHeight / 2) - (i - centro) * 30;
    const pila = `translate(${dx}px, ${dy}px) scale(0.72)`;
    pieza.animate(
      [
        { transform: `translateY(${alto}px) ${pila}`, easing: SUAVE },
        { transform: pila, offset: 0.4, easing: DESLIZ },
        { transform: 'none' },
      ],
      { duration: T.piezas.dura, delay: T.piezas.inicio + i * T.piezas.paso, ...antes },
    );
  });

  // Capa 3 · Información: la conversación con Windi se escribe mensaje a mensaje.
  panel.chat.forEach((mensaje, i) => {
    mensaje.animate(
      [
        { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(10px)' },
        { clipPath: 'inset(-8px)', transform: 'none' },
      ],
      { duration: T.chat.dura, delay: T.chat.inicio + i * T.chat.paso, easing: SUAVE, ...antes },
    );
  });
}

/**
 * Acomodar: aplica un cambio de posición y desliza cada elemento desde donde estaba hasta donde queda. Con
 * «reducir movimiento», el cambio es inmediato.
 */
export function deslizar<R>(panel: Panel, elementos: HTMLElement[], cambio: () => R, duracion = 520): R {
  const partida = elementos.map((elemento) => elemento.getBoundingClientRect());
  const resultado = cambio();
  if (!conMovimiento()) return resultado;
  // El lienzo está escalado: el desplazamiento medido en pantalla se pasa a medidas del lienzo.
  const escala = escalaDe(panel);
  elementos.forEach((elemento, i) => {
    const llegada = elemento.getBoundingClientRect();
    const dx = ((partida[i]?.left ?? llegada.left) - llegada.left) / escala;
    const dy = ((partida[i]?.top ?? llegada.top) - llegada.top) / escala;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    elemento.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: duracion,
      delay: i * 30,
      easing: DESLIZ,
      fill: 'backwards',
    });
  });
  return resultado;
}

/** Cambio de tema: el wallpaper nuevo se destapa a 18° y los widgets se deslizan a su plantilla. */
function cambiarTema(panel: Panel, tema: Tema) {
  const fondos = deslizar(panel, panel.piezas, () => aplicarTema(panel, tema), 900);
  const retirar = () => fondos.saliente?.classList.remove('fondo--saliente');
  if (!conMovimiento() || !fondos.saliente) {
    retirar();
    return;
  }
  const { offsetWidth: ancho, offsetHeight: alto } = panel.lienzo;
  fondos.entrante
    .animate(destapar(ancho, alto), { duration: 1000, easing: SUAVE })
    .finished.then(retirar, retirar);
}

/**
 * Pieza activa. En escritorio, la pieza del panel ligada a la función que tiene el puntero encima o, si no
 * hay ninguna, a la más cercana al centro de la ventana. Aquí solo se marca la pieza con una clase; cómo se
 * nota (sube y pasa a sombra de nivel 2, o borde de 3 px con «reducir movimiento») lo decide estilos.css.
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
