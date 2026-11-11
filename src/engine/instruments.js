// Lecturas de los instrumentos del banco de laboratorio (puro, sin DOM)
import { Cx, cpol, csub, cmul, cdiv, cconj, cabs, cang } from './complex.js';
import { SQ3 } from './math.js';

// computeInstruments(r) → lecturas con el banco de compensación desconectado.
// computeInstruments(r,{compensado:true}) → lecturas con el banco conectado (usa r.comp, sin recalcular
// el circuito); devuelve null si no hay compensación calculada.
//
// Vatímetros (método de Aron) en la fuente: bobinas de corriente en las líneas A y B,
// bobinas de tensión entre A–C y B–C:  W1 = Re(Ū_AC·Ī_A*),  W2 = Re(Ū_BC·Ī_B*).
export function computeInstruments(r,{compensado=false}={}){
  const c=compensado?r.comp:null;
  if(compensado&&!c)return null;

  // Fasores de la fase A en bornes de la fuente. Con el banco conectado, Ū_AN sale de S̄ = 3·Ū_AN·Ī_A*.
  const IA=c?cpol(c.IL,c.IAang):r.IAc;
  const UA=c?cdiv(Cx(c.Ptot/3,c.Qtot/3),cconj(IA)):cpol(r.Uf_src,r.UA);
  const giro=g=>z=>cmul(z,cpol(1,g)),aB=giro(r.dir*(-120)),aC=giro(r.dir*120);
  const U=[UA,aB(UA),aC(UA)],I=[IA,aB(IA),aC(IA)];

  const W1=cmul(csub(U[0],U[2]),cconj(I[0])).re;
  const W2=cmul(csub(U[1],U[2]),cconj(I[1])).re;
  // P = W1 + W2 siempre; Q = √3·(W1 − W2) en secuencia ABC y con el signo cambiado en ACB
  const P=W1+W2,Q=SQ3*r.dir*(W1-W2),φ=Math.atan2(Q,P);

  return{
    compensado:!!c,
    vFuente:{UL:c?c.UL_src:r.UL_src,Uf:cabs(UA)},
    vReceptor:{UL:c?c.UloadL:r.UloadL,Uf:c?c.UloadF:r.UloadF},
    amp:{IL:cabs(IA),ang:I.map(cang)},
    W1,W2,P,Q,tanφ:Q/P,
    fp:P/Math.hypot(P,Q),φ,
    fpCarga:c?c.fpL:r.fpLoad,φCarga:c?c.φL:r.φLoad,
    Pline:c?c.Pline:r.Pline,dUpct:c?c.dUpct:r.dUpct,
  };
}
