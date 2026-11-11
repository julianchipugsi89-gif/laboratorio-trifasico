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

describe('Sentido de las partículas respecto a i = Î·sen(ωt + θ)', () => {
  // La posición a lo largo del trazo es −(desplazamiento del patrón de guiones): un stroke-dashoffset
  // positivo retrasa los guiones hacia el inicio del trazo.
  const linea = () => $('lab-wire-A').nextElementSibling;
  const pos = (f, w) => { window.setWt(w); return -(+f.style.strokeDashoffset); };
  afterEach(() => window.resetWt());

  it('el trazo de la línea va de la fuente a los bornes del receptor', () => {
    window.loadExercise(1);
    const [, x0, x1] = linea().getAttribute('d').match(/^M(\d+) \d+ H(\d+)$/).map(Number);
    expect(x0).toBeLessThan(x1);                             // x crece de la fuente (izquierda) a la carga
    expect(x0).toBe(98);
  });

  it.each([1, 2, 4])('Ej. %i: con i_A > 0 la partícula avanza de fuente a carga; con i_A < 0 retrocede', n => {
    window.loadExercise(n);
    const f = linea(), ang = +f.getAttribute('data-ang');
    for (let w = 0; w < 360; w += 15) {
      const i = Math.sin((w + ang) * Math.PI / 180);         // signo de i_A(ωt)
      if (Math.abs(i) < 0.2) continue;                       // cerca del cruce por cero no se compara
      const v = pos(f, w + 1) - pos(f, w - 1);               // velocidad ∝ dx/d(ωt)
      expect(Math.sign(v)).toBe(Math.sign(i));
    }
  });

  it('en el pico de i_A la velocidad es máxima y la partícula está en el centro de su recorrido', () => {
    window.loadExercise(1);
    const f = linea(), amp = +f.getAttribute('data-amp'), ang = +f.getAttribute('data-ang');
    const pico = 90 - ang;                                   // ωt + θ = 90° → i = +Î
    expect(pos(f, pico)).toBeCloseTo(0, 1);                  // centro del recorrido (que va de −amp a +amp)
    const vel = w => Math.abs(pos(f, w + 1) - pos(f, w - 1));
    const vPico = vel(pico);
    for (const d of [30, 60, 90, 120, 150]) expect(vel(pico + d)).toBeLessThan(vPico);
    expect(vel(pico + 90)).toBeLessThan(0.05 * vPico);       // en el cruce por cero de i, la partícula se detiene…
    expect(Math.abs(pos(f, pico + 90))).toBeCloseTo(amp, 1); // …en un extremo del recorrido
  });

  it('en las derivaciones, i > 0 baja del embarrado hacia la carga', () => {
    window.loadExercise(1);
    const f = $('lab-load-1').querySelector('.lab-flow'), ang = +f.getAttribute('data-ang');
    const [, y0, y1] = f.getAttribute('d').match(/^M\d+ (\d+) V(\d+)$/).map(Number);
    expect(y0).toBeLessThan(y1);                             // el trazo baja del embarrado al bloque de carga
    const pico = 90 - ang;
    expect(pos(f, pico + 1) - pos(f, pico - 1)).toBeGreaterThan(0);
  });
});

describe('Pilotos con el contactor', () => {
  const estados = () => [...document.querySelectorAll('#lab-pilots .lab-pilot')].map(p => p.className.replace('lab-pilot ', ''));

  it('Ej. 1: el piloto de fp pasa de aviso a normal al conectar el banco y vuelve al desconectar', () => {
    window.loadExercise(1);
    expect(estados()[0]).toBe('warn');
    window.toggleLabContactor();
    expect(estados()[0]).toBe('ok');
    expect($('lab-pilots').textContent).toContain('Factor de potencia: cumple con el banco conectado');
    expect($('lab-pilots-sub').textContent).toBe('Estado con el banco conectado');
    window.toggleLabContactor();
    expect(estados()[0]).toBe('warn');
  });

  it('el diagnóstico normativo de la parte inferior y el informe no cambian con el contactor', () => {
    window.loadExercise(1);
    const antes = capturar(window);
    window.toggleLabContactor();
    const t = capturar(window);
    expect(t.inferior).toBe(antes.inferior);
    expect(t.informe).toBe(antes.informe);
    expect(t.inferior).toContain('cumple solo con la compensación propuesta');
  });
});

describe('Escala mínima de la escena por legibilidad', () => {
  it('ningún texto de la escena tiene una fuente menor que FUENTE_MIN', async () => {
    const { FUENTE_MIN } = await import('../../src/graphics/labScene.js');
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/styles/lab.css', 'utf8');
    window.loadExercise(2); window.toggleLabContactor();
    const clases = new Set([...$('lab-scene').querySelectorAll('text')].flatMap(t => t.getAttribute('class').split(' ')));
    const tam = [];
    for (const c of clases) {
      const m = css.match(new RegExp(String.raw`^\.${c}\{[^}]*font-size:([\d.]+)px`, 'm'));
      if (m) tam.push([c, +m[1]]);
    }
    expect(tam.length).toBeGreaterThanOrEqual(5);              // lab-t, lab-cap, lab-val, lab-sym, lab-big, lab-flag
    for (const [c, px] of tam) expect(px, c).toBeGreaterThanOrEqual(FUENTE_MIN);
  });

  it('el ancho mínimo deja el texto más pequeño en 9 px efectivos (escala 9/11)', async () => {
    const { FUENTE_MIN, PX_LEGIBLE } = await import('../../src/graphics/labScene.js');
    window.loadExercise(2);
    const svg = $('lab-scene').querySelector('svg');
    const W = +svg.getAttribute('viewBox').split(' ')[2];
    expect(parseFloat(svg.style.minWidth)).toBe(Math.round(W * PX_LEGIBLE / FUENTE_MIN));
    expect(FUENTE_MIN * parseFloat(svg.style.minWidth) / W).toBeCloseTo(9, 1);
  });
});

describe('Coste de la animación', () => {
  const pestana = id => window.showTab(id, [...document.querySelectorAll('.tab')].find(b => b.getAttribute('onclick').includes(`'${id}'`)));
  afterEach(() => { window.resetWt(); delete window.matchMedia; });

  it('animando en el laboratorio no se repinta el fasorial oculto; al abrirlo se pone al día', () => {
    let fotograma = null;
    window.requestAnimationFrame = cb => { fotograma = cb; return 1; };
    window.cancelAnimationFrame = () => {};
    window.loadExercise(1); pestana('lab'); window.setWt(0);
    const lectura0 = $('wt-readout').textContent;
    const particula = () => $('lab-wire-A').nextElementSibling.style.strokeDashoffset;
    const p0 = particula();
    window.toggleWtAnim();
    fotograma(1000); fotograma(1100);                          // 100 ms a 60°/s → ωt = 6°
    expect($('lab-wt-val').textContent).toBe('ωt = 6°');
    expect(particula()).not.toBe(p0);                          // el laboratorio, a la vista, sí se mueve
    expect($('wt-readout').textContent).toBe(lectura0);        // el fasorial, oculto, no se toca
    pestana('phasor');
    expect($('wt-readout').textContent).toContain('Instante ωt = 6°');
  });

  it('fijar ωt a mano lo repinta todo, también lo oculto', () => {
    window.loadExercise(1); pestana('lab'); window.setWt(45);
    expect($('wt-readout').textContent).toContain('Instante ωt = 45°');
  });
});

describe('Accesibilidad de los campos', () => {
  it('todo campo de entrada tiene una etiqueta asociada o un nombre accesible', () => {
    window.loadExercise(2);
    const sinNombre = [...document.querySelectorAll('input, select')]
      .filter(c => !c.getAttribute('aria-label') && !document.querySelector(`label[for="${c.id}"]`))
      .map(c => c.id);
    expect(sinNombre).toEqual([]);
  });

  it('hay una única región principal', () => {
    expect(document.querySelectorAll('main')).toHaveLength(1);
    expect(document.querySelector('main .layout')).not.toBeNull();
    expect(document.querySelector('main #bot-section')).not.toBeNull();
  });
});
