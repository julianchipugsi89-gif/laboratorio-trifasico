import { describe, it, expect } from 'vitest';
import { computeCircuit, computePilots, normItems } from '../../src/engine/index.js';
import { entrada, imp, motor, ejercicios, receptorA1 } from '../fixtures/casos.js';

const casos = [
  ['Ej. 1', () => ejercicios[1]()],
  ['Ej. 2', () => ejercicios[2]()],
  ['Ej. 3', () => ejercicios[3]()],
  ['Ej. 4', () => ejercicios[4]()],
  ['Ej. 1 en modo receptor', () => ({ ...ejercicios[1](), vRef: 'load' })],
  ['Ej. 2 en modo receptor', () => ({ ...ejercicios[2](), vRef: 'load' })],
];

describe.each(casos)('Pilotos — %s', (_, inp) => {
  const r = computeCircuit(inp());

  it('contactor abierto: mismos puntos, estados y textos que normItems(r)', () => {
    const n = normItems(r), p = computePilots(r);
    expect(p.map(x => [x.s, x.t, x.sub])).toEqual(n.map(x => [x.s, x.t, x.sub]));
  });

  it('contactor cerrado: un piloto por cada punto, evaluado con r.comp', () => {
    const p = computePilots(r, { compensado: true });
    expect(p).toHaveLength(normItems(r).length);
    expect(p[0].s).toBe(r.comp.fpS >= r.lim.fpMin - 1e-9 ? 'ok' : 'bad');
    expect(p[0].sub).toContain(r.comp.fpS.toFixed(4));
    if (r.zLineEnabled) expect(p[1].s).toBe(Math.abs(r.comp.dUpct) <= r.lim.dUmax + 1e-9 ? 'ok' : 'bad');
    else expect(p[1].s).toBe('na');
  });

  it('no altera normItems(r) ni el resultado', () => {
    const antes = JSON.stringify(normItems(r));
    computePilots(r, { compensado: true });
    expect(JSON.stringify(normItems(r))).toBe(antes);
  });
});

describe('Pilotos con el banco conectado — casos concretos', () => {
  it('Ej. 1: el fp pasa de «aviso» (solo cumple con la compensación) a «normal»', () => {
    const r = computeCircuit(ejercicios[1]());
    expect(computePilots(r)[0].s).toBe('warn');
    const p = computePilots(r, { compensado: true })[0];
    expect(p.s).toBe('ok');
    expect(p.t).toBe('Factor de potencia: cumple con el banco conectado');
  });

  it('fp objetivo 0,85 por debajo del umbral 0,94: alarma también con el banco conectado', () => {
    const r = computeCircuit({ ...ejercicios[1](), fpTgt: 0.85 });
    const p = computePilots(r, { compensado: true })[0];
    expect(r.comp.fpS).toBeLessThan(0.94);
    expect(p.s).toBe('bad');
    expect(p.t).toBe('Factor de potencia: bajo el umbral incluso con el banco conectado');
  });

  it('ΔU: con límite manual de 2 % el Ej. 1 incumple abierto (−2,50 %) y cumple cerrado', () => {
    const r = computeCircuit({ ...ejercicios[1](), lim: { fpMin: 0.94, dUmax: 2 } });
    expect(r.dUpct).toBeCloseTo(-2.5, 1);
    expect(computePilots(r)[1].s).toBe('bad');
    expect(Math.abs(r.comp.dUpct)).toBeLessThan(2);
    const p = computePilots(r, { compensado: true })[1];
    expect(p.s).toBe('ok');
    expect(p.t).toBe('Variación de tensión en la carga: dentro del límite');
  });

  it('ΔU: con límite de 1 % sigue en alarma con el banco conectado', () => {
    const r = computeCircuit({ ...ejercicios[1](), lim: { fpMin: 0.94, dUmax: 1 } });
    expect(computePilots(r, { compensado: true })[1].s).toBe('bad');
  });

  it('modo receptor (Y 30+j40 Ω, Z_L = 2+j1 Ω): caída −2,72 % con la tensión de fuente compensada', () => {
    const r = computeCircuit(receptorA1({ fpTgt: 0.95 }));
    const p = computePilots(r, { compensado: true })[1];
    expect(p.t).toBe('Caída de tensión en la línea (criterio de diseño): dentro del límite');
    expect(p.sub).toContain('U_L,fuente necesaria = 411.2 V → −2.72 %');
  });

  it('motores: la tensión en bornes se toma de r.comp.UloadL', () => {
    // Motor de placa 480 V alimentado a 440 V con línea: con el banco la tensión sube de 431 a 433 V aprox.
    const r = computeCircuit(entrada({ UL: 440, f: 60, zLineEnabled: true, ZL: { R: 0.08, X: 0.15 }, fpTgt: 0.96,
      loads: [motor('delta', 15, 'HP', 480, 0.84, 89.5), imp('delta', 72)] }));
    const abierto = computePilots(r)[2], cerrado = computePilots(r, { compensado: true })[2];
    const d = (r.comp.UloadL - 480) / 480 * 100;
    expect(r.comp.UloadL).toBeGreaterThan(r.UloadL);
    expect(cerrado.t).toBe('M1: tensión en bornes frente a la placa');
    expect(cerrado.s).toBe(Math.abs(d) <= 5 ? 'ok' : Math.abs(d) <= 10 ? 'warn' : 'bad');
    expect(cerrado.s).toBe('warn');                            // −9,7 %: entre 5 y 10 %
    expect(cerrado.sub).not.toBe(abierto.sub);
    expect(cerrado.sub).toContain('frente a U_n = 480.0 V');
  });

  it('sin compensación calculada devuelve null', () => {
    expect(computePilots(computeCircuit(entrada({ loads: [imp('star', 30, 40)] })), { compensado: true })).toBeNull();
  });
});
