// Genera los iconos de la PWA en public/ a partir del logotipo de la cabecera (círculo con tres
// conductores a 120°). Sin dependencias: dibuja con funciones de distancia y escribe el PNG a mano.
//   node tools/generar-iconos.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';

const VERDE_A = [0x2d, 0x6a, 0x4f], VERDE_B = [0x1f, 0x4d, 0x38], PAPEL = [0xfa, 0xf8, 0xf3];

const crcTabla = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = crcTabla[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const trozo = (tipo, datos) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([len, cuerpo, crc]);
};
function png(n, rgba) {
  const cab = Buffer.alloc(13); cab.writeUInt32BE(n, 0); cab.writeUInt32BE(n, 4); cab[8] = 8; cab[9] = 6;
  const filas = Buffer.alloc(n * (n * 4 + 1));
  for (let y = 0; y < n; y++) rgba.copy(filas, y * (n * 4 + 1) + 1, y * n * 4, (y + 1) * n * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', cab), trozo('IDAT', zlib.deflateSync(filas, { level: 9 })), trozo('IEND', Buffer.alloc(0))]);
}

const distSegmento = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const cobertura = d => Math.max(0, Math.min(1, 0.5 - d));   // d: distancia con signo al borde, en píxeles

// n: lado en píxeles. radio: redondeo del fondo (0 = a sangre). escala: tamaño del símbolo respecto al lado.
function icono(n, { radio, escala }) {
  const rgba = Buffer.alloc(n * n * 4), u = n * escala / 24, cx = n / 2, cy = n / 2, grosor = 2 * u, r = radio * n;
  const P = (x, y) => [cx + (x - 12) * u, cy + (y - 12) * u];
  const [c0x, c0y] = P(12, 12), tramos = [[P(12, 3), P(12, 12)], [P(12, 12), P(18.3, 18.3)], [P(12, 12), P(5.7, 18.3)]];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const px = x + 0.5, py = y + 0.5;
    // Fondo: rectángulo redondeado con degradado diagonal
    const qx = Math.abs(px - cx) - (n / 2 - r), qy = Math.abs(py - cy) - (n / 2 - r);
    const dFondo = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    const aFondo = cobertura(dFondo), g = (px + py) / (2 * n);
    const fondo = VERDE_A.map((a, i) => a + (VERDE_B[i] - a) * g);
    // Símbolo: anillo de radio 9 y tres conductores, con extremos redondeados
    let d = Math.abs(Math.hypot(px - c0x, py - c0y) - 9 * u);
    for (const [[ax, ay], [bx, by]] of tramos) d = Math.min(d, distSegmento(px, py, ax, ay, bx, by));
    const aSim = cobertura(d - grosor / 2);
    const i = (y * n + x) * 4;
    for (let k = 0; k < 3; k++) rgba[i + k] = Math.round(fondo[k] + (PAPEL[k] - fondo[k]) * aSim);
    rgba[i + 3] = Math.round(255 * aFondo);
  }
  return png(n, rgba);
}

fs.mkdirSync('public/icons', { recursive: true });
const salidas = [
  ['public/icons/icon-192.png', 192, { radio: 0.22, escala: 0.6 }],
  ['public/icons/icon-512.png', 512, { radio: 0.22, escala: 0.6 }],
  // Enmascarable: fondo a sangre y símbolo dentro de la zona segura (80 % central)
  ['public/icons/icon-maskable-512.png', 512, { radio: 0, escala: 0.5 }],
  ['public/icons/apple-touch-icon.png', 180, { radio: 0, escala: 0.56 }],
];
for (const [ruta, n, op] of salidas) { fs.writeFileSync(ruta, icono(n, op)); console.log(ruta, fs.statSync(ruta).size, 'bytes'); }

fs.writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d6a4f"/><stop offset="1" stop-color="#1f4d38"/></linearGradient></defs>
  <rect width="40" height="40" rx="9" fill="url(#g)"/>
  <g transform="translate(8 8)" fill="none" stroke="#faf8f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.3 6.3M12 12L5.7 18.3"/>
  </g>
</svg>
`);
console.log('public/favicon.svg');
