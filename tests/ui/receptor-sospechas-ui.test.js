// Inconsistencias corregidas en modo receptor con Z_L (recMode; ver CHANGELOG.md) — parte de la interfaz.
// Caso con δ grande y números redondos (ver fixtures): Y 30 Ω, Z_L = j10 Ω, 400 V en el receptor.
//   Ū_A′N = 230,940∠0° V (dato) · Ū_AN = 243,432∠+18,43° V · U_L,fuente = 421,637 V
//   fp fuente = cos 18,435° = 0,9487 · fp carga = 1,0000
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

  it('Ū_AN de la tabla = 243,432 ∠+18,43°', () => {
    expect(tabla).toContain('Ū_AN 243.432 ∠+18.43°');
  });

  it('Ū_AB de la tabla = 421,637 ∠+48,43°', () => {
    expect(tabla).toContain('Ū_AB 421.637 ∠+48.43°');
  });

  it('lectura ωt = 0°: u_A = √2·243,432·sen 18,435° = 108,9 V y Û = 344,3 V', () => {
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

  it('pasos: 0,9487 se rotula «fp (entrada)» y ya no «fp (carga)»', () => {
    expect(pasos).toMatch(/fp \(entrada\) = 0\.9487/);
    expect(pasos).not.toMatch(/fp \(carga\)/);
  });

  it('pasos: el fp de la carga (1,0000) aparece como en modo fuente', () => {
    expect(pasos).toMatch(/fp de la carga = cos\(∠Z_eq\) = 1\.0000/);
  });

  it('informe: «fp (entrada)» = 0,9487 y «fp de las cargas» = 1,0000', () => {
    expect(informe).toMatch(/fp \(entrada\)0\.9487/);
    expect(informe).toMatch(/fp de las cargas1\.0000/);
    expect(informe).not.toMatch(/fp \(carga\)/);
  });
});

describe('Arreglo 6 — redacción de ΔU en modo receptor', () => {
  it('tarjeta: «Caída en la línea respecto a la fuente» = −5,13 %', () => {
    pintar(receptorDelta());
    expect(dom.el('mv-udrop').previousElementSibling.textContent).toBe('Caída en la línea respecto a la fuente');
    expect(dom.el('mv-udrop').textContent).toBe('−5.13 %');
  });

  it('en modo fuente la tarjeta conserva «ΔU en la carga»', () => {
    pintar(entrada({ zLineEnabled: true, ZL: { R: 0, X: 10 }, loads: [imp('star', 30)] }));
    expect(dom.el('mv-udrop').previousElementSibling.textContent).toBe('ΔU en la carga');
  });

  it('tabla de compensación: la fila no dice «respecto a U_n» en modo receptor', () => {
    pintar(receptorA1({ fpTgt: 0.95 }));
    const txt = sinEtiquetas(dom.el('fp-corr-body').innerHTML);
    expect(txt).toContain('Caída en la línea resp. a la fuente−3.86 %−2.72 %');
    expect(txt).not.toContain('respecto a U_n');
  });
});

describe('Sospecha 4 — texto «Banco a U_L nominal»', () => {
  it('el valor mostrado junto a «U_L nominal (400.0 V)» es Q a 400 V = 1,929 kvar', () => {
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

  it('Ū_A′N (carga, el dato) se dibuja en 0°', () => {
    expect(carga[0].ang).toBeCloseTo(0, 2);
  });

  it('Ū_A′N es más corta que Ū_AN en la proporción 230,940/243,432 = 0,9487', () => {
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
