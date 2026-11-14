// Interacción del escritorio de ejemplo (CD-01-HU01). El panel no es una imagen: se puede usar, con puntero
// y con teclado. Las tareas se completan, el calendario elige un día, las tarjetas del Kanban cambian de
// columna (arrastrando o pulsando), las pestañas de la ventana cambian de vista y la propuesta de Windi se
// confirma o se rechaza. Todo ocurre en la página: no se guarda nada ni se llama a ningún servicio, y no
// aparece ningún texto que no esté ya en el panel.
import { deslizar } from './movimiento';
import { estadoDeTarea, type Panel, type Tema } from './panel';

/** Tarjetas que caben en una columna del Kanban con la plantilla más baja. */
const TOPE_DE_COLUMNA = 4;

function tareas(raiz: HTMLElement) {
  const lista = [...raiz.querySelectorAll<HTMLButtonElement>('.tarea')];
  const dato = raiz.querySelector('.tareas .pieza__dato');
  for (const tarea of lista) {
    tarea.addEventListener('click', () => {
      const completada = tarea.getAttribute('aria-pressed') !== 'true';
      tarea.setAttribute('aria-pressed', String(completada));
      const estado = tarea.querySelector('.tarea__estado');
      if (estado) estado.innerHTML = estadoDeTarea(completada);
      const hechas = lista.filter((t) => t.getAttribute('aria-pressed') === 'true').length;
      if (dato) dato.textContent = `${hechas} de ${lista.length} completadas`;
    });
  }
}

/** Un día elegido a la vez. Entre días se pasa con las flechas; solo el elegido entra en la tabulación. */
function calendario(raiz: HTMLElement) {
  const dias = [...raiz.querySelectorAll<HTMLButtonElement>('.dia--numero')];
  const elegir = (dia: HTMLButtonElement) => {
    for (const otro of dias) {
      otro.setAttribute('aria-pressed', String(otro === dia));
      otro.tabIndex = otro === dia ? 0 : -1;
    }
  };
  const SALTOS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  dias.forEach((dia, i) => {
    dia.addEventListener('click', () => elegir(dia));
    dia.addEventListener('keydown', (evento) => {
      const destino = dias[i + (SALTOS[evento.key] ?? 0)];
      if (!destino || destino === dia) return;
      evento.preventDefault();
      elegir(destino);
      destino.focus();
    });
  });
}

function kanban(panel: Panel) {
  const columnas = [...panel.raiz.querySelectorAll<HTMLElement>('.columna')];
  const tarjetas = () => [...panel.raiz.querySelectorAll<HTMLElement>('.tarjeta')];
  const conSitio = (columna: HTMLElement) => columna.querySelectorAll('.tarjeta').length < TOPE_DE_COLUMNA;
  /** Pasa la tarjeta a la columna si cabe; todas las tarjetas se deslizan a su sitio nuevo. */
  const mover = (tarjeta: HTMLElement, columna: HTMLElement | undefined) => {
    deslizar(panel, tarjetas(), () => {
      tarjeta.style.transform = '';
      if (columna && columna !== tarjeta.parentElement && conSitio(columna)) columna.append(tarjeta);
    });
  };

  for (const tarjeta of tarjetas()) {
    let inicio: { x: number; y: number } | null = null;
    let arrastrada = false;
    tarjeta.addEventListener('pointerdown', (evento) => {
      if (evento.button !== 0) return;
      inicio = { x: evento.clientX, y: evento.clientY };
      arrastrada = false;
      tarjeta.setPointerCapture(evento.pointerId);
    });
    tarjeta.addEventListener('pointermove', (evento) => {
      if (!inicio) return;
      const dx = evento.clientX - inicio.x;
      const dy = evento.clientY - inicio.y;
      if (!arrastrada && Math.hypot(dx, dy) < 4) return;
      arrastrada = true;
      tarjeta.classList.add('tarjeta--arrastrada');
      // El lienzo está escalado: el movimiento del puntero se pasa a medidas del lienzo.
      const escala = panel.lienzo.getBoundingClientRect().width / panel.lienzo.offsetWidth || 1;
      tarjeta.style.transform = `translate(${dx / escala}px, ${dy / escala}px)`;
    });
    const soltar = (evento: PointerEvent) => {
      if (!inicio) return;
      inicio = null;
      if (!arrastrada) return;
      tarjeta.classList.remove('tarjeta--arrastrada');
      const caja = tarjeta.getBoundingClientRect();
      const x = caja.left + caja.width / 2;
      const y = caja.top + caja.height / 2;
      const destino = columnas.find((columna) => {
        const c = columna.getBoundingClientRect();
        return x >= c.left && x <= c.right && y >= c.top && y <= c.bottom;
      });
      // Si el arrastre se cancela o cae fuera de las columnas, la tarjeta vuelve a su sitio.
      mover(tarjeta, evento.type === 'pointerup' ? destino : undefined);
    };
    tarjeta.addEventListener('pointerup', soltar);
    tarjeta.addEventListener('pointercancel', soltar);
    // Sin arrastrar (un toque o el teclado), la tarjeta pasa a la columna siguiente que tenga sitio.
    tarjeta.addEventListener('click', () => {
      if (arrastrada) {
        arrastrada = false;
        return;
      }
      const actual = columnas.indexOf(tarjeta.parentElement as HTMLElement);
      const siguientes = columnas.map((_, i) => columnas[(actual + 1 + i) % columnas.length]);
      mover(
        tarjeta,
        siguientes.find((columna) => columna && conSitio(columna)),
      );
      tarjeta.focus();
    });
  }
  return { columnas, mover };
}

/**
 * La propuesta de Windi. «Confirmar» mueve una tarjeta a «Por hacer» en el Kanban, que es lo que la propuesta
 * dice; «Rechazar» no cambia nada. Después las dos opciones quedan deshabilitadas y la elegida, marcada.
 */
function propuesta(panel: Panel, tablero: ReturnType<typeof kanban>) {
  const opciones = [...panel.raiz.querySelectorAll<HTMLButtonElement>('[data-respuesta]')];
  for (const opcion of opciones) {
    opcion.addEventListener('click', () => {
      for (const otra of opciones) {
        otra.disabled = true;
        otra.classList.toggle('chat__accion--elegida', otra === opcion);
      }
      if (opcion.dataset.respuesta !== 'confirmar') return;
      const [porHacer, ...resto] = tablero.columnas;
      const tarjeta = resto.map((columna) => columna.querySelector<HTMLElement>('.tarjeta')).find(Boolean);
      if (!tarjeta) return;
      tarjeta.classList.add('tarjeta--movida');
      tablero.mover(tarjeta, porHacer);
    });
  }
}

/** Pestañas de la ventana: «Planificador» (la conversación) y «Personalización» (los tres temas). */
function pestanas(raiz: HTMLElement, elegirTema: (tema: Tema) => void) {
  const lista = [...raiz.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const activar = (pestana: HTMLButtonElement) => {
    for (const otra of lista) {
      const activa = otra === pestana;
      otra.setAttribute('aria-selected', String(activa));
      otra.tabIndex = activa ? 0 : -1;
      const vista = raiz.querySelector<HTMLElement>(`#${otra.getAttribute('aria-controls')}`);
      if (vista) vista.hidden = !activa;
    }
  };
  lista.forEach((pestana, i) => {
    pestana.addEventListener('click', () => activar(pestana));
    pestana.addEventListener('keydown', (evento) => {
      if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
      const otra = lista[(i + 1) % lista.length];
      if (!otra) return;
      evento.preventDefault();
      activar(otra);
      otra.focus();
    });
  });
  for (const opcion of raiz.querySelectorAll<HTMLElement>('[data-elegir]')) {
    opcion.addEventListener('click', () => elegirTema(opcion.dataset.elegir as Tema));
  }
}

/** Activa los controles del panel. `elegirTema` es la misma acción que «Elige un tema» de la página. */
export function activarPanel(panel: Panel, elegirTema: (tema: Tema) => void) {
  tareas(panel.raiz);
  calendario(panel.raiz);
  propuesta(panel, kanban(panel));
  pestanas(panel.raiz, elegirTema);
}
