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
    const amable =
      'Solo puedo ayudarte con tus tarjetas y con la aplicación. ¿Revisamos lo que tienes para hoy?';
    await abrir(responde(amable));
    await escribir('¿Quién ganó el partido?');
    await seleccionar(enviar());
    // ET22, ET23: la respuesta del agente se muestra tal cual; el alcance lo fija windi-chat.
    expect(conversacion().at(-1)).toBe(amable);
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
});
