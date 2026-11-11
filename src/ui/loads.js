// Tarjetas de cargas en paralelo
import { motorData } from '../engine/circuit.js';
import { fN, fA, fpTag, fPow, fS } from '../engine/format.js';
import { bad, r2d } from '../engine/math.js';
import { $ } from '../core/dom.js';
import { currentUL, updateWiresHint } from './inputs.js';
import { nextLoadId, loads, setLoads } from '../core/state.js';

export const loadTag=(l,k)=>(l.kind==='motor'?'M':'Z')+(k+1);
export function addLoad(p={}){
  const id=nextLoadId(),UL=currentUL();
  const l={id,kind:p.kind||'imp',conn:p.conn||(p.kind==='motor'?'delta':'star'),
    R:p.R??0,XL:p.XL??0,XC:p.XC??0,
    Pout:p.Pout??5.5,Punit:p.Punit||'kW',Unom:p.Unom??(bad(UL)?220:Math.round(UL)),cosphi:p.cosphi??0.85,eta:p.eta??88};
  loads.push(l);
  const el=document.createElement('div');
  el.className='load-card';el.id=`lc-${id}`;
  el.innerHTML=`
    <div class="load-card-hdr">
      <div class="seg-ctrl sm" style="flex:1;min-width:0">
        <button class="seg${l.kind==='imp'?' active':''}" id="lc-${id}-ki" onclick="setKind(${id},'imp')">Impedancia RLC</button>
        <button class="seg${l.kind==='motor'?' active':''}" id="lc-${id}-km" onclick="setKind(${id},'motor')">Motor 3~</button>
      </div>
      <span class="load-num" id="lc-${id}-num">Z?</span>
      <button class="rm-btn" id="lc-${id}-rm" onclick="removeLoad(${id})" title="Eliminar">✕</button>
    </div>
    <div class="kind-row">
      <div class="seg-ctrl sm" style="flex:1">
        <button class="seg${l.conn==='star'?' active':''}" id="lc-${id}-yb" onclick="setConn(${id},'star')"><b>Y</b> Estrella</button>
        <button class="seg${l.conn==='delta'?' active':''}" id="lc-${id}-db" onclick="setConn(${id},'delta')"><b>Δ</b> Triángulo</button>
      </div>
    </div>
    <div id="lc-${id}-imp" class="imp-row" style="display:${l.kind==='imp'?'grid':'none'}">
      <div><div class="fl"><label>R</label><span class="u">Ω</span></div>
        <input type="number" id="lc-${id}-r" value="${l.R}" min="0" step="0.1" oninput="updLoad(${id})"></div>
      <div><div class="fl"><label>X<sub>L</sub></label><span class="u">Ω</span></div>
        <input type="number" id="lc-${id}-xl" value="${l.XL}" min="0" step="0.1" oninput="updLoad(${id})"></div>
      <div><div class="fl"><label>X<sub>C</sub></label><span class="u">Ω</span></div>
        <input type="number" id="lc-${id}-xc" value="${l.XC}" min="0" step="0.1" oninput="updLoad(${id})"></div>
    </div>
    <div id="lc-${id}-mot" class="motor-grid" style="display:${l.kind==='motor'?'grid':'none'}">
      <div><div class="fl"><label>P útil (eje)</label></div>
        <div class="inline"><input type="number" id="lc-${id}-p" value="${l.Pout}" min="0" step="0.1" oninput="updLoad(${id})">
        <select id="lc-${id}-pu" onchange="updLoad(${id})"><option value="kW"${l.Punit==='kW'?' selected':''}>kW</option><option value="HP"${l.Punit==='HP'?' selected':''}>HP</option></select></div></div>
      <div><div class="fl"><label>U<sub>n</sub> placa</label><span class="u">V línea</span></div>
        <input type="number" id="lc-${id}-un" value="${l.Unom}" min="1" step="1" oninput="updLoad(${id})"></div>
      <div><div class="fl"><label>cosφ</label><span class="u">ind.</span></div>
        <input type="number" id="lc-${id}-cf" value="${l.cosphi}" min="0.05" max="1" step="0.01" oninput="updLoad(${id})"></div>
      <div><div class="fl"><label>η</label><span class="u">%</span></div>
        <input type="number" id="lc-${id}-eta" value="${l.eta}" min="1" max="100" step="0.5" oninput="updLoad(${id})"></div>
    </div>
    <div class="lp" id="lc-${id}-prev"></div>
    <div class="lh" id="lc-${id}-hint"></div>`;
  $('loads-list').appendChild(el);
  relabel();updLoad(id);
}
export function removeLoad(id){
  if(loads.length<=1)return;
  setLoads(loads.filter(l=>l.id!==id));
  $(`lc-${id}`)?.remove();
  relabel();updateWiresHint();
}
export function relabel(){
  loads.forEach((l,k)=>{
    const n=$(`lc-${l.id}-num`);if(n)n.textContent=loadTag(l,k);
    const r=$(`lc-${l.id}-rm`);if(r)r.disabled=loads.length<=1;
  });
  $('loads-badge').textContent=`${loads.length} carga${loads.length!==1?'s':''}`;
}
export function setKind(id,kind){
  const l=loads.find(x=>x.id===id);if(!l)return;
  l.kind=kind;
  $(`lc-${id}-ki`).classList.toggle('active',kind==='imp');
  $(`lc-${id}-km`).classList.toggle('active',kind==='motor');
  $(`lc-${id}-imp`).style.display=kind==='imp'?'grid':'none';
  $(`lc-${id}-mot`).style.display=kind==='motor'?'grid':'none';
  relabel();updLoad(id);
}
export function setConn(id,conn){
  const l=loads.find(x=>x.id===id);if(!l)return;
  l.conn=conn;
  $(`lc-${id}-yb`).classList.toggle('active',conn==='star');
  $(`lc-${id}-db`).classList.toggle('active',conn==='delta');
  updLoad(id);
}
export function updLoad(id){
  const l=loads.find(x=>x.id===id);if(!l)return;
  const num=s=>parseFloat($(`lc-${id}-${s}`).value);
  l.R=Math.max(0,num('r')||0);l.XL=Math.max(0,num('xl')||0);l.XC=Math.max(0,num('xc')||0);
  l.Pout=num('p');l.Punit=$(`lc-${id}-pu`).value;l.Unom=num('un');l.cosphi=num('cf');l.eta=num('eta');
  const prev=$(`lc-${id}-prev`),hint=$(`lc-${id}-hint`);
  if(l.kind==='imp'){
    const X=l.XL-l.XC,Zm=Math.hypot(l.R,X);
    if(Zm<1e-9){prev.textContent='|Z| = 0 Ω — cortocircuito';prev.style.color='var(--rd)';}
    else{prev.textContent=`|Z| = ${fN(Zm,3)} Ω ∠${fA(r2d(Math.atan2(X,l.R)))} ${fpTag(X)}`;prev.style.color='var(--ac)';}
    hint.textContent=l.conn==='delta'?`Z_Y = Z_Δ/3 → |Z_Y| = ${fN(Zm/3,3)} Ω (equivalente estrella)`:'';
  }else{
    const err=motorError(l);
    if(err){prev.textContent=err;prev.style.color='var(--rd)';hint.textContent='';}
    else{
      const m=motorData(l);
      prev.textContent=`P_abs = ${fPow(m.Pin,'W')} · Q = ${fPow(m.Q,'var')} · I_n = ${fS(m.Inom)} A`;
      prev.style.color='var(--ac)';
      hint.textContent=`Potencia constante · devanados en ${l.conn==='delta'?'Δ: I_f = I_L/√3':'Y: I_f = I_L'}`;
    }
  }
  hint.style.display=hint.textContent?'block':'none';
  updateWiresHint();
}
export function motorError(l){
  if(!(l.Pout>0))return'P útil debe ser > 0';
  if(!(l.eta>0&&l.eta<=100))return'η debe estar entre 0 y 100 %';
  if(!(l.cosphi>0&&l.cosphi<=1))return'cosφ debe estar entre 0 y 1';
  if(!(l.Unom>0))return'U_n debe ser > 0';
  return null;
}
