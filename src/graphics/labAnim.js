// Animación del laboratorio: posición de las partículas y giro de los motores como función pura de ωt.
// No tiene bucle propio: la llama el estado ωt compartido (graphics/wt.js) en cada cambio.
import { d2r } from '../engine/math.js';
import { $ } from '../core/dom.js';
import { waveHoverDeg } from '../core/state.js';

// La velocidad de cada partícula es proporcional a i_k(ωt) = √2·I·sen(ωt + θ): su posición es la
// integral, −cos(ωt + θ), así que va y viene con un recorrido proporcional a la corriente eficaz.
export function updateLabAnim(r){
  const box=$('lab-scene');
  if(!box||!box.querySelectorAll)return;
  const wt=waveHoverDeg??0;
  box.querySelectorAll('.lab-flow').forEach(el=>{
    const amp=+el.getAttribute('data-amp'),ang=+el.getAttribute('data-ang');
    el.style.strokeDashoffset=(amp*Math.cos(d2r(wt+ang))).toFixed(2);
  });
  // Los motores giran con el campo: el sentido se invierte con la secuencia ACB
  box.querySelectorAll('.lab-rotor').forEach(el=>{
    el.setAttribute('transform',`rotate(${(-r.dir*wt).toFixed(1)} ${el.getAttribute('data-cx')} ${el.getAttribute('data-cy')})`);
  });
}
