# Etapa 3 — Núcleo multiproducto (10 productos, sin interfaz) · Resumen

**Estado: COMPLETADA** (clausura en `cierre_etapa3.md`).

- **Rama:** `feat/multiproducto-definitivo-2026-11` @ `33df81d`
- **Autorización:** «AUTORIZACIÓN EXPRESA — CIERRE ETAPA 2 E INICIO ETAPA 3»

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `js/orquestador-multiproducto.js` | Añade `generarMuchos({ctxBase, productos, onProgreso})` y la exporta. No modifica las funciones existentes salvo la lista de exports (+1 entrada). |
| `tests/multiproducto-contratos.test.js` | Nuevo (118 aserciones). |
| `tests/multiproducto-aislamiento.test.js` | Nuevo (63 aserciones). |

Sin cambios en `index.html`, `motor-nucleo.js`, `data-productos.js` ni en los tests previos. Sin historial, ZIP ni UI (etapas posteriores).

## Explicación concreta

`generarMuchos()`:
- Procesa la lista de productos **en secuencia** (nunca concurrente).
- Cada producto pasa por `generarProductoAislado()`, cuyo `try/finally` restaura motor + DOM + `LAST_RESULT` + locks.
- Toma un **snapshot inicial del estado global** y lo restaura al terminar el lote en `finally`: el lote queda invisible para el resto de la app (contenedores `_generationCounter`/`_rerollNonce` incluidos, que el restore por producto dejaba avanzados).
- Un fallo en un producto no cancela el lote; los resultados parciales se conservan y se devuelven.
- `onProgreso({indice, total, producto, resultado})` tras cada producto, también si falla; un error en el callback no detiene el lote.
- Devuelve `{ok, total, resultados}`.

Compatibilidad conservada: `generarProducto`, `generar`, `generarAislado` siguen expuestas y funcionando (verificadas en tests y en navegador). No se duplica `buildCandidate`, `evaluaSetOk` ni `formatPrompt` (assert estático sobre el archivo + reutilización de `generateSet`/`formatPrompt`).

Diff: `diff_etapa3_orquestador.patch` (59 líneas, solo adición + export). La versión previa (9.540 bytes) se reconstruyó en scratch para poder diffear (el archivo no está rastreado en git).

## Pruebas y resultados reales

| Prueba | Resultado |
|---|---|
| `multiproducto-contratos` (10 productos, una operación) | **PASS** — 118 aserciones, 0 fallos (29,6 s) |
| `multiproducto-aislamiento` (restauración, fallo individual, regeneración, compatibilidad, generador único) | **PASS** — 63 aserciones, 0 fallos |
| POC (`poc_multiproducto_harness.js`) re-ejecutada en navegador con el código actual | **10/10 checks OK** |
| `generarMuchos(10)` en navegador real (Edge headless + CDP) | **ok=true**, 10/10, 46,7 s, `estadoRestaurado=true`, progreso 0..9 |
| Suite Node completa (96 ficheros) | **95 PASS / 0 FAIL / 1 SKIP** |
| SKIP | `security-browser.test.js` (requiere playwright, no instalado) |

**Productos procesados:** los 10 del catálogo, sin fallos en el lote completo: CAMISETA SOFT, CAMISETA APPAREL, HOODIE, GORRA, MUG, MOCHILA, TOTE BAG, FUNDA MÓVIL, ILUSTRACION PREMIUM APPAREL, DISPLATE. En el test de aislamiento, MUG falló de forma **inyectada** (simulación controlada) y los otros 9 conservaron su resultado.

## Aislamiento y restauración (evidencia)

- En Node: `JSON(MOTOR_STATE+DOM+LAST_RESULT+locks)` idéntico antes/después del lote; `_ACTIVE_GEN_LOCKS === null`.
- En navegador: snapshot (motor, DOM, `LAST_RESULT`, locks, avisos) idéntica antes/después → `estadoRestaurado: true` (`resumen_generarmuchos_navegador.json`).
- Memoria local: las claves nuevas quedan segregadas por producto; ninguna clave mezcla dos productos (test).
- Fallo individual: `window.generateSet` parcheado para lanzar en MUG → 9 resultados ok + 1 con error `FALLO_INYECTADO_ETAPA3`; el lote continuó.
- Regeneración individual: regenerar MUG no alteró los prompts/contextos de los demás resultados.

## Evidencias guardadas

`PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa3_nucleo_multiproducto/`:
`resumen_etapa3.md` (este), `diff_etapa3_orquestador.patch`, `suite_resumen.txt`,
`tests_multiproducto_contratos.log`, `tests_multiproducto_aislamiento.log`,
`resumen_poc_revalidado.json`, `resumen_generarmuchos_navegador.json`.

## Protecciones verificadas

- `index.html`: 0 cambios. `main`: `d0ca672`; `fix/creative-contract-guard-2026-11`: `8acd294` (intactas).
- POC: harness e informe sin cambios (sha256 `9a13a103…` / `8c5bb5ff…`); el módulo de la POC fue **ampliado** conservando sus tres API, como pedía la autorización.
- Sin commits, push, merge ni despliegues. Etapa 4 no iniciada.

## Limitaciones y riesgos pendientes

1. La memoria anti-repetición (patrones/historial/colores) **no** se revierte: es comportamiento del motor por diseño; el lote deja esas claves nuevas, siempre separadas por producto.
2. Los tests en Node usan un DOM mínimo construido en el propio test; el generador real se validó aparte en navegador (lote de 10 + POC 10/10).
3. `generarMuchos` requiere el DOM real para ser fiel a la app; en Node sin DOM se degrada a valores por defecto.
4. Pendientes heredados: negación de COPY en modo `new` secular; respaldo `'objeto'` si `getProductSurface()` falta. Ninguno bloquea esta etapa.
5. Sin UI, historial ni ZIP todavía: fuera del alcance de la etapa 3.
