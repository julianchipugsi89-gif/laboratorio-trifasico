// DOM mínimo para ejercitar los módulos de interfaz en node, sin jsdom.
// Cada elemento guarda lo que se le escribe; el contexto 2D registra las llamadas de dibujo.
import { vi } from 'vitest';

export function instalarDomSimulado({ anchoLienzo = 400 } = {}) {
  const elementos = new Map();
  const dibujo = [];

  const ctx = new Proxy({}, {
    get(estado, prop) {
      if (prop in estado) return estado[prop];
      if (prop === 'measureText') return () => ({ width: 10 });
      return (...args) => { dibujo.push({ op: prop, args }); };
    },
    set(estado, prop, valor) { estado[prop] = valor; return true; },
  });

  const crear = () => ({
    innerHTML: '', textContent: '', value: '', className: '', style: {}, width: 0, height: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    parentElement: { clientWidth: anchoLienzo },
    addEventListener() {},
    getContext: () => ctx,
    get previousElementSibling() { return this.hermanoAnterior ??= crear(); },
  });

  const el = id => {
    if (!elementos.has(id)) elementos.set(id, crear());
    return elementos.get(id);
  };

  vi.stubGlobal('document', { getElementById: el, documentElement: {}, querySelectorAll: () => [], body: { style: {} } });
  vi.stubGlobal('window', { devicePixelRatio: 1, addEventListener() {}, matchMedia: () => ({ matches: false }) });
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '' }));

  return { el, dibujo };
}

export const sinEtiquetas = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

// Flechas del fasorial: cada una es moveTo(centro) seguido de lineTo(punta).
// Devuelve el ángulo (grados, antihorario) y la longitud de cada flecha, en orden de dibujo.
export function flechasDesdeCentro(dibujo, cx, cy) {
  const flechas = [];
  for (let i = 0; i + 1 < dibujo.length; i++) {
    const a = dibujo[i], b = dibujo[i + 1];
    if (a.op === 'moveTo' && b.op === 'lineTo' && a.args[0] === cx && a.args[1] === cy) {
      const [x, y] = b.args;
      flechas.push({ ang: Math.atan2(cy - y, x - cx) * 180 / Math.PI, len: Math.hypot(x - cx, y - cy) });
    }
  }
  return flechas;
}
