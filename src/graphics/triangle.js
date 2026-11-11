// Triángulo de potencias
import { fN, fPow } from '../engine/format.js';
import { getCSS, $ } from '../ui/dom.js';

// ── Triángulo vectorial de potencias realista ─────────────────────────
export function genTriangleSVG(r,print){
  const W=660,H=250,padL=58,padR=236,padY=42;
  const c=r.comp,P1=r.P3,Q1=r.Q3,P2=c?c.Ptot:NaN,Q2=c?c.Qtot:NaN;
  const maxP=Math.max(P1,c?P2:0,1e-9),maxQ=Math.max(Math.abs(Q1),c?Math.abs(Q2):0,P1*0.28,1e-9);
  const k=Math.min((W-padL-padR)/maxP,(H-2*padY)/maxQ);
  const up=Q1>=0,x0=padL,y0=up?H-padY:padY;
  const X=p=>x0+p*k,Y=q=>up?y0-Math.abs(q)*k:y0+Math.abs(q)*k;
  const col=v=>print?({fg:'#232824',f2:'#4e5650',f3:'#7d857e',ac:'#2d6a4f',gn:'#2b7a52',am:'#b87314',pa:'#c85a32',bd:'#d3cbbd',grid:'rgba(0,0,0,.06)'})[v]
    :getCSS({fg:'--fg',f2:'--fg2',f3:'--fg3',ac:'--ac',gn:'--gn',am:'--am',pa:'--pa',bd:'--bd',grid:'--grid-line'}[v]);
  const mono='IBM Plex Mono,monospace';

  const vArrow=(x1,y1,x2,y2,stroke,w=2.2,dash='')=>{
    const a=Math.atan2(y2-y1,x2-x1),hl=9;
    const xe=x2-hl*0.7*Math.cos(a),ye=y2-hl*0.7*Math.sin(a);
    const p1x=x2-hl*Math.cos(a-0.32),p1y=y2-hl*Math.sin(a-0.32);
    const p2x=x2-hl*Math.cos(a+0.32),p2y=y2-hl*Math.sin(a+0.32);
    return `<line x1="${x1}" y1="${y1}" x2="${xe}" y2="${ye}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:''}/>`+
           `<polygon points="${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}" fill="${stroke}"/>`;
  };

  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${mono}" style="display:block;width:100%;max-width:760px;margin:0 auto">`;
  // Cuadrícula técnica de fondo
  for(let gx=20;gx<W;gx+=25)s+=`<line x1="${gx}" y1="0" x2="${gx}" y2="${H}" stroke="${col('grid')}" stroke-width="0.7"/>`;
  for(let gy=20;gy<H;gy+=25)s+=`<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="${col('grid')}" stroke-width="0.7"/>`;
  s+=`<line x1="${x0-16}" y1="${y0}" x2="${W-24}" y2="${y0}" stroke="${col('bd')}" stroke-width="1.2"/>`;
  s+=`<line x1="${x0}" y1="14" x2="${x0}" y2="${H-14}" stroke="${col('bd')}" stroke-width="1.2"/>`;

  // Superficie del triángulo S-P-Q
  s+=`<polygon points="${X(0)},${y0} ${X(P1)},${y0} ${X(P1)},${Y(Q1)}" fill="${col('ac')}" fill-opacity=".11"/>`;

  // Arco del ángulo φ
  const rArc=Math.min(44,P1*k*0.35),angRad=Math.atan2(Y(Q1)-y0,X(P1)-x0);
  const ax=x0+rArc*Math.cos(angRad),ay=y0+rArc*Math.sin(angRad);
  s+=`<path d="M ${x0+rArc} ${y0} A ${rArc} ${rArc} 0 0 ${up?0:1} ${ax} ${ay}" fill="none" stroke="${col('pa')}" stroke-width="1.5"/>`;
  s+=`<text x="${x0+rArc+6}" y="${y0+(up?-8:14)}" font-size="9.5" fill="${col('pa')}" font-weight="600">φ=${fN(Math.abs(r.φd),1)}° (fp=${fN(r.fp,3)})</text>`;

  // Vectores P, Q y S
  s+=vArrow(X(0),y0,X(P1),y0,col('fg'),2.4);
  if(Math.abs(Q1)>1e-6)s+=vArrow(X(P1),y0,X(P1),Y(Q1),col('am'),2.4);
  s+=vArrow(X(0),y0,X(P1),Y(Q1),col('ac'),2.6);

  // Etiquetas de P, Q y S
  s+=`<text x="${X(P1/2)}" y="${y0+(up?18:-9)}" font-size="10.5" fill="${col('fg')}" font-weight="600" text-anchor="middle">P = ${fPow(P1,'W')}</text>`;
  s+=`<text x="${X(P1)+10}" y="${(y0+Y(Q1))/2}" font-size="10.5" fill="${col('am')}" font-weight="600" dominant-baseline="middle">Q = ${fPow(Q1,'var')}</text>`;
  s+=`<text x="${X(P1*0.46)-8}" y="${Y(Q1*0.46)+(up?-10:16)}" font-size="10.5" fill="${col('ac')}" font-weight="700" text-anchor="end">S = ${fPow(r.S3,'VA')}</text>`;

  // Triángulo compensado superpuesto
  if(c){
    s+=`<polygon points="${X(0)},${y0} ${X(P2)},${y0} ${X(P2)},${Y(Q2)}" fill="${col('gn')}" fill-opacity=".10"/>`;
    s+=vArrow(X(0),y0,X(P2),Y(Q2),col('gn'),2.2,'6,3');
    // Vector de reducción Q_C / Q_L
    const xQc=Math.max(X(P1),X(P2))+44;
    s+=`<line x1="${X(P1)}" y1="${Y(Q1)}" x2="${xQc+4}" y2="${Y(Q1)}" stroke="${col('bd')}" stroke-dasharray="2,2"/>`;
    s+=`<line x1="${X(P2)}" y1="${Y(Q2)}" x2="${xQc+4}" y2="${Y(Q2)}" stroke="${col('bd')}" stroke-dasharray="2,2"/>`;
    s+=vArrow(xQc,Y(Q1),xQc,Y(Q2),col('gn'),2);
    const qcLbl=r.compType==='C'?`Q_C = ${fPow(r.QC,'var')}`:`Q_L = ${fPow(r.QLr,'var')}`;
    s+=`<text x="${xQc+7}" y="${(Y(Q1)+Y(Q2))/2-5}" font-size="9.5" fill="${col('gn')}" font-weight="700">${qcLbl}</text>`;
    s+=`<text x="${xQc+7}" y="${(Y(Q1)+Y(Q2))/2+9}" font-size="9" fill="${col('f2')}">S' = ${fPow(c.Stot,'VA')} (fp'=${fN(c.fpS,3)})</text>`;
  }
  s+=`<text x="${W-10}" y="${up?16:H-8}" font-size="9" fill="${col('f3')}" text-anchor="end">${c?'— Estado inicial   - - - Compensado':'Potencia reactiva '+(up?'inductiva (+Q)':'capacitiva (−Q)')}</text>`;
  return s+'</svg>';
}
export function renderTriangle(r){$('power-triangle').innerHTML=genTriangleSVG(r,false);}
