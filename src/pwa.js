// PWA: número de versión en el pie, registro del service worker y aviso de actualización.
import { $ } from './core/dom.js';

/* global __APP_VERSION__ */

// Muestra el aviso «Hay una actualización». La versión nueva ya está descargada y en espera: al pulsar
// Recargar se le pide que tome el control y la página se recarga con ella.
function avisar(reg){
  const aviso=$('update-banner');
  aviso.style.display='';
  $('update-reload').onclick=()=>{
    $('update-reload').disabled=true;
    $('update-reload').textContent='Actualizando…';
    sessionStorage.setItem('pwa-recarga','1');
    if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');
    else location.reload();
  };
  $('update-later').onclick=()=>{aviso.style.display='none';};
}

function registrar(){
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    // Ya había una versión nueva esperando (p. ej. se cerró la pestaña sin recargar)
    if(reg.waiting&&navigator.serviceWorker.controller)avisar(reg);
    reg.addEventListener('updatefound',()=>{
      const nuevo=reg.installing;
      if(!nuevo)return;
      nuevo.addEventListener('statechange',()=>{
        // «installed» con una versión anterior al mando = actualización; sin ella es la primera instalación
        if(nuevo.state==='installed'&&navigator.serviceWorker.controller)avisar(reg);
      });
    });
    // Busca versión nueva al volver a la pestaña y cada hora, para clases largas con la app abierta
    const buscar=()=>reg.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)buscar();});
    setInterval(buscar,60*60*1000);
  }).catch(()=>{});
}

export function initPwa(){
  const v=$('app-version');
  if(v)v.textContent=`Versión ${__APP_VERSION__}`;
  // El service worker solo existe en el sitio compilado; en desarrollo y en las pruebas no se registra
  if(!import.meta.env.PROD||!('serviceWorker' in navigator))return;

  let recargando=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    // Solo se recarga si lo pidió el usuario; la primera instalación también cambia de controlador
    if(recargando||sessionStorage.getItem('pwa-recarga')!=='1')return;
    recargando=true;sessionStorage.removeItem('pwa-recarga');
    location.reload();
  });
  if(document.readyState==='complete')registrar();
  else window.addEventListener('load',registrar);
}
