# Etapa 5 — Exportación ZIP sin dependencias · Resumen

**Estado: COMPLETADA** (clausura en `cierre_etapa5.md`).

- **Rama:** `feat/multiproducto-definitivo-2026-11` @ `33df81d`
- **Autorización:** «AUTORIZACIÓN EXPRESA — CIERRE ETAPA 4 E INICIO ETAPA 5»

## Archivos

| Archivo | Detalle |
|---|---|
| `js/multiproducto-zip.js` | Nuevo (STORE puro, CRC32 propio, Blob nativa). Copia de referencia en la evidencia. |
| `tests/multiproducto-zip.test.js` | Nuevo (61 aserciones). |

No se modificó el orquestador, el historial, `index.html`, los contratos, los bancos, los umbrales ni `PRODUCT_BIAS`. Sin librerías externas (no hay `package.json`, ni `node_modules`, ni `jszip/fflate/pako`).

## Implementación

ZIP en modo **STORE** (sin compresión) con tres estructuras bien separadas:
- **Encabezados locales**: firma `0x04034b50`, versión 20, flags `0x0800` (EFS/UTF-8), método 0, fecha DOS fija (determinista), CRC32, tamaños y nombre UTF-8.
- **Directorio central**: firma `0x02014b50` por entrada con CRC, tamaños, offset del encabezado local y nombre.
- **EOCD**: firma `0x06054b50`, número de entradas, tamaño y offset del directorio central.

CRC32 con tabla del polinomio `0xEDB88320`; texto con `TextEncoder` (fallback manual si no existe); descarga con `Blob` + `URL.createObjectURL`.

Contenido del ZIP:
```
00_LOTE.txt                 información general (id, fecha, contexto, totales)
NN_<PRODUCTO>_<OK|ERROR>.txt prompt + contexto de cada producto (NN = 01..N)
99_RESUMEN.txt              tabla de resultados y errores
```
Nombres saneados a ASCII (`FUNDA MÓVIL` → `FUNDA_MOVIL`), con prefijo numérico que garantiza unicidad y orden. Los productos con error llevan `_ERROR.txt` y su mensaje; el resumen marca el lote como PARCIAL.

La exportación es **solo lectura**: `generarZip(lote)` usa los datos recibidos y no escribe ni altera el historial (verificado comparando el almacenamiento antes/después).

## Pruebas y resultados reales

| Prueba | Resultado |
|---|---|
| `multiproducto-zip` (61 aserciones: 1 y 10 productos, CRC recalculado, estructura, Python zipfile, nombres, UTF-8, fallos, sin dependencias, no-modificación) | **PASS** — 61 aserciones, 0 fallos |
| Suite Node completa (98 ficheros, incluye las etapas anteriores) | **97 PASS / 0 FAIL / 1 SKIP** |
| SKIP habitual | `security-browser.test.js` (playwright no instalado) |

### Extracción real con Python `zipfile`
`extraccion_python_zipfile.txt` (sobre `muestra_10.zip`): 12 entradas; `testzip()` = None; CRC de cada entrada recalculado con `zlib.crc32` y **coincide** con el declarado; flags UTF-8 `0x0800` en todas; el contenido contiene ñ, tildes, «» y ·.

## Evidencias guardadas

`PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa5_zip/`:
`resumen_etapa5.md` (este), `tests_multiproducto_zip.log`, `muestra_10.zip`,
`extraccion_python_zipfile.txt`, `referencia_multiproducto_zip.js`, `suite_resumen.txt`.

## Limitaciones detectadas

1. **STORE sin compresión**: los ZIP son más grandes (un lote de 10 prompts ≈ 400 KB frente a ~60 KB comprimido). Aceptado por requisito (sin dependencias).
2. **Fecha DOS fija (1980-01-01)** en las cabeceras para que la salida sea determinista; la fecha real del lote va dentro del contenido (`00_LOTE.txt`).
3. Nombres internos saneados a ASCII; los caracteres originales del producto se conservan dentro del contenido y en el resumen.
4. `descargarZip()` requiere DOM real; `generarZip()` funciona en Node (validado).
5. Pendientes heredados de etapas previas (negación de COPY en modo `new` secular; respaldo `'objeto'`; claves del historial no tumbstoneadas físicamente por `clearAllMemory`). Ninguno bloquea.
