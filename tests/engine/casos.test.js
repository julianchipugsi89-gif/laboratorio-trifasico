import { describe, it, expect } from 'vitest';
import { computeCircuit, computeChecks, SQ3 } from '../../src/engine/index.js';
import { entrada, imp, motor, ejercicios, receptorA1 } from '../fixtures/casos.js';

const mod360 = a => ((a % 360) + 360) % 360;

describe('Modo receptor con Z_L (cálculo hacia atrás)', () => {
  it('Y 30+j40 Ω, Z_L = 2+j1 Ω, 400 V en el receptor → U_L,fuente = 416,077 V', () => {
    const r = computeCircuit(receptorA1());
    expect(r.recMode).toBe(true);
    expect(r.IL).toBeCloseTo(4.6188, 4);
    expect(r.IA).toBeCloseTo(-53.13, 2);
    expect(Math.hypot(r.dropC.re, r.dropC.im)).toBeCloseTo(10.328, 3);
    expect(r.Uf_src).toBeCloseTo(240.222, 3);
    expect(r.delta).toBeCloseTo(-1.10, 2);
    expect(r.UL_src).toBeCloseTo(416.077, 3);
  });

  it('Δ 38√3∠30° Ω, Z_L = 1+j2 Ω, 380 V en el receptor → Ī_A = 10∠−30° A, U_L,fuente = 412,872 V', () => {
    const ZD = 38 * SQ3;
    const r = computeCircuit(entrada({ UL: 380, zLineEnabled: true, vRef: 'load', ZL: { R: 1, X: 2 },
      loads: [imp('delta', ZD * Math.cos(Math.PI / 6), ZD * Math.sin(Math.PI / 6))] }));
    expect(r.IL).toBeCloseTo(10, 6);
    expect(r.IA).toBeCloseTo(-30, 6);
    expect(r.UL_src).toBeCloseTo(412.872, 3);
  });

  it('Motor Δ 7,5 kW, η 90 %, cosφ 0,85, Z_L = 0,5+j0,3 Ω, 440 V en el receptor → U_L,fuente = 452,991 V', () => {
    const r = computeCircuit(entrada({ UL: 440, f: 60, zLineEnabled: true, vRef: 'load', ZL: { R: 0.5, X: 0.3 },
      loads: [motor('delta', 7.5, 'kW', 440, 0.85, 90)] }));
    expect(r.IL).toBeCloseTo(12.864, 3);
    expect(r.IA).toBeCloseTo(-31.79, 2);
    expect(r.UL_src).toBeCloseTo(452.991, 3);
  });

  it('ida y vuelta: fuente → U en el receptor → modo receptor recupera la U de fuente', () => {
    const src = computeCircuit(ejercicios[2]());
    const rec = computeCircuit({ ...ejercicios[2](), UL: src.UloadL, vRef: 'load' });
    expect(Math.abs(rec.UL_src - 440)).toBeLessThan(1e-6);
    expect(rec.IL).toBeCloseTo(src.IL, 8);
  });

  it('sin Z_L el modo receptor no se activa y equivale al modo fuente', () => {
    const a = computeCircuit(entrada({ loads: [imp('star', 30, 40)], vRef: 'load' }));
    const b = computeCircuit(entrada({ loads: [imp('star', 30, 40)], vRef: 'source' }));
    expect(a.recMode).toBe(false);
    expect(a.IL).toBe(b.IL);
    expect(a.delta).toBe(0);
  });
});

describe('Secuencia ACB', () => {
  const abc = computeCircuit(entrada({ loads: [imp('star', 30, 40)] }));
  const acb = computeCircuit(entrada({ seq: 'acb', loads: [imp('star', 30, 40)] }));

  it('B adelanta 120° y C retrasa 120° respecto de A', () => {
    expect(mod360(acb.UB - acb.UA)).toBeCloseTo(120, 9);
    expect(mod360(acb.UC - acb.UA)).toBeCloseTo(240, 9);
    expect(mod360(acb.IB - acb.IA)).toBeCloseTo(120, 9);
    expect(mod360(abc.UB - abc.UA)).toBeCloseTo(240, 9);
  });

  it('módulos y potencias no cambian con la secuencia', () => {
    expect(acb.IL).toBeCloseTo(abc.IL, 12);
    expect(acb.IA).toBeCloseTo(abc.IA, 12);
    expect(acb.P3).toBeCloseTo(abc.P3, 9);
    expect(acb.Q3).toBeCloseTo(abc.Q3, 9);
  });

  it('corriente de fase en Δ: retrasa 30° a Ī_A en ACB (adelanta 30° en ABC)', () => {
    const d = seq => computeCircuit(entrada({ seq, loads: [imp('delta', 30, 40)] })).bkd[0];
    expect(d('acb').IkPhaseAng - d('acb').IkAng).toBeCloseTo(-30, 9);
    expect(d('abc').IkPhaseAng - d('abc').IkAng).toBeCloseTo(30, 9);
  });

  it('las comprobaciones dan ok', () => {
    expect(computeChecks(acb).every(c => c.ok)).toBe(true);
  });
});

describe('Carga capacitiva con compensación por reactores (Ej. 4)', () => {
  const r = computeCircuit(ejercicios[4]());

  it('elige reactores y no condensadores', () => {
    expect(r.compType).toBe('L');
    expect(Number.isNaN(r.QC)).toBe(true);
  });

  it('Q_L = P·(tan|φ₁| − tan|φ₂|) = 3129,08·(0,99799 − 0,29167) = 2210,1 var', () => {
    expect(r.QLr).toBeCloseTo(2210.13, 0);
  });

  it('L_Y = 3·U_f²/(ω·Q_L) = 48400/(376,99·2210,13) = 58,09 mH y L_Δ = 3·L_Y', () => {
    expect(r.LY * 1e3).toBeCloseTo(58.09, 1);
    expect(r.LD).toBeCloseTo(3 * r.LY, 12);
  });

  it('tras compensar el fp en la carga llega a 0,96 y sigue capacitivo', () => {
    expect(r.comp.fpL).toBeCloseTo(0.96, 6);
    expect(r.comp.φL).toBeLessThan(0);
    expect(r.comp.IL).toBeLessThan(r.IL);
  });
});

describe('Motores con Z_L: convergencia (Ej. 2)', () => {
  const r = computeCircuit(ejercicios[2]());

  it('converge en pocas iteraciones', () => {
    expect(r.error).toBeUndefined();
    expect(r.motorIter).toBeGreaterThan(1);
    expect(r.motorIter).toBeLessThan(50);
  });

  it('cada motor absorbe su potencia de placa (potencia constante) a la tensión real en bornes', () => {
    for (const b of r.bkd.filter(b => b.kind === 'motor')) {
      expect(b.Pk).toBeCloseTo(b.m.Pin, 4);
      expect(b.Qk).toBeCloseTo(b.m.Q, 4);
    }
    expect(r.UloadL).toBeLessThan(440);
  });

  it('P_abs del motor de 15 HP = 15·745,7/0,895 = 12497,8 W', () => {
    expect(r.bkd[0].m.Pin).toBeCloseTo(12497.77, 1);
  });

  it('LKT en la línea: Ū_AN = Ū_carga + Ī_A·Z_L', () => {
    const re = r.UloadC.re + r.IAc.re * 0.08 - r.IAc.im * 0.15;
    const im = r.UloadC.im + r.IAc.re * 0.15 + r.IAc.im * 0.08;
    expect(re).toBeCloseTo(440 / SQ3, 6);
    expect(im).toBeCloseTo(0, 6);
  });

  it('la compensación con motores y Z_L lleva el fp en bornes exactamente al objetivo', () => {
    expect(r.comp.fpL).toBeCloseTo(0.96, 8);
    expect(r.comp.UloadL).toBeGreaterThan(r.UloadL);
  });
});

describe('Errores que el motor debe devolver', () => {
  it('colapso de tensión: la línea no puede alimentar los motores', () => {
    const r = computeCircuit({ ...ejercicios[2](), ZL: { R: 30, X: 0.15 } });
    expect(r.error).toMatch(/No converge/);
    expect(r.IL).toBeUndefined();
  });

  it('|Z| = 0 en una carga (R = 0, X_L = X_C): cortocircuito', () => {
    const r = computeCircuit(entrada({ loads: [imp('star', 12, 9), imp('delta', 0, 5, 5)] }));
    expect(r.error).toMatch(/Z2: \|Z\| = 0/);
  });

  it('impedancia total nula: Z_L cancela exactamente a Z_eq', () => {
    const r = computeCircuit(entrada({ zLineEnabled: true, ZL: { R: 0, X: 5 }, loads: [imp('star', 0, 0, 5)] }));
    expect(r.error).toMatch(/Impedancia total nula/);
  });
});
