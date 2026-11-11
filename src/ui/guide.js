// Desarrollo guiado: recorre los pasos de buildSteps resaltando en la escena lo que se está calculando.
// Depende del laboratorio (ui/lab.js) y no al revés: se engancha a sus repintados.
import { $ } from '../core/dom.js';
import { lastResult } from '../core/state.js';
import { labEstado, fijarLabContactor, onLabPintado, onLabNuevoResultado } from './lab.js';
import { buildSteps } from './steps.js';

export const GUIDE_MS=6000;   // avance automático: un paso por cada ciclo de la animación en cámara lenta
const MOTIVO='Modo guiado: los pasos describen el estado sin compensar, así que el contactor queda desconectado.';

let pasos=[],idx=-1,timer=null,cerradoAntes=false;
const activo=()=>idx>=0;
export const guideEstado=()=>({activo:activo(),idx,pasos,auto:!!timer});

// Resalta los elementos del paso y atenúa el resto. La escena se regenera en cada repintado del
// laboratorio, así que esto se vuelve a aplicar desde el enganche onLabPintado.
function resaltar(){
  const svg=$('lab-scene').querySelector('.lab-svg');
  if(!svg)return;
  svg.querySelectorAll('.lab-hl').forEach(e=>e.classList.remove('lab-hl'));
  svg.classList.toggle('lab-guided',activo());
  if(!activo())return;
  pasos[idx].els.forEach(id=>{const e=document.getElementById(id);if(e)e.classList.add('lab-hl');});
  // En pantallas estrechas la escena se desplaza: se lleva a la vista el elemento principal del paso
  const box=$('lab-scene'),primero=document.getElementById(pasos[idx].els[0]);   // el primero de la lista es el principal
  if(primero&&box.scrollWidth>box.clientWidth+1){
    const rb=box.getBoundingClientRect(),re=primero.getBoundingClientRect();
    if(re.left<rb.left||re.right>rb.right)box.scrollLeft+=re.left-rb.left-16;
  }
}

function pintarPanel(){
  const on=activo();
  $('lab-guide').style.display=on?'':'none';
  $('lab-guide-btn').disabled=on;
  if(!on)return;
  const p=pasos[idx];
  $('lab-guide-n').textContent=`Paso ${idx+1} de ${pasos.length}`;
  $('lab-guide-n').className='step-n'+(p.am?' am':'');
  $('lab-guide-title').textContent=p.t;
  $('lab-guide-body').innerHTML=p.b.replace(/\n/g,'<br>');
  $('lab-guide-prev').disabled=idx===0;
  $('lab-guide-next').disabled=idx===pasos.length-1;
  $('lab-guide-auto').textContent=timer?'⏸ Pausar avance':'▶ Avance automático';
}

function ir(i){
  idx=Math.max(0,Math.min(pasos.length-1,i));
  resaltar();pintarPanel();
}

export function pauseGuideAuto(){
  if(timer)clearInterval(timer);
  timer=null;
  if(activo())pintarPanel();
}
export function toggleGuideAuto(){
  if(!activo())return;
  if(timer){pauseGuideAuto();return;}
  if(idx===pasos.length-1)idx=0;   // desde el último paso, el avance automático vuelve a empezar
  timer=setInterval(()=>{
    if(idx<pasos.length-1)ir(idx+1);
    if(idx===pasos.length-1)pauseGuideAuto();
  },GUIDE_MS);
  ir(idx);
}

export function startGuide(){
  const {r,cerrado}=labEstado();
  if(!r||r!==lastResult||activo())return;   // tras «Limpiar todo» no hay resultado vigente que guiar
  pasos=buildSteps(r);
  cerradoAntes=cerrado;
  idx=0;
  fijarLabContactor(false,MOTIVO);   // repinta la escena; el enganche aplica el resaltado
  pintarPanel();
}
export function exitGuide(){
  if(!activo())return;
  pauseGuideAuto();
  idx=-1;
  fijarLabContactor(cerradoAntes,'');   // la escena queda como estaba, contactor incluido
  pintarPanel();
}
export function guideNext(){if(activo())ir(idx+1);}
export function guidePrev(){if(activo())ir(idx-1);}

onLabPintado(resaltar);
// Un resultado nuevo cambia los pasos: el modo guiado termina (el laboratorio ya quita el bloqueo)
onLabNuevoResultado(()=>{
  if(timer)clearInterval(timer);
  timer=null;idx=-1;pasos=[];
  pintarPanel();
});

// Teclado: flechas, AvPág/RePág (punteros de presentación) y Esc. Solo con el modo guiado activo, la
// pestaña del laboratorio a la vista y el foco fuera de un campo (las flechas mueven deslizadores y números).
document.addEventListener('keydown',e=>{
  if(!activo()||!$('tab-lab').classList.contains('active'))return;
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const t=e.target;
  if(t&&t.tagName&&/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))return;
  if(['ArrowRight','ArrowDown','PageDown'].includes(e.key))guideNext();
  else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key))guidePrev();
  else if(e.key==='Escape')exitGuide();
  else return;
  e.preventDefault();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGuideAuto();});
