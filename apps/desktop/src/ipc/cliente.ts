import { invoke, isTauri } from '@tauri-apps/api/core';
import type { CommandMap, CommandName, Invoke, Result } from '@/types';
import { invocarSimulado } from './simulado';

// Cliente IPC tipado sobre CommandMap (mapa de comandos de tipos.ts). Las vistas llaman al Núcleo solo por
// aquí (convenciones.md, «Estilo»; D-188, reparto entre Rust y React). Cada comando recibe un único argumento
// `params` (docs/DUDAS.md). Fuera de Tauri responde el Núcleo simulado.
export const invocar: Invoke = <K extends CommandName>(comando: K, params: CommandMap[K]['params']) =>
  isTauri() ? invoke<Result<CommandMap[K]['result']>>(comando, { params }) : invocarSimulado();
