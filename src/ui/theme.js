// Tema claro / oscuro
import { renderDiagrams } from '../graphics/diagrams.js';
import { drawPhasors } from '../graphics/phasors.js';
import { renderTriangle } from '../graphics/triangle.js';
import { drawWaveforms } from '../graphics/waveforms.js';
import { $ } from './dom.js';
import { theme, setTheme, lastResult } from './state.js';

export const prefersDark=()=>!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
export const effTheme=()=>theme||(prefersDark()?'dark':'light');
export function syncThemeBtn(){$('themeBtn').textContent=effTheme()==='dark'?'☀ Modo claro':'☾ Modo oscuro';}
export function toggleTheme(){
  setTheme(effTheme()==='dark'?'light':'dark');
  document.documentElement.setAttribute('data-theme',theme);
  syncThemeBtn();
  if(lastResult){drawPhasors(lastResult);drawWaveforms(lastResult);renderDiagrams(lastResult);renderTriangle(lastResult);}
}
