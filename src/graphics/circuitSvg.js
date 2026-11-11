// Planta y topología del sistema trifásico
import { cscale, cabs } from '../engine/complex.js';
import { rstr, fS, fN, fPow } from '../engine/format.js';
import { svgKit } from './svgKit.js';

export function genCircuitSVG(r){
  const K=svgKit(),{c,line,txt,term,dot,vtx,arrowR,rlcBranch,ground,acSource}=K;
  const four=r.wires===4,ZLon=r.zLineEnabled,hasComp=!!r.comp;
  const gap=36,yA=42,yB=yA+gap,yC=yB+gap,yN=yC+gap,lastBus=four?yN:yC;
  const xGen=52,xT=96,xZ=132,zW=74,xArr=ZLon?xZ+zW+20:124,x0=xArr+96,LWc=222;
  const nCols=r.bkd.length+(hasComp?1:0);
  const W=Math.max(660,x0+nCols*LWc+28),yT0=lastBus+46,triH=112,H=yT0+triH+56;

  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" viewBox="0 0 ${W} ${H}" style="display:block;max-width:100%;height:auto">`;
  // Fondo técnico con cuadrícula sutil de ingeniería
  s+=`<defs>
    <pattern id="engGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${c.grid}" stroke-width="0.7"/>
    </pattern>
  </defs>`;
  s+=`<rect width="${W}" height="${H}" fill="${c.bg}" rx="8"/>`;
  s+=`<rect width="${W}" height="${H}" fill="url(#engGrid)" rx="8"/>`;

  // Bloque Generador / Fuente Trifásica realista a la izquierda
  const genTop=yA-22,genBot=lastBus+22;
  s+=`<rect x="14" y="${genTop}" width="72" height="${genBot-genTop}" rx="8" fill="${c.card}" stroke="${c.bd}" stroke-width="1.5"/>`;
  s+=txt(50,genTop+13,'FUENTE 3~',{size:8.5,col:c.fg3,anchor:'middle',weight:700,font:K.sans});
  // Neutro común del generador y puesta a tierra
  s+=line(26,yA,26,lastBus,c.N,1.5);
  s+=ground(26,lastBus+2,c.N);

  // Conductores de fase (Busbars con grosor realista)
  [['A',yA,c.A,r.UA,r.IA],['B',yB,c.B,r.UB,r.IB],['C',yC,c.C,r.UC,r.IC]].forEach(([l,y,col,uAng,iAng])=>{
    s+=line(26,y,xGen-11,y,c.N,1.4);
    s+=acSource(xGen,y,11,col);
    s+=line(xGen+11,y,xT,y,col,2.2);
    s+=txt(xT-2,y-8,l,{size:11.5,col,anchor:'middle',weight:700,font:K.sans});
    if(ZLon){
      s+=line(xT+4,y,xZ,y,col,2.4);
      // Línea con R_L y X_L realistas en serie
      s+=`<rect x="${xZ-3}" y="${y-11}" width="${zW+6}" height="22" rx="5" fill="${c.card}" stroke="${c.bd}" stroke-width="1"/>`;
      s+=line(xZ,y,xZ+zW,y,col,1.8);
      s+=rlcBranch(xZ,y,xZ+zW,y,{hasR:r.ZL.R>0,hasL:r.ZL.X>0,hasC:false,col,len:zW-8});
      if(l==='A')s+=txt(xZ+zW/2,y-15,`Z_L = ${rstr(r.ZLc,2)} Ω`,{size:9,col:c.am,anchor:'middle',weight:600});
      s+=line(xZ+zW,y,W-16,y,col,2.4);
    }else{
      s+=line(xT+4,y,W-16,y,col,2.4);
    }
    s+=term(xT,y,col);
    s+=txt(xArr,y-7,`Ī<tspan font-size="8" dy="2">${l}</tspan><tspan dy="-2" font-size="9" font-style="normal"> ${fS(r.IL,3)}A</tspan>`,{size:10,col,italic:true,weight:600});
    s+=arrowR(xArr+62,xArr+88,y-5,col);
  });

  // Conductor de neutro (4 hilos) o aviso de 3 hilos
  if(four){
    s+=txt(xT-2,yN-8,'N',{size:11,col:c.N,anchor:'middle',weight:700,font:K.sans});
    s+=line(26,yN,W-16,yN,c.N,1.8,'6,3')+term(xT,yN,c.N);
    s+=txt(xArr,yN-6,'I_N = 0 A (equilibrado)',{size:9,col:c.fg3});
  }else{
    s+=txt(xArr,lastBus+22,'Sistema a 3 hilos · sin conductor neutro',{size:9.5,col:c.fg3,italic:true});
  }

  // Cargas conectadas al bus
  r.bkd.forEach((b,k)=>{
    const cx=x0+k*LWc+LWc/2-10,xl=cx-64,xr=cx+64,yb=yT0+triH;
    const isM=b.kind==='motor',isD=b.conn==='delta';
    const hasR=b.src.R>0,hasL=b.src.XL>0,hasC=b.src.XC>0;

    // Empalmes en las barras colectoras
    [[cx,yA,c.A,'A′'],[xr,yB,c.B,'B′'],[xl,yC,c.C,'C′']].forEach(([x,y,col,l])=>{
      s+=dot(x,y,col)+txt(x+6,y-5,l,{size:9,col,weight:600});
    });

    if(isM){
      // Motor industrial trifásico realista con carcasa aletada, caja de bornes, patas y eje
      const my=yT0+58,R=32;
      // Bajadas a la caja de bornes superior del motor
      const bxY=my-R-12;
      s+=line(cx,yA,cx,bxY,c.A,1.8);
      s+=line(xr,yB,xr,bxY-6,c.B,1.8)+line(xr,bxY-6,cx+12,bxY-6,c.B,1.8)+line(cx+12,bxY-6,cx+12,bxY,c.B,1.8);
      s+=line(xl,yC,xl,bxY-12,c.C,1.8)+line(xl,bxY-12,cx-12,bxY-12,c.C,1.8)+line(cx-12,bxY-12,cx-12,bxY,c.C,1.8);
      // Patas de anclaje / bancada
      s+=`<path d="M ${cx-26} ${my+R-4} L ${cx-34} ${my+R+10} L ${cx-12} ${my+R+10} L ${cx-16} ${my+R-1} Z" fill="${c.bd}" stroke="${c.fg2}" stroke-width="1.3"/>`;
      s+=`<path d="M ${cx+26} ${my+R-4} L ${cx+34} ${my+R+10} L ${cx+12} ${my+R+10} L ${cx+16} ${my+R-1} Z" fill="${c.bd}" stroke="${c.fg2}" stroke-width="1.3"/>`;
      s+=line(cx-42,my+R+10,cx+42,my+R+10,c.fg3,2.2);
      // Eje motriz lateral con chavetero
      s+=`<rect x="${cx+R-2}" y="${my-5}" width="18" height="10" rx="1.5" fill="${c.bg}" stroke="${c.fg2}" stroke-width="1.4"/>`;
      s+=`<line x1="${cx+R+3}" y1="${my-2}" x2="${cx+R+13}" y2="${my-2}" stroke="${c.fg3}" stroke-width="1.2"/>`;
      // Caja de bornes superior (U1 V1 W1)
      s+=`<rect x="${cx-18}" y="${bxY}" width="36" height="14" rx="2.5" fill="${c.card}" stroke="${c.fg2}" stroke-width="1.4"/>`;
      s+= `<circle cx="${cx-12}" cy="${bxY+6}" r="2.2" fill="${c.C}"/><circle cx="${cx}" cy="${bxY+6}" r="2.2" fill="${c.A}"/><circle cx="${cx+12}" cy="${bxY+6}" r="2.2" fill="${c.B}"/>`;
      // Carcasa estatórica con aletas de refrigeración
      s+=`<circle cx="${cx}" cy="${my}" r="${R}" fill="${c.card}" stroke="${c.ac}" stroke-width="2.2"/>`;
      s+=`<circle cx="${cx}" cy="${my}" r="${R-5}" fill="none" stroke="${c.bd}" stroke-width="1" stroke-dasharray="4,3"/>`;
      [-14,-7,0,7,14].forEach(dy=>{
        const dx=Math.sqrt(Math.max(0,R*R-dy*dy));
        s+=line(cx-dx-4,my+dy,cx-dx+3,my+dy,c.ac,1.5);
        s+=line(cx+dx-3,my+dy,cx+dx+4,my+dy,c.ac,1.5);
      });
      s+=txt(cx,my-3,'M',{size:15,col:c.fg,anchor:'middle',weight:700,font:K.sans});
      s+=txt(cx,my+11,`3~ ${isD?'Δ':'Y'}`,{size:9.5,col:c.ac,anchor:'middle',weight:600});
      s+=txt(cx,yb+22,`${b.tag}: Motor ${fS(b.src.Pout,3)} ${b.src.Punit} (${isD?'Δ':'Y'})`,{size:10,col:c.fg,anchor:'middle',weight:600});
      s+=txt(cx,yb+36,`cosφ=${fN(b.src.cosphi,2)} · η=${fN(b.src.eta,0)}% · I_L=${fS(b.Ik,3)}A`,{size:9,col:c.fg2,anchor:'middle'});
      return;
    }

    // Bajadas verticales hacia la carga RLC
    s+=line(cx,yA,cx,yT0,c.A,1.7)+line(xr,yB,xr,yb,c.B,1.7)+line(xl,yC,xl,yb,c.C,1.7);
    if(isD){
      // Triángulo Δ con elementos R, L, C reales dibujados en cada lado
      [[cx,yT0,xl,yb],[cx,yT0,xr,yb],[xl,yb,xr,yb]].forEach(([x1,y1,x2,y2])=>{
        s+=line(x1,y1,x2,y2,c.fg2,1.6);
        s+=rlcBranch(x1,y1,x2,y2,{hasR,hasL,hasC,len:54});
      });
    }else{
      // Estrella Y con punto neutro N' y elementos R, L, C en cada brazo
      const ny=yT0+triH*0.64;
      [[cx,yT0],[xl,yb],[xr,yb]].forEach(([x,y])=>{
        s+=line(x,y,cx,ny,c.fg2,1.6);
        s+=rlcBranch(x,y,cx,ny,{hasR,hasL,hasC,len:42});
      });
      s+=dot(cx,ny,c.N)+txt(cx-8,ny-5,"N′",{size:9.5,col:c.fg2,anchor:'end',weight:600});
      if(four){
        const xn=cx+88;
        s+=line(cx,ny,xn,ny,c.N,1.4,'4,2')+line(xn,ny,xn,yN,c.N,1.4,'4,2')+dot(xn,yN,c.N)+txt(xn+5,yN-5,'N',{size:9,col:c.N,weight:600});
      }else s+=txt(cx+8,ny+14,'N′ flotante',{size:8.5,col:c.fg3});
    }
    s+=vtx(cx,yT0)+vtx(xl,yb)+vtx(xr,yb);
    s+=txt(cx+8,yT0-3,'A′',{size:9,col:c.A,weight:600})+txt(xl-8,yb+4,'C′',{size:9,col:c.C,anchor:'end',weight:600})+txt(xr+8,yb+4,'B′',{size:9,col:c.B,weight:600});
    const Zo=isD?cscale(b.ZY,3):b.ZY;
    s+=txt(cx,yb+22,`${b.tag} (${isD?'Δ':'Y'}): Z = ${rstr(Zo,2)} Ω`,{size:10,col:c.fg,anchor:'middle',weight:600});
    s+=txt(cx,yb+36,`|Z|=${fS(cabs(Zo),3)}Ω · I_L=${fS(b.Ik,3)}A`,{size:9,col:c.fg2,anchor:'middle'});
  });

  // Si hay compensación de factor de potencia activa, dibujar el banco trifásico Q_C / Q_L
  if(hasComp){
    const k=r.bkd.length,cx=x0+k*LWc+LWc/2-10,xl=cx-54,xr=cx+54,yb=yT0+triH;
    const isCap=r.compType==='C';
    [[cx,yA,c.A],[xr,yB,c.B],[xl,yC,c.C]].forEach(([x,y,col])=>{s+=dot(x,y,col);});
    s+=line(cx,yA,cx,yT0,c.A,1.5,'4,2')+line(xr,yB,xr,yb,c.B,1.5,'4,2')+line(xl,yC,xl,yb,c.C,1.5,'4,2');
    [[cx,yT0,xl,yb],[cx,yT0,xr,yb],[xl,yb,xr,yb]].forEach(([x1,y1,x2,y2])=>{
      s+=line(x1,y1,x2,y2,c.gn,1.6);
      s+=rlcBranch(x1,y1,x2,y2,{hasR:false,hasL:!isCap,hasC:isCap,col:c.gn,len:38});
    });
    s+=vtx(cx,yT0)+vtx(xl,yb)+vtx(xr,yb);
    s+=txt(cx,yb+22,isCap?`Banco Q_C (Δ): ${fN(r.CD*1e6,2)} μF/fase`:`Banco Q_L (Δ): ${fN(r.LD*1e3,2)} mH/fase`,{size:10,col:c.gn,anchor:'middle',weight:700});
    s+=txt(cx,yb+36,`Q = ${fPow(isCap?r.QC:r.QLr,'var')} → fp = ${fN(r.fpTgt,3)}`,{size:9,col:c.fg2,anchor:'middle'});
  }

  return s+'</svg>';
}
