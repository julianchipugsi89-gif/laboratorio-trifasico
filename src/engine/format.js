// Formato de números, ángulos, potencias y complejos
import { cabs, cang } from './complex.js';
import { bad } from './math.js';

export const noNegZero=t=>/^-0(\.0*)?$/.test(t)?t.slice(1):t;
export const fN=(n,d=3)=>bad(n)?'—':noNegZero(Number(n).toFixed(d));
export const fS=(n,s=4)=>{if(bad(n))return'—';if(Math.abs(n)<1e-9)return'0';const d=Math.max(0,s-1-Math.floor(Math.log10(Math.abs(n))));return Number(n).toFixed(Math.min(d,6));};
export const fA=a=>(a>=0?'+':'−')+fN(Math.abs(a),2)+'°';
export const pStr=(m,a)=>`${fN(m,3)} ∠${fA(a)}`;
export const sgn=(n,d=2)=>(n>=0?'+':'−')+fN(Math.abs(n),d);
export const fPow=(n,u='')=>{if(bad(n))return'—';const a=Math.abs(n);return a>=1e6?`${fS(n/1e6)} M${u}`:a>=1e3?`${fS(n/1e3)} k${u}`:`${fS(n)} ${u}`;};
export const fpTag=φ=>φ>1e-9?'ind.':φ<-1e-9?'cap.':'';
export const cstr=(z,d=3)=>`${fN(cabs(z),d)} ∠${fA(cang(z))}`;
export const rstr=(z,d=3)=>`${fN(z.re,d)}${z.im>=0?'+':'−'}j${fN(Math.abs(z.im),d)}`;
