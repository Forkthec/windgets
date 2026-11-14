// Pruebas del sello de integridad (CD-02-HU01-CA12). Se ejecutan con `node --test installer/sellar.test.mjs`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estaSellado, sellar } from './sellar.mjs';

const instalador = Buffer.from('MZ' + 'contenido del instalador '.repeat(64));

test('CD-02-HU01-CA12 · un instalador sellado pasa la verificación', () => {
  assert.equal(estaSellado(sellar(instalador)), true);
});

test('CD-02-HU01-CA12 · una descarga incompleta no pasa la verificación', () => {
  const sellado = sellar(instalador);
  assert.equal(estaSellado(sellado.subarray(0, sellado.length - 100)), false);
  assert.equal(estaSellado(sellado.subarray(0, sellado.length - 1)), false);
});

test('CD-02-HU01-CA12 · un archivo dañado no pasa la verificación', () => {
  const danado = Buffer.from(sellar(instalador));
  danado[10] ^= 0xff;
  assert.equal(estaSellado(danado), false);
});

test('el instalador sin sellar no pasa la verificación y no se sella dos veces', () => {
  assert.equal(estaSellado(instalador), false);
  assert.throws(() => sellar(sellar(instalador)), /ya está sellado/);
});
