// Diagrama fasorial
import { fN, fA, fpTag } from '../engine/format.js';
import { d2r, π } from '../engine/math.js';
import { $, getCSS, textCol } from '../core/dom.js';
import { waveHoverDeg } from '../core/state.js';

// ── Diagrama Fasorial Polar con Transportador Graduado ────────────────
export function drawPhasors(r){
  const canvas=$('phasorCanvas');if(!canvas)return;
  const W=canvas.parentElement.clientWidth||380,H=Math.min(Math.max(W,310),360),dpr=window.devicePixelRatio||1;
  canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const cx=W/2,cy=H/2,R=Math.min(cx,cy)-38;
  const mono=getCSS('--mono')||'monospace',sans=getCSS('--sans')||'sans-serif';
  const live=waveHoverDeg!==null,wt=live?waveHoverDeg:0;   // los fasores giran e^{jωt}
  ctx.clearRect(0,0,W,H);

  // Rayos radiales cada 30° del transportador y etiquetas de grados
  ctx.font=`9.5px ${mono}`;
  for(let deg=0;deg<360;deg+=30){
    const rad=d2r(deg),xEdge=cx+R*Math.cos(rad),yEdge=cy-R*Math.sin(rad);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(xEdge,yEdge);
    ctx.strokeStyle=deg%90===0?getCSS('--bd'):getCSS('--grid-line');
    ctx.lineWidth=deg%90===0?1.1:0.8;ctx.stroke();
    const lbl=deg<=180?`${deg}°`:`−${360-deg}°`;
    const lx=cx+(R+16)*Math.cos(rad),ly=cy-(R+16)*Math.sin(rad);
    ctx.fillStyle=getCSS('--fg3');ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(lbl,lx,ly);
  }

  // Círculos concéntricos graduados (25%, 50%, 75%, 100%)
  [0.25,0.5,0.75,1].forEach((k,idx)=>{
    ctx.beginPath();ctx.arc(cx,cy,R*k,0,2*π);
    ctx.strokeStyle=idx===3?getCSS('--bd'):getCSS('--grid-line');
    ctx.lineWidth=idx===3?1.3:0.9;
    ctx.setLineDash(idx===2?[4,3]:[]);ctx.stroke();ctx.setLineDash([]);
  });

  // Sector sombreado del desfase φ entre U_AN (0°) e I_A
  if(Math.abs(r.φd)>0.8){
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R*0.34,d2r(-(r.UA+wt)),d2r(-(r.IA+wt)),r.IA>r.UA);
    ctx.closePath();
    ctx.fillStyle=getCSS('--ac-bg');ctx.fill();
    ctx.beginPath();
    ctx.arc(cx,cy,R*0.34,d2r(-(r.UA+wt)),d2r(-(r.IA+wt)),r.IA>r.UA);
    ctx.strokeStyle=getCSS('--ac');ctx.lineWidth=1.4;ctx.stroke();
    const am=d2r((r.IA+r.UA)/2+wt);
    ctx.fillStyle=getCSS('--ac');ctx.font=`600 10.5px ${mono}`;
    ctx.fillText(`φ=${fN(Math.abs(r.φd),1)}°`,cx+R*0.44*Math.cos(am),cy-R*0.44*Math.sin(am));
  }

  const cA=getCSS('--pa'),cB=getCSS('--pb'),cC=getCSS('--pc'),bgCard=getCSS('--bg-card');
  function pill(x,y,text,col){
    ctx.font=`600 10px ${sans}`;
    const w=ctx.measureText(text).width+8,h=15;
    ctx.fillStyle=bgCard;ctx.globalAlpha=0.88;
    ctx.fillRect(x-w/2,y-h/2,w,h);ctx.globalAlpha=1;
    ctx.fillStyle=textCol(col);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(text,x,y);
  }
  function arrow(ang0,col,dash,scale,label,proj){
    const ang=ang0+wt,len=R*scale,rad=d2r(ang),ex=cx+len*Math.cos(rad),ey=cy-len*Math.sin(rad);
    if(live&&proj){
      // Proyección sobre el eje vertical = valor instantáneo (u = Û·sen(ωt+θ))
      ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(cx,ey);
      ctx.strokeStyle=col;ctx.globalAlpha=0.5;ctx.lineWidth=1;ctx.setLineDash([2,3]);ctx.stroke();
      ctx.setLineDash([]);ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(cx,ey,dash?2.6:3.4,0,2*π);ctx.fillStyle=col;ctx.fill();
    }
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);
    ctx.strokeStyle=col;ctx.lineWidth=dash?1.9:2.6;ctx.setLineDash(dash?[6,3]:[]);ctx.stroke();ctx.setLineDash([]);
    const a=Math.atan2(cy-ey,ex-cx),hl=9.5;
    ctx.beginPath();ctx.moveTo(ex,ey);
    ctx.lineTo(ex-hl*Math.cos(a-0.3),ey+hl*Math.sin(a-0.3));
    ctx.lineTo(ex-hl*Math.cos(a+0.28),ey+hl*Math.sin(a+0.28));
    ctx.closePath();ctx.fillStyle=col;ctx.fill();
    if(label){
      const px=cx+(len-18)*Math.cos(rad),py=cy-(len-18)*Math.sin(rad);
      pill(px,py,label,col);
    }
  }

  // Si hay Z_L, mostrar también Ū_carga
  if(r.zLineEnabled&&!live){
    const kU=Math.min(0.95,Math.max(0.5,r.UloadF/r.Uf_src));
    [[r.UloadAng,cA],[r.UB-r.UA+r.UloadAng,cB],[r.UC-r.UA+r.UloadAng,cC]].forEach(([a,c])=>arrow(a,c,true,kU*0.88,null));
  }
  // Fasores de tensión fuente (escala 0.92R) y corriente de línea (escala 0.68R)
  if(live){
    // Eje vertical de proyección resaltado
    ctx.beginPath();ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);
    ctx.strokeStyle=getCSS('--fg2');ctx.lineWidth=1.3;ctx.stroke();
  }
  [[r.UA,cA,'Ū_AN'],[r.UB,cB,'Ū_BN'],[r.UC,cC,'Ū_CN']].forEach(([a,c,l])=>arrow(a,c,false,0.92,l,true));
  [[r.IA,cA,'Ī_A'],[r.IB,cB,'Ī_B'],[r.IC,cC,'Ī_C']].forEach(([a,c,l])=>arrow(a,c,true,0.68,l,true));
  if(live){
    ctx.font=`600 11px ${mono}`;ctx.fillStyle=getCSS('--fg');ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(`ωt = ${fN(wt,0)}°`,10,10);
    ctx.font=`9.5px ${mono}`;ctx.fillStyle=getCSS('--fg3');
    ctx.fillText('fasores girando',10,25);
  }

  ctx.beginPath();ctx.arc(cx,cy,3.5,0,2*π);ctx.fillStyle=getCSS('--fg');ctx.fill();
  if(r.recMode&&r.zLineEnabled){
    $('phasor-note').textContent=`Ū_A′N = ${fN(r.UloadF,2)} V ∠${fA(r.UloadAng)} (DATO)   |   Ū_AN = ${fN(r.Uf_src,2)} V ∠${fA(r.UA)} (calculada)   |   Ī_A = ${fN(r.IL,3)} A ∠${fA(r.IA)}   |   φ = ${fN(r.φd,2)}°`;
  } else {
    $('phasor-note').textContent=`Ū_AN = ${fN(r.Uf,2)} V ∠${fA(r.UA)}   |   Ī_A = ${fN(r.IL,3)} A ∠${fA(r.IA)}   |   Desfase φ = ${fN(r.φd,2)}° (${fpTag(r.φ)||'resistivo'})`;
  }
}
