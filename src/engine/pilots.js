// Pilotos de alarma del laboratorio (puro, sin DOM)
import { fN, fS, fpTag, sgn } from './format.js';
import { normItems } from './norms.js';

// computePilots(r) → estado sin compensar: los mismos puntos y estados que normItems(r).
// computePilots(r,{compensado:true}) → estado con el banco conectado, evaluado solo con r.comp
// y los mismos umbrales (r.lim); devuelve null si no hay compensación calculada.
// normItems(r) no cambia: sigue siendo lo que muestran el diagnóstico normativo y el informe.
export function computePilots(r,{compensado=false}={}){
  if(!compensado)return normItems(r).map(({s,t,sub})=>({s,t,sub}));
  const c=r.comp;
  if(!c)return null;
  const out=[];

  const okFp=c.fpS>=r.lim.fpMin-1e-9;
  out.push({s:okFp?'ok':'bad',
    t:okFp?'Factor de potencia: cumple con el banco conectado':'Factor de potencia: bajo el umbral incluso con el banco conectado',
    sub:`fp en la fuente = ${fN(c.fpS,4)} ${fpTag(c.φS)} · umbral ${fN(r.lim.fpMin,2)}`});

  if(r.zLineEnabled){
    const ok=Math.abs(c.dUpct)<=r.lim.dUmax+1e-9,est=ok?'dentro del límite':'fuera del límite';
    out.push(r.recMode
      ?{s:ok?'ok':'bad',t:`Caída de tensión en la línea (criterio de diseño): ${est}`,
        sub:`U_L,fuente necesaria = ${fS(c.UL_src)} V → ${sgn(c.dUpct)} % · límite ±${fN(r.lim.dUmax,1)} %`}
      :{s:ok?'ok':'bad',t:`Variación de tensión en la carga: ${est}`,
        sub:`U_carga = ${fS(c.UloadL)} V → ${sgn(c.dUpct)} % · límite ±${fN(r.lim.dUmax,1)} %`});
  }else{
    out.push({s:'na',t:'Variación de tensión: no aplica',sub:'Sin Z_L la carga recibe la tensión de la fuente (0 %).'});
  }

  r.bkd.filter(b=>b.kind==='motor').forEach(b=>{
    const d=(c.UloadL-b.src.Unom)/b.src.Unom*100,a=Math.abs(d);
    out.push({s:a<=5?'ok':a<=10?'warn':'bad',t:`${b.tag}: tensión en bornes frente a la placa`,
      sub:`${fS(c.UloadL)} V frente a U_n = ${fS(b.src.Unom)} V → ${sgn(d)} %`});
  });
  return out;
}
