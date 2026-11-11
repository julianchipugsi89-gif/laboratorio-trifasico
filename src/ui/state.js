// Estado de la interfaz

export let voltageType='line',zLineEnabled=false,wiresSel='auto',vRef='source',loads=[],loadId=0,lastResult=null,theme=null,waveHoverDeg=null;

// Los módulos ES no permiten reasignar un import: el estado se modifica solo desde aquí.
export function setVoltageType(v){voltageType=v;}
export function setZLineEnabled(v){zLineEnabled=v;}
export function setWiresSel(v){wiresSel=v;}
export function setVRefState(v){vRef=v;}
export function setLoads(v){loads=v;}
export function resetLoads(){loads=[];loadId=0;}
export function nextLoadId(){return ++loadId;}
export function setLastResult(v){lastResult=v;}
export function setTheme(v){theme=v;}
export function setWaveHoverDeg(v){waveHoverDeg=v;}
