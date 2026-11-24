# Etapa 8 — Plan de 5 commits atómicos (propuesta, NO ejecutada)

Rama: `feat/multiproducto-definitivo-2026-11` @ `33df81d` · Sin commits, push ni merge.
Restricción respetada: este documento prepara el plan; **no ejecuta** `git add`/`commit`.

## Reparto general
| # | Commit | Alcance | Archivos |
|---|---|---|---|
| 1 | Superficies | `PRODUCT_SURFACE`, `getProductSurface()` y mockup por superficie | `js/data-productos.js`, `js/motor-nucleo.js` (solo hunk superficie), `tests/mockup-superficie.test.js` |
| 2 | Copy Explore | COPY literal del mensaje en Explore | `js/motor-nucleo.js` (solo hunks copy), `tests/copy-explore-coherencia.test.js` |
| 3 | Núcleo multiproducto | orquestador + historial + ZIP | `js/orquestador-multiproducto.js`, `js/multiproducto-historial.js`, `js/multiproducto-zip.js`, `tests/multiproducto-contratos.test.js`, `tests/multiproducto-aislamiento.test.js`, `tests/multiproducto-historial.test.js`, `tests/multiproducto-zip.test.js` |
| 4 | Interfaz | panel, estilos y módulo UI | `index.html`, `styles.css`, `js/multiproducto-ui.js` |
| 5 | Evidencias | documentación y resultados etapas 0–8 | `PRUEBAS WORKFLOW/09_CHECKPOINTS/**` |

## Caso especial: `js/motor-nucleo.js` pertenece a dos commits
El fichero acumula dos cambios **independientes** (verificado):
- hunk 1 (`@@ -4290`): COPY gospel Explore con `typedMessage`;
- hunk 2 (`@@ -4302`): COPY secular Explore con `typedMessage`;
- hunk 3 (`@@ -4332`): bloque de mockup por superficie.

Comprobado que los hunks son disjuntos y reversibles: `HEAD + hunk3` genera un estado válido
(`node --check` rc=0) y `estado + hunks 1-2` reproduce exactamente el working tree. Para
repartirlos sin `git add -p` interactivo, se incluye `partir_motor.py` (ya probado), que
genera la versión intermedia “solo superficie”.

## Secuencia de comandos (propuesta)
```bash
cd "C:/Users/Administrator/Desktop/POD/Taller-pod-copia opencode"
BASE=33df81d5823850767a28f9ec54f64104cd5547ce

# --- 1) Superficies ---
cp js/motor-nucleo.js /tmp/motor.full.js                 # copia con ambos cambios
python3 "PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa8_preparacion_commits/partir_motor.py" . .
cp motor_nucleo_commit1_solo_superficie.js js/motor-nucleo.js
node --check js/motor-nucleo.js && node tests/mockup-superficie.test.js
git add js/data-productos.js js/motor-nucleo.js tests/mockup-superficie.test.js
git commit -m "feat(product): mockups por superficie (prenda/pared/objeto)"

# --- 2) Copy Explore ---
cp /tmp/motor.full.js js/motor-nucleo.js                  # restaura ambos cambios
git add js/motor-nucleo.js tests/copy-explore-coherencia.test.js
node --check js/motor-nucleo.js && node tests/copy-explore-coherencia.test.js
git commit -m "fix(prompt): copy literal del mensaje en modo exploración"

# --- 3) Núcleo multiproducto ---
git add js/orquestador-multiproducto.js js/multiproducto-historial.js js/multiproducto-zip.js \
        tests/multiproducto-contratos.test.js tests/multiproducto-aislamiento.test.js \
        tests/multiproducto-historial.test.js tests/multiproducto-zip.test.js
git commit -m "feat(multiproduct): orquestador, historial local y exportación ZIP"

# --- 4) Interfaz ---
git add index.html styles.css js/multiproducto-ui.js
git commit -m "feat(multiproduct): interfaz del flujo multiproducto"

# --- 5) Evidencias ---
git add "PRUEBAS WORKFLOW/09_CHECKPOINTS"
git commit -m "docs(pruebas): evidencia de las etapas 0-8 del desarrollo multiproducto"
```
Nota: tras el commit 2, `js/motor-nucleo.js` queda con el contenido completo (ambos cambios),
que es el estado actual del árbol; no hace falta volver a añadirlo.

## Criterios de “funciona por separado”
- Commit 1: `tests/mockup-superficie.test.js` + `tests/product-contract.test.js`.
- Commit 2: `tests/copy-explore-coherencia.test.js` + `tests/product-contract.test.js`.
- Commit 3: los 4 tests nuevos + POC en navegador (orquestador/historial/ZIP siguen operativos).
- Commit 4: smoke CDP (panel carga, 1 producto, pestaña, historial, ZIP). No hay test Node de UI.
- Commit 5: solo documentación; no afecta a ejecución.

## Excluidos (ajenos o temporales, no se commitean)
`_tmp_cases.js`, `_tmp_left.html`, `_tmp_right.html`, `_tmp_prompt_*.txt`, `_tmp_repro_king.js`,
`_tmp_ui_inventory.json`, `TallerPOD-UI-rediseno.html`, `.gitignore`, `DESIGN.md`,
`scripts/live_runner.py`, `scripts/__pycache__/`, `PRUEBAS WORKFLOW/01_GOSPEL_ES/` (zona ajena).
