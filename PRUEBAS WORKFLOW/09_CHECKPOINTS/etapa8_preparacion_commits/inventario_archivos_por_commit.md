# Etapa 8 — Inventario de archivos por commit

Hashes `sha256` (12 primeros hex) del estado actual del árbol.
Rama `feat/multiproducto-definitivo-2026-11` @ `33df81d`.

## Commit 1 · Superficies
| Archivo | Estado | Líneas | sha256 |
|---|---|---|---|
| `js/data-productos.js` | modificado (+21) | 355 | `30aa4a2aebc2` |
| `js/motor-nucleo.js` (porción: hunk 3) | modificado | 5.739 | `8be0b40980fc` |
| `tests/mockup-superficie.test.js` | nuevo | 127 | `618765b9af15` |

Intermedio generado para el commit: `motor_nucleo_commit1_solo_superficie.js`
(5.735 líneas LF, sha256 `5f307fc286b1…`) → se copia sobre `js/motor-nucleo.js`.

## Commit 2 · Copy Explore
| Archivo | Estado | Líneas | sha256 |
|---|---|---|---|
| `js/motor-nucleo.js` (porción: hunks 1-2) | modificado | 5.739 | `8be0b40980fc` |
| `tests/copy-explore-coherencia.test.js` | nuevo | 106 | `32a6241f2eb9` |

## Commit 3 · Núcleo multiproducto
| Archivo | Estado | Líneas | sha256 |
|---|---|---|---|
| `js/orquestador-multiproducto.js` | nuevo | 252 | `f99596fdc851` |
| `js/multiproducto-historial.js` | nuevo | 254 | `2421abd473e6` |
| `js/multiproducto-zip.js` | nuevo | 267 | `198a5c026285` |
| `tests/multiproducto-contratos.test.js` | nuevo | 139 | `fd17431f0248` |
| `tests/multiproducto-aislamiento.test.js` | nuevo | 178 | `13b903e1470f` |
| `tests/multiproducto-historial.test.js` | nuevo | 258 | `4e3e834426ea` |
| `tests/multiproducto-zip.test.js` | nuevo | 219 | `c9dbd440d427` |

## Commit 4 · Interfaz
| Archivo | Estado | Líneas | sha256 |
|---|---|---|---|
| `index.html` | modificado (+60) | 720 | `d5418e1a148e` |
| `styles.css` | modificado (+154) | 1.419 | `61714111cb2f` |
| `js/multiproducto-ui.js` | nuevo | 724 | `df708ce45388` |

## Commit 5 · Evidencias
`PRUEBAS WORKFLOW/09_CHECKPOINTS/**` — 2,3 MB, 26 `.md`, 11 `.txt`, 10 `.log`, 7 `.zip`,
5 `.patch`, 5 `.json`, 4 `.js`, 2 `.png`, 1 `.py`, 1 `.html`.
Incluye: `etapa0_base_trabajo_2026-11.md`, `etapa1_mockups/`, `etapa2_copy_explore/`,
`etapa3_nucleo_multiproducto/`, `etapa4_historial/`, `etapa5_zip/`, `etapa6_integracion/`,
`etapa7_validacion_integral/`, `etapa8_preparacion_commits/` (este plan),
`INFORME_POC_MULTIPRODUCTO_2026-11.md`, `MATRIZ_CONCEPTOS_ASIGNADOS.*`,
`poc_evidencia_2026-11/`, `poc_multiproducto_harness.js`, `PROMPT_AUDITORIA_TOTAL_QA.md`,
`regresion_poc_2026-11.resumen.txt`.

## Cobertura de los untracked (verificación)
Nuevos del desarrollo y su commit asignado:
`js/orquestador-multiproducto.js` (3), `js/multiproducto-historial.js` (3),
`js/multiproducto-zip.js` (3), `js/multiproducto-ui.js` (4),
6 tests (1, 2, 3), `PRUEBAS WORKFLOW/09_CHECKPOINTS/**` (5).
No queda ningún fichero del desarrollo sin asignar.

Pendientes **no** incluidos (ajenos/temporales): lista en `plan_commits_atomicos.md`.
