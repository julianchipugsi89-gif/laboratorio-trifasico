import { describe, it, expect } from 'vitest';
import { computeCircuit, computeChecks } from '../../src/engine/index.js';
import { ejercicios } from '../fixtures/casos.js';

describe.each([1, 2, 3, 4])('Ejercicio %i de loadExercise', n => {
  const r = computeCircuit(ejercicios[n]());

  it('resuelve sin error', () => {
    expect(r.error).toBeUndefined();
  });

  it('todas las comprobaciones de computeChecks dan ok', () => {
    const checks = computeChecks(r);
    expect(checks.length).toBeGreaterThanOrEqual(5);
    expect(checks.filter(c => !c.ok).map(c => c.txt)).toEqual([]);
  });
});

describe('Valores calculados a mano', () => {
  it('Ej. 1: Z_eq = 6+j4,5 Ω, Z_total = 6,12+j4,66 Ω → I_L = 127,017/7,6922 = 16,512 A', () => {
    const r = computeCircuit(ejercicios[1]());
    expect(r.ZeqC.re).toBeCloseTo(6, 9);
    expect(r.ZeqC.im).toBeCloseTo(4.5, 9);
    expect(r.IL).toBeCloseTo(16.5124, 3);
    expect(r.UloadF).toBeCloseTo(123.843, 2);      // I_L·|Z_eq| = 16,5124·7,5
    expect(r.dUpct).toBeCloseTo(-2.499, 2);        // 7,5/7,6922 − 1
    expect(r.Pload).toBeCloseTo(4907.9, 0);        // 3·I²·6
    expect(r.Pline).toBeCloseTo(98.16, 1);         // 3·I²·0,12
    expect(r.wires).toBe(4);                       // auto: hay una carga Y de impedancia
    expect(r.comp.fpL).toBeCloseTo(0.95, 6);
  });

  it('Ej. 3: P = 6400 + 3840 + 11111,1 W, Q = 4800 + 5120 + 6886,0 var → I_L = 39,22 A', () => {
    const r = computeCircuit(ejercicios[3]());
    expect(r.P3).toBeCloseTo(21351.11, 1);
    expect(r.Q3).toBeCloseTo(16806.04, 1);
    expect(r.IL).toBeCloseTo(39.219, 2);
    expect(r.fp).toBeCloseTo(0.78578, 4);
    expect(r.compType).toBe('C');
    expect(r.QC).toBeCloseTo(9788.3, 0);           // P·(tanφ₁ − tan(acos 0,95))
  });

  it('Ej. 4: P = 3129,08 W, Q = −3122,78 var (capacitiva) → I_L = 11,601 A', () => {
    const r = computeCircuit(ejercicios[4]());
    expect(r.P3).toBeCloseTo(3129.08, 1);
    expect(r.Q3).toBeCloseTo(-3122.78, 1);
    expect(r.IL).toBeCloseTo(11.6014, 3);
    expect(r.fp).toBeCloseTo(0.70782, 4);
  });
});
