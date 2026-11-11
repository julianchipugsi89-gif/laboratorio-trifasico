// Kit gráfico SVG de símbolos eléctricos
import { r2d } from '../engine/math.js';
import { getCSS } from '../ui/dom.js';

export function svgKit(){
  const c={
    A:getCSS('--pa'),B:getCSS('--pb'),C:getCSS('--pc'),N:getCSS('--pn'),
    fg:getCSS('--fg'),fg2:getCSS('--fg2'),fg3:getCSS('--fg3'),
    bg:getCSS('--bg-tint'),card:getCSS('--bg-card'),bd:getCSS('--bd'),
    ac:getCSS('--ac'),acbg:getCSS('--ac-bg'),am:getCSS('--am'),gn:getCSS('--gn'),
    grid:getCSS('--grid-line')
  };
  // Texto de fase con su variante de alto contraste (las líneas mantienen el color vivo)
  const tcol={[c.A]:getCSS('--pa-t'),[c.B]:getCSS('--pb-t'),[c.C]:getCSS('--pc-t')};
  const mono='IBM Plex Mono,monospace',sans='IBM Plex Sans,sans-serif';
  const line=(x1,y1,x2,y2,col,w=1.8,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:''}/>`;
  const txt=(x,y,t,{size=10,col=c.fg2,anchor='start',weight=500,font=mono,italic=false}={})=>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${tcol[col]||col}" text-anchor="${anchor}" font-weight="${weight}" font-family="${font}"${italic?' font-style="italic"':''}>${t}</text>`;
  const term=(x,y,col)=>`<circle cx="${x}" cy="${y}" r="4.2" fill="${c.card}" stroke="${col}" stroke-width="2"/>`;
  const dot=(x,y,col)=>`<circle cx="${x}" cy="${y}" r="3.6" fill="${col}" stroke="${c.card}" stroke-width="1"/>`;
  const vtx=(x,y)=>`<circle cx="${x}" cy="${y}" r="3.8" fill="${c.card}" stroke="${c.fg2}" stroke-width="1.6"/>`;
  const arrowR=(x1,x2,y,col)=>`${line(x1,y,x2-6,y,col,1.8)}<polygon points="${x2},${y} ${x2-8},${y-3.8} ${x2-8},${y+3.8}" fill="${col}"/>`;

  // Dibuja una rama RLC realista a lo largo del segmento (x1,y1)→(x2,y2)
  // Muestra resistencia en zigzag, bobina con espiras y/o placas de condensador
  const rlcBranch=(x1,y1,x2,y2,{hasR=true,hasL=false,hasC=false,col=c.fg2,len=44}={})=>{
    const mx=(x1+x2)/2,my=(y1+y2)/2,ang=r2d(Math.atan2(y2-y1,x2-x1));
    const parts=[];
    if(hasR)parts.push('R');
    if(hasL)parts.push('L');
    if(hasC)parts.push('C');
    if(!parts.length)parts.push('R');
    const span=Math.min(len,Math.hypot(x2-x1,y2-y1)-14);
    const pw=span/parts.length;
    let g=`<g transform="translate(${mx} ${my}) rotate(${ang})">`;
    // Fondo limpio para ocultar el hilo debajo del símbolo
    g+=`<rect x="${-span/2-2}" y="-7" width="${span+4}" height="14" rx="3" fill="${c.bg}" opacity="0.92"/>`;
    parts.forEach((p,idx)=>{
      const sx=-span/2+idx*pw,ex=sx+pw,cx=(sx+ex)/2;
      if(p==='R'){
        // Zigzag IEEE de 5 picos
        const pad=2,w=pw-2*pad,x0=sx+pad;
        const pts=[[sx,0],[x0,0],[x0+w*0.12,-5],[x0+w*0.30,5],[x0+w*0.50,-5],[x0+w*0.70,5],[x0+w*0.88,-5],[x0+w,0],[ex,0]];
        g+=`<polyline points="${pts.map(q=>q.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="1.65" stroke-linejoin="round" stroke-linecap="round"/>`;
      }else if(p==='L'){
        // Bobina helicoidal de 3 arcos
        const pad=2,w=pw-2*pad,x0=sx+pad,step=w/3;
        let d=`M ${sx} 0 L ${x0} 0 `;
        for(let k=0;k<3;k++){
          const ax=x0+k*step,bx=ax+step;
          d+=`A ${step/2} 5.2 0 1 1 ${bx} 0 `;
        }
        d+=`L ${ex} 0`;
        g+=`<path d="${d}" fill="none" stroke="${c.ac}" stroke-width="1.65" stroke-linecap="round"/>`;
      }else if(p==='C'){
        // Placas paralelas de condensador
        const gap=3.2;
        g+=`<line x1="${sx}" y1="0" x2="${cx-gap/2}" y2="0" stroke="${col}" stroke-width="1.6"/>`;
        g+=`<line x1="${cx-gap/2}" y1="-6.5" x2="${cx-gap/2}" y2="6.5" stroke="${col}" stroke-width="2.2"/>`;
        g+=`<line x1="${cx+gap/2}" y1="-6.5" x2="${cx+gap/2}" y2="6.5" stroke="${col}" stroke-width="2.2"/>`;
        g+=`<line x1="${cx+gap/2}" y1="0" x2="${ex}" y2="0" stroke="${col}" stroke-width="1.6"/>`;
      }
    });
    g+=`</g>`;
    return g;
  };

  // Símbolo de puesta a tierra física
  const ground=(x,y,col=c.N)=>`
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+8}" stroke="${col}" stroke-width="1.6"/>
    <line x1="${x-9}" y1="${y+8}" x2="${x+9}" y2="${y+8}" stroke="${col}" stroke-width="1.8"/>
    <line x1="${x-6}" y1="${y+12}" x2="${x+6}" y2="${y+12}" stroke="${col}" stroke-width="1.6"/>
    <line x1="${x-3}" y1="${y+16}" x2="${x+3}" y2="${y+16}" stroke="${col}" stroke-width="1.4"/>`;

  // Símbolo de fuente senoidal AC circular
  const acSource=(cx,cy,r,col)=>`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.card}" stroke="${col}" stroke-width="1.8"/>
    <path d="M ${cx-r*0.55} ${cy} Q ${cx-r*0.275} ${cy-r*0.55} ${cx} ${cy} T ${cx+r*0.55} ${cy}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;

  return{c,mono,sans,line,txt,term,dot,vtx,arrowR,rlcBranch,ground,acSource};
}
