// Punto de entrada: enlaza los manejadores en línea del HTML y arranca la app
import { resetWt, setWt, stopWtAnim, toggleWtAnim } from './graphics/wt.js';
import { closePrint, showPrintView } from './print/report.js';
import { clearAll } from './ui/clear.js';
import { loadExercise } from './ui/exercises.js';
import { applyPreset, markPreset, onSourceChange, renderPresets, setVRef, setVT, setWires, setZL, updateLevelHint, updateZLHint } from './ui/inputs.js';
import { addLoad, removeLoad, setConn, setKind, updLoad } from './ui/loads.js';
import { solve } from './ui/solve.js';
import { showTab } from './ui/tabs.js';
import { syncThemeBtn, toggleTheme } from './ui/theme.js';

// El HTML usa atributos onclick/oninput; los módulos ES no crean globales, así que se exponen aquí.
Object.assign(window, {
  addLoad, applyPreset, clearAll, closePrint, loadExercise, markPreset, onSourceChange, removeLoad, resetWt, setConn, setKind, setVRef, setVT, setWires, setWt, setZL, showPrintView, showTab, solve, stopWtAnim, toggleTheme, toggleWtAnim, updLoad, updateLevelHint, updateZLHint,
});

renderPresets();
syncThemeBtn();
// Carga inicial con un ejercicio completo y realista para mostrar de inmediato las gráficas
loadExercise(1);
