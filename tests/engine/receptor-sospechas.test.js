// Inconsistencias corregidas en modo receptor con Z_L (recMode; ver CHANGELOG.md) — parte del motor.
import { describe, it, expect } from 'vitest';
import { computeCircuit, computeChecks, normItems } from '../../src/engine/index.js';
import { entrada, imp, ejercicios, receptorA1, receptorDelta } from '../fixtures/casos.js';

describe('Sospecha 1 — computeChecks: Boucherot P y Q en modo receptor', () => {
  // Caso: Y 30+j40 Ω, Z_L = 2+j1 Ω, 400 V en el receptor.
  //   I² = (230,940/50)² = 21,3333 A²
  //   P_fuente = 3·I²·(30+2) = 2048,00 W · Q_fuente = 3·I²·(40+1) = 2624,00 var
  //   S = 3·U_AN·I_L = 3·240,222·4,6188 = 3328,6 VA → cosφ = 0,61527
  const r = computeCircuit(receptorA1());

  it('el motor entrega P y Q de fuente correctos', () => {
    expect(r.P3).toBeCloseTo(2048, 6);
    expect(r.Q3).toBeCloseTo(2624, 6);
  });

  it('3·U_f,fuente·I_L·cosφ reproduce P de fuente (2048 W)', () => {
    expect(3 * r.Uf_src * r.IL * Math.cos(r.φ)).toBeCloseTo(2048, 6);
  });

  it('con r.Uf (receptor) la misma fórmula daría 1968,9 W (valor que mostraba antes del arreglo)', () => {
    expect(3 * r.Uf * r.IL * Math.cos(r.φ)).toBeCloseTo(1968.87, 1);
  });

  it('todas las comprobaciones dan ok en modo receptor', () => {
    expect(computeChecks(r).filter(c => !c.ok).map(c => c.txt)).toEqual([]);
  });

  it('también con δ grande (Y 30 Ω, Z_L = j10 Ω)', () => {
    expect(computeChecks(computeCircuit(receptorDelta())).every(c => c.ok)).toBe(true);
  });
});

describe('Sospecha 4 — Q_nom del banco en modo receptor', () => {
  // Mismo caso con fp objetivo 0,95 en bornes de carga.
  //   P_carga = 3·I²·30 = 1920 W · tanφ₁ = 40/30 · tanφ₂ = tan(acos 0,95) = 0,32868
  //   Q_C = 1920·(1,33333 − 0,32868) = 1928,92 var
  // En modo receptor la tensión en bornes del banco es el dato (400 V) y no cambia al compensar,
  // así que el banco «a U_L nominal (400 V)» —lo que rotula la interfaz con r.UL— entrega exactamente Q_C.
  const r = computeCircuit(receptorA1({ fpTgt: 0.95 }));

  it('Q_C = 1928,92 var', () => {
    expect(r.QC).toBeCloseTo(1928.92, 1);
  });

  it('Q_nom corresponde a la tensión r.UL que acompaña al texto (400 V)', () => {
    const B = r.QC / (3 * r.UcapF ** 2);
    expect(r.Qnom).toBeCloseTo(3 * (r.UL / Math.sqrt(3)) ** 2 * B, 6);   // = 1928,92 var
  });
});

describe('Arreglo 6 — ΔU en modo receptor: caída en la línea respecto a la fuente', () => {
  // Y 30 Ω, Z_L = j10 Ω: U_L,fuente = 421,637 V, receptor a 400 V
  //   ΔU = (400 − 421,637)/421,637 = −5,13 %
  const r = computeCircuit(receptorDelta());

  it('ΔU = (U_L − U_L,fuente)/U_L,fuente = −5,13 %', () => {
    expect(r.dUpct).toBeCloseTo(-5.13, 2);
  });

  it('ida y vuelta: coincide con el ΔU del modo fuente resuelto con U_L = U_L,fuente', () => {
    const src = computeCircuit({ ...receptorDelta(), vRef: 'source', UL: r.UL_src });
    expect(src.UloadL).toBeCloseTo(400, 9);
    expect(src.dUpct).toBeCloseTo(r.dUpct, 9);
  });

  it('ida y vuelta con motores y Z_L (Ej. 2 con 430 V en el receptor)', () => {
    const rec = computeCircuit({ ...ejercicios[2](), vRef: 'load', UL: 430, fpTgt: NaN });
    const src = computeCircuit({ ...ejercicios[2](), vRef: 'source', UL: rec.UL_src, fpTgt: NaN });
    expect(src.UloadL).toBeCloseTo(430, 6);
    expect(src.dUpct).toBeCloseTo(rec.dUpct, 6);
  });

  it('tras compensar (Y 30+j40 Ω, Z_L = 2+j1 Ω, fp 0,95): −3,86 % → −2,72 %', () => {
    // Antes: (400 − 416,077)/416,077 = −3,864 %
    // Después: Ī = 2,9171∠−18,19° A → Ū_AN = 230,940 + Ī·(2+j1) = 237,396 V → U_L,fuente = 411,18 V
    //          (400 − 411,18)/411,18 = −2,719 %
    const c = computeCircuit(receptorA1({ fpTgt: 0.95 }));
    expect(c.dUpct).toBeCloseTo(-3.864, 2);
    expect(c.comp.UL_src).toBeCloseTo(411.18, 1);
    expect(c.comp.dUpct).toBeCloseTo(-2.719, 2);
  });

  it('normItems: criterio de diseño, sin «respecto a U_n», con el mismo límite', () => {
    const it2 = normItems(r)[1];
    expect(it2.s).toBe('ok');                                  // 5,13 % ≤ 8 % (bajo voltaje)
    expect(it2.t).toBe('Caída de tensión en la línea (criterio de diseño): dentro del límite');
    expect(it2.sub).toContain('Receptor a su tensión dato U_L = 400.0 V');
    expect(it2.sub).toContain('tensión de fuente necesaria U_L,fuente = 421.6 V → −5.13 %');
    expect(it2.sub).toContain('límite ±8.0 %');
    expect(it2.sub).not.toContain('U_n');
    expect(it2.src).toContain('ARCERNNR-002/20');
  });

  it('normItems: con límite manual de 5 % queda fuera del límite', () => {
    const it2 = normItems(computeCircuit({ ...receptorDelta(), lim: { fpMin: 0.94, dUmax: 5 } }))[1];
    expect(it2.s).toBe('bad');
    expect(it2.t).toBe('Caída de tensión en la línea (criterio de diseño): fuera del límite');
  });

  it('en modo fuente normItems conserva su redacción', () => {
    const it2 = normItems(computeCircuit(entrada({ zLineEnabled: true, ZL: { R: 0, X: 10 }, loads: [imp('star', 30)] })))[1];
    expect(it2.t).toBe('Variación de tensión en la carga: dentro del límite');
    expect(it2.sub).toContain('respecto a U_n = 400.0 V');
    expect(it2.src).toBe('Regulación ARCERNNR-002/20, Tabla 1 (BV 8 %, MV 6 %, AV 5 %). El límite es editable.');
  });
});
