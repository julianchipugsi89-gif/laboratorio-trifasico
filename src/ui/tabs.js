// Pestañas de resultados
import { renderDiagrams } from '../graphics/diagrams.js';
import { drawPhasors } from '../graphics/phasors.js';
import { renderTriangle } from '../graphics/triangle.js';
import { drawWaveforms } from '../graphics/waveforms.js';
import { stopWtAnim, renderWtReadout } from '../graphics/wt.js';
import { $ } from './dom.js';
import { lastResult } from './state.js';

export function showTab(id,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');$('tab-'+id).classList.add('active');
  if(id!=='phasor')stopWtAnim();
  if(lastResult){
    if(id==='phasor'){drawPhasors(lastResult);drawWaveforms(lastResult);renderWtReadout(lastResult);}
    if(id==='diagram')renderDiagrams(lastResult);
    if(id==='table')renderTriangle(lastResult);
  }
}
