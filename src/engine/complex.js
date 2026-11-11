// Aritmética compleja
import { r2d, d2r } from './math.js';

export const Cx=(re,im=0)=>({re,im});
export const cadd=(...z)=>z.reduce((s,v)=>Cx(s.re+v.re,s.im+v.im),Cx(0));
export const csub=(a,b)=>Cx(a.re-b.re,a.im-b.im);
export const cmul=(a,b)=>Cx(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
export const cdiv=(a,b)=>{const d=b.re*b.re+b.im*b.im;return Cx((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);};
export const cconj=a=>Cx(a.re,-a.im);
export const cscale=(a,k)=>Cx(a.re*k,a.im*k);
export const cabs=z=>Math.hypot(z.re,z.im),cang=z=>r2d(Math.atan2(z.im,z.re));
export const cpol=(m,a)=>Cx(m*Math.cos(d2r(a)),m*Math.sin(d2r(a)));
