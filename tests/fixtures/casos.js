// Entradas de computeCircuit(inp) para las pruebas.
// Los 4 ejercicios replican src/ui/exercises.js (loadExercise) con los criterios por defecto de la interfaz.
export const entrada = (o = {}) => ({
  UL: 400, f: 50, seq: 'abc', voltageType: 'line',
  zLineEnabled: false, vRef: 'source', ZL: { R: 0, X: 0 },
  loads: [], fpTgt: NaN, wiresSel: 'auto',
  lim: { fpMin: 0.94, dUmax: NaN },
  ...o,
});
export const imp = (conn, R, XL = 0, XC = 0) => ({ kind: 'imp', conn, R, XL, XC });
export const motor = (conn, Pout, Punit, Unom, cosphi, eta) => ({ kind: 'motor', conn, Pout, Punit, Unom, cosphi, eta });

export const ejercicios = {
  // Ej. 1: taller mixto Y + Δ con línea Z_L (220 V · 60 Hz)
  1: () => entrada({ UL: 220, f: 60, zLineEnabled: true, ZL: { R: 0.12, X: 0.16 }, fpTgt: 0.95, wiresSel: 'auto',
    loads: [imp('star', 12, 9), imp('delta', 36, 27)] }),
  // Ej. 2: planta con 2 motores + calefactor y banco Q_C (440 V · 60 Hz)
  2: () => entrada({ UL: 440, f: 60, zLineEnabled: true, ZL: { R: 0.08, X: 0.15 }, fpTgt: 0.96, wiresSel: '3',
    loads: [motor('delta', 15, 'HP', 440, 0.84, 89.5), motor('star', 7.5, 'kW', 440, 0.82, 87), imp('delta', 72)] }),
  // Ej. 3: clásico Fraile Mora · Y + Δ + motor (400 V · 50 Hz)
  3: () => entrada({ UL: 400, f: 50, fpTgt: 0.95, wiresSel: '4',
    loads: [imp('star', 16, 12), imp('delta', 45, 60), motor('delta', 10, 'kW', 400, 0.85, 90)] }),
  // Ej. 4: carga RLC capacitiva con compensación inductiva
  4: () => entrada({ UL: 220, f: 60, fpTgt: 0.96, wiresSel: 'auto',
    loads: [imp('star', 15, 8, 28), imp('delta', 45, 12, 48)] }),
};

// Modo receptor con δ grande y números redondos:
// carga Y resistiva 30 Ω, Z_L = j10 Ω, 400 V de línea conocidos en el receptor.
//   Ū_A′N = 230,940∠0° V · Ī_A = 7,6980∠0° A · ΔŪ = j76,980 V
//   Ū_AN = 230,940 + j76,980 = 243,432∠18,435° V · U_L,fuente = 421,637 V
//   P = 3·230,940·7,6980 = 5333,33 W · Q = 3·I²·10 = 1777,78 var
//   fp fuente = cos 18,435° = 0,94868 · fp carga = 1
export const receptorDelta = () => entrada({ UL: 400, f: 50, zLineEnabled: true, vRef: 'load', ZL: { R: 0, X: 10 },
  loads: [imp('star', 30)] });

// Modo receptor del caso de aceptación 1: carga Y 30+j40 Ω, Z_L = 2+j1 Ω, 400 V en el receptor.
export const receptorA1 = (o = {}) => entrada({ UL: 400, f: 50, zLineEnabled: true, vRef: 'load', ZL: { R: 2, X: 1 },
  loads: [imp('star', 30, 40)], ...o });
