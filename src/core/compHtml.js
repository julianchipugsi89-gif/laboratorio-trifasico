// HTML de la corrección del factor de potencia (compartido por la pantalla y el informe; sin DOM)
import { fN, fS, fPow, fpTag, sgn } from '../engine/format.js';
import { SQ3, bad } from '../engine/math.js';

export function fpCorrHTML(r,print){
  const f3=print?'#646c65':'var(--fg3)',am=print?'#8f5f0e':'var(--am)';
  const note=t=>`<span style="font-size:10.5px;color:${f3}">${t}</span>`;
  const warn=t=>`<span style="font-size:10.5px;color:${am}">${t}</span>`;
  const lag=r.compType==='C',tg=lag?'ind.':'cap.';
  // Un solo valor del banco: el final (tras ajustar por la variación de tensión).
  const Qbank=lag?r.QC:r.QLr,Q0=Math.abs(r.Qneed0),differs=Math.abs(Q0-Qbank)>1e-3*Qbank;
  const est=differs?note(`Fórmula con el estado inicial: ${fPow(Q0,'var')}. El banco final difiere porque al compensar cambia la tensión en bornes.`)+'<br>':'';
  let h=`${note('fp medido en bornes de carga · carga '+(lag?'inductiva (en retraso)':'capacitiva (en adelanto)'))}<br>`;
  h+=`fp actual: ${fN(r.fpLoad,4)} ${tg} → objetivo: <span class="hl">${fN(r.fpTgt,3)} ${tg}</span><br>`;
  if(lag){
    h+=`Q_C = P_carga·(tanφ₁ − tanφ₂) = <span class="hl">${fPow(Qbank,'var')}</span> ${note('(banco de condensadores)')}<br>`+est;
    h+=`C_Y (estrella) = Q_C/(3·ω·U_f²) = <span class="hl">${fN(r.CY*1e6,3)} μF</span><br>`;
    h+=`C_Δ (triángulo) = C_Y/3 = <span class="hl">${fN(r.CD*1e6,3)} μF</span><br>`;
    h+=`Tensión de cada condensador: Y → ${fS(r.UcapF)} V · Δ → ${fS(r.UcapF*SQ3)} V<br>`;
    h+=`Banco a U_L nominal (${fS(r.UL)} V): ${fPow(r.Qnom,'var')} → `+(bad(r.kvarStep)?'sin paso comercial en la lista'
      :`paso comercial sugerido: <span class="hl">${r.kvarStep} kvar</span>`)+`<br>`;
    h+=note('Un banco comercial ligeramente mayor sobrecompensa un poco; Q varía con (U/U_n)².')+'<br>';
  }else{
    h+=warn('⚠ La carga es capacitiva: añadir condensadores empeoraría el fp. Se requieren reactores (bobinas).')+'<br>';
    h+=`Q_L = P_carga·(tan|φ₁| − tan|φ₂|) = <span class="hl">${fPow(Qbank,'var')}</span> ${note('(banco de reactores)')}<br>`+est;
    h+=`L_Y (estrella) = 3·U_f²/(ω·Q_L) = <span class="hl">${fN(r.LY*1e3,3)} mH</span><br>`;
    h+=`L_Δ (triángulo) = 3·L_Y = <span class="hl">${fN(r.LD*1e3,3)} mH</span><br>`;
    h+=note('L_Δ requiere 3 veces la inductancia de L_Y')+'<br>';
  }
  if(r.zLineEnabled)h+=warn(`⚡ Con Z_L: se usa P_carga = ${fPow(r.Pload,'W')} (sin pérdidas de línea). El fp en la fuente quedará distinto al objetivo.`)+'<br>';
  if(r.hasMotor&&r.zLineEnabled)h+=note(`Motores a potencia constante: al compensar sube la tensión en bornes, así que ${lag?'C':'L'} se ajustó en ${r.compIter} iteraciones para que el fp en bornes llegue exactamente al objetivo.`);
  return h;
}

export function compTableHTML(r,print){
  const c=r.comp;if(!c)return'';
  const pct=(a,b)=>(b-a)/a*100;
  const rows=[
    ['I_L (fuente)',`${fS(r.IL)} A`,`${fS(c.IL)} A`,pct(r.IL,c.IL)],
    ['fp en la fuente',`${fN(r.fp,4)} ${fpTag(r.φ)}`,`${fN(c.fpS,4)} ${fpTag(c.φS)}`,null],
    ['fp en la carga',`${fN(r.fpLoad,4)} ${fpTag(r.φLoad)}`,`${fN(c.fpL,4)} ${fpTag(c.φL)}`,null],
    ['S total',fPow(r.S3,'VA'),fPow(c.Stot,'VA'),pct(r.S3,c.Stot)],
  ];
  if(r.zLineEnabled){
    rows.push(['P pérdidas línea',fPow(r.Pline,'W'),fPow(c.Pline,'W'),pct(r.Pline,c.Pline)]);
    // En modo receptor U_carga es el dato y no cambia: lo que varía es la tensión de fuente necesaria
    rows.push(r.recMode
      ?['U_L,fuente necesaria',`${fS(r.UL_src)} V`,`${fS(c.UL_src)} V`,pct(r.UL_src,c.UL_src)]
      :['U_carga (fase)',`${fS(r.UloadF)} V`,`${fS(c.UloadF)} V`,pct(r.UloadF,c.UloadF)]);
    rows.push([r.recMode?'Caída en la línea resp. a la fuente':'ΔU respecto a U_n',`${sgn(r.dUpct)} %`,`${sgn(c.dUpct)} %`,null]);
  }
  const bd=print?'#e3ddd0':'var(--bd-sub)',f3=print?'#7d857e':'var(--fg3)',gn=print?'#2b7a52':'var(--gn)',am=print?'#b87314':'var(--am)';
  const td=`padding:4px 6px;border-bottom:1px solid ${bd};text-align:right`;
  let h=`<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${f3};margin:12px 0 4px">Efecto en la fuente tras compensar</div>`;
  h+=`<table style="width:100%;border-collapse:collapse;font-family:${print?'monospace':'var(--mono)'};font-size:11.5px">`;
  h+=`<tr><th style="${td};text-align:left;color:${f3};font-size:10px">Magnitud</th><th style="${td};color:${f3};font-size:10px">Antes</th><th style="${td};color:${f3};font-size:10px">Después</th><th style="${td};color:${f3};font-size:10px">Δ</th></tr>`;
  rows.forEach(([l,a,b,p])=>{
    const pc=p===null?'':`<span style="color:${p<0?gn:am}">${sgn(p,1)} %</span>`;
    h+=`<tr><td style="${td};text-align:left">${l}</td><td style="${td}">${a}</td><td style="${td};font-weight:600">${b}</td><td style="${td}">${pc}</td></tr>`;
  });
  h+='</table>';
  const nota=!r.recMode?'U_carga sube al compensar: la línea transporta menos corriente reactiva y cae menos tensión en Z_L.'
    :c.UL_src<=r.UL_src?'La tensión de fuente necesaria baja al compensar: la línea transporta menos corriente reactiva y cae menos tensión en Z_L.'
    :'La tensión de fuente necesaria sube al compensar: la corriente capacitiva de la carga elevaba la tensión en bornes a través de Z_L, y ese efecto se reduce.';
  if(r.zLineEnabled)h+=`<div style="font-size:10.5px;color:${f3};margin-top:4px">${nota}</div>`;
  return h;
}
