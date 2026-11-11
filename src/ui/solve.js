// Resolver: lee entradas, llama al motor y pinta
import { computeCircuit } from '../engine/circuit.js';
import { bad } from '../engine/math.js';
import { hideAlert, showAlert } from './alerts.js';
import { $ } from '../core/dom.js';
import { currentUL } from './inputs.js';
import { motorError, loadTag } from './loads.js';
import { renderResults } from './results.js';
import { loads, voltageType, zLineEnabled, vRef, wiresSel, setLastResult } from '../core/state.js';

export function solve(){
  hideAlert();
  const UL=currentUL(),f=parseFloat($('inp-f').value);
  if(bad(UL))return showAlert('Tensión inválida (> 0 V).');
  if(!f||f<=0)return showAlert('Frecuencia inválida (> 0 Hz).');
  for(const [k,l] of loads.entries()){
    if(l.kind==='motor'){const e=motorError(l);if(e)return showAlert(`${loadTag(l,k)}: ${e}.`);}
  }
  const inp={UL,f,seq:$('inp-seq').value,voltageType,zLineEnabled,vRef,
    ZL:{R:Math.max(0,parseFloat($('inp-rl').value)||0),X:Math.max(0,parseFloat($('inp-xl').value)||0)},
    loads:loads.map(l=>({...l})),fpTgt:parseFloat($('inp-fptgt').value),wiresSel,
    lim:{fpMin:parseFloat($('inp-fpmin').value),dUmax:parseFloat($('inp-dumax').value)}};
  const r=computeCircuit(inp);
  if(r.error)return showAlert(r.error);
  setLastResult(r);
  renderResults(r);
}
