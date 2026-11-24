# Etapa 7 — Pruebas de regresión (resultados reales)

Todas ejecutadas el 2026-11-24 sobre `feat/multiproducto-definitivo-2026-11` @ `33df81d`.
Navegador: Edge `Edg/158.0.4370.33`, CDP 1.3, `http://127.0.0.1:8080/`.

| # | Prueba | Resultado |
|---|---|---|
| 1 | Suite Node completa | **98 ficheros · 10.646 PASS · 0 FAIL · 0 SKIP** (`suite_node_resumen.txt`, `suite_completa.log`) |
| 2 | POC original (10 comprobaciones) | **10/10 OK** en 42,9 s; restauración íntegra (`motorDifiereEn=[]`, `domDifiereEn=[]`, `lastResultIgual=true`, `locksNulos=true`) |
| 3 | Contratos de producto | `product-contract.test.js` rc=0; ver `tests_especificos.log` |
| 4 | Aislamiento | `multiproducto-aislamiento.test.js` 63 aserciones, 0 fallos |
| 5 | Historial | `multiproducto-historial.test.js` 41 aserciones, 0 fallos |
| 6 | ZIP + extracción real | `multiproducto-zip.test.js` rc=0; además `python3 zipfile` sobre `etapa7_lote_10.zip`: 12 entradas, `testzip()=None`, STORE, EFS 0x800, CRC coincidente |
| 7 | Flujo completo multiproducto (CDP) | 10/10 OK en 64 s; 10 prompts independientes; progreso real (20 % a “Generando HOODIE… (3 de 10)”) |
| 8 | Generador individual | `#out` 38.944 caracteres, `audiencia 79/100 · producto 100/100`; lote MP intacto |
| 9 | Responsive | iframe 390×844: 2 columnas, sin scroll horizontal (382 < 390); iframe 1280×900: sin desbordes |
| 10 | Consola y errores de ejecución | `window.__errs === []` tras carga, lote de 10, regeneración, cancelación y guardado/carga/ZIP |

## Detalle del flujo completo (CDP)
- Regenerar DISPLATE: cambia su hash y los otros 9 quedan idénticos.
- Guardar: `Lote guardado: 1795529583814-c4lyu7` · `2026-11-24 09:13 · 10 productos · COMPLETO`.
- Cargar: `Lote cargado sin regenerar: 1795529583814-c4lyu7 · 10 productos` (~0,5 s), mismas longitudes de prompt (no hubo regeneración).
- ZIP: 392.895 bytes, 12 archivos, `00_LOTE.txt` con ID/fecha/COMPLETO.

## Pruebas que no se pudieron ejecutar
- Ninguna. No hay SKIP en la suite. El portapapeles automático no pudo confirmarse en
  headless (`NotAllowedError`); se verificó el fallback seleccionable y queda como
  limitación de entorno, no como prueba omitida.

## Artefactos
`suite_node_resumen.txt`, `suite_completa.log`, `tests_especificos.log`,
`etapa7_lote_10.zip`, `poc_resultado_etapa7.json` (volcado del harness POC).
