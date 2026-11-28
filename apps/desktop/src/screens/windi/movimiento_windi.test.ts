import { describe, expect, it } from 'vitest';
import pantalla from './windi.css?raw';
import estilos from '@/ui/tema/tokens.css?raw';

// AN-07 · Windi (docs/implementacion/ANIMACIONES.md A-24, A-37).

describe('AN-07 · A-24 mensaje nuevo en la conversación', () => {
  it('entra con fundido y sube `--mov-corto`, en `--dur-corto` con `--ease-salida`', () => {
    expect(estilos).toMatch(
      /\.wg-windi__mensaje \{[^}]*transition:\s*opacity var\(--dur-corto\) var\(--ease-salida\),\s*transform var\(--dur-corto\) var\(--ease-salida\);/,
    );
    expect(estilos).toMatch(
      /@starting-style \{\s*\.wg-windi__mensaje \{\s*opacity: 0;\s*transform: translateY\(var\(--mov-corto\)\);/,
    );
  });
});

describe('AN-07 · A-37 Windi sin conexión', () => {
  it('el campo cambia de opacidad con fundido de `--dur-corto`', () => {
    expect(pantalla).toMatch(
      /\.wg-windi \.wg-windi__escribir textarea \{[^}]*transition: opacity var\(--dur-corto\) var\(--ease-salida\);/,
    );
  });
});
