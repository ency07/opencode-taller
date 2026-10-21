# Deuda operativa y técnica

Registro de desviaciones, riesgos aceptados y limitaciones conocidas, según
GOVERNANCE.md §13. Cada entrada es trazable a código y tiene responsable y fecha
objetivo. Las deudas de severidad Alta/Crítica requieren plan fechado antes del
cierre completo.

Convención de estado: `open` (registrada) · `planned` (asignada a una rama/PR) ·
`closed` (resuelta y verificada).

---

### DEBT-001 — El lock de ficha falla en silencio si el guardado no persiste

- **Origen:** `setLockValue()` (`js/memoria-local.js:302`) ignora el valor de
  retorno de `setJSON` (`js/memoria-local.js:129`), que devuelve `false` cuando
  `localStorage` rechaza la escritura (cuota, modo privado).
- **Riesgo:** el usuario cree que fijó un eje y el motor lo vuelve a sortear.
- **Impacto:** Medio.
- **Mitigación actual:** ninguna.
- **Solución definitiva:** propagar el retorno y avisar en la UI cuando el lock no persista.
- **Responsable:** Motor / UI.
- **Fecha objetivo:** rama `fix/locks-merge-sync`.
- **Estado:** planned.
- **Revisión:** cada release.

### DEBT-002 — El gate del set no exige unicidad de jerarquía, densidad y espacio negativo

- **Origen:** `evaluaSetOk()` (`js/motor-nucleo.js:1488`) valida `layout`,
  `distribucionTexto`, `tipografia`, `formaSimbolo`, `integracionTexto`,
  `tratamiento`, `tecnica` y `familiaColor`, pero no `jerarquiaVisual`,
  `densidad`, `negativeSpace` ni `composicion`.
- **Cierre (2026-10-20, PR `fix/gate-axes`):** `ejesOk` ahora exige jerarquía,
  densidad y espacio negativo distintos entre A/B/C; la asignación provisional
  usa `_pickFresh` para esos ejes y el dado excluye candidatos que repiten con
  las conservadas. Los locks manuales pueden repetir jerarquía (decisión del
  usuario, nunca se bloquea). Cubierto por `tests/gate-axes.test.js`.
- **Estado:** closed (verificado en suite).
- **Revisión:** cada release.

### DEBT-003 — `nuevo_texto` del selector nunca coincide y el fallback se contradice

- **Origen:** el `<option>` usa `value="nuevo_texto"` (`index.html:314`) pero el
  motor compara `textMode === 'nuevo'` (`js/motor-nucleo.js:1945`); al no
  coincidir cae al `else` que ordena "respeta literalmente… no inventes palabras",
  contradiciendo el bloque previo "crear copy original" (`js/motor-nucleo.js:1873`).
- **Riesgo:** el usuario pide copy nuevo y recibe conservación literal.
- **Impacto:** Alto.
- **Mitigación actual:** ninguna.
- **Solución definitiva:** unificar el valor del selector con la comparación del motor.
- **Responsable:** Motor / UI.
- **Fecha objetivo:** próxima rama de fixes del selector de variación.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-004 — DISPLATE hereda `cara = 'espalda'`

- **Origen:** `_stampSideForProduct()` (`js/motor-nucleo.js:577`) devuelve el valor
  almacenado sin excluir DISPLATE, y la ficha siempre imprime `CARA DEL ESTAMPADO`
  (`js/motor-nucleo.js:2023`) aunque el producto no tenga caras.
- **Riesgo:** una funda sin "espalda" puede declarar cara espalda y confundir al generador.
- **Impacto:** Medio.
- **Mitigación actual:** `ia-analisis.js` oculta el selector `stampSide` en DISPLATE.
- **Solución definitiva:** excluir DISPLATE del cálculo de cara y omitir la línea en la ficha.
- **Responsable:** Motor / Producto.
- **Fecha objetivo:** próxima revisión de reglas de producto.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-005 — El contador de uso de estilos ignora la región

- **Origen:** `_getStyleUsageScore`/`_recordStyleUse` (`js/motor-nucleo.js:298`,
  `js/motor-nucleo.js:317`) pasan el mercado crudo a
  `getStyleUsageCounter`/`recordStyleUse` (`js/memoria-local.js:698`), sin región.
  Los locks sí separan por región (`memLocksMarket()` = `market|region`).
- **Riesgo:** la rotación de estilos mezcla regiones del mismo mercado.
- **Impacto:** Bajo.
- **Mitigación actual:** ninguna.
- **Solución definitiva:** incluir la región en la clave del contador, como en los locks.
- **Responsable:** Motor.
- **Fecha objetivo:** próxima revisión de memoria de rotación.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-006 — El pool de audiencias se amplía al mercado en silencio

- **Origen:** `getCurrentAudiencePool()` (`js/motor-nucleo.js:196`) cae al pool del
  mercado cuando ningún subnicho coincide, sin aviso.
- **Riesgo:** el usuario cree estar filtrando por subnicho y ve audiencias fuera de él.
- **Impacto:** Bajo.
- **Mitigación actual:** no cruza mercados (solo amplía dentro del mercado).
- **Solución definitiva:** indicar en la UI cuándo el pool es de mercado por falta de coincidencia.
- **Responsable:** UI / Motor.
- **Fecha objetivo:** próxima revisión del selector de audiencia.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-007 — `main` sin protección de rama

- **Origen:** rama `main` sin reglas de protección en GitHub.
- **Cierre (2026-10-20):** protección activada vía API y verificada —
  obligatorio PR a `main` (0 aprobaciones requeridas, por ser trabajo unipersonal),
  administradores incluidos (`enforce_admins`), sin force-push ni borrado de la rama,
  historia lineal. Los checks de CI obligatorios quedan como mejora posterior (DEBT-008).
- **Estado:** closed (verificado con GET de protection; `required_pull_request_reviews` activo).

### DEBT-008 — CI no corre en `push` a `main`

- **Origen:** `.github/workflows/node-regression.yml` define `on.push.branches:
  fix/redteam-semantic-identity`; los PR hacia `main` sí disparan el workflow.
- **Riesgo:** un commit directo a `main` no ejecuta la regresión.
- **Impacto:** Medio.
- **Mitigación actual:** todo cambio entra por PR.
- **Solución definitiva:** añadir `main` a los `branches` de `push`.
- **Responsable:** Administración del repositorio.
- **Fecha objetivo:** pendiente de decisión del propietario.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-009 — Falta test de integración del ciclo de locks y validación visual real

- **Origen:** los tests cubren unidades y contratos de texto; no hay test que
  ejecute el ciclo completo (contexto → guardar lock → recargar → re-sortear) ni
  ninguno que inspeccione la imagen final (el motor solo produce prompts).
- **Riesgo:** regresiones de persistencia de locks o de coherencia visual no detectadas.
- **Impacto:** Medio.
- **Mitigación actual:** pruebas manuales del usuario en Preview de Vercel.
- **Solución definitiva:** test de integración de locks con `localStorage` simulado;
  la validación visual queda como verificación manual reproducible documentada.
- **Responsable:** Calidad / Motor.
- **Fecha objetivo:** próxima revisión de cobertura.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-010 — Doctrina gospel: alcance de lo textual vs lo visual

- **Origen:** decisión de diseño pendiente: si la doctrina gospel se cubre solo
  mediante el copy o si una dirección puede desviar lo visual.
- **Riesgo:** ambigüedad de producto (no es defecto de código).
- **Impacto:** Medio.
- **Mitigación actual:** bloque `DOCTRINA` en el prompt para mercados gospel.
- **Solución definitiva:** decisión explícita del propietario y su reflejo en el prompt.
- **Responsable:** Producto.
- **Fecha objetivo:** pendiente de decisión del propietario.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-011 — Cliente IA triplicado (copy / revisor / visión) ya divergió

- **Origen:** tres implementaciones independientes de fetch+auth para los mismos
  proveedores: `js/copy-ia.js`, `js/ia-revisor.js` y `js/ia-analisis.js`. La de
  copy-ia mandaba Gemini con `Authorization: Bearer` (inválido: exige
  `x-goog-api-key`), lo que hacía fallar el botón "Proponer copy con IA".
- **Riesgo:** cada proveedor nuevo o cambio de auth debe replicarse en tres sitios;
  una copia queda atrás en silencio (ya ocurrió).
- **Impacto:** Alto (funciones de IA caen sin error visible).
- **Mitigación actual:** copy-ia corregido en PR #20 y cubierto por tests de
  contrato de red (headers, JSON mode, timeout, diagnóstico).
- **Solución definitiva:** un único módulo cliente IA (endpoints, auth, failover,
  timeouts y parseo) usado por copy, revisor y visión.
- **Responsable:** Motor/IA.
- **Fecha objetivo:** próxima revisión del subsistema IA.
- **Estado:** open.
- **Revisión:** cada release.

### DEBT-012 — Sincronización en la nube (Supabase): bancos y frases entre dispositivos con login

- **Origen:** decisión del propietario (2026-10-20): los bancos y frases aprobadas
  deben sincronizarse entre TODOS los dispositivos. `localStorage` solo cubre el
  dispositivo actual; hace falta backend/DB en la nube con autenticación.
- **Pendiente de entrada del propietario:** crear el proyecto en Supabase y pasar
  Project URL + anon key (pública) y elegir login (email+contraseña o magic link).
- **Solución definitiva:** cliente Supabase en el panel IA con auth y RLS;
  tablas `frases` (user_id, subnicho, frase, apoyo, aprobada, fecha) y `bancos`
  (id, mercado, subnicho, frases jsonb); sincronización bidireccional simple.
  Sin URL/key no se puede avanzar (no se debe inventar credenciales).
- **Responsable:** Producto + Motor.
- **Estado:** open (bloqueada: pendiente credenciales del propietario).
- **Revisión:** cada release.

### DEBT-013 — Bancos de frases del propietario (Grok) aún no integrados en el repo

- **Origen:** el propietario generó bancos con Grok a partir de un prompt dado y
  aún no los ha enviado; mientras no estén en el repo pueden perderse.
- **Solución definitiva:** integrar cada banco como `banco-personal-<nicho>.json`
  (formato actual de `getBankForSubniche`) + cableo en `data-bancos.js` vía PR,
  validando que el motor los lea y que el gate de unicidad no se vea afectado;
  una vez en repo, serán los primeros datos que sincronice DEBT-012.
- **Pendiente de entrada del propietario:** el contenido de los bancos
  (mercado/subnicho de cada uno).
- **Responsable:** Motor.
- **Estado:** open (bloqueada: pendiente envío de bancos).
- **Revisión:** cada release.
