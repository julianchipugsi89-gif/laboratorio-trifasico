import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Genera dist/sw.js al terminar la compilación: lista todos los archivos del sitio para precargarlos
// (uso sin conexión) y les pone una huella, de modo que cualquier cambio publicado se detecta como
// versión nueva y la página muestra el aviso «Hay una actualización».
function serviceWorker() {
  let dist;
  return {
    name: 'trifasico-service-worker',
    apply: 'build',
    configResolved(c) { dist = path.resolve(c.root, c.build.outDir); },
    closeBundle() {
      const archivos = fs.readdirSync(dist, { recursive: true, withFileTypes: true })
        .filter(e => e.isFile())
        .map(e => path.relative(dist, path.join(e.parentPath ?? e.path, e.name)).split(path.sep).join('/'))
        // .woff es el formato de reserva de navegadores antiguos; quien admite service workers usa .woff2
        .filter(f => f !== 'sw.js' && !f.endsWith('.woff') && !f.endsWith('.map'))
        .sort();
      const huella = createHash('sha256');
      for (const f of archivos) huella.update(f).update(fs.readFileSync(path.join(dist, f)));
      const version = `${pkg.version}-${huella.digest('hex').slice(0, 8)}`;
      const precache = ['./', ...archivos.map(f => './' + f)];
      const plantilla = fs.readFileSync(new URL('./pwa/sw.template.js', import.meta.url), 'utf8');
      fs.writeFileSync(path.join(dist, 'sw.js'),
        plantilla.replace("'__VERSION__'", JSON.stringify(version)).replace('= __PRECACHE__;', () => '= ' + JSON.stringify(precache, null, 2) + ';'));
      if (/__VERSION__|__PRECACHE__/.test(fs.readFileSync(path.join(dist, 'sw.js'), 'utf8'))) throw new Error('sw.js: quedaron marcadores sin rellenar');
      console.log(`  sw.js · versión ${version} · ${precache.length} archivos precargados`);
    },
  };
}

export default defineConfig({
  // Base relativa: el sitio funciona igual en la raíz o en un subdirectorio, así que no depende del
  // nombre del repositorio en GitHub Pages (usuario.github.io/laboratorio-trifasico/).
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [serviceWorker()],
});
