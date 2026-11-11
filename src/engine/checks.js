// Comprobación de leyes (Boucherot / Kirchhoff)
import { cadd, cmul, cpol, cabs, csub } from './complex.js';
import { fN, fPow, cstr, pStr } from './format.js';
import { SQ3 } from './math.js';

export function computeChecks(r){
  const rel=1e-4,near=(a,b,ref)=>Math.abs(a-b)<=rel*Math.max(Math.abs(ref),1e-9);
  const list=[];
  list.push({ok:near(r.UL_src,r.Uf_src*SQ3,r.UL_src),txt:`U_L = √3·U_f: ${fN(r.UL_src,3)} ≈ ${fN(r.Uf_src*SQ3,3)} V`});
  const Spq=Math.hypot(r.P3,r.Q3);
  list.push({ok:near(r.S3,Spq,r.S3),txt:`S = √(P²+Q²): ${fPow(r.S3,'VA')} ≈ ${fPow(Spq,'VA')}`});
  const Pf=3*r.Uf_src*r.IL*Math.cos(r.φ),Qf=3*r.Uf_src*r.IL*Math.sin(r.φ);
  const Pq=r.bkd.reduce((s,b)=>s+b.Pk,0)+r.Pline,Qq=r.bkd.reduce((s,b)=>s+b.Qk,0)+r.Qline;
  const lin=r.zLineEnabled?' + línea':'';
  list.push({ok:near(Pq,Pf,r.S3),txt:`Boucherot P: ΣP_k${lin} = ${fPow(Pq,'W')} ≈ 3·U_f·I_L·cosφ = ${fPow(Pf,'W')}`});
  list.push({ok:near(Qq,Qf,r.S3),txt:`Boucherot Q: ΣQ_k${lin} = ${fPow(Qq,'var')} ≈ 3·U_f·I_L·senφ = ${fPow(Qf,'var')}`});
  if(r.zLineEnabled){
    const lhs=cadd(cmul(cpol(r.IL,r.IA),r.ZLc),r.UloadC);
    const UAN_exp=cpol(r.Uf_src,r.UA);
    const err=cabs(csub(lhs,UAN_exp));
    list.push({ok:err<=rel*r.Uf_src,txt:`LKT: Ī_A·Z_L + Ū_carga = ${cstr(lhs)} V ≈ Ū_AN = ${pStr(r.Uf_src,r.UA)} V`});
  }
  if(r.bkd.length>1){
    const sum=cadd(...r.bkd.map(b=>cpol(b.Ik,b.IkAng))),err=cabs(csub(sum,cpol(r.IL,r.IA)));
    list.push({ok:err<=rel*r.IL,txt:`LKC: Σ Ī_A,k = ${cstr(sum)} A ≈ Ī_A = ${pStr(r.IL,r.IA)} A`});
  }
  const In=cabs(cadd(cpol(r.IL,r.IA),cpol(r.IL,r.IB),cpol(r.IL,r.IC)));
  const inTxt=In<1e-9*r.IL?'0':In.toExponential(2);
  list.push({ok:In<=rel*r.IL,txt:r.wires===4
    ?`I_N = |Ī_A + Ī_B + Ī_C| = ${inTxt} A ≈ 0 (neutro sin corriente)`
    :`|Ī_A + Ī_B + Ī_C| = ${inTxt} A ≈ 0 (3 hilos: LKC sin neutro)`});
  return list;
}
