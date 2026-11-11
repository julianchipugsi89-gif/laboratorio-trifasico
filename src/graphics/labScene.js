// Escena SVG del banco de laboratorio: fuente, instrumentos, línea, embarrado y cargas.
// Devuelve una cadena; no toca el DOM. Los colores salen de clases CSS (styles/lab.css), así que
// la escena sigue al tema claro/oscuro sin volver a generarse.
import { fS, fN, fPow, fpTag, rstr } from '../engine/format.js';

const Y={A:70,B:130,C:190,N:250};
const X={src:98,v1:140,w1:215,w2:265,amp:335,cos:425,zl:500,term:575,v2:615,load0:705,pitch:152};
const FASES=['A','B','C'];

const tx=(x,y,t,cls='lab-t',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${t}</text>`;
const dot=(x,y,f)=>`<circle cx="${x}" cy="${y}" r="3.4" class="lab-d lab-d${f}"/>`;
const meter=(x,y,r,label)=>`<circle cx="${x}" cy="${y}" r="${r}" class="lab-el lab-inst"/>${tx(x,y+4,label,'lab-sym','middle')}`;

function cargaSVG(b,xc,cuatro){
  const taps=[xc-16,xc,xc+16];
  let s=`<g id="lab-load-${b.k}" class="lab-load">`;
  FASES.forEach((f,i)=>{s+=`<path class="lab-w lab-tap lab-${f}" d="M${taps[i]} ${Y[f]} V300"/>${dot(taps[i],Y[f],f)}`;});
  if(cuatro&&b.kind!=='motor'&&b.conn==='star')s+=`<path class="lab-w lab-N" d="M${xc+34} ${Y.N} V300"/>${dot(xc+34,Y.N,'N')}`;
  if(b.kind==='motor'){
    s+=`<circle cx="${xc}" cy="338" r="37" class="lab-el"/>`;
    s+=`<g class="lab-rotor" data-cx="${xc}" data-cy="338"><circle cx="${xc}" cy="338" r="27" class="lab-rotor-ring"/>`;
    s+=`<path class="lab-rotor-mark" d="M${xc} 311 V322 M${xc} 354 V365 M${xc-27} 338 H${xc-16} M${xc+16} 338 H${xc+27}"/></g>`;
    s+=tx(xc,336,'M','lab-big','middle')+tx(xc,352,'3~','lab-t','middle');
  }else{
    s+=`<rect x="${xc-44}" y="301" width="88" height="74" rx="9" class="lab-el"/>`;
    s+=b.conn==='star'
      ?`<path class="lab-glyph" d="M${xc} 343 V321 M${xc} 343 L${xc-19} 359 M${xc} 343 L${xc+19} 359"/>`
      :`<path class="lab-glyph" d="M${xc} 322 L${xc-21} 360 H${xc+21} Z"/>`;
  }
  s+=tx(xc,393,`${b.tag} · ${b.conn==='star'?'Y':'Δ'} · ${fS(b.Ik)} A`,'lab-val','middle');
  s+=tx(xc,408,`${fPow(b.Pk,'W')} · fp ${fN(b.fpk,2)}`,'lab-t','middle');
  return s+'</g>';
}

function bancoSVG(r,xc){
  const taps=[xc-16,xc,xc+16],esC=r.compType==='C';
  let s=`<g id="lab-bank" class="lab-bank">`;
  FASES.forEach((f,i)=>{s+=`<path class="lab-w lab-tap lab-${f}" d="M${taps[i]} ${Y[f]} V262"/>${dot(taps[i],Y[f],f)}`;});
  // Contactor tripolar abierto
  s+=`<g id="lab-contactor" class="lab-k">`;
  taps.forEach(x=>{s+=`<path class="lab-k-blade" d="M${x} 288 L${x-10} 265"/><circle cx="${x}" cy="262" r="2.6" class="lab-k-pin"/><circle cx="${x}" cy="288" r="2.6" class="lab-k-pin"/>`;});
  s+=`<path class="lab-lead" d="M${xc-24} 277 H${xc+14}"/>`+tx(xc-30,281,'K','lab-val','end')+`</g>`;
  taps.forEach(x=>{s+=`<path class="lab-w lab-off" d="M${x} 288 V301"/>`;});
  s+=`<rect x="${xc-44}" y="301" width="88" height="74" rx="9" class="lab-el"/>`;
  s+=esC
    ?`<path class="lab-glyph" d="M${xc} 318 V332 M${xc-16} 332 H${xc+16} M${xc-16} 343 H${xc+16} M${xc} 343 V358"/>`
    :`<path class="lab-glyph" d="M${xc} 316 V324 a7 7 0 0 1 0 12 a7 7 0 0 1 0 12 V360"/>`;
  s+=tx(xc,393,`Banco ${esC?'C':'L'} · ${fPow(esC?r.QC:r.QLr,'var')}`,'lab-val','middle');
  s+=tx(xc,408,'contactor K abierto','lab-t','middle');
  return s+'</g>';
}

export function genLabSVG(r,m){
  const n=r.bkd.length,banco=!!r.compType,cuatro=r.wires===4;
  const W=Math.max(880,X.load0+(n+(banco?1:0)-1)*X.pitch+72),H=420,xFin=W-18;
  const yCaja=cuatro?Y.N+20:Y.C+24;
  let s=`<svg class="lab-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Banco de laboratorio trifásico con instrumentos" style="width:100%;min-width:${Math.round(W*0.25)}px;height:auto">`;

  // Conductores de fase: tramo fuente → bornes del receptor y embarrado
  FASES.forEach(f=>{
    s+=`<path id="lab-wire-${f}" class="lab-w lab-${f}" d="M${X.src} ${Y[f]} H${X.term}"/>`;
    s+=`<path class="lab-w lab-bus lab-${f}" d="M${X.term} ${Y[f]} H${xFin}"/>`;
  });
  if(cuatro)s+=`<path id="lab-wire-N" class="lab-w lab-N" d="M${X.src} ${Y.N} H${xFin}"/>`+tx(X.src+7,Y.N-7,'N','lab-t');

  // Fuente
  s+=`<g id="lab-src"><rect x="14" y="42" width="${X.src-14}" height="${yCaja-42}" rx="11" class="lab-el"/>`;
  s+=tx(56,(42+yCaja)/2-6,'G','lab-big','middle')+tx(56,(42+yCaja)/2+12,'3~','lab-t','middle')+tx(56,(42+yCaja)/2+30,'FUENTE','lab-cap','middle');
  FASES.forEach(f=>{s+=tx(X.src+7,Y[f]-7,f,`lab-t lab-t${f}`);});
  s+=tx(14,yCaja+17,`${fS(r.Uf_src)} V/fase · ${fN(r.f,0)} Hz`,'lab-t');
  s+=tx(14,yCaja+32,`sec. ${r.seq==='abc'?'ABC':'ACB'} · ${r.wires} hilos`,'lab-t')+`</g>`;

  // Voltímetro de fuente (entre A y B)
  s+=`<g id="lab-v1"><path class="lab-lead lab-solid" d="M${X.v1} ${Y.A} V${Y.B}"/>${dot(X.v1,Y.A,'A')}${dot(X.v1,Y.B,'B')}${meter(X.v1,100,15,'V')}`;
  s+=tx(X.v1+20,104,`${fS(m.vFuente.UL)} V`,'lab-val')+`</g>`;

  // Vatímetros de Aron: corriente en A y B, tensión respecto a C
  s+=`<g id="lab-w1"><path class="lab-lead" d="M${X.w1} ${Y.A+15} V${Y.C}"/>${dot(X.w1,Y.C,'C')}${meter(X.w1,Y.A,15,'W1')}`;
  s+=tx(X.w1,Y.A-22,fPow(m.W1,'W'),'lab-val','middle')+`</g>`;
  s+=`<g id="lab-w2"><path class="lab-lead" d="M${X.w2} ${Y.B+15} V${Y.C}"/>${dot(X.w2,Y.C,'C')}${meter(X.w2,Y.B,15,'W2')}`;
  s+=tx(X.w2,Y.B-22,fPow(m.W2,'W'),'lab-val','middle')+`</g>`;

  // Amperímetros de línea
  s+=`<g id="lab-amp">`;
  FASES.forEach(f=>{s+=meter(X.amp,Y[f],13,'A')+tx(X.amp+18,Y[f]-9,`${fS(m.amp.IL)} A`,`lab-val lab-t${f}`);});
  s+=`</g>`;

  // Cosfímetro: bobina de corriente en la línea A y tomas de tensión a B y C
  s+=`<g id="lab-cos"><path class="lab-lead" d="M${X.cos-7} ${Y.A+14} V${Y.B}"/>${dot(X.cos-7,Y.B,'B')}<path class="lab-lead" d="M${X.cos+7} ${Y.A+14} V${Y.C}"/>${dot(X.cos+7,Y.C,'C')}`;
  s+=`<circle cx="${X.cos}" cy="${Y.A}" r="17" class="lab-el lab-inst"/>`+tx(X.cos,Y.A+3,'cos φ','lab-sym lab-sym-s','middle');
  s+=tx(X.cos,Y.A-24,`${fN(m.fp,3)} ${fpTag(m.φ)}`,'lab-val','middle')+`</g>`;

  // Línea
  s+=`<g id="lab-zl">`;
  if(r.zLineEnabled){
    FASES.forEach(f=>{s+=`<rect x="${X.zl}" y="${Y[f]-11}" width="60" height="22" rx="5" class="lab-el"/>`+tx(X.zl+30,Y[f]+4,'Z_L','lab-sym','middle');});
    s+=tx(X.zl+30,Y.A-22,`${rstr(r.ZLc)} Ω`,'lab-val','middle');
  }else s+=tx(X.zl+30,Y.A-22,'línea ideal','lab-t','middle');
  s+=`</g>`;

  // Bornes del receptor y embarrado
  s+=`<g id="lab-bus">`;
  FASES.forEach(f=>{s+=`<circle cx="${X.term}" cy="${Y[f]}" r="5" class="lab-term lab-${f}"/>`+tx(X.term,Y[f]-10,`${f}′`,`lab-t lab-t${f}`,'middle');});
  s+=tx(xFin,Y.A-10,'EMBARRADO','lab-cap','end')+`</g>`;

  // Voltímetro del receptor (entre A′ y B′)
  s+=`<g id="lab-v2"><path class="lab-lead lab-solid" d="M${X.v2} ${Y.A} V${Y.B}"/>${dot(X.v2,Y.A,'A')}${dot(X.v2,Y.B,'B')}${meter(X.v2,100,15,'V')}`;
  s+=tx(X.v2+20,104,`${fS(m.vReceptor.UL)} V`,'lab-val')+`</g>`;

  r.bkd.forEach((b,k)=>{s+=cargaSVG(b,X.load0+k*X.pitch,cuatro);});
  if(banco)s+=bancoSVG(r,X.load0+n*X.pitch);
  return s+'</svg>';
}
