# Laboratorio Trifásico Equilibrado

Simulador docente de **circuitos trifásicos equilibrados** para la asignatura de Circuitos Eléctricos.
Resuelve el circuito por el método del monofásico equivalente (Fraile Mora, *Circuitos Eléctricos*,
Patrón 5), muestra el desarrollo paso a paso y lo acompaña de un **laboratorio virtual** donde se ve
el banco funcionando: instrumentos con lectura, corriente animada, motores y banco de compensación.

Funciona en el navegador, se puede instalar como aplicación y, tras la primera carga, **no necesita
conexión**.

## Qué calcula

- Fuente trifásica con tensión de línea o de fase, secuencia ABC o ACB, 3 o 4 hilos.
- Cargas en paralelo: impedancias R–L–C en estrella o triángulo y motores de inducción (datos de placa).
- Línea con impedancia Z_L, con la tensión conocida **en la fuente** o **en el receptor**.
- Corrientes de línea y de fase, potencias P, Q, S, factor de potencia, caída de tensión y pérdidas.
- Compensación de reactiva: banco de condensadores (o reactores si la carga es capacitiva) para un fp objetivo.
- Comprobaciones de Boucherot y Kirchhoff, y diagnóstico frente a los criterios normativos.
- Informe para imprimir o guardar como PDF.

## Cómo usarlo en clase

1. **Elige un ejercicio** de la barra superior o introduce tus datos y pulsa *Resolver circuito trifásico*.
2. **Laboratorio virtual** (primera pestaña). Muestra la fuente, los instrumentos, la línea, el
   embarrado y las cargas, con sus lecturas:
   - Voltímetros en la fuente y en el receptor, amperímetros de línea y cosfímetro.
   - Dos vatímetros por el **método de Aron** (W1, W2 y su suma = P). Si uno marca negativo es que
     fp < 0,5; aparece en ámbar con la explicación.
   - Pilotos de alarma según el diagnóstico normativo.
   - *▶ Animar* mueve las partículas de corriente y los motores en **cámara lenta** (un ciclo de red
     en 6 s). Las partículas van y vienen porque la corriente es alterna; el deslizador fija el
     instante ωt. Con secuencia ACB los motores giran al revés.
3. **Contactor del banco.** *Conectar banco* (o un clic sobre el contactor K de la escena) alterna las
   lecturas entre el estado sin compensar y el compensado, y muestra el antes → después de I_L, fp,
   pérdidas y ΔU. Solo afecta al laboratorio: las demás pestañas y el informe describen siempre el
   estado sin compensar. Si no hay fp objetivo, o no hace falta corrección, aparece deshabilitado con
   el motivo.
4. **Pantalla completa.** *⛶ Pantalla completa* deja solo la escena y los instrumentos, con las
   lecturas más grandes, para proyectar. Se sale con Esc o con el mismo botón.
5. **Desarrollo guiado.** *☰ Desarrollo guiado* recorre los pasos del cálculo resaltando en la escena
   lo que se está calculando. Se maneja con los botones, con las flechas o con AvPág/RePág (sirve un
   puntero de presentación); Esc para salir. Dentro de la pantalla completa, el primer Esc sale de
   ella. Mientras está activo, el contactor queda desconectado.
6. El resto de pestañas ofrecen el esquema eléctrico, el diagrama fasorial con osciloscopio, la tabla
   de fases con el triángulo de potencias y el desarrollo paso a paso completo.

### Instalarlo y usarlo sin conexión

Abre el sitio una vez con conexión. En Chrome o Edge aparece *Instalar* en la barra de direcciones;
en el móvil, *Añadir a pantalla de inicio*. Desde ese momento funciona sin red.

Cuando se publica una versión nueva, la aplicación muestra el aviso **«Hay una actualización»** con un
botón *Recargar*. El pie de página indica la versión en uso: es la forma rápida de comprobar que toda
la clase trabaja con la misma.

## Límites del modelo

- **Solo circuitos equilibrados.** Las tres fases tienen la misma carga; no resuelve desequilibrios,
  fallos ni desplazamiento del neutro.
- **Motores a potencia constante.** Cada motor absorbe la potencia de su placa (P útil / η, con su
  cosφ) sea cual sea la tensión en bornes. Es razonable cerca de la tensión nominal; el diagnóstico
  avisa cuando la tensión se aleja más de un ±10 %. No se modelan el arranque ni el deslizamiento.
- **Modo receptor.** Cuando la tensión conocida es la del receptor, la aplicación calcula la tensión de
  fuente necesaria. La «caída en la línea» se refiere entonces a **esa tensión de fuente calculada**,
  no a una tensión nominal de la red, y se presenta como criterio de diseño.
- **Régimen permanente sinusoidal.** Sin armónicos ni transitorios. La línea es una impedancia serie
  R_L + jX_L por conductor, sin capacidad.
- **Compensación.** El banco se conecta en bornes de carga y se dimensiona para el fp objetivo en ese
  punto; el fp en la fuente difiere ligeramente cuando hay Z_L.
- Es una herramienta docente: no sustituye a un cálculo de proyecto.

## Referencias normativas

Los umbrales por defecto proceden de:

- **Factor de potencia mínimo 0,94** — Pliego Tarifario SPEE 2026, Resolución ARCONEL-029/25.
- **Variación de tensión admisible** — Regulación ARCERNNR-002/20, Tabla 1: bajo voltaje 8 %, medio
  voltaje 6 %, alto voltaje 5 %.

> **Verifica la vigencia.** Las resoluciones y los pliegos tarifarios se actualizan. Antes de usar
> estos valores fuera del aula, comprueba la normativa en vigor; ambos umbrales se pueden editar en el
> panel *Criterios normativos*.

## Desarrollo

Requiere Node.js 22.12 o posterior.

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # pruebas (Vitest)
npm run lint       # ESLint
npm run build      # sitio estático en dist/
npm run preview    # sirve dist/ para probar la PWA y el uso sin conexión
```

El service worker solo existe en el sitio compilado: para probar la instalación o el funcionamiento
sin red usa `npm run build` y `npm run preview`, no el servidor de desarrollo.

### Estructura

| Carpeta | Contenido |
|---|---|
| `src/engine/` | Motor de cálculo puro, sin DOM: complejos, `computeCircuit`, comprobaciones, diagnóstico normativo, lecturas de instrumentos y pilotos. |
| `src/core/` | Acceso al DOM, estado de la aplicación y HTML compartido de la compensación. |
| `src/ui/` | Entradas, cargas, resultados, pasos, pestañas, laboratorio y desarrollo guiado. |
| `src/graphics/` | Esquemas SVG, fasorial, osciloscopio, triángulo de potencias, escena del laboratorio y su animación. |
| `src/print/` | Informe imprimible. |
| `src/styles/` | Hojas de estilo, incluidas las fuentes locales. |
| `pwa/`, `public/` | Plantilla del service worker, manifiesto e iconos. |
| `tests/` | Pruebas del motor (entorno node) y de la interfaz (jsdom), con instantáneas del texto visible. |
| `tools/` | Utilidades de desarrollo: comparación contra la versión original y generador de iconos. |
| `legacy/` | El HTML de un solo archivo del que partió el proyecto, como referencia. |

`legacy/` y `tools/` están en el repositorio pero no se publican en el sitio.

### Pruebas

`npm test` ejecuta:

- **Motor** (`tests/engine`): los cuatro ejercicios incluidos, modo receptor, secuencia ACB,
  compensación con condensadores y reactores, motores con línea, errores (colapso de tensión,
  impedancia nula), método de Aron y pilotos. Los valores esperados están calculados a mano.
- **Interfaz** (`tests/ui`): instantáneas del texto visible de 13 escenarios en pantalla y en el
  informe, y el comportamiento del laboratorio (contactor, partículas, modo guiado, teclado).

Si un cambio modifica texto visible a propósito, actualiza las instantáneas con `npx vitest run -u`
y revisa el diff antes de confirmarlo.

Los lienzos del fasorial y del osciloscopio se comparan a mano contra `legacy/`: con `npm run dev`
abierto, en la consola del navegador:

```js
const h = await import('/tools/huellas.js'); (await h.contraLegacy()).comparacion
```

### Publicación

El flujo `.github/workflows/ci.yml` ejecuta lint y pruebas en cada push. Si pasan y la rama es
`main`, compila y publica en GitHub Pages.

Para publicar una versión nueva:

1. Sube el número de `version` en `package.json` y anota los cambios en `CHANGELOG.md`.
2. Haz push a `main`.

Quien tenga la aplicación abierta o instalada verá el aviso «Hay una actualización» la próxima vez
que la use con conexión. El aviso aparece con cualquier cambio publicado, aunque no se haya subido el
número de versión; subirlo sirve para que el pie de página lo refleje.

Los iconos se regeneran con `npm run iconos`.

## Créditos

Basado en el método de Jesús Fraile Mora, *Circuitos Eléctricos* (Pearson, 2012), capítulo 3.
Tipografías IBM Plex y Fraunces, bajo licencia SIL Open Font License.
