// Laboratorio virtual: escena del banco, panel de instrumentos, contactor y pilotos de alarma
import { fS, fN, fA, fPow, fpTag, sgn } from '../engine/format.js';
import { computeInstruments } from '../engine/instruments.js';
import { r2d, bad } from '../engine/math.js';
import { normItems } from '../engine/norms.js';
import { updateLabAnim } from '../graphics/labAnim.js';
import { genLabSVG } from '../graphics/labScene.js';
import { WT_SPEED } from '../graphics/wt.js';
import { $ } from '../core/dom.js';

const ESTADO={ok:'Normal',warn:'Aviso',bad:'Alarma',na:'No aplica'};

// Estado propio del laboratorio: el contactor no afecta a las demás pestañas ni recalcula el circuito
let labR=null,cerrado=false;

function tarjeta(sim,nombre,valor,sub,neg){
  return `<div class="lab-meter"><div class="lm-head"><span class="lm-sym">${sim}</span><span class="lm-name">${nombre}</span></div>`+
    `<div class="lm-val${neg?' neg':''}">${valor}</div><div class="lm-sub">${sub}</div></div>`;
}

// Por qué no se puede conectar el banco: [motivo completo, versión corta para la escena]
function motivoSinBanco(r){
  if(r.comp)return['',''];
  return bad(r.fpTgt)
    ?['Contactor deshabilitado: no hay fp objetivo, así que no hay banco dimensionado.','sin fp objetivo']
    :['Contactor deshabilitado: no se requiere corrección, el fp en bornes de carga ya alcanza el objetivo.','no requiere corrección'];
}

function comparacionHTML(r,a,b){
  const pct=(x,y)=>`${sgn((y-x)/x*100,1)} %`;
  const filas=[
    ['I_L en la línea',`${fS(a.amp.IL)} A`,`${fS(b.amp.IL)} A`,pct(a.amp.IL,b.amp.IL)],
    ['fp en la fuente',`${fN(a.fp,4)} ${fpTag(a.φ)}`,`${fN(b.fp,4)} ${fpTag(b.φ)}`,''],
  ];
  if(r.zLineEnabled){
    filas.push(['Pérdidas en la línea',fPow(a.Pline,'W'),fPow(b.Pline,'W'),pct(a.Pline,b.Pline)]);
    filas.push(r.recMode
      ?['U_L,fuente necesaria',`${fS(a.vFuente.UL)} V`,`${fS(b.vFuente.UL)} V`,pct(a.vFuente.UL,b.vFuente.UL)]
      :['ΔU en la carga',`${sgn(a.dUpct)} %`,`${sgn(b.dUpct)} %`,`U_carga ${fS(a.vReceptor.UL)} → ${fS(b.vReceptor.UL)} V`]);
  }
  return `<div class="lab-cmp-title">Al conectar el banco · antes → después</div><div class="lab-cmp-grid">`+
    filas.map(([n,x,y,d])=>`<div class="lab-cmp"><div class="lm-name">${n}</div><div class="lab-cmp-v"><span>${x}</span> → <b>${y}</b></div><div class="lm-sub">${d}</div></div>`).join('')+
    `</div>`+(r.zLineEnabled?'':`<div class="lm-sub">Sin Z_L no hay pérdidas de línea ni caída de tensión que comparar.</div>`);
}

function pintar(){
  const r=labR;
  const base=computeInstruments(r),comp=r.comp?computeInstruments(r,{compensado:true}):null;
  const m=cerrado?comp:base;
  const [motivo,motivoCorto]=motivoSinBanco(r);
  // Escala común de las partículas en ambos estados: al conectar el banco se ve bajar la corriente de línea
  const iref=Math.max(...[base,comp].filter(Boolean).flatMap(x=>[x.amp.IL,...x.cargas.map(c=>c.I),x.banco?x.banco.I:0]));
  $('lab-scene').innerHTML=genLabSVG(r,m,{iref,cerrado,motivoCorto});

  const abc=r.seq==='abc';
  const cards=[
    tarjeta('V','Voltímetro · fuente',`${fS(m.vFuente.UL)} V`,`línea-línea A–B${r.recMode?' · calculada':r.zLineEnabled?' · dato':''}`),
    tarjeta('V','Voltímetro · receptor',`${fS(m.vReceptor.UL)} V`,`línea-línea A′–B′${r.recMode?' · dato':''}`),
    tarjeta('A','Amperímetros de línea',`${fS(m.amp.IL)} A`,`I_A = I_B = I_C · ∠${fA(m.amp.ang[0])}`),
    tarjeta('W1','Vatímetro 1',fPow(m.W1,'W'),'Ī_A con Ū_AC',m.W1<0),
    tarjeta('W2','Vatímetro 2',fPow(m.W2,'W'),'Ī_B con Ū_BC',m.W2<0),
    tarjeta('Σ','W1 + W2 = P',fPow(m.P,'W'),`Q = √3·(${abc?'W1 − W2':'W2 − W1'}) = ${fPow(m.Q,'var')}`),
    tarjeta('φ','Cosfímetro',`${fN(m.fp,4)} ${fpTag(m.φ)}`,`φ = ${fA(r2d(m.φ))} · en la fuente`),
  ];
  if(r.zLineEnabled)cards.push(tarjeta('Δ',r.recMode?'Caída en la línea':'ΔU en la carga',`${sgn(m.dUpct)} %`,`pérdidas ${fPow(m.Pline,'W')}`));
  $('lab-meters').innerHTML=cards.join('');

  const neg=m.W1<0||m.W2<0;
  $('lab-aron-note').textContent=neg
    ?`Un vatímetro marca negativo porque fp < 0,5 (|φ| > 60°): la suma algebraica W1 + W2 sigue siendo P.`
    :`Método de Aron: bobinas de corriente en A y B, tensiones U_AC y U_BC. La suma W1 + W2 es la potencia activa total.`;

  const cmp=$('lab-compare');
  cmp.style.display=cerrado?'':'none';
  cmp.innerHTML=cerrado?comparacionHTML(r,base,comp):'';

  const btn=$('lab-k-btn');
  btn.textContent=cerrado?'Desconectar banco':'Conectar banco';
  btn.disabled=!r.comp;
  btn.title=motivo;
  btn.setAttribute('aria-pressed',String(cerrado));
  const why=$('lab-k-why');
  why.textContent=motivo;
  why.style.display=motivo?'':'none';

  $('lab-slow-note').textContent=`Cámara lenta: un ciclo de la red (1/${fN(r.f,0)} s) se muestra en ${fN(360/WT_SPEED,0)} s. `+
    `Las partículas van y vienen porque la corriente es alterna; su velocidad sigue al valor instantáneo i(ωt) de cada fase.`;

  updateLabAnim(r);
  updateLabHint();
}

export function renderLab(r){
  labR=r;cerrado=false;   // cada resolución empieza con el banco desconectado
  pintar();
  $('lab-pilots').innerHTML=normItems(r).map(i=>
    `<div class="lab-pilot ${i.s}"><span class="lab-lamp"></span><div><div class="lp-state">${ESTADO[i.s]}</div><div class="lp-txt">${i.t}</div></div></div>`).join('');
}

// Conecta o desconecta el banco: solo cambia de lecturas (r ↔ r.comp), no recalcula
export function toggleLabContactor(){
  if(!labR||!labR.comp)return;
  cerrado=!cerrado;
  pintar();
}
export const labContactorCerrado=()=>cerrado;

// El contactor dibujado en la escena también se puede pulsar (clic, Enter o espacio)
const enContactor=e=>e.target&&e.target.closest&&e.target.closest('#lab-contactor');
$('lab-scene').addEventListener('click',e=>{if(enContactor(e))toggleLabContactor();});
$('lab-scene').addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&enContactor(e)){
    e.preventDefault();toggleLabContactor();
    const k=$('lab-contactor');if(k&&k.focus)k.focus();
  }
});

// El aviso «desliza» solo aparece si la escena, ya escalada al mínimo, no cabe en su caja
export function updateLabHint(){
  const box=$('lab-scene'),hint=$('lab-hint');
  if(box&&hint)hint.style.display=box.scrollWidth>box.clientWidth+1?'block':'none';
}

// Pantalla completa: solo la escena y el panel de instrumentos (Esc o el mismo botón para salir)
export function toggleLabFullscreen(){
  if(document.fullscreenElement){document.exitFullscreen();return;}
  const el=$('lab-stage');
  if(el.requestFullscreen)el.requestFullscreen().catch(()=>{});
}
document.addEventListener('fullscreenchange',()=>{
  const on=document.fullscreenElement===$('lab-stage');
  $('lab-fs-btn').textContent=on?'✕ Salir de pantalla completa':'⛶ Pantalla completa';
  updateLabHint();
});
window.addEventListener('resize',updateLabHint);
