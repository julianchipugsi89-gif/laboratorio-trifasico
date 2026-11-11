// Circuito monofásico equivalente
import { fN, fA, rstr, pStr, cstr } from '../engine/format.js';
import { svgKit } from './svgKit.js';

export function genEquivSVG(r){
  const K=svgKit(),{c,line,txt,term,dot,arrowR,rlcBranch,ground,acSource}=K;
  const W=740,H=192,yT=50,yB=146,xS=54,xT=98,xLd=420,four=r.wires===4,ZLon=r.zLineEnabled;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" viewBox="0 0 ${W} ${H}" style="display:block;max-width:100%;height:auto">`;
  s+=`<rect width="${W}" height="${H}" fill="${c.bg}" rx="8"/>`;
  s+=`<rect width="${W}" height="${H}" fill="url(#engGrid)" rx="8"/>`;

  // Fuente monofásica ideal fase A
  const ym=(yT+yB)/2;
  s+=line(xS,yT,xS,ym-16,c.A,2)+acSource(xS,ym,16,c.A)+line(xS,ym+16,xS,yB,c.N,2);
  s+=line(xS,yT,xT,yT,c.A,2.2)+line(xS,yB,xT,yB,c.N,1.8);
  s+=ground(xS,yB,c.N);
  s+=txt(xT,yT-9,'A',{size:11.5,col:c.A,anchor:'middle',weight:700,font:K.sans});
  s+=txt(xT,yB+16,'N',{size:11.5,col:c.N,anchor:'middle',weight:700,font:K.sans});

  // Cota de tensión fuente U_AN
  s+=line(xT,yB-8,xT,yT+10,c.fg3,1.1,'3,2')+`<polygon points="${xT},${yT+6} ${xT-3.5},${yT+14} ${xT+3.5},${yT+14}" fill="${c.fg3}"/>`;
  const ufSrcLbl=r.recMode?`Ū_AN = ${fN(r.Uf_src,2)}∠${fA(r.UA)} V (calculada)`:`Ū_AN = ${fN(r.Uf,2)}∠${fA(r.UA)} V (DATO)`;
  s+=txt(xT+8,ym-3,ufSrcLbl,{size:9.5,col:r.recMode?c.am:c.fg,weight:600});
  s+=txt(xT+8,ym+11,r.recMode?`U_L,fuente = ${fN(r.UL_src,2)} V`:`(U_L / √3)`,{size:8.5,col:c.fg3});

  // Tramo de línea Z_L
  let x=xT+4;
  if(ZLon){
    const xz=188,zw=92;
    s+=line(x,yT,xz,yT,c.A,2.2);
    s+=`<rect x="${xz-4}" y="${yT-12}" width="${zw+8}" height="24" rx="5" fill="${c.card}" stroke="${c.am}" stroke-width="1.2"/>`;
    s+=line(xz,yT,xz+zw,yT,c.A,1.8);
    s+=rlcBranch(xz,yT,xz+zw,yT,{hasR:r.ZL.R>0,hasL:r.ZL.X>0,hasC:false,col:c.A,len:zw-8});
    s+=txt(xz+zw/2,yT-17,`Z_L = ${rstr(r.ZLc,2)} Ω`,{size:9.5,col:c.am,anchor:'middle',weight:600});
    s+=txt(xz+zw/2,yT+23,`ΔŪ = ${fN(r.UlineDropF,2)} V`,{size:8.5,col:c.am,anchor:'middle'});
    x=xz+zw;
  }
  s+=line(x,yT,xLd,yT,c.A,2.2);
  const xa=ZLon?300:210;
  s+=txt(xa,yT-18,`Ī_A = ${pStr(r.IL,r.IA)} A`,{size:10,col:c.A,weight:600});
  s+=arrowR(xa,xa+48,yT-7,c.A);

  // Rama de impedancia equivalente Z_eq (con R y L/C realistas verticales)
  s+=dot(xLd,yT,c.A)+txt(xLd,yT-9,'A′',{size:10.5,col:c.A,anchor:'middle',weight:700});
  const zy1=yT+14,zy2=yB-14;
  s+=`<rect x="${xLd-16}" y="${zy1}" width="32" height="${zy2-zy1}" rx="6" fill="${c.card}" stroke="${c.ac}" stroke-width="1.5"/>`;
  s+=line(xLd,yT,xLd,yB,c.fg2,1.6);
  s+=rlcBranch(xLd,zy1+4,xLd,zy2-4,{hasR:r.Zeq.R>0,hasL:r.Zeq.X>1e-6,hasC:r.Zeq.X<-1e-6,len:zy2-zy1-10});
  s+=txt(xLd+24,ym-10,`Z_eq,Y = ${rstr(r.ZeqC,3)} Ω`,{size:10,col:c.fg,weight:600});
  s+=txt(xLd+24,ym+4,`|Z_eq| = ${cstr(r.ZeqC,3)} Ω`,{size:9.5,col:c.ac});
  const uloadLbl=!ZLon?'Ū_A′N = Ū_AN (línea ideal)':r.recMode?`Ū_A′N = ${pStr(r.UloadF,r.UloadAng)} V (DATO)`:`Ū_A′N = ${pStr(r.UloadF,r.UloadAng)} V`;
  s+=txt(xLd+24,ym+18,uloadLbl,{size:9,col:ZLon?(r.recMode?c.gn:c.am):c.fg3});

  // Rama en paralelo de compensación C_Y / L_Y si está activa
  if(r.comp){
    const xC=705,isCap=r.compType==='C';
    s+=line(xLd,yT,xC,yT,c.gn,1.6,'4,2')+line(xC,yT,xC,yB,c.gn,1.6)+line(xLd,yB,xC,yB,c.N,1.4,'4,2');
    s+=rlcBranch(xC,zy1+10,xC,zy2-10,{hasR:false,hasL:!isCap,hasC:isCap,col:c.gn,len:36});
    s+=dot(xC,yT,c.gn)+dot(xC,yB,c.N);
    s+=txt(xC,yT-9,isCap?`C_Y=${fN(r.CY*1e6,1)}μF`:`L_Y=${fN(r.LY*1e3,1)}mH`,{size:9,col:c.gn,anchor:'middle',weight:600});
  }

  // Retorno por el neutro
  s+=line(xT+4,yB,xLd,yB,c.N,1.8,four?'':'6,3')+dot(xLd,yB,c.N);
  s+=txt(xLd,yB+16,"N′",{size:10,col:c.N,anchor:'middle',weight:600});
  s+=term(xT,yT,c.A)+term(xT,yB,c.N);
  s+=txt((xT+xLd)/2,yB+26,four?'Conductor neutro físico N (I_N = 0 A)':"Neutro ficticio de referencia (V_N′N = 0 V por simetría equilibrada)",{size:9,col:c.fg3,anchor:'middle'});
  return s+'</svg>';
}
