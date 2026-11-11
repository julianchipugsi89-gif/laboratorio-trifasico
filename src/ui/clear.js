// Limpiar todo
import { stopWtAnim } from '../graphics/wt.js';
import { hideAlert } from './alerts.js';
import { $ } from './dom.js';
import { setVT, setVRef, setZL, setWires, onSourceChange } from './inputs.js';
import { addLoad } from './loads.js';
import { setWaveHoverDeg, zLineEnabled, resetLoads, setLastResult } from './state.js';

export function clearAll(){
  stopWtAnim();setWaveHoverDeg(null);
  $('inp-v').value='';$('inp-f').value=60;$('inp-seq').value='abc';
  $('inp-fptgt').value='';$('inp-fpmin').value=0.94;$('inp-dumax').value='';
  setVT('line');
  setVRef('source');
  if(zLineEnabled)setZL(false);
  $('inp-rl').value=0;$('inp-xl').value=0;
  resetLoads();$('loads-list').innerHTML='';
  addLoad({kind:'imp',R:0,XL:0,XC:0,conn:'star'});
  setWires('auto');
  $('results-section').style.display='none';$('bot-section').style.display='none';
  $('empty-state').style.display='block';$('btn-export').style.display='none';
  setLastResult(null);hideAlert();onSourceChange();
}
