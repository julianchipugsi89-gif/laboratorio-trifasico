// Esquemas eléctricos
import { genCircuitSVG } from './circuitSvg.js';
import { genEquivSVG } from './equivSvg.js';
import { $ } from '../ui/dom.js';

// ── Kit gráfico de esquemas de ingeniería realistas ────────────────────
export function renderDiagrams(r){
  $('circuit-diagram').innerHTML=genCircuitSVG(r);
  $('equiv-diagram').innerHTML=genEquivSVG(r);
}
