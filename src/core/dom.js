// Acceso al DOM y a las variables CSS (compartido por ui, graphics y print)

export const $=id=>document.getElementById(id);
export function textCol(c){const m={[getCSS('--pa')]:'--pa-t',[getCSS('--pb')]:'--pb-t',[getCSS('--pc')]:'--pc-t'};return m[c]?getCSS(m[c]):c;}
export function getCSS(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
