// Sospechas de inconsistencia en modo receptor con Z_L (recMode) — parte del motor.
// it.fails = inconsistencia CONFIRMADA y aún sin corregir: la prueba afirma el valor correcto y hoy falla.
// Al aplicar el arreglo, Vitest avisará («expected to fail») y basta cambiar it.fails por it.
import { describe, it, expect } from 'vitest';
import { computeCircuit, computeChecks } from '../../src/engine/index.js';
import { receptorA1, receptorDelta } from '../fixtures/casos.js';

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

  it('con r.Uf (receptor) la misma fórmula da 1968,9 W: es la que usa computeChecks', () => {
    expect(3 * r.Uf * r.IL * Math.cos(r.φ)).toBeCloseTo(1968.87, 1);
  });

  it.fails('todas las comprobaciones dan ok en modo receptor', () => {
    expect(computeChecks(r).filter(c => !c.ok).map(c => c.txt)).toEqual([]);
  });

  it.fails('también con δ grande (Y 30 Ω, Z_L = j10 Ω)', () => {
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

  it.fails('Q_nom corresponde a la tensión r.UL que acompaña al texto (400 V)', () => {
    const B = r.QC / (3 * r.UcapF ** 2);
    expect(r.Qnom).toBeCloseTo(3 * (r.UL / Math.sqrt(3)) ** 2 * B, 6);   // = 1928,92 var
  });
});

describe('Extra — ΔU en modo receptor', () => {
  // dUpct se fija en 0 en recMode, así que normItems siempre da «dentro del límite».
  // Con Y 30 Ω y Z_L = j10 Ω: U_L,fuente = 421,637 V, U_carga = 400 V
  //   ΔU = (400 − 421,637)/421,637 = −5,13 %
  const r = computeCircuit(receptorDelta());

  it.fails('ΔU respecto a la tensión de fuente = −5,13 %', () => {
    expect(r.dUpct).toBeCloseTo(-5.13, 2);
  });
});
