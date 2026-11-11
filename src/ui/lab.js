// Laboratorio virtual: escena del banco, panel de instrumentos y pilotos de alarma
import { fS, fN, fA, fPow, fpTag, sgn } from '../engine/format.js';
import { computeInstruments } from '../engine/instruments.js';
import { r2d } from '../engine/math.js';
import { normItems } from '../engine/norms.js';
import { genLabSVG } from '../graphics/labScene.js';
import { $ } from '../core/dom.js';

const ESTADO={ok:'Normal',warn:'Aviso',bad:'Alarma',na:'No aplica'};

function tarjeta(sim,nombre,valor,sub,neg){
  return `<div class="lab-meter"><div class="lm-head"><span class="lm-sym">${sim}</span><span class="lm-name">${nombre}</span></div>`+
    `<div class="lm-val${neg?' neg':''}">${valor}</div><div class="lm-sub">${sub}</div></div>`;
}

export function renderLab(r){
  const m=computeInstruments(r);
  $('lab-scene').innerHTML=genLabSVG(r,m);

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

  updateLabHint();

  $('lab-pilots').innerHTML=normItems(r).map(i=>
    `<div class="lab-pilot ${i.s}"><span class="lab-lamp"></span><div><div class="lp-state">${ESTADO[i.s]}</div><div class="lp-txt">${i.t}</div></div></div>`).join('');
}

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
