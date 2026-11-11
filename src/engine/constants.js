// Datos de referencia

export const HP_W=745.7;
export const PRESETS=[
  {UL:220,f:60,lbl:'220 V · 60 Hz'},{UL:208,f:60,lbl:'208 V · 60 Hz'},
  {UL:440,f:60,lbl:'440 V · 60 Hz'},{UL:480,f:60,lbl:'480 V · 60 Hz'},
  {UL:13800,f:60,lbl:'13,8 kV · 60 Hz'},{UL:400,f:50,lbl:'400 V · 50 Hz (libro)'}];
export const KVAR_STEPS=[0.5,1,1.5,2,2.5,3,4,5,6,7.5,10,12.5,15,20,25,30,40,50,60,75,100,125,150,200,250,300,400,500,600,750,1000,1200,1500,2000];
export function voltLevel(UL){
  return UL<=600?{name:'bajo voltaje',lim:8}:UL<=40000?{name:'medio voltaje',lim:6}:{name:'alto voltaje',lim:5};
}
