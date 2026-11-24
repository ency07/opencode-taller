# Cierre — Etapa 4 · Historial local

**Estado:** COMPLETADA (autorizada junto con el inicio de la etapa 5).

## Conservación
- `js/multiproducto-historial.js` (254 líneas, sha256 `2421abd473e63352…`) y `tests/multiproducto-historial.test.js` intactos; copia de referencia en la evidencia.
- Evidencia: `resumen_etapa4.md`, `suite_resumen.txt`, `tests_multiproducto_historial.log`, `referencia_multiproducto_historial.js`.
- Pruebas: historial PASS (41 aserciones); suite 96 PASS / 0 FAIL / 1 SKIP.

## Pendientes documentados (no corregidos)

1. `clearAllMemory()` oculta funcionalmente los lotes mediante la barrera global, pero **no elimina físicamente** las claves del historial (`clearedKeys: 0` porque el módulo escribe fuera del registro interno de `memoria-local`). El espacio se recupera en la siguiente rotación o al limpiar el sitio.
2. No hay fallback cuando `localStorage` no está disponible.
3. La deduplicación está activada por defecto (desactivable con `{deduplicar:false}`).
4. Pendientes heredados: negación de COPY en modo `new` secular; respaldo `'objeto'` si `getProductSurface()` no está disponible.

No se modificó el módulo de historial durante el cierre.
