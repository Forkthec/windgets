// HE-14-HU01 · Conversar por chat de texto con el agente de IA. Una prueba por CA en la vista; las reglas del
// Núcleo (saludo una vez, 2000 caracteres, 15 s, «Reintentar», historial) tienen su prueba ca_he_14_hu01_* en
// servicio_de_windi/pruebas.rs. El Núcleo de prueba simula la conversación de IPC-WIN-01 y 02.
import { act, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  Result,
  WindiConfirmProposalResult,
  WindiMessage,
  WindiProposal,
  WindiSendMessageResult,
} from '@/types';
import { abrirPantalla, llamadasA, screen } from '../kanban/pruebas';
import { Windi } from './Windi';

const SALUDO = '¡Hola, Prueba! Soy Windi. ¿Qué organizamos hoy con tus tarjetas o con la aplicación?';

type Respuesta = (mensaje: string) => Result<WindiSendMessageResult>;
type AlConfirmar = (id: string) => Result<WindiConfirmProposalResult>;

/** Abre el Agente de IA con un Núcleo que guarda la conversación y responde con `responder`. */
async function abrir(
  responder: Respuesta,
  {
    online = true,
    historial = [] as WindiMessage[],
    espera = Promise.resolve(),
    confirmar = undefined as AlConfirmar | undefined,
  } = {},
) {
  const mensajes: WindiMessage[] = [...historial];
  let n = 0;
  const agregar = (role: WindiMessage['role'], text: string, failed = false) => {
    n += 1;
    const m: WindiMessage = { id: `m${n}`, role, text, sent_at: '2026-11-14T19:25:00.000Z', failed };
    mensajes.push(m);
    return m;
  };
  const nucleo = await abrirPantalla('windi', 'Agente de IA', Windi, [], (nucleo) => {
    nucleo.responder('windi_get_conversation', () => {
      if (mensajes.length === 0) agregar('assistant', SALUDO);
      return { ok: true, value: { messages: [...mensajes], proposal: null, online } };
    });
    nucleo.responder('windi_send_message', (async ({ message }: { message: string }) => {
      const ultimo = mensajes.at(-1);
      if (ultimo?.role === 'user' && ultimo.failed && ultimo.text === message) ultimo.failed = false;
      else agregar('user', message);
      await espera;
      const r = responder(message);
      // CA08: con falla, el mensaje del usuario queda en el chat marcado como fallido.
      const enviado = mensajes.at(-1);
      if (!r.ok) {
        if (enviado) enviado.failed = true;
        return r;
      }
      // La respuesta es el mensaje que guarda el Núcleo: la vista pone la propuesta después de él.
      const m = agregar('assistant', r.value.reply.text);
      return { ...r, value: { ...r.value, reply: m } };
    }) as never);
    // HE-14-HU03: IPC-WIN-03 y 04 guardan la respuesta de Windi en la conversación.
    nucleo.responder('windi_confirm_proposal', (({ proposal_id }: { proposal_id: string }) => {
      const r: Result<WindiConfirmProposalResult> = confirmar
        ? confirmar(proposal_id)
        : {
            ok: true,
            value: {
              outcome: 'applied',
              reply: {
                id: '',
                role: 'assistant',
                text: 'Listo, ya hice el cambio.',
                sent_at: '',
                failed: false,
              },
              new_proposal: null,
            },
          };
      if (!r.ok) return r;
      const m = agregar('assistant', r.value.reply.text);
      return { ...r, value: { ...r.value, reply: m } };
    }) as never);
    nucleo.responder('windi_reject_proposal', (() => {
      const m = agregar(
        'assistant',
        'Entendido, no hice ningún cambio. ¿Quieres cambiar algo de la propuesta?',
      );
      return { ok: true, value: { reply: m } };
    }) as never);
  });
  return { nucleo };
}

function responde(texto: string): Respuesta {
  return () => ({
    ok: true,
    value: {
      reply: { id: 'r', role: 'assistant', text: texto, sent_at: '', failed: false },
      proposal: null,
    },
  });
}

const NO_DISPONIBLE: Respuesta = () => ({
  ok: false,
  error: { code: 'windi.unavailable', message: 'No pude responder en este momento. Intenta de nuevo.' },
});

function campo() {
  return screen.getByLabelText('Escribe un mensaje') as HTMLTextAreaElement;
}

function enviar() {
  return screen.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement;
}

function conversacion() {
  return within(screen.getByRole('list', { name: 'Conversación' }))
    .queryAllByRole('listitem')
    .map((li) => li.querySelector('p')?.textContent ?? li.textContent);
}

async function escribir(texto: string) {
  await act(async () => {
    fireEvent.change(campo(), { target: { value: texto } });
  });
}

async function seleccionar(boton: HTMLElement) {
  await act(async () => {
    fireEvent.click(boton);
  });
}

describe('HE-14-HU01 · Conversar con el agente de IA', () => {
  it('HE-14-HU01-CA01 · Abrir el chat', async () => {
    await abrir(responde(''));
    // ET01: el área de conversación, el campo con «0 / 2000» y «Enviar» deshabilitado (ET02).
    expect(screen.getByRole('list', { name: 'Conversación' })).toBeTruthy();
    expect(campo().value).toBe('');
    expect(screen.getByText('0 / 2000')).toBeTruthy();
    expect(enviar().disabled).toBe(true);
    // ET07, ET08, ET10: un solo mensaje del agente que saluda por el alias y se presenta como «Windi».
    expect(conversacion()).toEqual([SALUDO]);
    expect(screen.getByText('Windi')).toBeTruthy();
  });

  it('HE-14-HU01-CA02 · Enviar mensaje con el botón', async () => {
    let terminar: () => void = () => undefined;
    const espera = new Promise<void>((r) => (terminar = r));
    // La respuesta tarda: se ve «Escribiendo…» mientras tanto (ET06).
    const { nucleo } = await abrir(responde('¡Claro! ¿Qué tarjeta revisamos?'), { espera });
    await escribir('Hola Windi');
    expect(screen.getByText('10 / 2000')).toBeTruthy();
    expect(enviar().disabled).toBe(false);
    await seleccionar(enviar());
    // ET06: mi mensaje y el indicador «Escribiendo…».
    expect(conversacion()).toEqual([SALUDO, 'Hola Windi', 'Escribiendo…']);
    expect(campo().value).toBe('');
    expect(llamadasA(nucleo, 'windi_send_message')).toEqual([{ message: 'Hola Windi' }]);
    await act(async () => {
      terminar();
    });
    // Después, la respuesta del agente.
    expect(screen.queryByText('Escribiendo…')).toBeNull();
    expect(conversacion()).toEqual([SALUDO, 'Hola Windi', '¡Claro! ¿Qué tarjeta revisamos?']);
  });

  it('HE-14-HU01-CA03 · Enviar mensaje con la tecla Enter', async () => {
    const { nucleo } = await abrir(responde('¿Qué organizamos?'));
    await escribir('Hola');
    // ET05: «Enter» envía igual que «Enviar»; Mayúsculas + «Enter» no envía.
    await act(async () => {
      fireEvent.keyDown(campo(), { key: 'Enter', shiftKey: true });
    });
    expect(llamadasA(nucleo, 'windi_send_message')).toEqual([]);
    await act(async () => {
      fireEvent.keyDown(campo(), { key: 'Enter' });
    });
    expect(llamadasA(nucleo, 'windi_send_message')).toEqual([{ message: 'Hola' }]);
    expect(conversacion()).toEqual([SALUDO, 'Hola', '¿Qué organizamos?']);
  });

  it('HE-14-HU01-CA04 · Mensaje vacío', async () => {
    const { nucleo } = await abrir(responde(''));
    await escribir('    ');
    // ET02: con solo espacios, «Enviar» deshabilitado; «Enter» tampoco envía.
    expect(enviar().disabled).toBe(true);
    await act(async () => {
      fireEvent.keyDown(campo(), { key: 'Enter' });
    });
    expect(llamadasA(nucleo, 'windi_send_message')).toEqual([]);
  });

  it('HE-14-HU01-CA05 · Mensaje de más de 2000 caracteres', async () => {
    await abrir(responde(''));
    await escribir('a'.repeat(2000));
    expect(enviar().disabled).toBe(false);
    await escribir('a'.repeat(2001));
    // ET04: el mensaje y «Enviar» deshabilitado (RT-04).
    expect(screen.getByText('Tu mensaje no puede superar los 2000 caracteres.')).toBeTruthy();
    expect(screen.getByText('2001 / 2000')).toBeTruthy();
    expect(enviar().disabled).toBe(true);
  });

  it('HE-14-HU01-CA06 · Consulta fuera del alcance', async () => {
    // v12, ET26: el mensaje fijo (lo pone el Núcleo); ET25: la propuesta activa sigue activa.
    const fijo =
      'Solo puedo ayudarte con tus tarjetas y con Windgets. Por ejemplo, puedo crear una tarjeta o contarte qué tienes para hoy.';
    let n = 0;
    const activa: WindiProposal = {
      id: 'p1',
      action: 'edit',
      items: [{ card_id: 't1', current: null, changes: { title: 'Informe final' }, title: 'Informe' }],
      warnings: [],
      state: 'active',
    };
    await abrir((m) => {
      n += 1;
      return n === 1 ? proponer(activa)(m) : responde(fijo)(m);
    });
    await escribir('Cambia el informe');
    await seleccionar(enviar());
    await escribir('¿Quién ganó el partido?');
    await seleccionar(enviar());
    expect(conversacion().at(-1)).toBe(fijo);
    const propuesta = screen.getAllByRole('region', { name: 'Propuesta' })[0] as HTMLElement;
    expect((within(propuesta).getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('HE-14-HU01-CA07 · Agente de IA sin conexión', async () => {
    const historial: WindiMessage[] = [
      { id: 'h1', role: 'assistant', text: SALUDO, sent_at: '', failed: false },
      { id: 'h2', role: 'user', text: 'Hola', sent_at: '', failed: false },
    ];
    const { nucleo } = await abrir(responde(''), { online: false, historial });
    // ET13: el historial y el aviso (RT-04); ET12: campo y «Enviar» deshabilitados.
    expect(conversacion()).toEqual([SALUDO, 'Hola']);
    expect(
      screen.getByText(
        'El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.',
      ),
    ).toBeTruthy();
    expect(campo().disabled).toBe(true);
    expect(enviar().disabled).toBe(true);
    // Al volver la conexión (EV-03) se puede escribir de nuevo.
    nucleo.emitir('connectivity_changed', { online: true });
    await act(async () => {});
    expect(campo().disabled).toBe(false);
  });

  it('HE-14-HU01-CA08 · Error del servicio de IA', async () => {
    let intentos = 0;
    const { nucleo } = await abrir((m) => {
      intentos += 1;
      return intentos === 1 ? NO_DISPONIBLE(m) : responde('Ya estoy aquí.')(m);
    });
    await escribir('Ayúdame');
    await seleccionar(enviar());
    // ET16: mi mensaje se conserva y aparece el mensaje con «Reintentar».
    expect(conversacion()).toEqual([SALUDO, 'Ayúdame']);
    expect(screen.getByText('No pude responder en este momento. Intenta de nuevo.')).toBeTruthy();
    await seleccionar(screen.getByRole('button', { name: 'Reintentar' }));
    // «Reintentar» vuelve a enviar el mismo mensaje, sin duplicarlo.
    expect(llamadasA(nucleo, 'windi_send_message')).toEqual([{ message: 'Ayúdame' }, { message: 'Ayúdame' }]);
    expect(conversacion()).toEqual([SALUDO, 'Ayúdame', 'Ya estoy aquí.']);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  it('HE-14-HU01-CA09 · Solicitud ambigua', async () => {
    await abrir(responde('¿Qué tarjeta quieres cambiar?'));
    await escribir('Cámbiala');
    await seleccionar(enviar());
    // ET21: una sola pregunta concreta, sin propuesta.
    expect(conversacion().at(-1)).toBe('¿Qué tarjeta quieres cambiar?');
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
  });
});

function propuesta(id: string, titulo: string): WindiProposal {
  return {
    id,
    action: 'edit',
    items: [{ card_id: `t-${id}`, current: null, changes: { title: titulo }, title: titulo }],
    warnings: [],
    state: 'active',
  };
}

function proponer(...lista: WindiProposal[]): Respuesta {
  let i = 0;
  return () => {
    const p = lista[Math.min(i, lista.length - 1)] ?? null;
    i += 1;
    return {
      ok: true,
      value: {
        reply: {
          id: 'r',
          role: 'assistant',
          text: `Te propongo: ${p?.items[0]?.title}`,
          sent_at: '',
          failed: false,
        },
        proposal: p,
      },
    };
  };
}

async function pedir(texto: string) {
  await escribir(texto);
  await seleccionar(enviar());
}

function propuestas() {
  return screen.queryAllByRole('region', { name: 'Propuesta' });
}

function boton(region: HTMLElement | undefined, nombre: string) {
  if (!region) throw new Error('sin propuesta');
  return within(region).getByRole('button', { name: nombre }) as HTMLButtonElement;
}

describe('HE-14-HU03 · Confirmar una propuesta del agente de IA', () => {
  it('HE-14-HU03-CA01 · Confirmar una propuesta', async () => {
    const { nucleo } = await abrir(proponer(propuesta('p1', 'Informe final')));
    await pedir('Cambia el título del informe');
    // ET02: la propuesta con «Confirmar» y «Rechazar».
    const [p] = propuestas();
    expect(within(p as HTMLElement).getByText('Informe final')).toBeTruthy();
    await seleccionar(boton(p, 'Confirmar'));
    // ET01, ET08: se aplica en el Núcleo y Windi confirma el cambio.
    expect(llamadasA(nucleo, 'windi_confirm_proposal')).toEqual([{ proposal_id: 'p1' }]);
    expect(conversacion()).toContain('Listo, ya hice el cambio.');
    expect(boton(propuestas()[0], 'Confirmar').disabled).toBe(true);
  });

  it('HE-14-HU03-CA02 · Confirmar una propuesta sin conexión', async () => {
    await abrir(proponer(propuesta('p1', 'Informe final')), {
      confirmar: () => ({
        ok: false,
        error: { code: 'net.offline', message: 'Se perdió la conexión. No se hizo ningún cambio.' },
      }),
    });
    await pedir('Cambia el título del informe');
    await seleccionar(boton(propuestas()[0], 'Confirmar'));
    // ET07: el aviso y «Confirmar» y «Rechazar» deshabilitados; no hay respuesta de cambio hecho.
    expect(screen.getByText('Se perdió la conexión. No se hizo ningún cambio.')).toBeTruthy();
    expect(boton(propuestas()[0], 'Confirmar').disabled).toBe(true);
    expect(boton(propuestas()[0], 'Rechazar').disabled).toBe(true);
    expect(conversacion()).not.toContain('Listo, ya hice el cambio.');
  });

  it('HE-14-HU03-CA03 · Propuesta desactualizada', async () => {
    const explicacion =
      'No hice ningún cambio porque tus tarjetas cambiaron desde que te lo propuse: «Informe» tiene otro valor en título.';
    await abrir(proponer(propuesta('p1', 'Informe final')), {
      confirmar: () => ({
        ok: true,
        value: {
          outcome: 'stale',
          reply: { id: '', role: 'assistant', text: explicacion, sent_at: '', failed: false },
          new_proposal: propuesta('p2', 'Informe revisado'),
        },
      }),
    });
    await pedir('Cambia el título del informe');
    await seleccionar(boton(propuestas()[0], 'Confirmar'));
    // ET05, ET06: no se aplica; Windi explica qué cambió y muestra la propuesta nueva con los datos actuales.
    expect(conversacion()).toContain(explicacion);
    const [vieja, nueva] = propuestas();
    expect(within(vieja as HTMLElement).getByText('Descartada')).toBeTruthy();
    expect(within(nueva as HTMLElement).getByText('Informe revisado')).toBeTruthy();
    expect(boton(nueva, 'Confirmar').disabled).toBe(false);
  });

  it('HE-14-HU03-CA04 · Una sola propuesta activa', async () => {
    const { nucleo } = await abrir(
      proponer(propuesta('p1', 'Informe final'), propuesta('p2', 'Informe corto')),
    );
    await pedir('Cambia el título del informe');
    await pedir('Mejor algo más corto');
    // ET03, ET04: la anterior queda «Descartada» con sus opciones deshabilitadas.
    const [anterior, nueva] = propuestas();
    expect(within(anterior as HTMLElement).getByText('Descartada')).toBeTruthy();
    expect(boton(anterior, 'Confirmar').disabled).toBe(true);
    expect(boton(anterior, 'Rechazar').disabled).toBe(true);
    await seleccionar(boton(nueva, 'Confirmar'));
    // Solo se aplica la nueva.
    expect(llamadasA(nucleo, 'windi_confirm_proposal')).toEqual([{ proposal_id: 'p2' }]);
  });

  it('HE-14-HU03-CA07 · No se puede aplicar la propuesta', async () => {
    const { nucleo } = await abrir(proponer(propuesta('p1', 'Informe final')), {
      confirmar: () => ({
        ok: false,
        error: {
          code: 'windi.apply_failed',
          message: 'No pude aplicar los cambios. No se hizo ningún cambio.',
        },
      }),
    });
    await pedir('Cambia el título del informe');
    await seleccionar(boton(propuestas()[0], 'Confirmar'));
    // ET12 (RT-04): el aviso, y «Confirmar» y «Rechazar» siguen habilitadas; no hay respuesta de cambio hecho.
    expect(screen.getByText('No pude aplicar los cambios. No se hizo ningún cambio.')).toBeTruthy();
    expect(boton(propuestas()[0], 'Confirmar').disabled).toBe(false);
    expect(boton(propuestas()[0], 'Rechazar').disabled).toBe(false);
    expect(conversacion()).not.toContain('Listo, ya hice el cambio.');
    // Se puede volver a confirmar.
    await seleccionar(boton(propuestas()[0], 'Confirmar'));
    expect(llamadasA(nucleo, 'windi_confirm_proposal')).toHaveLength(2);
  });
});

describe('HE-14-HU05 · Editar tarjetas con el agente de IA', () => {
  it('HE-14-HU05-CA01 · Editar con confirmación', async () => {
    // ET01: el valor actual y el nuevo de cada dato que cambia.
    const edicion: WindiProposal = {
      id: 'p1',
      action: 'edit',
      items: [
        {
          card_id: 't1',
          current: { title: 'Informe', due_date: '2026-11-20' },
          changes: { title: 'Informe final', due_date: '2026-11-22' },
          title: 'Informe',
        },
      ],
      warnings: [],
      state: 'active',
    };
    await abrir(proponer(edicion));
    await pedir('Cambia el informe');
    const cambios = within(propuestas()[0] as HTMLElement).getByRole('list', { name: 'Cambios' });
    expect(within(cambios).getByText('Título: Informe → Informe final')).toBeTruthy();
    expect(within(cambios).getByText('Fecha límite: 20/11/2026 → 22/11/2026')).toBeTruthy();
  });

  it('HE-14-HU05-CA06 · Editar una tarjeta completada', async () => {
    // ET05: el aviso en la propuesta, con «Confirmar» y «Rechazar» habilitados.
    const aviso = 'Esta tarjeta está completada. Editarla no cambia su columna.';
    await abrir(
      proponer({
        id: 'p1',
        action: 'edit',
        items: [
          {
            card_id: 't1',
            current: { title: 'Informe' },
            changes: { title: 'Informe final' },
            title: 'Informe',
          },
        ],
        warnings: [aviso],
        state: 'active',
      }),
    );
    await pedir('Cambia el informe');
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getByText(aviso)).toBeTruthy();
    expect(boton(p, 'Confirmar').disabled).toBe(false);
  });

  /** Una propuesta de edición con los elementos dados. */
  const editar = (...items: WindiProposal['items']): WindiProposal => ({
    id: 'p1',
    action: 'edit',
    items,
    warnings: [],
    state: 'active',
  });
  const cambiosDe = (i: number) =>
    within(
      within(propuestas()[0] as HTMLElement).getAllByRole('list', { name: 'Cambios' })[i] as HTMLElement,
    );

  it('HE-14-HU05-CA08 · Editar varias tarjetas en una propuesta', async () => {
    // ET10: una sola propuesta con cada tarjeta, su valor actual y su valor nuevo.
    await abrir(
      proponer(
        editar(
          {
            card_id: 't1',
            current: { due_date: '2026-11-10' },
            changes: { due_date: '2026-11-20' },
            title: 'Luz',
          },
          {
            card_id: 't2',
            current: { due_date: '2026-11-12' },
            changes: { due_date: '2026-11-20' },
            title: 'Agua',
          },
        ),
      ),
    );
    await pedir('Pasa mis vencidas al viernes');
    expect(propuestas()).toHaveLength(1);
    const texto = propuestas()[0]?.textContent ?? '';
    expect(texto).toContain('Luz');
    expect(texto).toContain('Agua');
    expect(cambiosDe(0).getByText('Fecha límite: 10/11/2026 → 20/11/2026')).toBeTruthy();
    expect(cambiosDe(1).getByText('Fecha límite: 12/11/2026 → 20/11/2026')).toBeTruthy();
  });

  it('HE-14-HU05-CA09 · Agregar una etiqueta', async () => {
    // ET11: las etiquetas por su nombre (Estudio = e1, Casa = e2 en el Núcleo de prueba).
    await abrir(
      proponer(
        editar({
          card_id: 't1',
          current: { label_ids: ['e1'] },
          changes: { label_ids: ['e1', 'e2'] },
          title: 'Informe',
        }),
      ),
    );
    await pedir('Ponle la etiqueta Casa al informe');
    expect(cambiosDe(0).getByText('Etiquetas: Estudio → Estudio, Casa')).toBeTruthy();
    expect(boton(propuestas()[0], 'Confirmar').disabled).toBe(false);
    expect(boton(propuestas()[0], 'Rechazar').disabled).toBe(false);
  });

  it('HE-14-HU05-CA10 · Etiqueta que no existe', async () => {
    // HE-14-HU03-ET10: el Núcleo responde el motivo sin propuesta.
    const texto = 'No tienes la etiqueta “Viaje”. Tus etiquetas son: Estudio, Casa.';
    await abrir(responde(texto));
    await pedir('Ponle la etiqueta Viaje al informe');
    expect(conversacion()).toContain(texto);
    expect(propuestas()).toHaveLength(0);
  });

  it('HE-14-HU05-CA11 · Asignar el bloque horario', async () => {
    await abrir(
      proponer(
        editar({
          card_id: 't1',
          current: { time_block: null } as never,
          changes: { time_block: { date: '2026-11-15', start_hour: 10, end_hour: 11 } } as never,
          title: 'Estudiar redes',
        }),
      ),
    );
    await pedir('Ponla mañana de 10 a 11');
    expect(
      cambiosDe(0).getByText('Bloque horario: Sin bloque horario → 10:00 – 11:00 del 15/11/2026'),
    ).toBeTruthy();
  });

  it('HE-14-HU05-CA12 · Quitar el bloque horario', async () => {
    await abrir(
      proponer(
        editar({
          card_id: 't1',
          current: { time_block: { date: '2026-11-15', start_hour: 10, end_hour: 11 } } as never,
          changes: { time_block: null } as never,
          title: 'Estudiar redes',
        }),
      ),
    );
    await pedir('Quítala del horario');
    expect(cambiosDe(0).getByText('Bloque horario: 10:00 – 11:00 → Sin bloque horario')).toBeTruthy();
  });

  it('HE-14-HU05-ET12 · La prioridad y la descripción se pueden quitar', async () => {
    await abrir(
      proponer(
        editar({
          card_id: 't1',
          current: { priority: 'high', description: 'Para el lunes' },
          changes: { priority: null, description: null },
          title: 'Informe',
        }),
      ),
    );
    await pedir('Quítale la prioridad y la descripción');
    expect(cambiosDe(0).getByText('Prioridad: Alta → Sin prioridad')).toBeTruthy();
    expect(cambiosDe(0).getByText('Descripción: Para el lunes → Sin descripción')).toBeTruthy();
  });
});

describe('HE-14-HU04 · Crear tarjetas con el agente de IA', () => {
  it('HE-14-HU04-ET10 · La propuesta de creación muestra los datos de cada tarjeta', async () => {
    await abrir(
      proponer({
        id: 'p1',
        action: 'create',
        items: [
          {
            card_id: null,
            current: null,
            changes: {
              type: 'reminder',
              title: 'Pagar la luz',
              due_date: '2026-11-27',
              priority: 'high',
              label_ids: ['e2'],
              description: 'Antes del mediodía',
            },
            title: 'Pagar la luz',
          },
          {
            card_id: null,
            current: null,
            changes: { title: 'Comprar pan', due_date: '2026-11-20' },
            title: 'Comprar pan',
          },
        ],
        warnings: [],
        state: 'active',
      }),
    );
    await pedir('Crea Pagar la luz y Comprar pan');
    const datos = (i: number) =>
      within(within(propuestas()[0] as HTMLElement).getAllByRole('list', { name: 'Datos' })[i] as HTMLElement)
        .getAllByRole('listitem')
        .map((li) => li.textContent);
    expect(datos(0)).toEqual([
      'Tipo: Recordatorio',
      'Fecha límite: 27/11/2026',
      'Prioridad: Alta',
      'Etiquetas: Casa',
      'Descripción: Antes del mediodía',
    ]);
    // Sin tipo, la tarjeta es Tarea (HE-14-HU04-ET02); lo que no tiene no se muestra.
    expect(datos(1)).toEqual(['Tipo: Tarea', 'Fecha límite: 20/11/2026']);
  });

  it('HE-14-HU04-CA10 · Crear una tarjeta con bloque horario', async () => {
    await abrir(
      proponer({
        id: 'p1',
        action: 'create',
        items: [
          {
            card_id: null,
            current: null,
            changes: {
              title: 'Estudiar redes',
              due_date: '2026-11-15',
              time_block: { date: '2026-11-15', start_hour: 10, end_hour: 11 },
            } as never,
            title: 'Estudiar redes',
          },
        ],
        warnings: [],
        state: 'active',
      }),
    );
    await pedir('Crea Estudiar redes para mañana de 10 a 11');
    expect(
      within(propuestas()[0] as HTMLElement).getByText('Bloque horario: 10:00 – 11:00 del 15/11/2026'),
    ).toBeTruthy();
  });
});

describe('HE-14-HU06 · Mover tarjetas con el agente de IA', () => {
  const mover = (warnings: string[]): WindiProposal => ({
    id: 'p1',
    action: 'move',
    items: [
      {
        card_id: 't1',
        current: { column_id: 'c1' },
        changes: {
          column_id: 'c3',
          from_column: 'Por hacer',
          to_column: 'Hecho',
        } as unknown as WindiProposal['items'][number]['changes'],
        title: 'Informe',
      },
    ],
    warnings,
    state: 'active',
  });

  it('HE-14-HU06-CA01 · Mover con confirmación', async () => {
    // ET01: la columna actual y la de destino, con «Confirmar» y «Rechazar».
    await abrir(proponer(mover([])));
    await pedir('Mueve el informe a Hecho');
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getByText('Columna: Por hacer → Hecho')).toBeTruthy();
    expect(boton(p, 'Confirmar').disabled).toBe(false);
    expect(boton(p, 'Rechazar').disabled).toBe(false);
  });

  it('HE-14-HU06-CA06 · Mover una tarjeta completada', async () => {
    const aviso =
      'Esta tarjeta está completada. Si la mueves, dejará de estar completada y se borrará su fecha de completado.';
    await abrir(proponer(mover([aviso])));
    await pedir('Devuelve el informe a Por hacer');
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getByText(aviso)).toBeTruthy();
    expect(boton(p, 'Confirmar').disabled).toBe(false);
  });

  it('HE-14-HU06-CA09 · Mover varias tarjetas', async () => {
    // ET12: una sola propuesta con cada tarjeta, su columna actual y la de destino.
    const item = (card_id: string, title: string) => ({
      card_id,
      current: { column_id: 'c1' },
      changes: {
        column_id: 'c2',
        from_column: 'Por hacer',
        to_column: 'En progreso',
      } as unknown as WindiProposal['items'][number]['changes'],
      title,
    });
    await abrir(
      proponer({
        id: 'p1',
        action: 'move',
        items: [item('t1', 'Luz'), item('t2', 'Agua'), item('t3', 'Gas')],
        warnings: [],
        state: 'active',
      }),
    );
    await pedir('Mueve todas las de Por hacer a En progreso');
    expect(propuestas()).toHaveLength(1);
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getAllByText('Columna: Por hacer → En progreso')).toHaveLength(3);
    for (const t of ['Luz', 'Agua', 'Gas']) expect(p.textContent).toContain(t);
  });
});

describe('HE-14-HU07 · Eliminar tarjetas con el agente de IA', () => {
  const SIN_DESHACER = 'Esta acción no se puede deshacer.';
  const eliminar = (titulos: string[], warnings: string[]): WindiProposal => ({
    id: 'p1',
    action: 'delete',
    items: titulos.map((t, i) => ({ card_id: `t${i}`, current: { title: t }, changes: null, title: t })),
    warnings,
    state: 'active',
  });

  it('HE-14-HU07-CA01 · Eliminar con confirmación', async () => {
    await abrir(proponer(eliminar(['Informe'], [SIN_DESHACER])));
    await pedir('Elimina el informe');
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getByText('Informe')).toBeTruthy();
    expect(within(p).getByText(SIN_DESHACER)).toBeTruthy();
    expect(boton(p, 'Confirmar').disabled).toBe(false);
    expect(boton(p, 'Rechazar').disabled).toBe(false);
  });

  it('HE-14-HU07-CA02 · Eliminar varias tarjetas', async () => {
    await abrir(proponer(eliminar(['Comprar pan', 'Llamar a mamá', 'Cita médica'], [SIN_DESHACER])));
    await pedir('Elimina las de Por hacer');
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getByText('3 tarjetas')).toBeTruthy();
    expect(within(p).getByText('Cita médica')).toBeTruthy();
  });

  it('HE-14-HU07-CA06 · Eliminar una tarjeta completada', async () => {
    const texto = 'Esta tarjeta está completada. Si la eliminas, dejará de contar en tus reportes.';
    await abrir(proponer(eliminar(['Informe'], [SIN_DESHACER, texto])));
    await pedir('Elimina el informe');
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getByText(texto)).toBeTruthy();
  });
});

describe('HE-15-HU02 · Funciones que requieren conexión', () => {
  it('HE-15-HU02-CA05 · Funciones que requieren conexión (agente de IA)', async () => {
    await abrir(responde(''), { online: false });
    // ET08: el agente de IA deshabilitado con el aviso de falta de conexión de su pantalla (HE-14-HU01).
    expect(
      screen.getByText(
        'El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.',
      ),
    ).toBeTruthy();
    expect(campo().disabled).toBe(true);
    expect(enviar().disabled).toBe(true);
  });
});

describe('HE-14-HU10 · Crear etiquetas con el agente de IA (P29)', () => {
  it('HE-14-HU10-CA01 · la propuesta muestra el nombre y el color de cada etiqueta nueva', async () => {
    const propuesta: WindiProposal = {
      id: 'p1',
      action: 'create_label',
      items: [
        {
          card_id: null,
          current: null,
          changes: { name: 'Universidad', color_id: 'blue', color_name: 'Azul', hex: '#2196F3' } as never,
          title: 'Universidad',
        },
      ],
      warnings: [],
      state: 'active',
    };
    await abrir(proponer(propuesta));
    await pedir('Crea la etiqueta Universidad azul');
    const p = propuestas()[0] as HTMLElement;
    expect(within(p).getByText('Universidad')).toBeTruthy();
    expect(within(p).getByText('Color: Azul')).toBeTruthy();
    expect(boton(p, 'Confirmar').disabled).toBe(false);
  });
});
