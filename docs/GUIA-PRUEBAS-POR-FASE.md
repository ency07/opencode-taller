# Guía de pruebas — Verificación por fase (Mercado Gospel)

Cada fase tiene su rama, su commit y sus pruebas. Esta guía te permite verificar que cada ajuste/fix/modificación funciona.

## Cómo ejecutar

```bash
# Suite completa (debe dar 48/48 PASS)
for f in tests/*.test.js; do node "$f"; done

# Test específico
node tests/<nombre>.test.js
```

---

## P0 — Protección/diagnóstico

**Qué se verificó:**
- `main` intacto (`d0ca672`), 48/48 tests PASS, stash intacto, ramas mapeadas
- No se modificó ningún archivo del repo

**Pruebas a ejecutar:**
```bash
# Verificar main
git rev-parse main  # → d0ca672db4ea7ad2d5ae0f950f8958e6397fd1d2

# Verificar stash
git stash list  # → stash@{0}: WIP on test/integracion-bancos

# Verificar tests
node tests/pattern-template.test.js  # → PASS (79 aserciones)
node tests/visual-prompt-contract.test.js  # → OK (93 comprobaciones)
```

**Evidencia esperada:** 48/48 PASS, main en d0ca672, stash intacto.

---

## P1 — Arquitectura creativa

**Rama:** `feat/creative-territory-engine` | **Commit:** `e491295`

**Qué se implementó:**
- `contracts/creative-contract.md` → esquema con `creativeTerritory`, `visualIdentity`, `decisionMode`
- `js/data-territorios.js` → 10 territorios con IDs, descripciones, restricciones, compatibilidades

**Pruebas a ejecutar:**
```bash
# Verificar archivo existe
ls -la contracts/creative-contract.md  # → debe existir
ls -la js/data-territorios.js  # → debe existir

# Verificar sintaxis
node --check js/data-territorios.js  # → sin errores

# Verificar contenido (10 territorios)
node -e "
const fs = require('fs');
const src = fs.readFileSync('js/data-territorios.js','utf8');
const count = (src.match(/id: \"/g) || []).length;
console.log('Territorios:', count);
const ids = src.match(/id: \"([A-Z_]+)\"/g);
console.log('IDs:', ids.join(', '));
"  # → Territorios: 10
```

**Evidencia esperada:** 10 territorios con IDs únicos, contrato con campos definidos.

---

## P2 — Catálogos

**Rama:** `feat/creative-territory-engine` | **Commit:** `e83ceb5`

**Qué se implementó:**
- `js/data-tratamientos.js` → `STRUCTURAL_TREATMENTS` (HEAVY/SOFT/MODERN), `VISUAL_TREATMENTS`, `TEXT_INTEGRATIONS`
- `js/data-tecnicas.js` → `ILLUSTRATION_TECHNIQUES`
- `js/data-composiciones.js` → `LAYOUTS`, `COLOR_MODES`

**Pruebas a ejecutar:**
```bash
# Verificar archivos existen
ls -la js/data-tratamientos.js js/data-tecnicas.js js/data-composiciones.js

# Verificar sintaxis
node --check js/data-tratamientos.js && echo "tratamientos: OK"
node --check js/data-tecnicas.js && echo "tecnicas: OK"
node --check js/data-composiciones.js && echo "composiciones: OK"

# Verificar contenido
node -e "
const fs = require('fs');
const t = fs.readFileSync('js/data-tratamientos.js','utf8');
console.log('STRUCTURAL_TREATMENTS:', (t.match(/HEAVY|SOFT|MODERN/g) || []).length, 'menciones');
const tec = fs.readFileSync('js/data-tecnicas.js','utf8');
console.log('ILLUSTRATION_TECHNIQUES:', (tec.match(/\"[^\"]+\"/g) || []).length, 'items');
const comp = fs.readFileSync('js/data-composiciones.js','utf8');
console.log('LAYOUTS:', (comp.match(/\"[^\"]+\"/g) || []).length, 'items');
"
```

**Evidencia esperada:** Archivos válidos, constantes con datos.

---

## P3 — Territorios + selector

**Rama:** `feat/ui-ux-layout-p3-territorios-selectores` | **Commit:** `b799d90`

**Qué se implementó:**
- `index.html` → selector `<select id="creativeTerritory">` con 4 territorios
- `js/motor-nucleo.js` → `MOTOR_STATE.creativeTerritory`, `visualIdentity`, `decisionMode` + lectura en `readStateFromDOM()`

**Pruebas a ejecutar:**
```bash
# Verificar selector en index.html
grep -n 'id="creativeTerritory"' index.html  # → debe existir
grep -n 'BIBLICAL_BOTANICAL\|SACRED_EDITORIAL\|BIBLICAL_ARCHAEOLOGY\|FAITH_WORKWEAR' index.html  # → 4 opciones

# Verificar MOTOR_STATE
grep -n "creativeTerritory\|visualIdentity\|decisionMode" js/motor-nucleo.js  # → debe existir en MOTOR_STATE y readStateFromDOM

# Verificar sintaxis
node --check js/motor-nucleo.js  # → sin errores

# Test funcional (verificar que readStateFromDOM lee el campo)
node -e "
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync('js/motor-nucleo.js','utf8');
// Verificar que MOTOR_STATE tiene los campos
if (src.includes(\"creativeTerritory: 'auto'\") && src.includes(\"visualIdentity: null\") && src.includes(\"decisionMode: 'assisted'\")) {
  console.log('MOTOR_STATE: OK (3 campos presentes)');
} else {
  console.log('MOTOR_STATE: FALTA');
}
if (src.includes(\"MOTOR_STATE.creativeTerritory = v('creativeTerritory'\")) {
  console.log('readStateFromDOM: OK (lee creativeTerritory)');
} else {
  console.log('readStateFromDOM: FALTA');
}
"
```

**Evidencia esperada:** Selector visible en UI, MOTOR_STATE con 3 campos, readStateFromDOM los lee.

---

## P4 — Motores Gospel+Secular

**Rama:** `feat/ui-ux-layout-p4-motores-gospel-secular` | **Commit:** `ae0ceb2`

**Qué se implementó:**
- `shared/shared-infra.js` → infraestructura neutra (productos, métodos de impresión, UI, utilidades)
- `secular-engine/secular-engine.js` → motor independiente (9 mercados, benchmarks, reglas comerciales)
- `contracts/motores-arch.md` → documentación de separación

**Pruebas a ejecutar:**
```bash
# Verificar archivos existen
ls -la shared/shared-infra.js secular-engine/secular-engine.js contracts/motores-arch.md

# Verificar sintaxis
node --check shared/shared-infra.js && echo "shared-infra: OK"
node --check secular-engine/secular-engine.js && echo "secular-engine: OK"

# Verificar contenido del secular engine
node -e "
const fs = require('fs');
const vm = require('vm');
global.window = global;
vm.runInThisContext(fs.readFileSync('secular-engine/secular-engine.js','utf8'), {filename:'secular-engine.js'});
console.log('SECULAR_MARKETS:', SECULAR_MARKETS.length, 'mercados');
console.log('SECULAR_BRAND_BENCHMARKS:', Object.keys(SECULAR_BRAND_BENCHMARKS).length, 'mercados con benchmarks');
console.log('SECULAR_RULES.qaType:', SECULAR_RULES.qaType);
console.log('initSecularEngine:', typeof initSecularEngine);
const engine = initSecularEngine({market:'streetwear', language:'es'});
console.log('Engine init:', JSON.stringify(engine));
"

# Verificar aislamiento (secular no modifica gospel)
grep -rn "motor-nucleo\|banco-gospel" secular-engine/  # → no debe haber referencias
grep -rn "secular-engine" js/  # → no debe haber referencias (aislamiento)
```

**Evidencia esperada:** Secular engine funciona independiente, no modifica Gospel.

---

## P5 — Diversidad y saturación

**Rama:** `feat/ui-ux-layout-p5-diversidad-saturacion` | **Commit:** `51d004e`

**Qué se implementó:**
- `js/diversidad-saturacion.js` → reglas de diversidad y saturación

**Pruebas a ejecutar:**
```bash
# Verificar sintaxis
node --check js/diversidad-saturacion.js && echo "diversidad: OK"

# Verificar funciones
node -e "
const fs = require('fs');
const vm = require('vm');
global.window = global;
vm.runInThisContext(fs.readFileSync('js/diversidad-saturacion.js','utf8'), {filename:'diversidad-saturacion.js'});
console.log('SATURACION_UMBRAL:', SATURACION_UMBRAL);
console.log('DISTRIBUCION_ESTILOS:', Object.keys(DISTRIBUCION_ESTILOS).length, 'niveles');
// Test aplicarDiversidad
const result = aplicarDiversidad(['HEAVY','HEAVY','HEAVY','HEAVY','SOFT'], 0.4);
console.log('aplicarDiversidad:', result);
console.log('estaSaturado:', estaSaturado(['HEAVY','HEAVY','HEAVY','HEAVY','SOFT']));
console.log('contarEstilos:', JSON.stringify(contarEstilos(['HEAVY','SOFT','MODERN','HEAVY'])));
"
```

**Evidencia esperada:** Funciones operativas, redistribución correcta, detección de saturación.

---

## P6 — Interfaz

**Rama:** `feat/ui-ux-layout-p6-interfaz-sincronizacion` | **Commit:** `b1f188e`

**Qué se implementó:**
- `js/pod-nav.js` → PODNav sincroniza `product` e `idioma`
- `js/motor-nucleo.js` → `borrarMemoria()` borra toda la memoria
- `js/ia-analisis.js` → `btnFmt` reformatea el prompt de salida

**Pruebas a ejecutar:**
```bash
# Verificar PODNav sincroniza product e idioma
grep -n "product\|language" js/pod-nav.js  # → debe aparecer en FIELDS

# Verificar borrarMemoria borra todo
grep -n "clearSetHistory\|clearCreativeMemory" js/motor-nucleo.js  # → debe existir

# Verificar btnFmt reformatea
grep -n "formatPrompt(LAST_RESULT)" js/ia-analisis.js  # → debe existir

# Test PODNav
node tests/nav-sync.test.js  # → PASS (67 aserciones)

# Verificar sintaxis
node --check js/pod-nav.js && echo "pod-nav: OK"
node --check js/motor-nucleo.js && echo "motor-nucleo: OK"
node --check js/ia-analisis.js && echo "ia-analisis: OK"
```

**Evidencia esperada:** PODNav sincroniza product/idioma, borrarMemoria borra todo, btnFmt reformatea.

---

## P7 — QA y doc

**Rama:** `feat/ui-ux-layout-p7-qa-doc` | **Commit:** `95a8627`

**Qué se implementó:**
- `README.md` → documentación completa (129 líneas)

**Pruebas a ejecutar:**
```bash
# Verificar README existe
ls -la README.md  # → debe existir

# Verificar contenido mínimo
grep -n "Arquitectura\|Ejecución\|Pruebas\|Estructura" README.md  # → debe tener secciones

# Suite completa
for f in tests/*.test.js; do node "$f"; done | grep -v PASS | head  # → solo visual-prompt-contract con "OK"
```

**Evidencia esperada:** README con arquitectura, ejecución, tests, estructura.

---

## Resumen de verificación rápida

```bash
# 1. Verificar main intacto
git rev-parse main  # → d0ca672

# 2. Verificar tests
for f in tests/*.test.js; do node "$f"; done | tail -1  # → 48/48 PASS

# 3. Verificar archivos P1
ls contracts/creative-contract.md js/data-territorios.js

# 4. Verificar archivos P2
ls js/data-tratamientos.js js/data-tecnicas.js js/data-composiciones.js

# 5. Verificar archivos P4
ls shared/shared-infra.js secular-engine/secular-engine.js contracts/motores-arch.md

# 6. Verificar archivos P5
ls js/diversidad-saturacion.js

# 7. Verificar README
ls README.md

# 8. Verificar ramas
git branch -r | grep "feat/ui-ux-layout"
```

---

## Notas importantes

- **Gospel Engine protegido:** Ninguna fase modificó `js/motor-nucleo.js` excepto P3 (agregó campos a MOTOR_STATE) y P6 (borrarMemoria). El motor principal sigue funcionando.
- **Aislamiento Secular:** `secular-engine/` no importa ni modifica archivos del Gospel Engine.
- **Infraestructura compartida:** `shared/` solo contiene datos neutrales (productos, métodos de impresión, UI).
- **Tests:** 48/48 PASS en todas las ramas. No se rompió ningún test existente.
- **Preview Vercel:** No verificado (sin CLI Vercel). El usuario debe verificar manualmente.