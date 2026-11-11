// Estado compartido ωt: animación, lectura instantánea y eventos
import { fN } from '../engine/format.js';
import { d2r } from '../engine/math.js';
import { drawPhasors } from './phasors.js';
import { drawWaveforms } from './waveforms.js';
import { $ } from '../core/dom.js';
import { setWaveHoverDeg, waveHoverDeg, lastResult } from '../core/state.js';

// Eventos del osciloscopio
// Estado compartido ωt: null = fasores estáticos (t = 0, sin proyecciones)
let wtAnim=null,wtLastTs=0;
export const WT_SPEED=60; // grados por segundo → un ciclo en 6 s
export function setWt(v){
  setWaveHoverDeg(v===null?null:((v%360)+360)%360);
  $('wt-range').value=waveHoverDeg??0;
  $('wt-val').textContent=waveHoverDeg===null?'ωt = 0° (estático)':`ωt = ${fN(waveHoverDeg,0)}°`;
  if(lastResult){drawPhasors(lastResult);drawWaveforms(lastResult);renderWtReadout(lastResult);}
}
export function wtStep(ts){
  if(!wtAnim)return;
  const dt=wtLastTs?Math.min(ts-wtLastTs,100):0;wtLastTs=ts;
  setWt((waveHoverDeg??0)+dt*WT_SPEED/1000);
  wtAnim=requestAnimationFrame(wtStep);
}
export function toggleWtAnim(){
  if(wtAnim){stopWtAnim();return;}
  if(!lastResult)return;
  wtLastTs=0;wtAnim=requestAnimationFrame(wtStep);
  $('wt-play').textContent='⏸ Pausar';
}
export function stopWtAnim(){
  if(wtAnim)cancelAnimationFrame(wtAnim);
  wtAnim=null;const b=$('wt-play');if(b)b.textContent='▶ Animar';
}
export function resetWt(){stopWtAnim();setWt(null);}
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
