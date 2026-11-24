import { describe, expect, it } from 'vitest';
import { bloquearZoom } from './bloquearZoom';

describe('RD-69 · Zoom bloqueado en la ventana principal (D-04)', () => {
  it('cancela Ctrl + rueda y Ctrl + «+», «−» y «0», pero no la rueda ni las teclas sin Ctrl', () => {
    const dejar = bloquearZoom();
    const enviar = (evento: Event) => {
      window.dispatchEvent(evento);
      return evento.defaultPrevented;
    };
    expect(enviar(new WheelEvent('wheel', { ctrlKey: true, cancelable: true }))).toBe(true);
    expect(enviar(new KeyboardEvent('keydown', { key: '+', ctrlKey: true, cancelable: true }))).toBe(true);
    expect(enviar(new KeyboardEvent('keydown', { key: '-', ctrlKey: true, cancelable: true }))).toBe(true);
    expect(enviar(new KeyboardEvent('keydown', { key: '0', ctrlKey: true, cancelable: true }))).toBe(true);
    expect(enviar(new WheelEvent('wheel', { cancelable: true }))).toBe(false);
    expect(enviar(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, cancelable: true }))).toBe(false);
    dejar();
    expect(enviar(new WheelEvent('wheel', { ctrlKey: true, cancelable: true }))).toBe(false);
  });
});
