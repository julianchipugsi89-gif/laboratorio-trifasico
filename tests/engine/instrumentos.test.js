import { describe, it, expect } from 'vitest';
import { computeCircuit, computeInstruments, SQ3 } from '../../src/engine/index.js';
import { entrada, imp, ejercicios, receptorDelta, receptorA1 } from '../fixtures/casos.js';

const cerca = (a, b, rel = 1e-9) => expect(Math.abs(a - b)).toBeLessThanOrEqual(rel * Math.max(1, Math.abs(b)));

describe('Voltímetros', () => {
  it('modo fuente (Ej. 1): fuente = U_L dato (220 V), receptor = U_carga,L', () => {
    const r = computeCircuit(ejercicios[1]()), m = computeInstruments(r);
    expect(m.vFuente.UL).toBe(r.UL_src);
    expect(m.vFuente.UL).toBeCloseTo(220, 9);
    expect(m.vReceptor.UL).toBe(r.UloadL);
    expect(m.vReceptor.UL).toBeCloseTo(214.503, 2);       // 220·7,5/7,6922
  });

  it('modo receptor (Y 30 Ω, Z_L = j10 Ω): fuente = 421,637 V calculada, receptor = 400 V dato', () => {
    const m = computeInstruments(computeCircuit(receptorDelta()));
    expect(m.vFuente.UL).toBeCloseTo(421.637, 3);
    expect(m.vFuente.Uf).toBeCloseTo(243.432, 3);
    expect(m.vReceptor.UL).toBeCloseTo(400, 9);
  });

  it('sin Z_L ambos voltímetros marcan lo mismo', () => {
    const m = computeInstruments(computeCircuit(ejercicios[3]()));
    expect(m.vReceptor.UL).toBeCloseTo(m.vFuente.UL, 9);
  });
});

describe('Amperímetros de línea', () => {
  it('las tres líneas marcan I_L y están desfasadas 120°', () => {
    const r = computeCircuit(ejercicios[1]()), m = computeInstruments(r);
    expect(m.amp.IL).toBeCloseTo(16.5124, 3);
    expect(m.amp.ang[0]).toBeCloseTo(r.IA, 9);
    expect(((m.amp.ang[0] - m.amp.ang[1]) % 360 + 360) % 360).toBeCloseTo(120, 9);
  });
});

describe.each([1, 2, 3, 4])('Método de Aron — Ejercicio %i', n => {
  const abc = computeCircuit({ ...ejercicios[n](), seq: 'abc' }), acb = computeCircuit({ ...ejercicios[n](), seq: 'acb' });
  const ma = computeInstruments(abc), mb = computeInstruments(acb);

  it('ABC: W1 + W2 = P3', () => cerca(ma.W1 + ma.W2, abc.P3));
  it('ABC: tanφ = √3·(W1 − W2)/(W1 + W2)', () => cerca(SQ3 * (ma.W1 - ma.W2) / (ma.W1 + ma.W2), Math.tan(abc.φ)));
  it('ACB: W1 + W2 = P3', () => cerca(mb.W1 + mb.W2, acb.P3));
  it('ACB: las lecturas se intercambian', () => { cerca(mb.W1, ma.W2); cerca(mb.W2, ma.W1); });
  it('ACB: tanφ = √3·(W2 − W1)/(W1 + W2)', () => cerca(SQ3 * (mb.W2 - mb.W1) / (mb.W1 + mb.W2), Math.tan(acb.φ)));
  it('Q, tanφ y fp devueltos coinciden con el circuito en ambas secuencias', () => {
    for (const [r, m] of [[abc, ma], [acb, mb]]) {
      cerca(m.Q, r.Q3); cerca(m.tanφ, Math.tan(r.φ)); cerca(m.fp, r.fp); cerca(m.P, r.P3);
    }
  });
});

describe('Método de Aron — casos límite', () => {
  // Y 10+j30 Ω a 400 V: φ = 71,565°, fp = 0,316 < 0,5
  //   I = 230,940/31,623 = 7,3030 A · U_L·I = 2921,2
  //   W1 = 2921,2·cos(φ − 30°) = 2921,2·0,74821 = 2185,6 W
  //   W2 = 2921,2·cos(φ + 30°) = 2921,2·(−0,20048) = −585,6 W  → suma 1600 W = 3·I²·10
  it('fp < 0,5 inductivo: W2 es negativa y la suma sigue siendo P', () => {
    const r = computeCircuit(entrada({ loads: [imp('star', 10, 30)] })), m = computeInstruments(r);
    expect(r.fp).toBeLessThan(0.5);
    expect(m.W1).toBeCloseTo(2185.6, 0);
    expect(m.W2).toBeCloseTo(-585.6, 0);
    expect(m.W1 + m.W2).toBeCloseTo(1600, 6);
  });

  it('fp < 0,5 en secuencia ACB: la negativa pasa a ser W1', () => {
    const m = computeInstruments(computeCircuit(entrada({ seq: 'acb', loads: [imp('star', 10, 30)] })));
    expect(m.W1).toBeCloseTo(-585.6, 0);
    expect(m.W2).toBeCloseTo(2185.6, 0);
  });

  it('fp < 0,5 capacitivo (Y 10−j30 Ω, ABC): la negativa es W1', () => {
    const m = computeInstruments(computeCircuit(entrada({ loads: [imp('star', 10, 0, 30)] })));
    expect(m.W1).toBeCloseTo(-585.6, 0);
    expect(m.W2).toBeCloseTo(2185.6, 0);
    expect(m.Q).toBeLessThan(0);
  });

  it('fp = 0,5 (φ = 60°): W2 = 0 y W1 = P', () => {
    const r = computeCircuit(entrada({ loads: [imp('star', 10, 10 * SQ3)] })), m = computeInstruments(r);
    expect(m.W2).toBeCloseTo(0, 6);
    expect(m.W1).toBeCloseTo(r.P3, 6);
  });

  it('carga resistiva (fp = 1): W1 = W2 = P/2', () => {
    const r = computeCircuit(entrada({ loads: [imp('star', 30)] })), m = computeInstruments(r);
    expect(m.W1).toBeCloseTo(r.P3 / 2, 6);
    expect(m.W2).toBeCloseTo(r.P3 / 2, 6);
  });

  it('modo receptor: los vatímetros miden en la fuente (P = 2048 W en Y 30+j40 Ω, Z_L = 2+j1 Ω)', () => {
    const m = computeInstruments(computeCircuit(receptorA1()));
    expect(m.W1 + m.W2).toBeCloseTo(2048, 6);
    expect(m.Q).toBeCloseTo(2624, 6);
  });
});

describe('Banco de compensación conectado (usa r.comp, sin recalcular)', () => {
  it('devuelve null si no hay compensación calculada', () => {
    expect(computeInstruments(computeCircuit(entrada({ loads: [imp('star', 30, 40)] })), { compensado: true })).toBeNull();
  });

  it.each([1, 2, 3, 4])('Ej. %i: las lecturas coinciden con r.comp', n => {
    const r = computeCircuit(ejercicios[n]()), m = computeInstruments(r, { compensado: true });
    expect(m.compensado).toBe(true);
    cerca(m.W1 + m.W2, r.comp.Ptot);
    cerca(m.Q, r.comp.Qtot, 1e-8);
    cerca(m.fp, r.comp.fpS);
    cerca(m.amp.IL, r.comp.IL);
    cerca(m.vFuente.UL, r.comp.UL_src);
    cerca(m.vFuente.Uf * SQ3, r.comp.UL_src, 1e-8);
    expect(m.vReceptor.UL).toBe(r.comp.UloadL);
    expect(m.Pline).toBe(r.comp.Pline);
    expect(m.fpCarga).toBe(r.comp.fpL);
  });

  it('Ej. 1: al conectar baja I_L y suben fp y U en el receptor', () => {
    const r = computeCircuit(ejercicios[1]()), a = computeInstruments(r), b = computeInstruments(r, { compensado: true });
    expect(b.amp.IL).toBeLessThan(a.amp.IL);
    expect(b.fp).toBeGreaterThan(a.fp);
    expect(b.vReceptor.UL).toBeGreaterThan(a.vReceptor.UL);
    expect(b.Pline).toBeLessThan(a.Pline);
  });

  it('modo receptor: al conectar baja la tensión de fuente necesaria y el receptor sigue en su dato', () => {
    const r = computeCircuit(receptorA1({ fpTgt: 0.95 })), b = computeInstruments(r, { compensado: true });
    expect(b.vFuente.UL).toBeCloseTo(411.18, 1);
    expect(b.vReceptor.UL).toBeCloseTo(400, 9);
  });
});
