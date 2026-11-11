// Ejercicios prácticos reales
import { $ } from './dom.js';
import { setVRef, setVT, setZL, updateZLHint, setWires, onSourceChange } from './inputs.js';
import { addLoad } from './loads.js';
import { solve } from './solve.js';
import { resetLoads } from './state.js';

// Selector de ejercicios prácticos reales
export function loadExercise(n){
  resetLoads();$('loads-list').innerHTML='';
  setVRef('source');
  if(n===1){
    // Ej. 1: Taller industrial mixto Y + Δ con impedancia de línea y compensación a 0.95
    setVT('line');$('inp-v').value=220;$('inp-f').value=60;$('inp-seq').value='abc';
    setZL(true);$('inp-rl').value=0.12;$('inp-xl').value=0.16;updateZLHint();
    $('inp-fptgt').value=0.95;setWires('auto');
    addLoad({kind:'imp',conn:'star',R:12,XL:9,XC:0});
    addLoad({kind:'imp',conn:'delta',R:36,XL:27,XC:0});
  }else if(n===2){
    // Ej. 2: Planta industrial 440 V con 2 motores de inducción + banco calefactor en Δ
    setVT('line');$('inp-v').value=440;$('inp-f').value=60;$('inp-seq').value='abc';
    setZL(true);$('inp-rl').value=0.08;$('inp-xl').value=0.15;updateZLHint();
    $('inp-fptgt').value=0.96;setWires('3');
    addLoad({kind:'motor',conn:'delta',Pout:15,Punit:'HP',Unom:440,cosphi:0.84,eta:89.5});
    addLoad({kind:'motor',conn:'star',Pout:7.5,Punit:'kW',Unom:440,cosphi:0.82,eta:87});
    addLoad({kind:'imp',conn:'delta',R:72,XL:0,XC:0});
  }else if(n===3){
    // Ej. 3: Red de distribución 400 V / 50 Hz estilo Fraile Mora
    setVT('line');$('inp-v').value=400;$('inp-f').value=50;$('inp-seq').value='abc';
    setZL(false);$('inp-fptgt').value=0.95;setWires('4');
    addLoad({kind:'imp',conn:'star',R:16,XL:12,XC:0});
    addLoad({kind:'imp',conn:'delta',R:45,XL:60,XC:0});
    addLoad({kind:'motor',conn:'delta',Pout:10,Punit:'kW',Unom:400,cosphi:0.85,eta:90});
  }else if(n===4){
    // Ej. 4: Carga RLC con predominio capacitivo y compensación mediante reactor inductivo
    setVT('line');$('inp-v').value=220;$('inp-f').value=60;$('inp-seq').value='abc';
    setZL(false);$('inp-fptgt').value=0.96;setWires('auto');
    addLoad({kind:'imp',conn:'star',R:15,XL:8,XC:28});
    addLoad({kind:'imp',conn:'delta',R:45,XL:12,XC:48});
  }
  onSourceChange();
  solve();
}
