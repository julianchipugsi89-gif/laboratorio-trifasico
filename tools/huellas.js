// Escenarios de regresión de la interfaz y extracción de su texto visible.
//
// Lo usan dos cosas:
//  · tests/ui/escenarios.test.js → instantáneas de Vitest del texto visible (pantalla e informe).
//  · El navegador, para comparar a mano los lienzos (fasorial y osciloscopio) contra legacy/:
//      con `npm run dev` abierto, en la consola de la app:
//        const h = await import('/tools/huellas.js'); (await h.contraLegacy()).comparacion
//      (huellas() y comparar() sirven para comparar dos versiones cualesquiera).
//
// «Visible» = ni el nodo ni ningún ancestro tiene display:none en línea (ni es un aviso sin activar).
// Los paneles de pestaña inactivos sí cuentan: se ocultan por clase y su contenido está siempre pintado.

const pestana = (w, id) => {
  const btn = [...w.document.querySelectorAll('.tab')].find(b => (b.getAttribute('onclick') || '').includes(`'${id}'`));
  w.showTab(id, btn);
};
const ej3acb = w => { w.loadExercise(3); w.document.getElementById('inp-seq').value = 'acb'; w.solve(); };

// Media tensión: tensión especificada como U_f fase-neutro (13,8 kV de línea), una carga Δ y línea Z_L
const mediaTension = w => {
  const d = w.document;
  w.clearAll();
  w.setVT('phase'); d.getElementById('inp-v').value = 13800 / Math.sqrt(3); w.onSourceChange();
  w.setZL(true); d.getElementById('inp-rl').value = 2; d.getElementById('inp-xl').value = 4; w.updateZLHint();
  d.getElementById('lc-1-r').value = 300; d.getElementById('lc-1-xl').value = 225; w.setConn(1, 'delta');
  w.solve();
  return () => w.setVT('line');
};

// Cada escenario parte de un ejercicio cargado, así que no depende del orden. Puede devolver una función de limpieza.
export const ESCENARIOS = [
  ['ej1', w => w.loadExercise(1)],
  ['ej2', w => w.loadExercise(2)],
  ['ej3', w => w.loadExercise(3)],
  ['ej4', w => w.loadExercise(4)],
  ['ej1-receptor', w => { w.loadExercise(1); w.setVRef('load'); w.solve(); }],
  ['ej2-receptor', w => { w.loadExercise(2); w.setVRef('load'); w.solve(); }],
  ['ej3-wt75', w => { w.loadExercise(3); w.setWt(75); return () => w.resetWt(); }],
  ['ej3-acb', ej3acb],
  ['mt-fase-delta', mediaTension],
  ['informe', w => { w.loadExercise(4); w.showPrintView(); return () => w.closePrint(); }],
  ['tema-alt', w => { ej3acb(w); w.toggleTheme(); return () => w.toggleTheme(); }],
  ['colapso-alerta', w => { w.loadExercise(2); w.document.getElementById('inp-rl').value = 30; w.solve(); }],
  ['limpio', w => w.clearAll()],
];

export const REGIONES = {
  entradas: '.layout > aside',
  alerta: '#alertBox',
  vacio: '#empty-state',
  sintesis: '#res-badge, #results-section .card-body > .metric-row',
  laboratorio: '#tab-lab',
  esquema: '#tab-diagram',
  fasorial: '#tab-phasor',
  tabla: '#tab-table',
  pasos: '#tab-steps',
  inferior: '#bot-section',
  informe: '#print-content',
};

const oculto = el => {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    if (e.style && e.style.display === 'none') return true;
    if (e.classList.contains('alert') && !e.classList.contains('vis')) return true;
  }
  return false;
};

export function textoVisible(doc, selector) {
  const lineas = [];
  for (const raiz of doc.querySelectorAll(selector)) {
    const w = doc.createTreeWalker(raiz, 4 /* NodeFilter.SHOW_TEXT */);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (t && !oculto(n.parentElement)) lineas.push(t);
    }
  }
  return lineas.join('\n');
}

// Texto visible por región. El informe se genera aunque el escenario no lo abra.
export function capturar(w) {
  const doc = w.document, out = {};
  const modal = doc.getElementById('print-modal'), abierto = modal.style.display !== 'none';
  if (!abierto) w.showPrintView();
  for (const [nombre, sel] of Object.entries(REGIONES)) {
    if (doc.querySelector(sel)) out[nombre] = textoVisible(doc, sel);
  }
  if (!abierto) w.closePrint();
  return out;
}

// ── Solo navegador: huellas de texto visible y de los lienzos ─────────
const hash = async s => {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 5).map(x => x.toString(16).padStart(2, '0')).join('');
};

export async function huellas(w = window) {
  // El zoom del navegador cambia devicePixelRatio y, con él, los píxeles del lienzo
  Object.defineProperty(w, 'devicePixelRatio', { get: () => 1, configurable: true });
  await w.document.fonts.ready;
  const out = {};
  for (const [nombre, preparar] of ESCENARIOS) {
    w.resetWt();   // la animación del laboratorio puede haber arrancado sola
    const limpiar = preparar(w);
    const h = {};
    for (const [region, texto] of Object.entries(capturar(w))) h[region] = await hash(texto);
    pestana(w, 'phasor');
    h['lienzo fasorial'] = await hash(w.document.getElementById('phasorCanvas').toDataURL());
    h['lienzo osciloscopio'] = await hash(w.document.getElementById('waveCanvas').toDataURL());
    if (limpiar) limpiar();
    out[nombre] = h;
  }
  return out;
}

// Devuelve, por escenario, las regiones cuya huella difiere (las que solo existen en un lado se ignoran).
export function comparar(a, b) {
  const res = {};
  for (const k of Object.keys(a)) {
    const d = Object.keys(a[k]).filter(r => b[k] && r in b[k] && a[k][r] !== b[k][r]);
    res[k] = d.length ? 'DIFIERE: ' + d.join(', ') : 'igual';
  }
  return res;
}

// Compara la app contra legacy/ en una sola llamada. Carga ambas en marcos del mismo tamaño dentro de
// esta página, así el zoom y el ancho son idénticos y los lienzos son comparables píxel a píxel.
//   const h = await import('/tools/huellas.js'); await h.contraLegacy()
export async function contraLegacy(otra = '/legacy/trifasico_equilibrado_v2.html', ancho = 1100, alto = 800) {
  const marco = async src => {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:0;top:0;width:${ancho}px;height:${alto}px;opacity:0;pointer-events:none;border:0`;
    f.src = src;
    document.body.appendChild(f);
    await new Promise(r => { f.onload = r; });
    await new Promise(r => setTimeout(r, 300));
    return f;
  };
  const a = await marco(otra), b = await marco(location.pathname);
  const ha = await huellas(a.contentWindow), hb = await huellas(b.contentWindow);
  a.remove(); b.remove();
  return { comparacion: comparar(ha, hb), huellas: hb };
}
