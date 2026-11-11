// Carga el index.html real y la aplicación completa sobre jsdom (para pruebas con // @vitest-environment jsdom).
import fs from 'node:fs';

export async function arrancarApp() {
  const html = fs.readFileSync('index.html', 'utf8');   // la raíz de Vitest es la del proyecto
  document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '');
  // jsdom no implementa canvas: contexto 2D que acepta cualquier llamada de dibujo
  const ctx = new Proxy({}, {
    get: (estado, p) => p in estado ? estado[p] : p === 'measureText' ? () => ({ width: 10 }) : () => {},
    set: (estado, p, v) => { estado[p] = v; return true; },
  });
  window.HTMLCanvasElement.prototype.getContext = () => ctx;
  await import('../../src/main.js');
}
