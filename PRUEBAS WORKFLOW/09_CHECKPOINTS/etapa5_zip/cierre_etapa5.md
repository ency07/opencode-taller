# Cierre — Etapa 5 · Exportación ZIP

**Estado:** COMPLETADA (autorizada junto con el inicio de la etapa 6).

## Conservación
- `js/multiproducto-zip.js` y `tests/multiproducto-zip.test.js` intactos; copia de referencia del módulo en la evidencia.
- Pruebas: `multiproducto-zip` PASS (61 aserciones); suite 97 PASS / 0 FAIL / 1 SKIP.
- Extracción real con Python `zipfile`: 12 entradas, `testzip()` None, CRC coincidente en todas, flags UTF-8 `0x0800`.

## Pendientes documentados (no corregidos)
1. STORE sin compresión: ZIP más grande (~400 KB por lote de 10) a cambio de cero dependencias.
2. Fecha DOS fija (1980-01-01) en cabeceras para salida determinista; la fecha real va en el contenido.
3. Nombres internos ASCII (el original se conserva dentro del contenido).
4. `descargarZip()` requiere DOM; `generarZip()` funciona en Node.
5. Heredados: negación de COPY en modo `new` secular; respaldo `'objeto'` si falta `getProductSurface`; claves del historial no tumbstoneadas físicamente por `clearAllMemory`.
