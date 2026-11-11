// @vitest-environment jsdom
// Instantáneas del texto visible (pantalla e informe) de los 13 escenarios de regresión.
// Carga el index.html real y la aplicación completa sobre un DOM simulado (jsdom).
// Los lienzos (fasorial y osciloscopio) no se cubren aquí: se comparan a mano con tools/huellas.js.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import { ESCENARIOS, REGIONES, capturar } from '../../tools/huellas.js';

beforeAll(async () => {
  const html = fs.readFileSync('index.html', 'utf8');   // la raíz de Vitest es la del proyecto
  document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '');
  // jsdom no implementa canvas: contexto 2D que acepta cualquier llamada de dibujo
  const ctx = new Proxy({}, {
    get: (estado, p) => p in estado ? estado[p] : p === 'measureText' ? () => ({ width: 10 }) : () => {},
    set: (estado, p, v) => { estado[p] = v; return true; },
  });
  window.HTMLCanvasElement.prototype.getContext = () => ctx;
  await import('../../src/main.js');
});

describe.each(ESCENARIOS)('%s', (nombre, preparar) => {
  let texto;
  beforeAll(() => {
    const limpiar = preparar(window);
    texto = capturar(window);
    if (limpiar) limpiar();
  });

  it.each(Object.keys(REGIONES))('%s', region => {
    if (!(region in texto)) return;          // la región aún no existe en el HTML
    expect(texto[region]).toMatchSnapshot();
  });
});

describe('criterio de visibilidad', () => {
  it('sin Z_L la fila de ΔU está oculta y no entra en la instantánea', () => {
    window.loadExercise(1); window.setVRef('load'); window.solve();   // deja −2,50 % en la celda
    window.loadExercise(3);                                            // sin Z_L: la fila se oculta
    expect(document.getElementById('mv-udrop').textContent).toBe('−2.50 %');
    expect(capturar(window).sintesis).not.toContain('−2.50 %');
  });

  it('tras «Limpiar todo» no queda texto visible de resultados ni informe', () => {
    window.clearAll();
    const t = capturar(window);
    expect(t.sintesis).toBe('');
    expect(t.pasos).toBe('');
    expect(t.inferior).toBe('');
    expect(t.vacio).toContain('Configura la fuente y las cargas');
  });
});
