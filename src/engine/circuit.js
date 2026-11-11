// Cálculo puro (sin DOM) — computeCircuit(inp) → resultado
import { Cx, cadd, cdiv, cabs, cmul, cconj, csub, cscale, cang } from './complex.js';
import { HP_W, KVAR_STEPS, voltLevel } from './constants.js';
import { SQ3, π, r2d, bad } from './math.js';

export function motorData(l){
  const Pout=l.Pout*(l.Punit==='HP'?HP_W:1000);
  const Pin=Pout/(l.eta/100);
  const Q=Pin*Math.tan(Math.acos(l.cosphi));
  return{Pout,Pin,Q,S:Math.hypot(Pin,Q),Inom:Pin/(SQ3*l.Unom*l.cosphi)};
}
export function solveNode(Uf,ZL,Zimp,Sph,Yext){
  const Us=Cx(Uf);
  let Yp=Yext;for(const Z of Zimp)Yp=cadd(Yp,cdiv(Cx(1),Z));
  let H,Zth;
  if(cabs(Yp)<1e-15){H=Cx(1);Zth=ZL;}
  else{const Zp=cdiv(Cx(1),Yp),den=cadd(ZL,Zp);H=cdiv(Zp,den);Zth=cdiv(cmul(ZL,Zp),den);}
  const Ipq=U=>Sph.reduce((s,S)=>cadd(s,cconj(cdiv(S,U))),Cx(0));
  let U=cmul(Us,H),it=0,ok=true;
  if(Sph.length&&cabs(ZL)>0){
    ok=false;
    for(it=1;it<=500;it++){
      const Un=csub(cmul(Us,H),cmul(Zth,Ipq(U)));
      if(!isFinite(Un.re)||!isFinite(Un.im)||cabs(Un)<0.05*Uf)break;
      const d=cabs(csub(Un,U));U=Un;
      if(d<1e-11*Uf){ok=true;break;}
    }
  }
  return{U,it,ok};
}
export function nodeCurrent(U,Zimp,Sph,Yext){
  let I=cmul(U,Yext);
  for(const Z of Zimp)I=cadd(I,cdiv(U,Z));
  for(const S of Sph)I=cadd(I,cconj(cdiv(S,U)));
  return I;
}

export function computeCircuit(inp){
  const{UL,f,seq,loads,fpTgt,wiresSel,lim}=inp;
  const vRef=inp.vRef||'source';
  const recMode=vRef==='load'&&!!inp.zLineEnabled; // modo receptor activo solo con Z_L
  const Uf=UL/SQ3,ω=2*π*f,dir=seq==='abc'?1:-1;
  const zLineEnabled=!!inp.zLineEnabled;
  const ZLc=zLineEnabled?Cx(inp.ZL.R,inp.ZL.X):Cx(0);
  const ZL={R:ZLc.re,X:ZLc.im},ZLM=cabs(ZLc);
  const tag=(l,k)=>(l.kind==='motor'?'M':'Z')+(k+1);

  const items=loads.map((l,k)=>{
    const it={...l,k:k+1,tag:tag(l,k)};
    if(l.kind==='motor'){it.m=motorData(l);it.Sph=cscale(Cx(it.m.Pin,it.m.Q),1/3);}
    else{const Z=Cx(l.R,l.XL-l.XC);it.ZY=l.conn==='delta'?cscale(Z,1/3):Z;}
    return it;
  });
  for(const it of items)if(it.kind!=='motor'&&cabs(it.ZY)<1e-9)return{error:`${it.tag}: |Z| = 0 — cortocircuito.`};
  const imp=items.filter(i=>i.kind!=='motor'),mot=items.filter(i=>i.kind==='motor');
  const Zimp=imp.map(i=>i.ZY),Sph=mot.map(i=>i.Sph);

  let UloadC,UloadF,UloadAng,UloadL,motorIter=0,IAc,delta=0,Uf_src=Uf,UL_src=UL;

  if(recMode){
    // === MODO RECEPTOR — cálculo directo hacia atrás ===
    const UprN=Cx(Uf); // Ū_A′N = Uf∠0° (dato en bornes de carga)
    mot.forEach(i=>{i.ZY=cdiv(Cx(Uf*Uf),cconj(i.Sph));}); // Z_M desde U en bornes
    // Ī_A = Σ (Ū_A′N / Z_k,Y)
    IAc=items.reduce((s,i)=>cadd(s,cdiv(UprN,i.ZY)),Cx(0));
    // Ū_AN = Ū_A′N + Ī_A · Z_L
    const UAN_rec=cadd(UprN,cmul(IAc,ZLc));
    delta=cang(UAN_rec);Uf_src=cabs(UAN_rec);UL_src=Uf_src*SQ3;
    UloadC=UprN;UloadF=Uf;UloadAng=0;UloadL=UL;
  } else {
    // === MODO FUENTE ===
    const sol=solveNode(Uf,ZLc,Zimp,Sph,Cx(0));
    if(!sol.ok)return{error:'No converge: la línea no puede alimentar la potencia de los motores (colapso de tensión). Reduce Z_L o la potencia.'};
    motorIter=sol.it;
    UloadC=sol.U;UloadF=cabs(UloadC);UloadAng=cang(UloadC);UloadL=UloadF*SQ3;
    mot.forEach(i=>{i.ZY=cdiv(Cx(UloadF*UloadF),cconj(i.Sph));});
    Uf_src=Uf;UL_src=UL;
  }

  const Yk=items.map(i=>cdiv(Cx(1),i.ZY));
  const Yeq=cadd(...Yk),ZeqC=cdiv(Cx(1),Yeq);
  const Zeq={R:ZeqC.re,X:ZeqC.im},Zm=cabs(ZeqC);
  const ZtotC=cadd(ZLc,ZeqC),Ztot={R:ZtotC.re,X:ZtotC.im},ZtotM=cabs(ZtotC);
  if(ZtotM<1e-9)return{error:'Impedancia total nula — cortocircuito.'};

  if(!recMode) IAc=cdiv(Cx(Uf),ZtotC);
  const IL=cabs(IAc);

  // Potencia compleja desde la fuente (referencia = Ū_AN)
  const UAN_ref=recMode?cadd(UloadC,cmul(IAc,ZLc)):Cx(Uf);
  const S3c=cscale(cmul(UAN_ref,cconj(IAc)),3);
  const P3=S3c.re,Q3=S3c.im,S3=cabs(S3c);
  const φ=Math.atan2(Q3,P3),φd=r2d(φ),fp=P3/S3;
  const UA=delta,UB=delta+dir*(-120),UC=delta+dir*120;
  const IA=cang(IAc),IB=IA+dir*(-120),IC=IA+dir*120;
  const dropC=cmul(IAc,ZLc),UlineDropF=cabs(dropC);
  const dUpct=recMode?(UL-UL_src)/UL_src*100:(UloadL-UL)/UL*100;
  const φLoad=Math.atan2(Zeq.X,Zeq.R),fpLoad=Math.cos(φLoad);

  const Pload=3*IL*IL*Zeq.R,Qload=3*IL*IL*Zeq.X,Pline=3*IL*IL*ZL.R,Qline=3*IL*IL*ZL.X;

  const bkd=items.map((i,idx)=>{
    const Ikc=cdiv(UloadC,i.ZY),Ik=cabs(Ikc),IkAng=cang(Ikc);
    const Sk=cscale(cmul(UloadC,cconj(Ikc)),3),isD=i.conn==='delta';
    const ZoC=isD?cscale(i.ZY,3):i.ZY;
    return{k:i.k,tag:i.tag,kind:i.kind,conn:i.conn,src:loads[idx],ZY:i.ZY,Y:Yk[idx],
      ZyMag:cabs(i.ZY),ZyPhi:cang(i.ZY),ZoMag:cabs(ZoC),ZoPhi:cang(ZoC),
      Ik,IkAng,IkPhase:isD?Ik/SQ3:Ik,IkPhaseAng:isD?IkAng+dir*30:IkAng,
      Pk:Sk.re,Qk:Sk.im,Sk:cabs(Sk),fpk:Sk.re/cabs(Sk),m:i.m||null,
      dUmot:i.kind==='motor'?(UloadL-i.Unom)/i.Unom*100:null};
  });

  let compType=null,QC=NaN,CY=NaN,CD=NaN,QLr=NaN,LY=NaN,LD=NaN,Qneed0=NaN,Qnom=NaN,kvarStep=NaN,UcapF=UloadF,comp=null,compIter=0;
  if(!bad(fpTgt)&&fpTgt>0&&fpTgt<=1&&fpTgt>fpLoad+1e-9&&Pload>0){
    const φ2=Math.sign(φLoad)*Math.acos(fpTgt),t2=Math.tan(φ2);
    Qneed0=Pload*(Math.tan(φLoad)-t2);
    let B=Qneed0/(3*UloadF*UloadF),s2=null;
    if(recMode){
      compIter=1;s2={ok:true,U:UloadC}; // tensión en bornes fija → B directo, sin iteración
    } else {
      for(compIter=1;compIter<=60;compIter++){
        s2=solveNode(Uf,ZLc,Zimp,Sph,Cx(0,B));
        if(!s2.ok)break;
        const U2=cabs(s2.U);let Pl=0,Ql=0;
        Zimp.forEach(Z=>{const S=cmul(s2.U,cconj(cdiv(s2.U,Z)));Pl+=3*S.re;Ql+=3*S.im;});
        Sph.forEach(S=>{Pl+=3*S.re;Ql+=3*S.im;});
        const Bn=(Ql-Pl*t2)/(3*U2*U2),d=Math.abs(Bn-B);B=Bn;
        if(d<=1e-12*Math.abs(B))break;
      }
    }
    if(s2&&s2.ok){
      let U2,I2,UAN2;
      if(recMode){
        U2=UloadC;I2=cadd(IAc,cmul(UloadC,Cx(0,B)));UAN2=cadd(U2,cmul(I2,ZLc));
      } else {
        s2=solveNode(Uf,ZLc,Zimp,Sph,Cx(0,B));
        U2=s2.U;I2=nodeCurrent(U2,Zimp,Sph,Cx(0,B));UAN2=Cx(Uf);
      }
      const U2m=cabs(U2),IL2=cabs(I2),UL_src2=cabs(UAN2)*SQ3;
      const Ssrc=cscale(cmul(UAN2,cconj(I2)),3),Sld=cscale(cmul(U2,cconj(I2)),3);
      comp={IL:IL2,IAang:cang(I2),fpS:Ssrc.re/cabs(Ssrc),φS:Math.atan2(Ssrc.im,Ssrc.re),
        fpL:Sld.re/cabs(Sld),φL:Math.atan2(Sld.im,Sld.re),UloadF:U2m,UloadL:U2m*SQ3,UloadAng:cang(U2),
        Pline:3*IL2*IL2*ZL.R,Ptot:Ssrc.re,Qtot:Ssrc.im,Stot:cabs(Ssrc),
        UL_src:UL_src2,dUpct:recMode?(UL-UL_src2)/UL_src2*100:(U2m*SQ3-UL)/UL*100};
      UcapF=U2m;
      const Qbank=3*U2m*U2m*B;
      if(B>0){
        compType='C';QC=Qbank;CY=B/ω;CD=CY/3;
        Qnom=3*Uf*Uf*B;
        kvarStep=KVAR_STEPS.find(s=>s*1000>=Qnom*(1-1e-9))??NaN;
      }else{compType='L';QLr=-Qbank;LY=-1/(ω*B);LD=3*LY;}
    }
  }

  const wiresAuto=items.some(i=>i.kind!=='motor'&&i.conn==='star')?4:3;
  const wires=wiresSel==='auto'?wiresAuto:+wiresSel;
  const level=voltLevel(UL);
  const L={fpMin:bad(lim?.fpMin)?0.94:lim.fpMin,dUmax:bad(lim?.dUmax)?level.lim:lim.dUmax};

  return{UL,Uf,f,ω,seq,dir,voltageType:inp.voltageType,loads,zLineEnabled,vRef,recMode,
    Zeq,ZeqC,Zm,ZL,ZLc,ZLM,Ztot,ZtotC,ZtotM,Yk,Yeq,
    φ,φd,fp,φLoad,fpLoad,IL,IAc,
    UloadC,UloadF,UloadL,UloadAng,UatLoad:UloadF,UlineDropF,dropC,dUpct,
    UA,UB,UC,IA,IB,IC,P3,Q3,S3,Pload,Qload,Pline,Qline,
    hasMotor:mot.length>0,motorIter,Uf_src,UL_src,delta,
    fpTgt,compType,QC,CY,CD,QLr,LY,LD,Qneed0,Qnom,kvarStep,UcapF,comp,compIter,
    wires,wiresAuto,wiresSel,level,lim:L,bkd};
}
