// Diagnóstico de cumplimiento normativo
import { fN, fpTag, fS, sgn } from './format.js';

export function normItems(r){
  const items=[],okFp=x=>x>=r.lim.fpMin-1e-9;
  let sub=`fp en la fuente (punto de medición) = ${fN(r.fp,4)} ${fpTag(r.φ)} · umbral ${fN(r.lim.fpMin,2)}`;
  if(r.comp)sub+=` · tras compensar: ${fN(r.comp.fpS,4)} ${fpTag(r.comp.φS)} ${okFp(r.comp.fpS)?'✓':'✗'}`;
  items.push({s:okFp(r.fp)?'ok':(r.comp&&okFp(r.comp.fpS)?'warn':'bad'),
    t:okFp(r.fp)?'Factor de potencia: cumple':(r.comp&&okFp(r.comp.fpS)?'Factor de potencia: cumple solo con la compensación propuesta':'Factor de potencia: bajo el umbral de penalización'),
    sub,src:'Pliego Tarifario SPEE 2026 (Res. ARCONEL-029/25). Verifica el umbral vigente al usar la herramienta.'});
  if(r.zLineEnabled){
    const ok=x=>Math.abs(x)<=r.lim.dUmax+1e-9;
    let s=`U_carga = ${fS(r.UloadL)} V → ${sgn(r.dUpct)} % respecto a U_n = ${fS(r.UL)} V · límite ±${fN(r.lim.dUmax,1)} % (${r.level.name})`;
    if(r.comp)s+=` · tras compensar: ${sgn(r.comp.dUpct)} % ${ok(r.comp.dUpct)?'✓':'✗'}`;
    items.push({s:ok(r.dUpct)?'ok':'bad',t:ok(r.dUpct)?'Variación de tensión en la carga: dentro del límite':'Variación de tensión en la carga: fuera del límite',
      sub:s,src:'Regulación ARCERNNR-002/20, Tabla 1 (BV 8 %, MV 6 %, AV 5 %). El límite es editable.'});
  }else{
    items.push({s:'na',t:'Variación de tensión: no aplica',sub:'Sin Z_L la carga recibe la tensión de la fuente (0 %).',src:''});
  }
  r.bkd.filter(b=>b.kind==='motor').forEach(b=>{
    const a=Math.abs(b.dUmot);
    items.push({s:a<=5?'ok':a<=10?'warn':'bad',t:`${b.tag}: tensión en bornes frente a la placa`,
      sub:`${fS(r.UloadL)} V frente a U_n = ${fS(b.src.Unom)} V → ${sgn(b.dUmot)} %`,
      src:'Referencia orientativa de diseño: ±10 % de U_n en motores. Fuera de ese rango el modelo de potencia constante deja de ser fiable.'});
  });
  return items;
}
