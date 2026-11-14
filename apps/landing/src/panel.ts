// Panel del escritorio (CD-01-HU01): una ilustración hecha con HTML y CSS, no una imagen, para poder moverla
// y cambiarle el tema. Es decorativa (`aria-hidden`): nada dentro es enfocable ni tiene rol. No lleva logo,
// isotipo ni ícono de la aplicación. Los textos son los de los mockups WG-MK-01, aprobados por Paula el
// 14-nov-2026.

export const TEMAS = [
  { id: 'windgets', nombre: 'Windgets' },
  { id: 'rojo-negro', nombre: 'Enfoque rojo y negro' },
  { id: 'rosa-pastel', nombre: 'Rosa pastel' },
] as const;

export type Tema = (typeof TEMAS)[number]['id'];

// Wallpapers de formas planas y sólidas, uno por tema: Amanecer, Bosque y Taller.
const FONDOS: Record<Tema, string> = {
  windgets:
    '<rect width="1200" height="750" fill="#E5FBFC"/><circle cx="700" cy="400" r="92" fill="#DCBA04"/><path d="M0 420C200 360 380 470 620 430C840 394 1000 330 1200 372V750H0Z" fill="#9FEFF3"/><path d="M0 500C220 450 420 548 660 510C880 476 1040 430 1200 462V750H0Z" fill="#00D9E2"/><path d="M0 580C240 536 460 622 700 590C900 562 1060 528 1200 552V750H0Z" fill="#6604E6"/><path d="M0 650C260 612 520 690 760 662C940 640 1080 618 1200 634V750H0Z" fill="#3D0A8A"/>',
  'rojo-negro':
    '<rect width="1200" height="750" fill="#DCE6D5"/><path d="M380 620 720 250l340 370Z" fill="#A9BEA7"/><path d="M820 620l240-240 140 140v100Z" fill="#A9BEA7"/><path d="M400 640l70-210 70 210Z" fill="#4C7A57"/><path d="M520 640 620 360l100 280Z" fill="#35593F"/><path d="M690 640l80-200 80 200Z" fill="#4C7A57"/><path d="M980 640l100-270 100 270Z" fill="#35593F"/><path d="M1100 640l60-170 40 90v80Z" fill="#4C7A57"/><rect x="380" y="620" width="820" height="130" fill="#2E4A36"/><rect width="380" height="750" fill="#141316"/><rect x="378" width="3" height="750" fill="#E0565B"/>',
  'rosa-pastel':
    '<rect width="1200" height="750" fill="#E6DCC8"/><rect x="770" y="28" width="330" height="150" rx="14" fill="#8C7A5C"/><rect x="786" y="44" width="141" height="134" fill="#B9D8DF"/><rect x="943" y="44" width="141" height="134" fill="#B9D8DF"/><rect x="150" y="62" width="44" height="60" fill="#C98B5A"/><rect x="214" y="40" width="36" height="82" fill="#6E947E"/><rect x="270" y="78" width="66" height="44" fill="#B8A078"/><rect x="120" y="122" width="250" height="8" fill="#8C6F52"/><rect y="560" width="1200" height="26" fill="#8C6F52"/><rect y="586" width="1200" height="164" fill="#B59C7A"/>',
};

const ICONO = (grosor: string, dibujo: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">${dibujo}</svg>`;
// «Pendiente» y «Completada» llevan ícono además de la palabra (R-12).
const RELOJ = ICONO('2.4', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
const HECHA = ICONO('2.8', '<path d="M5 13l4 4 10-11"/>');
const NUBE = ICONO(
  '2.2',
  '<path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.2A3.5 3.5 0 0 1 17 18z"/><path d="M9.5 14l2 2 3.5-4"/>',
);

const tarea = (nombre: string, completada = false) =>
  `<div class="tarea${completada ? ' tarea--completada' : ''}"><span class="tarea__nombre">${nombre}</span><span class="tarea__estado">${completada ? HECHA : RELOJ}<span>${completada ? 'Completada' : 'Pendiente'}</span></span></div>`;

// Octubre de 2026 empieza en jueves; el día 5 (lunes) es el de hoy en la ilustración.
const DIAS = [
  ...['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => `<span class="dia dia--nombre">${d}</span>`),
  '<span class="dia"></span>'.repeat(3),
  ...Array.from({ length: 31 }, (_, i) => `<span class="dia${i === 4 ? ' dia--hoy' : ''}">${i + 1}</span>`),
].join('');

// Las tres columnas por defecto del CA. Las tarjetas son bloques sin texto.
const columna = (nombre: string, tarjetas: number) =>
  `<div class="columna"><span class="columna__nombre">${nombre}</span>${'<span class="tarjeta"></span>'.repeat(tarjetas)}</div>`;

const windi = (clase: string, contenido: string) =>
  `<div class="chat__fila ${clase}"><span class="chat__avatar">W</span><div class="chat__mensaje">${contenido}</div></div>`;

const PIEZAS = `
<div class="banda"></div>
<div class="pieza reloj" data-pieza="reloj">
  <span class="reloj__titulo">Reloj</span>
  <span class="reloj__hora">10:20</span>
  <span class="reloj__fecha">lunes 5 de octubre</span>
</div>
<div class="pieza tareas" data-pieza="tareas">
  <div class="pieza__cabecera"><span class="pieza__titulo">Tareas del día</span><span class="pieza__dato">1 de 3 completadas</span></div>
  ${tarea('Entregar ensayo de historia')}
  ${tarea('Revisar avance del proyecto')}
  ${tarea('Caminar 30 minutos', true)}
</div>
<div class="pieza calendario" data-pieza="calendario">
  <div class="pieza__cabecera"><span class="pieza__titulo">Calendario</span><span class="pieza__dato">Octubre 2026</span></div>
  <div class="calendario__dias">${DIAS}</div>
</div>
<div class="pieza kanban" data-pieza="kanban">
  <span class="pieza__titulo">Kanban</span>
  <div class="kanban__columnas">${columna('Por hacer', 3)}${columna('En progreso', 2)}${columna('Hecho', 4)}</div>
</div>
<div class="pieza ventana" data-pieza="ventana">
  <div class="ventana__barra">
    <div class="ventana__pestanas"><span class="pestana pestana--activa">Planificador</span><span class="pestana">Personalización</span></div>
    <span class="sincronizado" data-pieza="sincronizado">${NUBE}<span>Sincronizado</span></span>
  </div>
  <div class="ventana__cuerpo">
    <span class="ventana__titulo">Agente de IA</span>
    ${windi('chat__saludo', '¡Hola! Soy Windi, el agente de IA de Windgets. ¿Qué organizamos hoy?')}
    <div class="chat__mensaje chat__mensaje--usuario">Mueve la mensualidad del gimnasio a Por hacer</div>
    ${windi(
      'chat__propuesta',
      '<span>¿Muevo "Pagar la mensualidad del gimnasio" a "Por hacer"?</span><span class="chat__acciones"><span class="chat__accion chat__accion--principal">Confirmar</span><span class="chat__accion">Rechazar</span></span>',
    )}
  </div>
</div>`;

export interface Panel {
  raiz: HTMLElement;
  lienzo: HTMLElement;
  /** Las cinco piezas, en el orden en que aterrizan: Reloj, Tareas del día, Calendario, Kanban y ventana. */
  piezas: HTMLElement[];
  sincronizado: HTMLElement;
  fondo(tema: Tema): SVGElement;
}

export function crearPanel(): Panel {
  const raiz = document.createElement('div');
  raiz.className = 'panel';
  raiz.setAttribute('aria-hidden', 'true');
  raiz.dataset.tema = TEMAS[0].id;
  const fondos = TEMAS.map(
    ({ id }, i) =>
      `<svg class="fondo${i === 0 ? ' fondo--activo' : ''}" data-fondo="${id}" viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice">${FONDOS[id]}</svg>`,
  ).join('');
  const barra = `<div class="barra">${'<span class="barra__icono"></span>'.repeat(4)}<span class="barra__hora">10:20</span></div>`;
  raiz.innerHTML = `<div class="lienzo">${fondos}<div class="rejilla">${PIEZAS}</div>${barra}</div>`;

  const uno = <T extends Element>(selector: string) => raiz.querySelector<T>(selector) as T;
  const lienzo = uno<HTMLElement>('.lienzo');
  ajustarEscala(raiz, lienzo);
  return {
    raiz,
    lienzo,
    piezas: ['reloj', 'tareas', 'calendario', 'kanban', 'ventana'].map((p) =>
      uno<HTMLElement>(`[data-pieza="${p}"]`),
    ),
    sincronizado: uno<HTMLElement>('[data-pieza="sincronizado"]'),
    fondo: (tema) => uno<SVGElement>(`[data-fondo="${tema}"]`),
  };
}

/**
 * El lienzo tiene un tamaño lógico fijo (1200 × 750; 600 × 450 por debajo de 1024 px) y se escala entero al
 * ancho del panel. `--visible` es la parte del ancho del lienzo que cabe en el panel: el resto se sale por
 * el borde.
 */
function ajustarEscala(raiz: HTMLElement, lienzo: HTMLElement) {
  const ajustar = () => {
    const visible = Number.parseFloat(getComputedStyle(raiz).getPropertyValue('--visible')) || 1;
    if (raiz.clientWidth === 0 || lienzo.offsetWidth === 0) return;
    lienzo.style.transform = `scale(${raiz.clientWidth / (lienzo.offsetWidth * visible)})`;
  };
  new ResizeObserver(ajustar).observe(raiz);
}

/**
 * Aplica el tema al panel y a la página (las miniaturas de las funciones usan sus colores). El wallpaper
 * anterior queda debajo como «saliente» hasta que quien llama lo retire al terminar el barrido.
 */
export function aplicarTema(panel: Panel, tema: Tema): { entrante: SVGElement; saliente: SVGElement | null } {
  const entrante = panel.fondo(tema);
  const anterior = panel.raiz.querySelector<SVGElement>('.fondo--activo');
  panel.raiz.querySelectorAll('.fondo--saliente').forEach((f) => f.classList.remove('fondo--saliente'));
  const saliente = anterior && anterior !== entrante ? anterior : null;
  saliente?.classList.replace('fondo--activo', 'fondo--saliente');
  entrante.classList.add('fondo--activo');
  panel.raiz.dataset.tema = tema;
  document.documentElement.dataset.tema = tema;
  return { entrante, saliente };
}
