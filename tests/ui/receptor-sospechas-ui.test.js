// Sospechas de inconsistencia en modo receptor con Z_L (recMode) — parte de la interfaz.
// Caso con δ grande y números redondos (ver fixtures): Y 30 Ω, Z_L = j10 Ω, 400 V en el receptor.
//   Ū_A′N = 230,940∠0° V (dato) · Ū_AN = 243,432∠+18,43° V · U_L,fuente = 421,637 V
//   fp fuente = cos 18,435° = 0,9487 · fp carga = 1,0000
// it.fails = inconsistencia CONFIRMADA y aún sin corregir: la prueba afirma el valor correcto y hoy falla.
// Al aplicar el arreglo, Vitest avisará («expected to fail») y basta cambiar it.fails por it.
import { describe, it, expect, beforeAll } from 'vitest';
import { computeCircuit } from '../../src/engine/index.js';
import { entrada, imp, receptorDelta, receptorA1 } from '../fixtures/casos.js';
import { instalarDomSimulado, sinEtiquetas, flechasDesdeCentro } from './domSimulado.js';

let dom, ui;
const pintar = inp => {
  const r = computeCircuit(inp);
  dom.dibujo.length = 0;
  ui.renderResults(r);
  return r;
};

beforeAll(async () => {
  dom = instalarDomSimulado({ anchoLienzo: 400 });   // lienzo 400×360 → centro (200, 180)
  ui = {
    ...(await import('../../src/ui/results.js')),
    ...(await import('../../src/print/report.js')),
  };
});

describe('Sospecha 2 — tabla de fases y lectura ωt bajo «fuente, calculada»', () => {
  let tabla, lectura, cabecera;
  beforeAll(() => {
    pintar(receptorDelta());
    tabla = sinEtiquetas(dom.el('phase-tbody').innerHTML);
    lectura = sinEtiquetas(dom.el('wt-readout').innerHTML);
    cabecera = dom.el('tbl-ufn-hdr').textContent;
  });

  it('la cabecera anuncia la tensión de fuente calculada', () => {
    expect(cabecera).toBe('Ū fase-neutro fuente, calculada (V)');
  });

  it.fails('Ū_AN de la tabla = 243,432 ∠+18,43°', () => {
    expect(tabla).toContain('Ū_AN 243.432 ∠+18.43°');
  });

  it.fails('Ū_AB de la tabla = 421,637 ∠+48,43°', () => {
    expect(tabla).toContain('Ū_AB 421.637 ∠+48.43°');
  });

  it.fails('lectura ωt = 0°: u_A = √2·243,432·sen 18,435° = 108,9 V y Û = 344,3 V', () => {
    expect(lectura).toContain('108.9');
    expect(lectura).toContain('Û = 344.3');
  });
});

describe('Sospecha 3 — rótulo de r.fp en pasos e informe', () => {
  let pasos, informe;
  beforeAll(() => {
    const r = pintar(receptorDelta());
    pasos = sinEtiquetas(dom.el('steps-container').innerHTML);
    informe = sinEtiquetas(ui.buildPrintHTML(r));
  });

  it.fails('pasos: lo rotulado «fp (carga)» vale 1,0000 (el de la carga)', () => {
    expect(pasos).toMatch(/fp \(carga\) = 1\.0000/);
  });

  it.fails('informe: lo rotulado «fp (carga)» vale 1,0000 (el de la carga)', () => {
    expect(informe).toMatch(/fp \(carga\)1\.0000/);
  });

  it.fails('informe: aparece el fp de entrada 0,9487 rotulado como tal', () => {
    expect(informe).toMatch(/fp \(entrada\)0\.9487/);
  });
});

describe('Sospecha 4 — texto «Banco a U_L nominal»', () => {
  it.fails('el valor mostrado junto a «U_L nominal (400.0 V)» es Q a 400 V = 1,929 kvar', () => {
    pintar(receptorA1({ fpTgt: 0.95 }));
    const txt = sinEtiquetas(dom.el('fp-corr-body').innerHTML);
    expect(txt).toMatch(/Banco a U_L nominal \(400\.0 V\): 1\.929 kvar/);
  });
});

describe('Sospecha 5 — drawPhasors: Ū_carga en modo receptor', () => {
  // Orden de dibujo: 12 rayos del transportador, 3 Ū_carga (discontinuas), 3 Ū fuente, 3 Ī.
  const R = 180 - 38;
  let carga, fuente;
  beforeAll(() => {
    pintar(receptorDelta());
    const f = flechasDesdeCentro(dom.dibujo, 200, 180);
    carga = f.slice(12, 15); fuente = f.slice(15, 18);
  });

  it('se dibujan 12 rayos + 9 fasores', () => {
    expect(flechasDesdeCentro(dom.dibujo, 200, 180)).toHaveLength(21);
  });

  it('Ū_AN (fuente) se dibuja en δ = +18,43°', () => {
    expect(fuente[0].ang).toBeCloseTo(18.435, 2);
  });

  it.fails('Ū_A′N (carga, el dato) se dibuja en 0°', () => {
    expect(carga[0].ang).toBeCloseTo(0, 2);
  });

  it.fails('Ū_A′N es más corta que Ū_AN en la proporción 230,940/243,432 = 0,9487', () => {
    expect(carga[0].len / (R * 0.88)).toBeCloseTo(230.940 / 243.432, 3);
  });

  it('en modo fuente Ū_carga sí queda en su ángulo real (referencia de regresión)', () => {
    // Y 30 Ω, Z_L = j10 Ω, 400 V en la fuente: Ū_carga = 230,94·30/(30+j10) → ∠−18,43°
    pintar(entrada({ zLineEnabled: true, ZL: { R: 0, X: 10 }, loads: [imp('star', 30)] }));
    const f = flechasDesdeCentro(dom.dibujo, 200, 180);
    expect(f[12].ang).toBeCloseTo(-18.435, 2);
    expect(f[15].ang).toBeCloseTo(0, 6);
  });
});
