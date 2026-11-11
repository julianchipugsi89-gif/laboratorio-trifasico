// Entradas de fuente, línea, hilos y punto de referencia
import { PRESETS, voltLevel } from '../engine/constants.js';
import { fN, fA } from '../engine/format.js';
import { SQ3, bad, r2d } from '../engine/math.js';
import { $ } from './dom.js';
import { voltageType, setVoltageType, setWiresSel, loads, wiresSel, setVRefState, vRef, zLineEnabled, setZLineEnabled } from './state.js';

export function renderPresets(){
  $('preset-row').innerHTML=PRESETS.map((p,i)=>`<button class="preset" id="pr-${i}" onclick="applyPreset(${i})">${p.lbl}</button>`).join('');
}
export function applyPreset(i){
  const p=PRESETS[i];
  setVT('line');$('inp-v').value=p.UL;$('inp-f').value=p.f;
  onSourceChange();
}
export function currentUL(){
  const v=parseFloat($('inp-v').value);if(!v||v<=0)return NaN;
  return voltageType==='line'?v:v*SQ3;
}
export function markPreset(){
  const UL=currentUL(),f=parseFloat($('inp-f').value);
  PRESETS.forEach((p,i)=>$(`pr-${i}`).classList.toggle('active',Math.abs(p.UL-UL)<1e-6&&p.f===f));
}
export function onSourceChange(){updateVHint();markPreset();updateLevelHint();}

export function setVT(t){
  setVoltageType(t);
  $('vt-line').classList.toggle('active',t==='line');
  $('vt-phase').classList.toggle('active',t==='phase');
  $('v-lbl').innerHTML=t==='line'?'Tensión U<sub>L</sub>':'Tensión U<sub>f</sub>';
  $('v-unit').textContent=t==='line'?'V · línea-línea':'V · fase-neutro';
  onSourceChange();
}
export function updateVHint(){
  const v=parseFloat($('inp-v').value),h=$('v-hint');
  if(!v||v<=0){h.textContent='';return;}
  h.textContent=voltageType==='line'
    ?`≡ U_f = ${v}/√3 = ${fN(v/SQ3,2)} V por fase`
    :`≡ U_L = ${v}·√3 = ${fN(v*SQ3,2)} V línea`;
}
export function updateLevelHint(){
  const UL=currentUL(),h=$('lvl-hint');
  const man=parseFloat($('inp-dumax').value);
  if(bad(UL)){h.textContent='ΔU: Regulación ARCERNNR-002/20 (BV 8 % · MV 6 % · AV 5 %).';return;}
  const lv=voltLevel(UL);
  h.textContent=bad(man)
    ?`ΔU auto: ${lv.name} → ±${lv.lim} % (ARCERNNR-002/20, Tabla 1).`
    :`ΔU manual: ±${man} % (auto sería ±${lv.lim} %, ${lv.name}).`;
}

export function setWires(w){
  setWiresSel(w);
  ['auto','3','4'].forEach(k=>$(`w-${k}`).classList.toggle('active',k===w));
  updateWiresHint();
}
export function autoWires(){return loads.some(l=>l.kind!=='motor'&&l.conn==='star')?4:3;}
export function updateWiresHint(){
  const a=autoWires(),w=wiresSel==='auto'?a:+wiresSel;
  $('w-hint').textContent=(wiresSel==='auto'?`Auto → ${a} hilos (${a===4?'hay cargas Y con neutro':'solo Δ y motores'}). `:'')
    +(w===4?'Neutro distribuido.':'Sin conductor de neutro: neutro ficticio en el monofásico.');
}

export function setVRef(v){
  setVRefState(v);
  $('vref-src').classList.toggle('active',v==='source');
  $('vref-load').classList.toggle('active',v==='load');
  updateVRefHint();
}
export function updateVRefHint(){
  const h=$('vref-hint');if(!h)return;
  if(vRef==='source'){
    h.textContent=zLineEnabled?'La tensión es el dato en los bornes de la fuente; Z_L causa caída.':'Sin Z_L el receptor recibe la misma tensión que la fuente.';
  }else{
    h.textContent=zLineEnabled?'La tensión es el dato en los bornes del receptor; se calcula la tensión de fuente necesaria.':'Sin Z_L fuente y receptor son el mismo punto; modo equivalente a fuente.';
  }
}
export function setZL(enabled){
  setZLineEnabled(enabled);
  $('zl-off').classList.toggle('active',!enabled);
  $('zl-on').classList.toggle('active',enabled);
  $('zl-inputs').style.display=enabled?'block':'none';
  if(enabled)updateZLHint();
  updateVRefHint();
}
export function updateZLHint(){
  const rl=parseFloat($('inp-rl').value)||0,xl=parseFloat($('inp-xl').value)||0,zm=Math.hypot(rl,xl);
  $('zl-hint').textContent=zm>0?`|Z_L| = ${fN(zm,3)} Ω ∠${fA(r2d(Math.atan2(xl,rl)))} por conductor`:'Z_L en serie en cada conductor de fase';
}
