// Desarrollo paso a paso
import { Cx, cscale, cconj, cang, cadd, cpol } from '../engine/complex.js';
import { fN, fPow, rstr, cstr, pStr, fpTag, fA, sgn } from '../engine/format.js';
import { $ } from './dom.js';

// ── Paso a paso ───────────────────────────────────────────────────────
export function renderSteps(r){
  const sp=m=>`<span class="hl">${m}</span>`,spam=m=>`<span class="hlam">${m}</span>`,su=m=>`<span class="sub">${m}</span>`;
  const steps=[],nL=r.bkd.length;
  steps.push({t:'Sistema trifásico',b:
    `U_L = ${sp(fN(r.UL,3)+' V')}  |  U_f = U_L/√3 = ${sp(fN(r.Uf,4)+' V')}\n`+
    `f = ${fN(r.f,0)} Hz → ω = 2πf = ${fN(r.ω,3)} rad/s  |  Secuencia: ${r.seq==='abc'?'ABC directa':'ACB inversa'}\n`+
    (r.wires===4?'Sistema de 4 hilos: el neutro N está distribuido hasta las cargas.'
      :`Sistema de 3 hilos: ${su("no hay conductor de neutro; se usa un neutro ficticio. En equilibrio V_N'N = 0, por eso el monofásico equivalente sigue siendo válido.")}`)});

  const lines=r.bkd.map(b=>{
    const cn=b.conn==='star'?'Y':'Δ',l=b.src;
    if(b.kind==='motor'){const m=b.m;
      return `${b.tag} (motor, devanados en ${cn}): P_útil = ${fPow(m.Pout,'W')}, η = ${fN(l.eta,1)} %\n`+
        `  P_abs = P_útil/η = ${fPow(m.Pout,'W')}/${fN(l.eta/100,3)} = ${sp(fPow(m.Pin,'W'))}\n`+
        `  cosφ = ${fN(l.cosphi,3)} → Q = P_abs·tanφ = ${sp(fPow(m.Q,'var'))}  |  S = ${fPow(m.S,'VA')}  ${su('(potencia constante)')}`;}
    const Zo=Cx(l.R,l.XL-l.XC);
    let t=`${b.tag} (${cn}): Z = ${rstr(Zo)} Ω = ${sp(cstr(Zo)+' Ω')}`;
    if(b.conn==='delta')t+=`\n  ${su('→ Z_Y = Z_Δ/3 = '+cstr(b.ZY)+' Ω  (equivalente estrella para el monofásico)')}`;
    return t;});
  steps.push({t:'Cargas'+(r.bkd.some(b=>b.conn==='delta'&&b.kind!=='motor')?' y conversión Δ→Y':''),b:lines.join('\n')});

  if(r.hasMotor){
    let t=r.zLineEnabled
      ?`Con Z_L, la tensión en bornes depende de la corriente de los motores → se itera:\n`+
       `  Ū_carga = Ū_AN·Z_p/(Z_L+Z_p) − (Z_L∥Z_p)·Σ(S_f,M/Ū_carga)*  ${su('(Z_p: paralelo de las cargas de impedancia)')}\n`+
       `  Converge en ${r.motorIter} iteraciones → Ū_carga = ${sp(pStr(r.UloadF,r.UloadAng)+' V')}\n`
      :`Sin Z_L los motores reciben Ū_AN = ${sp(pStr(r.Uf,0)+' V')} y absorben su potencia de placa.\n`;
    t+=r.bkd.filter(b=>b.kind==='motor').map(b=>{
      const Sf=cscale(Cx(b.m.Pin,b.m.Q),1/3);
      return `${b.tag}: S_f = (P+jQ)/3 = ${rstr(Sf,1)} VA → Z_M,Y = U_f²/S*_f = ${fN(r.UloadF,3)}² / (${rstr(cconj(Sf),1)}) = ${sp(cstr(b.ZY)+' Ω')}`;
    }).join('\n');
    t+=`\n${su('Esta impedancia equivalente solo es válida en este punto de operación.')}`;
    steps.push({t:'Punto de operación de los motores',b:t});
  }

  if(nL>1){
    let t=r.bkd.map(b=>`Y_${b.tag} = 1/Z_${b.tag},Y = ${rstr(b.Y,5)} S`).join('\n');
    t+=`\nY_eq = Σ Y_k = ${rstr(r.Yeq,5)} S\nZ_eq = 1/Y_eq = ${rstr(r.ZeqC,4)} Ω = ${sp(cstr(r.ZeqC,4)+' Ω')}`;
    steps.push({t:'Paralelo de admitancias → Z_eq',b:t});
  }

  const Zt=r.ZtotC;
  let mono='';
  if(r.recMode){
    // Modo receptor: Ī_A = Ū_A′N · Y_eq (cálculo directo)
    mono+=`[MODO RECEPTOR] Dato: Ū_A′N = ${sp(pStr(r.UloadF,r.UloadAng)+' V')}  ${su('(tensión en bornes de carga)')}\n`;
    mono+=`Y_eq = Σ Y_k = ${rstr(r.Yeq,5)} S\n`;
    mono+=`Ī_A = Ū_A′N · Y_eq = (${fN(r.UloadF,3)} ∠0°) · (${cstr(r.Yeq,4)})\n`+
      `    = ${sp(pStr(r.IL,r.IA)+' A')}\n`+
      `fp${r.zLineEnabled?' (carga)':''} = ${sp(fN(r.fp,4)+' '+fpTag(r.φ))}  ${su(r.φd>=0?'(I retrasada respecto a U)':'(I adelantada respecto a U)')}`;
  } else {
    if(r.zLineEnabled)mono+=`Z_total = Z_L + Z_eq = (${rstr(r.ZLc)}) + (${rstr(r.ZeqC)}) = ${rstr(Zt)} Ω = ${spam(cstr(Zt,4)+' Ω')}\n`;
    const zn=r.zLineEnabled?'Z_total':'Z_eq';
    mono+=`Ī_A = Ū_AN / ${zn} = (${fN(r.Uf,3)} ∠0°) / (${cstr(Zt,4)})\n`+
      `    = (${fN(r.Uf,3)} / ${fN(r.ZtotM,4)}) ∠(0° − (${fA(r.φd)})) = ${sp(pStr(r.IL,r.IA)+' A')}\n`+
      `fp${r.zLineEnabled?' (entrada)':''} = cos(${fA(r.φd)}) = ${sp(fN(r.fp,4)+' '+fpTag(r.φ))}  ${su(r.φd>=0?'(I retrasada respecto a U)':'(I adelantada respecto a U)')}`;
  }
  steps.push({t:'Circuito monofásico equivalente',b:mono});

  if(r.zLineEnabled){
    const φZL=cang(r.ZLc);
    if(r.recMode){
      steps.push({t:'Tensión de fuente: cálculo hacia atrás',am:true,b:
        `[MODO RECEPTOR] Ū_A′N = ${sp(pStr(r.UloadF,r.UloadAng)+' V')} (DATO)\n`+
        `ΔŪ = Ī_A·Z_L = (${pStr(r.IL,r.IA)})·(${cstr(r.ZLc)}) = (${fN(r.IL,3)}·${fN(r.ZLM,3)}) ∠(${fA(r.IA)} + ${fA(φZL)}) = ${spam(cstr(r.dropC)+' V')}\n`+
        `Ū_AN = Ū_A′N + ΔŪ = ${sp(pStr(r.Uf_src,r.UA)+' V')}  ${su('(tensión de fuente calculada)')}\n`+
        `U_L,fuente = √3·|Ū_AN| = √3·${fN(r.Uf_src,4)} = ${sp(fN(r.UL_src,3)+' V')}\n`+
        `δ = ∠Ū_AN = ${sp(fA(r.delta)+'  (ángulo de la fuente respecto al datum del receptor)')}`});
    } else {
      steps.push({t:'Tensión en la carga y caída en la línea',am:true,b:
        `ΔŪ = Ī_A·Z_L = (${pStr(r.IL,r.IA)})·(${cstr(r.ZLc)}) = (${fN(r.IL,3)}·${fN(r.ZLM,3)}) ∠(${fA(r.IA)} + ${fA(φZL)}) = ${spam(cstr(r.dropC)+' V')}\n`+
        `Ū_carga = Ū_AN − ΔŪ = ${sp(pStr(r.UloadF,r.UloadAng)+' V')}  →  U_carga,L = √3·U_carga = ${sp(fN(r.UloadL,3)+' V')}\n`+
        `ΔU = (U_carga,L − U_L)/U_L = (${fN(r.UloadL,2)} − ${fN(r.UL,2)})/${fN(r.UL,2)} = ${spam(sgn(r.dUpct)+' %')}  ${su('(escalar: es la que evalúa la normativa)')}\n`+
        `${su('|ΔŪ| = '+fN(r.UlineDropF,3)+' V ≠ |U_AN| − |U_carga| = '+fN(r.Uf-r.UloadF,3)+' V, porque ΔŪ no está en fase con Ū_AN')}\n`+
        `${su('fp de la carga = cos(∠Z_eq) = '+fN(r.fpLoad,4)+' '+fpTag(r.φLoad))}`});
    }
  }

  if(nL>1||r.bkd.some(b=>b.conn==='delta')||r.hasMotor){
    const uL=r.zLineEnabled?'Ū_carga':'Ū_AN';
    let t=`${uL} = ${sp(pStr(r.UloadF,r.UloadAng)+' V')}  ${su('(tensión fase-neutro que ve cada carga)')}\n`;
    t+=r.bkd.map(b=>{
      let s=`Ī_A,${b.tag} = ${uL}/Z_${b.tag},Y = (${pStr(r.UloadF,r.UloadAng)}) / (${cstr(b.ZY)}) = (${fN(r.UloadF,3)}/${fN(b.ZyMag,3)}) ∠(${fA(r.UloadAng)} − (${fA(b.ZyPhi)})) = ${sp(pStr(b.Ik,b.IkAng)+' A')}`;
      s+=b.conn==='delta'
        ?`\n  ${su(b.tag+' (Δ): I_f = I_L/√3 = '+fN(b.Ik,4)+'/√3 = ')}${spam(pStr(b.IkPhase,b.IkPhaseAng)+' A')} ${su('(rama AB, adelanta 30° a Ī_A en ABC)')}`
        :`\n  ${su(b.tag+' (Y): I_f = I_L = '+fN(b.Ik,4)+' A')}`;
      return s;}).join('\n');
    if(nL>1){
      const sum=cadd(...r.bkd.map(b=>cpol(b.Ik,b.IkAng)));
      t+=`\nΣ Ī_A,k = ${sp(cstr(sum)+' A')}  ${su('= Ī_A total ✓ (suma fasorial, LKC)')}`;
    }
    steps.push({t:'Corrientes por carga',b:t});
  }

  if(r.recMode&&r.zLineEnabled){
    steps.push({t:'Simetría: desfase 120°',b:
      `[Receptor] Ū_A′N = ${sp(pStr(r.UloadF,r.UloadAng))} V (DATO)  →  Ī_A = ${sp(pStr(r.IL,r.IA))}\n`+
      `           Ū_B′N = ${pStr(r.UloadF,r.UloadAng+r.dir*(-120))} V  →  Ī_B = ${sp(pStr(r.IL,r.IB))}\n`+
      `           Ū_C′N = ${pStr(r.UloadF,r.UloadAng+r.dir*120)} V  →  Ī_C = ${sp(pStr(r.IL,r.IC))}\n`+
      `[Fuente]  Ū_AN = ${sp(pStr(r.Uf_src,r.UA))} V  Ū_BN = ${pStr(r.Uf_src,r.UB)} V  Ū_CN = ${pStr(r.Uf_src,r.UC)} V\n`+
      su(r.wires===4?'I_N = Ī_A + Ī_B + Ī_C = 0 → el neutro no transporta corriente en equilibrio'
        :'Ī_A + Ī_B + Ī_C = 0 por LKC (no existe conductor de neutro)')});
  } else {
    steps.push({t:'Simetría: desfase 120°',b:
      `Ū_AN = ${pStr(r.Uf,r.UA)}  →  Ī_A = ${sp(pStr(r.IL,r.IA))}\n`+
      `Ū_BN = ${pStr(r.Uf,r.UB)}  →  Ī_B = ${sp(pStr(r.IL,r.IB))}\n`+
      `Ū_CN = ${pStr(r.Uf,r.UC)}  →  Ī_C = ${sp(pStr(r.IL,r.IC))}\n`+
      su(r.wires===4?'I_N = Ī_A + Ī_B + Ī_C = 0 → el neutro no transporta corriente en equilibrio'
        :'Ī_A + Ī_B + Ī_C = 0 por LKC (no existe conductor de neutro)')});
  }

  steps.push({t:'Potencias totales',b:r.zLineEnabled
    ?`P_carga = ${spam(fPow(r.Pload,'W'))}  |  P_línea = 3·I²·R_L = ${spam(fPow(r.Pline,'W'))}\n`+
      `P_total = P_carga + P_línea = ${sp(fPow(r.P3,'W'))}\n`+
      `Q = ${sp(fPow(r.Q3,'var'))}  |  S = √3·U_L·I_L = ${sp(fPow(r.S3,'VA'))}\n`+
      `Rendimiento η = P_carga/P_total = ${sp(fN(r.Pload/r.P3*100,2)+' %')}`
    :`P = √3·U_L·I_L·cosφ = √3·${fN(r.UL,2)}·${fN(r.IL,4)}·${fN(r.fp,4)} = ${sp(fPow(r.P3,'W'))}\n`+
      `Q = √3·U_L·I_L·senφ = ${sp(fPow(r.Q3,'var'))}  |  S = √3·U_L·I_L = ${sp(fPow(r.S3,'VA'))}`});
  $('steps-container').innerHTML=steps.map((s,i)=>`
    <div class="step">
      <div class="step-hdr"><span class="step-n${s.am?' am':''}">${s.am?'⚡ ':''}Paso ${i+1}</span><span class="step-title">${s.t}</span></div>
      <div class="step-body">${s.b.replace(/\n/g,'<br>')}</div>
    </div>`).join('');
}
