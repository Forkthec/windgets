// docs/rediseno.md RD-71 · Widget de escritorio «Windi»: los ojos y, al seleccionarlo, el panel de Windi en la
// ventana principal (HE-06-HU08, IPC-DESK-03).
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Invoke } from '@/types';
import { WidgetWindi } from './WidgetWindi';

describe('RD-71 · Widget Windi', () => {
  it('muestra los ojos y al seleccionarlo pide abrir el panel de Windi', () => {
    const pedidos: unknown[] = [];
    const invocar = ((comando: string, params: unknown) => {
      pedidos.push([comando, params]);
      return Promise.resolve({ ok: true, value: null });
    }) as unknown as Invoke;
    render(<WidgetWindi invocar={invocar} />);
    const boton = screen.getByRole('button', { name: 'Abrir Windi' });
    expect(boton.querySelectorAll('ellipse')).toHaveLength(2);
    fireEvent.click(boton);
    expect(pedidos).toEqual([['app_open_screen', { screen: 'windi' }]]);
  });
});
