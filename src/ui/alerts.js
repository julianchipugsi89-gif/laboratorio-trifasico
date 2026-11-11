// Avisos de validación
import { $ } from '../core/dom.js';

export function showAlert(m){const b=$('alertBox');b.textContent=m;b.classList.add('vis')}
export function hideAlert(){$('alertBox').classList.remove('vis')}
