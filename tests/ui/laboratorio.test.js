// @vitest-environment jsdom
// Laboratorio virtual (3b): contactor del banco, partículas, giro de motores y pausas de la animación.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { computeCircuit, computeInstruments, fS, fN } from '../../src/engine/index.js';
import { ejercicios } from '../fixtures/casos.js';
import { capturar } from '../../tools/huellas.js';
import { arrancarApp } from './arrancarApp.js';

const $ = id => document.getElementById(id);
const otras = t => { const { laboratorio, ...resto } = t; return resto; };
let wt;

beforeAll(async () => {
  await arrancarApp();
  wt = await import('../../src/graphics/wt.js');
});

describe('Contactor del banco', () => {
  it.each([1, 2, 3, 4])('Ej. %i: al cerrar, el amperímetro y el cosfímetro muestran las lecturas compensadas', n => {
    const r = computeCircuit(ejercicios[n]()), m = computeInstruments(r, { compensado: true });
    window.loadExercise(n);
    window.toggleLabContactor();
    const lab = capturar(window).laboratorio;
    expect(lab).toContain(`${fS(m.amp.IL)} A`);
    expect(lab).toContain(`${fN(m.fp, 4)}`);
    expect(lab).toContain(`${fS(m.vReceptor.UL)} V`);
    expect(lab).toContain('Banco conectado · las demás pestañas muestran el estado sin compensar');
  });

  it.each([1, 2])('Ej. %i en modo receptor: muestra U_L,fuente necesaria antes → después', n => {
    const r = computeCircuit({ ...ejercicios[n](), vRef: 'load' });
    const a = computeInstruments(r), b = computeInstruments(r, { compensado: true });
    window.loadExercise(n); window.setVRef('load'); window.solve();
    window.toggleLabContactor();
    const cmp = $('lab-compare').textContent;
    expect(cmp).toContain('U_L,fuente necesaria');
    expect(cmp).toContain(`${fS(a.vFuente.UL)} V → ${fS(b.vFuente.UL)} V`);
    expect(cmp).not.toContain('ΔU en la carga');
    expect(capturar(window).laboratorio).toContain(`${fS(b.amp.IL)} A`);
  });

  it('Ej. 1: el antes → después incluye I_L, fp, pérdidas y ΔU', () => {
    window.loadExercise(1); window.toggleLabContactor();
    const cmp = $('lab-compare').textContent;
    for (const t of ['I_L en la línea', 'fp en la fuente', 'Pérdidas en la línea', 'ΔU en la carga']) expect(cmp).toContain(t);
    expect($('lab-compare').style.display).toBe('');
  });

  it('solo afecta al laboratorio: el resto de pestañas y el informe no cambian', () => {
    window.loadExercise(2);
    const antes = capturar(window);
    window.toggleLabContactor();
    const cerrado = capturar(window);
    expect(otras(cerrado)).toEqual(otras(antes));
    expect(cerrado.laboratorio).not.toBe(antes.laboratorio);
    window.toggleLabContactor();
    expect(capturar(window)).toEqual(antes);                  // abrir devuelve exactamente las lecturas iniciales
  });

  it('no recalcula: el resultado del circuito es el mismo objeto antes y después', async () => {
    const estado = await import('../../src/core/state.js');
    window.loadExercise(1);
    const r = estado.lastResult;
    window.toggleLabContactor();
    expect(estado.lastResult).toBe(r);
  });

  it('cada nueva resolución empieza con el banco desconectado', () => {
    window.loadExercise(1); window.toggleLabContactor();
    expect($('lab-k-btn').textContent).toBe('Desconectar banco');
    window.solve();
    expect($('lab-k-btn').textContent).toBe('Conectar banco');
    expect($('lab-compare').style.display).toBe('none');
  });

  it('el contactor dibujado en la escena responde al clic', () => {
    window.loadExercise(1);
    $('lab-contactor').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect($('lab-contactor').getAttribute('aria-pressed')).toBe('true');
    expect($('lab-k-btn').getAttribute('aria-pressed')).toBe('true');
  });

  it('sin fp objetivo: deshabilitado, con el motivo a la vista', () => {
    window.loadExercise(1); $('inp-fptgt').value = ''; window.solve();
    expect($('lab-k-btn').disabled).toBe(true);
    expect($('lab-k-why').textContent).toContain('no hay fp objetivo');
    expect($('lab-contactor').getAttribute('aria-disabled')).toBe('true');
    const antes = capturar(window).laboratorio;
    window.toggleLabContactor();
    $('lab-contactor').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(capturar(window).laboratorio).toBe(antes);
    expect(antes).toContain('Banco sin dimensionar');
  });

  it('fp objetivo ya alcanzado: deshabilitado porque no se requiere corrección', () => {
    window.loadExercise(1); $('inp-fptgt').value = 0.5; window.solve();
    expect($('lab-k-btn').disabled).toBe(true);
    expect($('lab-k-why').textContent).toContain('no se requiere corrección');
  });
});

describe('Partículas y motores en función de ωt', () => {
  afterEach(() => window.resetWt());

  it('la partícula de la línea A está en amp·cos(ωt + θ_IA): va y viene', () => {
    window.loadExercise(1);
    const f = $('lab-scene').querySelector('.lab-flow');
    const amp = +f.getAttribute('data-amp'), ang = +f.getAttribute('data-ang');
    const pos = () => +f.style.strokeDashoffset;
    for (const w of [0, 90, 180, 270]) {
      window.setWt(w);
      expect(pos()).toBeCloseTo(amp * Math.cos((w + ang) * Math.PI / 180), 1);
    }
    window.setWt(0); const p0 = pos();
    window.setWt(180);
    expect(pos()).toBeCloseTo(-p0, 1);                        // medio ciclo después está en el extremo opuesto
  });

  it('las tres fases están desfasadas 120°', () => {
    window.loadExercise(1);
    const [a, b, c] = ['A', 'B', 'C'].map(f => +$(`lab-wire-${f}`).nextElementSibling.getAttribute('data-ang'));
    expect(((a - b) % 360 + 360) % 360).toBeCloseTo(120, 1);
    expect(((a - c) % 360 + 360) % 360).toBeCloseTo(240, 1);
  });

  it('al cerrar el contactor baja el recorrido de la partícula de línea y aparecen las del banco', () => {
    window.loadExercise(1);
    const amp = () => +$('lab-wire-A').nextElementSibling.getAttribute('data-amp');
    const n = () => $('lab-bank').querySelectorAll('.lab-flow').length;
    const a0 = amp();
    expect(n()).toBe(0);
    window.toggleLabContactor();
    expect(amp()).toBeLessThan(a0);
    expect(n()).toBe(3);
  });

  it('motores: el sentido de giro se invierte con la secuencia ACB', () => {
    const giro = () => $('lab-scene').querySelector('.lab-rotor').getAttribute('transform');
    window.loadExercise(2); window.setWt(90);
    expect(giro()).toMatch(/^rotate\(-90\.0 /);
    $('inp-seq').value = 'acb'; window.solve(); window.setWt(90);
    expect(giro()).toMatch(/^rotate\(90\.0 /);
  });

  it('el deslizador del laboratorio refleja el mismo ωt que el del fasorial', () => {
    window.loadExercise(1); window.setWt(135);
    expect($('lab-wt-range').value).toBe('135');
    expect($('wt-range').value).toBe('135');
    expect($('lab-wt-val').textContent).toBe($('wt-val').textContent);
  });

  it('rotula que es cámara lenta', () => {
    window.loadExercise(1);
    expect($('lab-slow-note').textContent).toContain('Cámara lenta: un ciclo de la red (1/60 s) se muestra en 6 s');
  });
});

describe('Arranque y pausas de la animación', () => {
  const pestana = id => window.showTab(id, [...document.querySelectorAll('.tab')].find(b => b.getAttribute('onclick').includes(`'${id}'`)));
  const animando = () => $('lab-wt-play').textContent === '⏸ Pausar';
  const conMovimiento = reducir => {
    window.matchMedia = q => ({ matches: reducir && q.includes('prefers-reduced-motion') });
    window.requestAnimationFrame = () => 1;
    window.cancelAnimationFrame = () => {};
  };
  afterEach(() => { window.resetWt(); delete window.matchMedia; });

  it('con prefers-reduced-motion no arranca sola', () => {
    conMovimiento(true);
    window.loadExercise(1); wt.autoStartWt();
    expect(animando()).toBe(false);
  });

  it('sin esa preferencia arranca sola y los dos botones pasan a «Pausar»', () => {
    conMovimiento(false);
    window.loadExercise(1); wt.autoStartWt();
    expect(animando()).toBe(true);
    expect($('wt-play').textContent).toBe('⏸ Pausar');
  });

  it('con prefers-reduced-motion el botón Animar sigue funcionando a petición del usuario', () => {
    conMovimiento(true);
    window.loadExercise(1); window.toggleWtAnim();
    expect(animando()).toBe(true);
  });

  it('se pausa al cambiar de pestaña; si arrancó sola, el fasorial vuelve a su estado estático', () => {
    conMovimiento(false);
    window.loadExercise(1); wt.autoStartWt(); pestana('phasor');
    expect(animando()).toBe(false);
    expect($('wt-val').textContent).toBe('ωt = 0° (estático)');
    pestana('lab');
    expect(animando()).toBe(true);                            // al volver al laboratorio arranca de nuevo
  });

  it('si la arrancó el usuario, al cambiar de pestaña se pausa pero conserva su ωt', () => {
    conMovimiento(false);
    window.loadExercise(1); pestana('lab'); window.stopWtAnim(); window.setWt(40); window.toggleWtAnim();
    pestana('table');
    expect(animando()).toBe(false);
    expect($('wt-val').textContent).toBe('ωt = 40°');
  });

  it('se pausa al ocultarse la página y no arranca mientras siga oculta', () => {
    conMovimiento(false);
    window.loadExercise(1); wt.autoStartWt();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new window.Event('visibilitychange'));
    expect(animando()).toBe(false);
    wt.autoStartWt();
    expect(animando()).toBe(false);
    delete document.hidden;
  });
});
