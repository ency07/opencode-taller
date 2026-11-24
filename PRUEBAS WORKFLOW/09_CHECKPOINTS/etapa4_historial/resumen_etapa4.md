# Etapa 4 — Historial local de lotes multiproducto · Resumen

**Estado: COMPLETADA** (clausura en `cierre_etapa4.md`).

- **Rama:** `feat/multiproducto-definitivo-2026-11` @ `33df81d`
- **Autorización:** «AUTORIZACIÓN EXPRESA — CIERRE ETAPA 3 E INICIO ETAPA 4»

## Archivos

| Archivo | Detalle |
|---|---|
| `js/multiproducto-historial.js` | Nuevo (254 líneas). sha256 `2421abd473e63352…`. Copia de referencia en la evidencia. |
| `tests/multiproducto-historial.test.js` | Nuevo (258 líneas, 41 aserciones). |

No se modificó el orquestador, `index.html`, los contratos, los bancos, los umbrales ni `PRODUCT_BIAS`.

## API y almacenamiento

`window.MultiproductoHistorial`:
- `guardarLote(lote, opciones)` → `{ok, id, duplicado, rotados}`; nunca sobrescribe: crea un id nuevo; con `deduplicar` (por defecto) un lote idéntico al último devuelve el existente.
- `cargarLote(id)` → lote completo o `null`.
- `listarLotes()` → resúmenes del más reciente al más antiguo.
- `eliminarLote(id)`, `contarLotes()`, `tamanoBytes()`.
- Constantes expuestas: `PREFIJO='POD2|multiproduct|'`, `MAX_LOTES=20`, `PRESUPUESTO_BYTES=4 MB`.

Claves: `POD2|multiproduct|lote|<id>` (registro) e `POD2|multiproduct|index` (índice). Registro por lote: `id, createdAt, ctx, productos[{producto, ok, prompt, context, error}], total, ok, errores`.

Compatibilidad con la memoria del Taller:
- Prefijo propio: no interfiere con `patterns`, `history`, `styleUsage` ni bancos (verificado).
- `GLOBAL_MEMORY_CLEAR_KEY`: los lotes anteriores a la barrera se ocultan (`listarLotes`/`cargarLote`) y las tumbas `__podDeleted` se ignoran. `clearAllMemory()` deja el historial inaccesible y permite guardar de nuevo.
- Regla de milisegundo compartido replicada del Taller: `createdAt = now > barrera ? now : barrera + 1`; comparación posterior **estricta**. Verificado con el caso límite en que lote y borrado comparten el mismo ms.

## Límites verificados como razonables

- Un lote real de 10 productos ocupa ~380 KB → con 4 MB caben ~10 lotes reales; la rotación combinada con el tope de 20 lotes actúa antes en lotes grandes.
- Rotación por número: 25 lotes sintéticos → quedan 20, sobrevive el más reciente.
- Rotación por presupuesto: lotes de ~300 KB → `tamanoBytes()` ≤ 4 MB tras guardar varios.
- Cuota agotada: con un localStorage limitado (900 KB) el módulo rota y conserva registros legibles; con un lote mayor que la cuota devuelve error estructurado sin corromper el índice.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `multiproducto-historial` (guardar/recuperar 10 productos y prompts, dedup, orden, eliminación, parciales/errores, rotación por lotes y por presupuesto, cuota, separación, globalClear) | **PASS** — 41 aserciones, 0 fallos |
| Suite Node completa (97 ficheros) | **96 PASS / 0 FAIL / 1 SKIP** |
| SKIP | `security-browser.test.js` (requiere playwright, no instalado) |
| Pruebas de etapas anteriores | Incluidas en la suite (mockup-superficie, copy-explore-coherencia, multiproducto-contratos, multiproducto-aislamiento, product-contract…) — todas en verde |

## Evidencias guardadas

`PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa4_historial/`:
`resumen_etapa4.md` (este), `suite_resumen.txt`, `tests_multiproducto_historial.log`,
`referencia_multiproducto_historial.js` (copia del módulo para reproducibilidad; el diff es la adición del archivo completo, no rastreado en git).

## Limitaciones y pendientes

1. **Las claves físicas no se tumbstonean con `clearAllMemory`**: el módulo escribe directamente en localStorage, fuera del registro interno de `memoria-local`, que reporta `clearedKeys: 0`. La barrera global las oculta funcionalmente (comprobado), pero no las borra del todo; el espacio se recupera en la siguiente rotación o al limpiar el sitio.
2. Sin fallback si `localStorage` no está disponible (entornos sin DOM); el navegador de la app sí lo tiene. Los tests usan un mock.
3. Dedup activo por defecto basado en contexto+productos; puede desactivarse con `{deduplicar:false}`.
4. Pendientes heredados de etapas previas (negación de COPY en modo `new` secular; respaldo `'objeto'` si falta `getProductSurface`). No bloquean.
5. UI, ZIP y recuperación desde interfaz quedan para etapas posteriores.
