// Informe / impresión
import { computeChecks } from '../engine/checks.js';
import { Cx } from '../engine/complex.js';
import { fN, rstr, fS, cstr, pStr, fA, sgn, fpTag, fPow } from '../engine/format.js';
import { normItems } from '../engine/norms.js';
import { genTriangleSVG } from '../graphics/triangle.js';
import { $ } from '../core/dom.js';
import { fpCorrHTML, compTableHTML } from '../core/compHtml.js';
import { lastResult } from '../core/state.js';

export function showPrintView(){
  if(!lastResult)return;
  $('print-content').innerHTML=buildPrintHTML(lastResult);
  $('print-modal').style.display='block';
  document.body.style.overflow='hidden';
}
export function closePrint(){$('print-modal').style.display='none';document.body.style.overflow='';}
$('print-modal').addEventListener('click',function(e){if(e.target===this)closePrint();});

export function buildPrintHTML(r){
  const row=(l,v)=>`<tr><td class="pl">${l}</td><td class="pv">${v}</td></tr>`;
  let h=`<div class="ph1">Circuito Trifásico Equilibrado</div><div class="ph2">Fraile Mora · Circuitos Eléctricos · Patrón 5</div><hr class="phr">`;
  if(r.recMode&&r.zLineEnabled)h+=`<div style="background:#e8f5ec;border:1.5px solid #2b7a52;border-radius:6px;padding:6px 12px;margin-bottom:10px;font-size:12px;font-family:monospace;color:#2b7a52"><b>MODO RECEPTOR</b> — La tensión es el dato en los bornes del receptor (A′,B′,C′); la tensión de fuente se calcula hacia atrás.</div>`;
  h+=`<div class="psec">Datos del circuito</div><table class="ptbl">`;
  h+=row(r.recMode&&r.zLineEnabled?'U_L dato (en receptor A′,B′,C′)':'Tensión de línea U_L',`${fN(r.UL,3)} V`);
  h+=row(r.recMode&&r.zLineEnabled?'U_f dato (en receptor, fase-neutro)':'Tensión de fase U_f',`${fN(r.Uf,4)} V`);
  h+=row('Frecuencia',`${fN(r.f,0)} Hz → ω = ${fN(r.ω,3)} rad/s`);
  h+=row('Secuencia de fases',r.seq==='abc'?'ABC directa':'ACB inversa');
  h+=row('Sistema',`${r.wires} hilos${r.wires===3?' (neutro ficticio)':''}${r.wiresSel==='auto'?' · automático':''}`);
  if(r.zLineEnabled)h+=row('<span style="color:#b87314">Impedancia de línea Z_L</span>',`<span style="color:#b87314">${rstr(r.ZLc)} Ω · |Z_L| = ${fN(r.ZLM,3)} Ω</span>`);
  h+=`</table>`;
  h+=`<div class="psec">Cargas del circuito</div><table class="ptbl2"><thead><tr><th>Carga</th><th>Conexión</th><th>Datos</th><th>Z por fase (Ω)</th></tr></thead><tbody>`;
  r.bkd.forEach(b=>{
    const l=b.src,cn=b.conn==='star'?'Y (Estrella)':'Δ (Triángulo)';
    const datos=b.kind==='motor'
      ?`Motor: ${fS(l.Pout)} ${l.Punit} · U_n ${fS(l.Unom)} V · cosφ ${fN(l.cosphi,2)} · η ${fN(l.eta,1)} %`
      :`R ${fN(l.R,3)} · X_L ${fN(l.XL,3)} · X_C ${fN(l.XC,3)}`;
    const z=b.kind==='motor'?`${cstr(b.ZY,4)} (Y-eq., en operación)`:cstr(Cx(l.R,l.XL-l.XC),4);
    h+=`<tr><td><b>${b.tag}</b></td><td>${cn}</td><td>${datos}</td><td>${z}</td></tr>`;
  });
  h+=`</tbody></table>`;
  h+=`<div class="psec">Resolución — Patrón 5</div>`;
  const st=$('steps-container');if(st&&st.innerHTML.trim())h+=`<div class="psteps">${st.innerHTML}</div>`;
  h+=`<div class="psec">Resultados</div><table class="ptbl">`;
  h+=row('Z_eq (cargas)',`${cstr(r.ZeqC,4)} Ω`);
  if(r.zLineEnabled)h+=row('Z_total (línea + cargas)',`${cstr(r.ZtotC,4)} Ω`);
  h+=row('Corriente de línea I_L',`${pStr(r.IL,r.IA)} A`);
  r.bkd.filter(b=>b.conn==='delta').forEach(b=>{h+=row(`Corriente de fase I_f en ${b.tag} (Δ)`,`${pStr(b.IkPhase,b.IkPhaseAng)} A <span style="font-size:10px;color:#7d857e">(I_L,${b.tag} = ${fN(b.Ik,4)} A)</span>`);});
  if(r.zLineEnabled&&r.recMode){
    h+=row('<b>U_L,fuente calculada</b>',`<b>${fN(r.UL_src,3)} V</b>`)+row('U_f,fuente calculada (fase)',`${pStr(r.Uf_src,r.UA)} V`);
    h+=row('U_carga (dato, fase)',`${pStr(r.UloadF,r.UloadAng)} V`)+row('U_carga (dato, línea)',`${fN(r.UloadL,3)} V`);
    h+=row('δ = ∠Ū_AN (ángulo fuente)',`${fA(r.delta)}`);
    h+=row('|ΔŪ| (caída en línea)',`${fN(r.UlineDropF,3)} V/fase`);
  } else if(r.zLineEnabled){
    h+=row('U_carga (fase)',`${pStr(r.UloadF,r.UloadAng)} V`)+row('U_carga (línea)',`${fN(r.UloadL,3)} V`);
    h+=row('Variación de tensión ΔU',`${sgn(r.dUpct)} % · |Ī·Z_L| = ${fN(r.UlineDropF,3)} V/fase`);
  }
  h+=row(`fp${r.zLineEnabled?' (entrada)':''}`,`${fN(r.fp,4)} ${fpTag(r.φ)}`);
  if(r.zLineEnabled)h+=row('fp de las cargas',`${fN(r.fpLoad,4)} ${fpTag(r.φLoad)}`);
  h+=`<tr class="ptot"><td>P activa total</td><td>${fPow(r.P3,'W')}</td></tr>`;
  if(r.zLineEnabled)h+=row('  P en cargas',fPow(r.Pload,'W'))+row('  P pérdidas en línea',fPow(r.Pline,'W'))+row('  Rendimiento η',`${fN(r.Pload/r.P3*100,2)} %`);
  h+=`<tr class="ptot"><td>Q reactiva total</td><td>${fPow(r.Q3,'var')} ${r.Q3>=0?'(inductiva)':'(capacitiva)'}</td></tr>`;
  h+=`<tr class="ptot"><td>S aparente total</td><td>${fPow(r.S3,'VA')}</td></tr></table>`;
  h+=`<div class="psec">Triángulo de potencias</div>${genTriangleSVG(r,true)}`;
  if(r.compType){
    h+=`<div class="psec" style="color:#2b7a52">Corrección de factor de potencia (en bornes de carga)</div>`;
    h+=`<div style="font-family:monospace;font-size:12px;line-height:1.9;color:#4e5650">${fpCorrHTML(r,true).replace(/class="hl"/g,'style="color:#2b7a52;font-weight:600"')}</div>`;
    h+=compTableHTML(r,true);
  }
  h+=`<div class="psec">Cumplimiento normativo</div><div style="font-family:monospace;font-size:12px;line-height:1.7;color:#4e5650">`;
  normItems(r).forEach(i=>{
    const c={ok:'#2b7a52',warn:'#b87314',bad:'#b84233',na:'#7d857e'}[i.s];
    h+=`<div style="margin-bottom:6px"><span style="color:${c};font-weight:700">● ${i.t}</span><br>${i.sub}${i.src?`<br><span style="font-size:10px;color:#7d857e">${i.src}</span>`:''}</div>`;
  });
  h+=`</div><div class="psec">Verificación</div><div style="font-family:monospace;font-size:12px;line-height:1.9;color:#4e5650">`;
  computeChecks(r).forEach(({ok,txt})=>{h+=`<div style="color:${ok?'#2b7a52':'#b84233'}">${ok?'✓':'✗'} ${txt}</div>`;});
  h+=`</div><div class="pfooter">Fraile Mora · Circuitos Eléctricos · Patrón 5 · Dashboard trifásico equilibrado</div>`;
  return h;
}
