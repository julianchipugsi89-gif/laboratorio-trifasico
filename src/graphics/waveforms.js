// Osciloscopio trifásico
import { fN } from '../engine/format.js';
import { π, d2r } from '../engine/math.js';
import { $, getCSS } from '../core/dom.js';
import { waveHoverDeg } from '../core/state.js';

// ── Osciloscopio trifásico instantáneo u(ωt) e i(ωt) ──────────────────
export function drawWaveforms(r){
  const canvas=$('waveCanvas');if(!canvas)return;
  const W=canvas.parentElement.clientWidth||380,H=Math.min(Math.max(W,310),360),dpr=window.devicePixelRatio||1;
  canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const padL=40,padR=16,padT=24,padB=32;
  const pw=W-padL-padR,ph=H-padT-padB,cy=padT+ph/2;
  const mono=getCSS('--mono')||'monospace';
  ctx.clearRect(0,0,W,H);

  // Rejilla del osciloscopio cada 60°
  ctx.font=`9.5px ${mono}`;ctx.textAlign='center';
  for(let deg=0;deg<=360;deg+=60){
    const x=padL+(deg/360)*pw;
    ctx.beginPath();ctx.moveTo(x,padT);ctx.lineTo(x,padT+ph);
    ctx.strokeStyle=deg%180===0?getCSS('--bd'):getCSS('--grid-line');
    ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=getCSS('--fg3');
    ctx.fillText(`${deg}°`,x,H-11);
  }
  [-1,-0.5,0,0.5,1].forEach(v=>{
    const y=cy-v*(ph*0.44);
    ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(padL+pw,y);
    ctx.strokeStyle=v===0?getCSS('--bd'):getCSS('--grid-line');
    ctx.lineWidth=v===0?1.2:0.8;ctx.stroke();
  });
  ctx.fillStyle=getCSS('--fg3');ctx.textAlign='right';
  ctx.fillText('+Û',padL-6,cy-ph*0.42);
  ctx.fillText('0',padL-6,cy+3);
  ctx.fillText('−Û',padL-6,cy+ph*0.45);

  const cA=getCSS('--pa'),cB=getCSS('--pb'),cC=getCSS('--pc');
  const ampU=ph*0.42,ampI=ph*0.29;
  function plotSine(angShift,amp,col,dash){
    ctx.beginPath();
    for(let px=0;px<=pw;px+=2){
      const wt=(px/pw)*2*π;
      const y=cy-amp*Math.sin(wt+d2r(angShift));
      if(px===0)ctx.moveTo(padL+px,y);else ctx.lineTo(padL+px,y);
    }
    ctx.strokeStyle=col;ctx.lineWidth=dash?1.6:2.2;
    ctx.setLineDash(dash?[5,3]:[]);ctx.stroke();ctx.setLineDash([]);
  }
  // Ondas de tensión u_A, u_B, u_C (continuas) y corrientes i_A, i_B, i_C (discontinuas)
  [[r.UA,cA],[r.UB,cB],[r.UC,cC]].forEach(([a,c])=>plotSine(a,ampU,c,false));
  [[r.IA,cA],[r.IB,cB],[r.IC,cC]].forEach(([a,c])=>plotSine(a,ampI,c,true));

  // Cota de desfase φ entre el paso por cero de u_A e i_A
  if(Math.abs(r.φd)>2){
    const xU=padL,xI=padL+(Math.max(0,Math.min(360,-r.IA))/360)*pw;
    if(xI>xU+6){
      ctx.beginPath();ctx.moveTo(xU,cy-12);ctx.lineTo(xI,cy-12);
      ctx.strokeStyle=getCSS('--ac');ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle=getCSS('--ac');ctx.textAlign='center';
      ctx.fillText(`Δθ = φ = ${fN(Math.abs(r.φd),1)}°`,(xU+xI)/2,cy-18);
    }
  }

  // Cursor interactivo si el usuario pasa el ratón
  if(waveHoverDeg!==null){
    const x=padL+(waveHoverDeg/360)*pw;
    ctx.beginPath();ctx.moveTo(x,padT);ctx.lineTo(x,padT+ph);
    ctx.strokeStyle=getCSS('--fg');ctx.lineWidth=1.1;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);
    // Punto sobre cada curva en el instante ωt (mismo color que su fasor)
    [[r.UA,cA,ampU,false],[r.UB,cB,ampU,false],[r.UC,cC,ampU,false],[r.IA,cA,ampI,true],[r.IB,cB,ampI,true],[r.IC,cC,ampI,true]].forEach(([a,col,amp,isI])=>{
      const y=cy-amp*Math.sin(d2r(waveHoverDeg+a));
      ctx.beginPath();ctx.arc(x,y,isI?2.8:3.6,0,2*π);ctx.fillStyle=col;ctx.fill();
      ctx.strokeStyle=getCSS('--bg-card');ctx.lineWidth=1;ctx.stroke();
    });
    ctx.font=`600 10px ${mono}`;ctx.fillStyle=getCSS('--fg');ctx.textAlign=x>padL+pw-60?'right':'left';
    ctx.fillText(`ωt=${fN(waveHoverDeg,0)}°`,x+(x>padL+pw-60?-5:5),padT+10);
    $('wave-hover-lbl').textContent=`ωt = ${fN(waveHoverDeg,0)}° · valores en la tabla inferior`;
  }else $('wave-hover-lbl').textContent='Pasa el cursor (o desliza) para fijar ωt';
}
