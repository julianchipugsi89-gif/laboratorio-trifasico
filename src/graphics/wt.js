// Estado compartido ωt: animación, lectura instantánea y eventos
import { fN } from '../engine/format.js';
import { d2r } from '../engine/math.js';
import { updateLabAnim } from './labAnim.js';
import { drawPhasors } from './phasors.js';
import { drawWaveforms } from './waveforms.js';
import { $ } from '../core/dom.js';
import { setWaveHoverDeg, waveHoverDeg, lastResult } from '../core/state.js';

// Eventos del osciloscopio
// Estado compartido ωt: null = fasores estáticos (t = 0, sin proyecciones)
let wtAnim=null,wtLastTs=0;
let wtAuto=false;   // true mientras la animación la arrancó la app y no el usuario
export const WT_SPEED=60; // grados por segundo → un ciclo en 6 s
const reducedMotion=()=>!window.matchMedia||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// El control Animar/deslizador está duplicado en la pestaña del laboratorio: ambos reflejan el mismo ωt
const playBtns=t=>['wt-play','lab-wt-play'].forEach(id=>{const b=$(id);if(b)b.textContent=t;});
function applyWt(v,animando=false){
  setWaveHoverDeg(v===null?null:((v%360)+360)%360);
  const txt=waveHoverDeg===null?'ωt = 0° (estático)':`ωt = ${fN(waveHoverDeg,0)}°`;
  $('wt-range').value=waveHoverDeg??0;
  $('wt-val').textContent=txt;
  const lr=$('lab-wt-range');
  if(lr){lr.value=waveHoverDeg??0;$('lab-wt-val').textContent=txt;}
  if(lastResult){
    // Durante la animación solo se repinta la pestaña que está a la vista; showTab pone al día la otra
    // al volver a ella. Fijar ωt a mano (deslizador, cursor) lo repinta todo, como siempre.
    const ver=id=>!animando||$(id).classList.contains('active');
    if(ver('tab-phasor')){drawPhasors(lastResult);drawWaveforms(lastResult);renderWtReadout(lastResult);}
    if(ver('tab-lab'))updateLabAnim(lastResult);
  }
}
export function setWt(v){wtAuto=false;applyWt(v);}
export function wtStep(ts){
  if(!wtAnim)return;
  const dt=wtLastTs?Math.min(ts-wtLastTs,100):0;wtLastTs=ts;
  applyWt((waveHoverDeg??0)+dt*WT_SPEED/1000,true);
  wtAnim=requestAnimationFrame(wtStep);
}
function startWt(){
  wtLastTs=0;wtAnim=requestAnimationFrame(wtStep);
  playBtns('⏸ Pausar');
}
export function toggleWtAnim(){
  wtAuto=false;
  if(wtAnim){stopWtAnim();return;}
  if(!lastResult)return;
  startWt();
}
export function stopWtAnim(){
  if(wtAnim)cancelAnimationFrame(wtAnim);
  wtAnim=null;playBtns('▶ Animar');
}
export function resetWt(){stopWtAnim();setWt(null);}
// Arranque automático del laboratorio: nunca con prefers-reduced-motion ni con la página oculta
export function autoStartWt(){
  if(wtAnim||!lastResult||reducedMotion()||document.hidden)return;
  wtAuto=true;startWt();
}
// Al cambiar de pestaña la animación se pausa. Si la había arrancado la app, además se vuelve a los
// fasores estáticos, para que la pestaña del fasorial se encuentre como siempre.
export function pauseWtOnTabChange(){
  const auto=wtAuto;
  stopWtAnim();
  if(auto){wtAuto=false;applyWt(null);}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWtAnim();});
// Lectura instantánea: u_k = √2·U_f·sen(ωt+θ_k), i_k = √2·I_L·sen(ωt+θ_Ik)
export function renderWtReadout(r){
  const el=$('wt-readout');if(!el)return;
  const wt=waveHoverDeg??0,Up=r.Uf_src*Math.SQRT2,Ip=r.IL*Math.SQRT2;
  const u=[r.UA,r.UB,r.UC].map(a=>Up*Math.sin(d2r(wt+a))),i=[r.IA,r.IB,r.IC].map(a=>Ip*Math.sin(d2r(wt+a)));
  const su=u.reduce((x,y)=>x+y,0),si=i.reduce((x,y)=>x+y,0);
  const cell=(v,d,cls)=>`<td class="${cls}">${fN(Math.abs(v)<1e-9?0:v,d)}</td>`;
  el.innerHTML=`<table><thead><tr><th>Instante ωt = ${fN(wt,0)}°</th><th>Fase A</th><th>Fase B</th><th>Fase C</th><th>Suma</th><th>Pico</th></tr></thead><tbody>
    <tr><td>u fase-neutro (V)</td>${u.map((v,k)=>cell(v,1,'abc'[k])).join('')}${cell(su,1,'sum')}<td>Û = ${fN(Up,1)}</td></tr>
    <tr><td>i de línea (A)</td>${i.map((v,k)=>cell(v,2,'abc'[k])).join('')}${cell(si,2,'sum')}<td>Î = ${fN(Ip,2)}</td></tr>
  </tbody></table><div class="cap">En un sistema equilibrado las tres tensiones y las tres corrientes suman cero en todo instante; por eso el neutro no transporta corriente.</div>`;
}
(function bindWaveEvents(){
  const c=$('waveCanvas');if(!c)return;
  const fromEvent=e=>{
    const rect=c.getBoundingClientRect(),padL=40,padR=16,pw=rect.width-padL-padR;
    return Math.max(0,Math.min(360,(e.clientX-rect.left-padL)/pw*360));
  };
  c.addEventListener('pointermove',e=>{
    if(!lastResult)return;
    if(e.pointerType!=='mouse'&&e.buttons===0)return;   // táctil: solo al arrastrar
    stopWtAnim();setWt(fromEvent(e));
  });
  c.addEventListener('pointerdown',e=>{if(lastResult){stopWtAnim();setWt(fromEvent(e));}});
})();

window.addEventListener('resize',()=>{
  if(lastResult&&$('tab-phasor').classList.contains('active')){
    drawPhasors(lastResult);drawWaveforms(lastResult);
  }
});
