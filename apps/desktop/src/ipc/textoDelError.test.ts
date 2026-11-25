import { describe, expect, it } from 'vitest';
import { textoDelError } from './textoDelError';

describe('RD-83 · El texto con el que se muestra un error', () => {
  it('RD-83 · muestra el texto del Núcleo cuando lo trae', () => {
    expect(textoDelError({ message: 'Esta tarjeta ya no existe.' })).toBe('Esta tarjeta ya no existe.');
  });

  it('RD-83 · sin texto, muestra el genérico de RD-24', () => {
    expect(textoDelError({ message: '' })).toBe('Ocurrió un error inesperado. Intenta de nuevo.');
  });
});
