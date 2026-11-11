# Registro de cambios

## Sin publicar

### Corregido — modo receptor con Z_L

Seis inconsistencias que solo afectaban al modo «tensión conocida en el receptor» con impedancia
de línea. El modo fuente no cambia: la comparación contra `legacy/trifasico_equilibrado_v2.html`
sigue siendo idéntica en todos sus escenarios.

Casos numéricos usados (400 V de línea conocidos en el receptor, 50 Hz, secuencia ABC):

- **Caso A:** carga Y 30+j40 Ω, Z_L = 2+j1 Ω → Ī_A = 4,6188∠−53,13° A, Ū_AN = 240,222∠−1,10° V,
  U_L,fuente = 416,077 V.
- **Caso B:** carga Y 30 Ω, Z_L = j10 Ω → Ī_A = 7,698∠0° A, Ū_AN = 243,432∠+18,43° V,
  U_L,fuente = 421,637 V.

1. **Comprobación de Boucherot** (`computeChecks`). El lado «3·U_f·I_L·cosφ» usaba la tensión del
   receptor con el ángulo φ de la fuente, y la comprobación salía en rojo. Ahora usa la tensión de
   fuente calculada.
   Caso A: P = 3·I²·(30+2) = 2048,0 W y Q = 3·I²·(40+1) = 2624,0 var.
   Antes mostraba 1,969 kW y 2,523 kvar (✗); ahora 2,048 kW y 2,624 kvar (✓).

2. **Tabla de fases y lectura instantánea ωt.** Bajo la cabecera «fuente, calculada» se mostraba el
   módulo del receptor con el ángulo de la fuente. Ahora módulo y ángulo son los de la fuente.
   Caso B: Ū_AN = 243,432 ∠+18,43° (antes 230,940 ∠+18,43°); Ū_AB = 421,637 ∠+48,43°
   (antes 400,000 ∠+48,43°); en ωt = 0°, u_A = √2·243,432·sen 18,43° = 108,9 V y Û = 344,3 V
   (antes 103,3 V y 326,6 V).

3. **Rótulo del factor de potencia.** Los pasos y el informe rotulaban «fp (carga)» el fp de la
   fuente. Ahora se rotula «fp (entrada)» y se muestra aparte el fp de las cargas, como en modo
   fuente.
   Caso B: fp (entrada) = cos 18,43° = 0,9487; fp de la carga = 1,0000
   (antes «fp (carga) = 0,9487»).

4. **Potencia nominal del banco de condensadores** (`Qnom`). El texto dice «Banco a U_L nominal
   (400 V)» pero el valor se calculaba a la tensión de fuente. Ahora se calcula a la tensión dato,
   que es la que tiene el banco en bornes de carga.
   Caso A con fp objetivo 0,95: Q_C = 1920·(1,3333 − 0,3287) = 1,929 kvar → paso comercial de
   2 kvar (antes 2,087 kvar → 2,5 kvar).

5. **Diagrama fasorial.** Ū_carga se dibujaba girada el ángulo δ de la fuente, encima de Ū_AN.
   Ahora se dibuja en su ángulo real y su longitud es proporcional a U_carga/U_fuente (con el mismo
   recorte 0,5–0,95).
   Caso B: Ū_A′N en 0° (antes +18,43°) y longitud relativa 230,940/243,432 = 0,9487 (antes 0,95
   fijo).

6. **Caída de tensión ΔU.** Valía siempre 0 %, de modo que el diagnóstico normativo daba «dentro
   del límite» con cualquier línea. Ahora ΔU = (U_L − U_L,fuente)/U_L,fuente, también tras
   compensar (`r.comp.dUpct`, con el nuevo `r.comp.UL_src`). Coincide con el ΔU del modo fuente
   resuelto con U_L = U_L,fuente.
   Caso B: ΔU = (400 − 421,637)/421,637 = −5,13 % (antes +0,00 %).
   Caso A con fp objetivo 0,95: −3,86 % → −2,72 % tras compensar (U_L,fuente baja de 416,08 V a
   411,18 V).
   Redacción solo en modo receptor: la tarjeta pasa a «Caída en la línea respecto a la fuente»; el
   diagnóstico se titula «Caída de tensión en la línea (criterio de diseño)», indica la tensión
   dato del receptor y la tensión de fuente necesaria, y cita ARCERNNR-002/20 como origen del
   límite (el límite es el mismo). En la tabla de compensación la fila se llama «Caída en la línea
   resp. a la fuente».

### Añadido

- Proyecto Vite con JavaScript modular: `src/engine` (cálculo puro), `src/core` (DOM y estado), `src/ui`, `src/graphics`,
  `src/print`, `src/styles`.
- Pruebas con Vitest en entorno node (`npm test`).
