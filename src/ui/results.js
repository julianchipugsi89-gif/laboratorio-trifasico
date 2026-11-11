// Renderizado de resultados
import { computeChecks } from '../engine/checks.js';
import { fS, fN, fA, fpTag, sgn, fPow, pStr } from '../engine/format.js';
import { r2d, bad } from '../engine/math.js';
import { normItems } from '../engine/norms.js';
import { renderDiagrams } from '../graphics/diagrams.js';
import { drawPhasors } from '../graphics/phasors.js';
import { renderTriangle } from '../graphics/triangle.js';
import { drawWaveforms } from '../graphics/waveforms.js';
import { renderWtReadout } from '../graphics/wt.js';
import { fpCorrHTML, compTableHTML } from '../core/compHtml.js';
import { $ } from '../core/dom.js';
import { renderLab } from './lab.js';
import { renderSteps } from './steps.js';

export function renderResults(r){
  $('empty-state').style.display='none';
  $('results-section').style.display='block';
  $('bot-section').style.display='flex';
  $('btn-export').style.display='';

  $('lbl-uf').innerHTML=r.recMode?'U<sub>f</sub> receptor (DATO)':r.zLineEnabled?'U<sub>AN</sub> fuente':'U<sub>f</sub> (fase)';
  $('lbl-fp').textContent=r.zLineEnabled?'fp entrada':'fp (cosφ)';
  $('mv-uf').textContent=`${fS(r.Uf)} V`;
  $('ms-uf').textContent=r.recMode?`U_L,fuente = ${fN(r.UL_src,3)} V (calc.)  |  δ = ${fA(r.delta)}`:`U_L = ${fS(r.UL)} V${r.zLineEnabled?' (fuente)':''}`;
  $('mv-z').textContent=`${fS(r.Zm)} Ω`;
  $('ms-z').textContent=`∠${fA(r2d(r.φLoad))}${r.hasMotor?' · en operación':''}`;

  const single=r.bkd.length===1,b0=r.bkd[0];
  const singleY=single&&b0.conn==='star',singleD=single&&b0.conn==='delta';
  $('lbl-il').innerHTML=singleY?'I<sub>L</sub> = I<sub>f</sub>':'I<sub>L</sub> total (línea)';
  $('mv-il').textContent=`${fS(r.IL)} A`;
  $('ms-il').textContent=`∠${fA(r.IA)}`;
  const il2=$('ms-il2');
  if(singleD){il2.style.display='';il2.textContent=`I_f(Δ) = I_L/√3 = ${fS(b0.IkPhase)} A`;}
  else if(!single){il2.style.display='';il2.textContent='I_f por carga: ver desglose';}
  else il2.style.display='none';

  $('mv-fp').innerHTML=`${fN(r.fp,4)}<span class="ftag">${fpTag(r.φ)}</span>`;
  const bar=$('fp-bar');
  bar.style.width=`${r.fp*100}%`;
  bar.style.background=r.fp>=r.lim.fpMin?'var(--gn)':r.fp>=0.8?'var(--am)':'var(--rd)';
  $('fp-thr').style.left=`${r.lim.fpMin*100}%`;
  const thl=$('fp-thr-lbl');thl.style.left=`${r.lim.fpMin*100}%`;thl.textContent=fN(r.lim.fpMin,2);
  $('fp-one').style.display=r.lim.fpMin>0.88?'none':'';   // evita que el umbral se monte sobre el «1»

  $('mv-udrop').previousElementSibling.textContent=r.recMode?'Caída en la línea respecto a la fuente':'ΔU en la carga';
  if(r.zLineEnabled){
    $('zl-metric-row').style.display='';
    $('mv-udrop').textContent=`${sgn(r.dUpct)} %`;
    $('ms-udrop').textContent=`|Ī·Z_L| = ${fS(r.UlineDropF)} V/fase`;
    $('mv-uload').textContent=`${fS(r.UloadF)} V`;
    $('ms-uload').textContent=`U_L = ${fS(r.UloadL)} V carga`;
    $('mv-pline').textContent=fPow(r.Pline,'W');
    $('ms-pline').textContent=r.P3>0?`η = ${fN(r.Pload/r.P3*100,1)} %`:'3·I²·R_L';
    $('mv-fpload').innerHTML=`${fN(r.fpLoad,4)}<span class="ftag">${fpTag(r.φLoad)}</span>`;
    $('ms-fpload').textContent='solo cargas';
  }else $('zl-metric-row').style.display='none';

  const nM=r.bkd.filter(b=>b.kind==='motor').length;
  const type=single?`${b0.kind==='motor'?'Motor ':''}${b0.conn==='star'?'Y':'Δ'}`:`${r.bkd.length} cargas paralelas${nM?` (${nM} motor${nM>1?'es':''})`:''}`;
  $('res-badge').textContent=`${type} · ${r.wires} hilos${r.zLineEnabled?' · Z_L':''}${r.comp?' · Compensado':''}`;

  const pairs=[['A','a','AN','AB',r.UA,r.IA],['B','b','BN','BC',r.UB,r.IB],['C','c','CN','CA',r.UC,r.IC]];
  $('phase-tbody').innerHTML=pairs.map(([lbl,cls,fn,ll,uA,iA])=>`<tr><td class="${cls}">${lbl}</td>
      <td class="${cls}"><span class="ftag">Ū_${fn}</span> ${pStr(r.Uf_src,uA)}</td>
      <td class="${cls}"><span class="ftag">Ū_${ll}</span> ${pStr(r.UL_src,uA+r.dir*30)}</td>
      <td class="${cls}"><span class="ftag">Ī_${lbl}</span> ${pStr(r.IL,iA)}</td></tr>`).join('');
  $('tbl-ufn-hdr').textContent=r.recMode?'Ū fase-neutro fuente, calculada (V)':r.zLineEnabled?'Ū fase-neutro fuente (V)':'Ū fase-neutro (V)';
  const tn=$('table-load-note');
  if(r.recMode){
    tn.style.display='block';
    tn.textContent=`[RECEPTOR] Ū_A′N (dato) = ${pStr(r.UloadF,r.UloadAng)} V/fase  |  Ū_AN (calc.) = ${pStr(r.Uf_src,r.UA)} V/fase  |  U_L,fuente = ${fN(r.UL_src,3)} V  |  δ = ${fA(r.delta)}`;
  } else if(r.zLineEnabled){
    tn.style.display='block';tn.textContent=`Ū_carga = ${pStr(r.UloadF,r.UloadAng)} V/fase  |  U_carga,L = ${fS(r.UloadL)} V  |  ΔU = ${sgn(r.dUpct)} %`;
  } else tn.style.display='none';

  $('mv-p').textContent=fPow(r.P3,'W');
  $('ms-p').textContent=r.zLineEnabled?'= P_carga + P_línea':'= √3·U_L·I_L·cosφ';
  $('mv-q').textContent=fPow(r.Q3,'var');
  $('ms-q').textContent=r.Q3>=0?'(inductiva)':'(capacitiva)';
  $('mv-s').textContent=fPow(r.S3,'VA');
  $('ms-s').textContent='= √(P²+Q²)';
  $('mv-phi').textContent=`${fA(r.φd)}`;
  $('ms-phi').textContent=r.zLineEnabled?'ángulo total (Z_L+Z_eq)':`carga ${r.φd>=0?'inductiva':'capacitiva'}`;

  renderLab(r);
  renderSteps(r);renderChecks(r);renderFP(r);renderNorm(r);
  renderDiagrams(r);renderBreakdown(r);drawPhasors(r);drawWaveforms(r);renderWtReadout(r);renderTriangle(r);
}
export function renderChecks(r){
  const list=computeChecks(r);
  $('check-list').innerHTML=list.map(c=>
    `<div class="ck"><span class="ck-ic ${c.ok?'ck-ok':'ck-er'}">${c.ok?'✓':'✗'}</span><span>${c.txt}</span></div>`).join('');
  const nOk=list.filter(c=>c.ok).length,all=nOk===list.length,b=$('check-badge');
  b.textContent=all?`✓ ${nOk}/${list.length} OK`:`⚠ ${nOk}/${list.length}`;
  b.className='badge '+(all?'gn':'am');
}

export function renderNorm(r){
  const items=normItems(r);
  $('norm-list').innerHTML=items.map(i=>`<div class="sem"><span class="sem-dot ${i.s}"></span><div>
    <div class="sem-t">${i.t}</div><div class="sem-s">${i.sub}</div>${i.src?`<div class="sem-src">${i.src}</div>`:''}</div></div>`).join('');
  const nBad=items.filter(i=>i.s==='bad').length,nWarn=items.filter(i=>i.s==='warn').length,b=$('norm-badge');
  b.textContent=nBad?`✗ ${nBad} incumple${nBad>1?'n':''}`:nWarn?`⚠ ${nWarn} aviso${nWarn>1?'s':''}`:'✓ Cumple';
  b.className='badge '+(nBad||nWarn?'am':'gn');
}

export function renderFP(r){
  const el=$('fp-corr-body'),muted=t=>`<div style="font-size:12px;color:var(--fg3)">${t}</div>`;
  if(bad(r.fpTgt)){el.innerHTML=muted('Introduce un fp objetivo arriba.');return;}
  if(!r.compType){el.innerHTML=muted(`fp objetivo (${fN(r.fpTgt,3)}) ≤ fp actual en bornes de carga (${fN(r.fpLoad,4)} ${fpTag(r.φLoad)}). No se requiere corrección.`);return;}
  el.innerHTML=`<div class="fp-result">${fpCorrHTML(r,false)}</div>${compTableHTML(r,false)}`;
}
export function renderBreakdown(r){
  const multi=r.bkd.length>1;
  $('breakdown-tbody').innerHTML=r.bkd.map(b=>{
    const isD=b.conn==='delta',isM=b.kind==='motor';
    const ifNote=isD?`<span style="font-size:9px;color:var(--am)"> (Δ)</span>`:`<span style="font-size:9px;color:var(--fg3)"> (=I_L)</span>`;
    const zTxt=isM?`${fS(b.ZyMag)} ∠${fA(b.ZyPhi)} <span style="font-size:9px;color:var(--fg3)">Y-eq.</span>`:`${fS(b.ZoMag)} ∠${fA(b.ZoPhi)}`;
    return`<tr>
      <td style="font-weight:600;color:var(--fg)">${b.tag}</td>
      <td>${isM?'Motor ':''}${isD?'Δ':'Y'}</td>
      <td>${zTxt}</td>
      <td>${fS(b.Ik)}</td>
      <td style="${isD?'color:var(--am);font-weight:600':''}">${fS(b.IkPhase)}${ifNote}</td>
      <td>${fPow(b.Pk)}</td><td>${fPow(b.Qk)}</td><td>${fPow(b.Sk)}</td>
      <td>${fN(b.fpk,4)}<span class="ftag">${fpTag(b.Qk)}</span></td></tr>`;}).join('')
    +(!multi?'':`<tr class="tot"><td colspan="3">TOTAL (fuente)</td><td>${fS(r.IL)}</td>
      <td style="color:var(--fg3);font-size:10px">ver cada carga</td>
      <td>${fPow(r.P3)}</td><td>${fPow(r.Q3)}</td><td>${fPow(r.S3)}</td><td>${fN(r.fp,4)}<span class="ftag">${fpTag(r.φ)}</span></td></tr>`);
  $('bk-notes').innerHTML=r.bkd.filter(b=>b.kind==='motor').map(b=>
    `${b.tag}: I_n de placa = ${fS(b.m.Inom)} A · I de operación = ${fS(b.Ik)} A · U en bornes = ${fS(r.UloadL)} V (${sgn(b.dUmot)} % de U_n = ${fS(b.src.Unom)} V) · P_abs = ${fPow(b.m.Pin,'W')} constante`).join('<br>');
}
