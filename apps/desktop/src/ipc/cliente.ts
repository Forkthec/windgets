import { invoke, isTauri } from '@tauri-apps/api/core';
import type { CommandMap, CommandName, Invoke, Result } from '@/types';
import textos from '@/types/messages.es.json';
import { invocarSimulado } from './simulado';

// Cliente IPC tipado sobre CommandMap (mapa de comandos de tipos.ts). Las vistas llaman al Núcleo solo por
// aquí (convenciones.md, «Estilo»; D-188, reparto entre Rust y React). Cada comando recibe un único argumento
// `params` (docs/DUDAS.md). Fuera de Tauri responde el Núcleo simulado.
//
// RD-83: si Tauri rechaza la llamada (comando que falla al deserializar, permiso o panic), la vista recibe el error
// genérico como cualquier otro `Result`; el motivo no se registra porque los parámetros pueden llevar contraseñas.
export const invocar: Invoke = <K extends CommandName>(comando: K, params: CommandMap[K]['params']) =>
  isTauri()
    ? invoke<Result<CommandMap[K]['result']>>(comando, { params }).catch(
        (): Result<CommandMap[K]['result']> => ({
          ok: false,
          error: { code: 'internal.unexpected', message: textos.ERROR_INESPERADO },
        }),
      )
    : invocarSimulado(comando, params);
