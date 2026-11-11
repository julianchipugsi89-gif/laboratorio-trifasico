// @vitest-environment jsdom
// Desarrollo guiado (3c): identificadores de paso, elementos resaltados, navegación, teclado y salida.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { ESCENARIOS, capturar } from '../../tools/huellas.js';
import { arrancarApp } from './arrancarApp.js';

const $ = id => document.getElementById(id);
const tecla = (key, target = document.body) => target.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const resaltados = () => [...$('lab-scene').querySelectorAll('.lab-hl')].map(e => e.id).sort();
const escena = () => $('lab-scene').innerHTML;
let pasosDe, estado, guia;

beforeAll(async () => {
  await arrancarApp();
  ({ buildSteps: pasosDe } = await import('../../src/ui/steps.js'));
  estado = await import('../../src/core/state.js');
  guia = await import('../../src/ui/guide.js');
});
afterEach(() => { window.exitGuide(); vi.useRealTimers(); });

const IDS = ['sistema', 'cargas', 'motores', 'paralelo', 'monofasico', 'caida-linea', 'fuente-hacia-atras', 'corrientes-carga', 'simetria', 'potencias'];

describe.each(ESCENARIOS)('Pasos del escenario %s', (nombre, preparar) => {
  let limpiar;
  beforeAll(() => { limpiar = preparar(window); });
  it('todo paso tiene identificador estable y único, y todos sus elementos existen en la escena', () => {
    if (nombre === 'limpio') { expect(estado.lastResult).toBeNull(); return; }
    const pasos = pasosDe(estado.lastResult);
    expect(pasos.length).toBeGreaterThanOrEqual(4);
    expect(new Set(pasos.map(p => p.id)).size).toBe(pasos.length);
    for (const p of pasos) {
      expect(IDS, p.t).toContain(p.id);
      expect(p.els.length, p.id).toBeGreaterThan(0);
      for (const id of p.els) expect($('lab-scene').querySelector('#' + id), `${p.id} → ${id}`).not.toBeNull();
    }
  });

  it('navegación completa de ida y vuelta; al salir la escena queda como estaba', () => {
    if (nombre === 'limpio') { window.startGuide(); expect($('lab-guide').style.display).toBe('none'); return; }
    const antes = escena(), pasos = pasosDe(estado.lastResult);
    window.startGuide();
    pasos.forEach((p, i) => {
      expect($('lab-guide-n').textContent).toBe(`Paso ${i + 1} de ${pasos.length}`);
      expect($('lab-guide-title').textContent).toBe(p.t);
      expect(resaltados()).toEqual([...p.els].sort());
      window.guideNext();
    });
    expect(guia.guideEstado().idx).toBe(pasos.length - 1);      // «siguiente» en el último paso no avanza
    for (let i = pasos.length - 1; i > 0; i--) window.guidePrev();
    window.guidePrev();                                          // «anterior» en el primero no retrocede
    expect(guia.guideEstado().idx).toBe(0);
    expect(resaltados()).toEqual([...pasos[0].els].sort());
    window.exitGuide();
    expect(escena()).toBe(antes);
    expect($('lab-guide').style.display).toBe('none');
    if (limpiar) limpiar();
  });
});

describe('Identificadores según el circuito', () => {
  const ids = () => pasosDe(estado.lastResult).map(p => p.id);
  it('Ej. 1 (dos cargas, Z_L, sin motores)', () => {
    window.loadExercise(1);
    expect(ids()).toEqual(['sistema', 'cargas', 'paralelo', 'monofasico', 'caida-linea', 'corrientes-carga', 'simetria', 'potencias']);
  });
  it('Ej. 2 añade «motores»', () => {
    window.loadExercise(2);
    expect(ids()).toEqual(['sistema', 'cargas', 'motores', 'paralelo', 'monofasico', 'caida-linea', 'corrientes-carga', 'simetria', 'potencias']);
  });
  it('modo receptor cambia «caida-linea» por «fuente-hacia-atras»', () => {
    window.loadExercise(1); window.setVRef('load'); window.solve();
    expect(ids()).toContain('fuente-hacia-atras');
    expect(ids()).not.toContain('caida-linea');
  });
  it('sin Z_L no hay paso de línea (Ej. 4)', () => {
    window.loadExercise(4);
    expect(ids()).toEqual(['sistema', 'cargas', 'paralelo', 'monofasico', 'corrientes-carga', 'simetria', 'potencias']);
  });
  it('una sola carga Y: sin «paralelo» ni «corrientes-carga»', () => {
    window.clearAll(); $('inp-v').value = 400; $('lc-1-r').value = 30; $('lc-1-xl').value = 40; window.updLoad(1); window.solve();
    expect(ids()).toEqual(['sistema', 'cargas', 'monofasico', 'simetria', 'potencias']);
  });
});

describe('Modo guiado', () => {
  it('atenúa el resto de la escena y muestra el texto del paso junto a ella', () => {
    window.loadExercise(1); window.startGuide();
    const svg = $('lab-scene').querySelector('svg');
    expect(svg.classList.contains('lab-guided')).toBe(true);
    expect($('lab-guide').style.display).toBe('');
    expect($('lab-guide').parentElement.id).toBe('lab-stage');          // dentro de lo que va a pantalla completa
    expect($('lab-guide-body').textContent).toContain('U_f = U_L/√3');
    window.exitGuide();
    expect($('lab-scene').querySelector('svg').classList.contains('lab-guided')).toBe(false);
    expect(resaltados()).toEqual([]);
  });

  it('la pestaña «Desarrollo paso a paso», el resto de pestañas y el informe no cambian', () => {
    window.loadExercise(2);
    const { laboratorio: _a, ...antes } = capturar(window);
    window.startGuide(); window.guideNext(); window.guideNext();
    const { laboratorio: _b, ...durante } = capturar(window);
    expect(durante).toEqual(antes);
  });

  it('el contactor queda desconectado y bloqueado, con el motivo a la vista', () => {
    window.loadExercise(1); window.toggleLabContactor();
    expect($('lab-k-btn').textContent).toBe('Desconectar banco');
    const cerradoAntes = escena();
    window.startGuide();
    expect($('lab-k-btn').textContent).toBe('Conectar banco');
    expect($('lab-k-btn').disabled).toBe(true);
    expect($('lab-k-why').textContent).toContain('Modo guiado');
    expect($('lab-contactor').getAttribute('role')).toBeNull();
    expect($('lab-compare').style.display).toBe('none');
    window.toggleLabContactor();
    $('lab-contactor').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect($('lab-k-btn').textContent).toBe('Conectar banco');           // sigue desconectado
    window.exitGuide();
    expect($('lab-k-btn').textContent).toBe('Desconectar banco');        // vuelve a como estaba: cerrado
    expect($('lab-k-btn').disabled).toBe(false);
    expect(escena()).toBe(cerradoAntes);
  });

  it('la animación ωt sigue disponible y el resaltado se mantiene al mover ωt', () => {
    window.loadExercise(2); window.startGuide(); window.guideNext();
    const hl = resaltados();
    window.setWt(120);
    expect($('lab-wt-val').textContent).toBe('ωt = 120°');
    expect($('lab-scene').querySelector('.lab-rotor').getAttribute('transform')).toMatch(/^rotate\(-120\.0 /);
    expect(resaltados()).toEqual(hl);
    window.resetWt();
  });

  it('un resultado nuevo termina el modo guiado', () => {
    window.loadExercise(1); window.startGuide(); window.guideNext();
    window.loadExercise(3);
    expect(guia.guideEstado().activo).toBe(false);
    expect($('lab-guide').style.display).toBe('none');
    expect($('lab-k-btn').disabled).toBe(false);
    expect(resaltados()).toEqual([]);
  });
});

describe('Teclado', () => {
  const idx = () => guia.guideEstado().idx;
  it('flechas y AvPág/RePág avanzan y retroceden; Esc sale', () => {
    window.loadExercise(1); window.startGuide();
    tecla('ArrowRight'); expect(idx()).toBe(1);
    tecla('PageDown'); expect(idx()).toBe(2);
    tecla('ArrowDown'); expect(idx()).toBe(3);
    tecla('ArrowLeft'); expect(idx()).toBe(2);
    tecla('PageUp'); expect(idx()).toBe(1);
    tecla('ArrowUp'); expect(idx()).toBe(0);
    tecla('Escape');
    expect(guia.guideEstado().activo).toBe(false);
  });

  it('las teclas se consumen (AvPág no desplaza la página) solo con el modo guiado activo', () => {
    window.loadExercise(1);
    expect(tecla('PageDown')).toBe(true);                               // inactivo: no se cancela
    window.startGuide();
    expect(tecla('PageDown')).toBe(false);                              // activo: preventDefault
    expect(tecla('a')).toBe(true);
  });

  it('con el foco en un campo o en el deslizador de ωt las flechas no cambian de paso', () => {
    window.loadExercise(1); window.startGuide();
    tecla('ArrowRight', $('lab-wt-range'));
    tecla('ArrowRight', $('inp-v'));
    expect(idx()).toBe(0);
  });

  it('fuera de la pestaña del laboratorio no actúa', () => {
    window.loadExercise(1); window.startGuide();
    const tab = id => window.showTab(id, [...document.querySelectorAll('.tab')].find(b => b.getAttribute('onclick').includes(`'${id}'`)));
    tab('steps');
    tecla('ArrowRight');
    expect(idx()).toBe(0);
    tab('lab');
    tecla('ArrowRight');
    expect(idx()).toBe(1);
  });
});

describe('Avance automático', () => {
  it('avanza un paso cada intervalo, se puede pausar y se detiene en el último', () => {
    vi.useFakeTimers();
    window.loadExercise(1); window.startGuide();
    const n = guia.guideEstado().pasos.length;
    window.toggleGuideAuto();
    expect($('lab-guide-auto').textContent).toBe('⏸ Pausar avance');
    vi.advanceTimersByTime(guia.GUIDE_MS * 2);
    expect(guia.guideEstado().idx).toBe(2);
    window.toggleGuideAuto();                                            // pausa
    vi.advanceTimersByTime(guia.GUIDE_MS * 3);
    expect(guia.guideEstado().idx).toBe(2);
    expect($('lab-guide-auto').textContent).toBe('▶ Avance automático');
    window.toggleGuideAuto();
    vi.advanceTimersByTime(guia.GUIDE_MS * (n + 3));
    expect(guia.guideEstado().idx).toBe(n - 1);
    expect(guia.guideEstado().auto).toBe(false);                         // al llegar al final se detiene solo
  });

  it('se pausa al cambiar de pestaña y al salir', () => {
    vi.useFakeTimers();
    window.loadExercise(1); window.startGuide(); window.toggleGuideAuto();
    window.showTab('table', [...document.querySelectorAll('.tab')].find(b => b.getAttribute('onclick').includes("'table'")));
    expect(guia.guideEstado().auto).toBe(false);
    window.toggleGuideAuto();
    window.exitGuide();
    vi.advanceTimersByTime(guia.GUIDE_MS * 3);
    expect(guia.guideEstado().activo).toBe(false);
  });
});
