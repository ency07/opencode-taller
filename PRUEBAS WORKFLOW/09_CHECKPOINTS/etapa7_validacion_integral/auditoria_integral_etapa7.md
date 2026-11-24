# Etapa 7 — Auditoría integral del sistema multiproducto

Fecha: 2026-11-24 · Rama: `feat/multiproducto-definitivo-2026-11` @ `33df81d` (sin commits)
Base de comparación: `33df81d5823850767a28f9ec54f64104cd5547ce`

## 1. Clasificación de superficies (10 productos)
`js/data-productos.js`: `PRODUCT_SURFACE` + `getProductSurface()`; exportados como
`window.PRODUCT_SURFACE` / `window.getProductSurface`.

| Superficie | Productos |
|---|---|
| prenda | CAMISETA SOFT, CAMISETA APPAREL, HOODIE, ILUSTRACION PREMIUM APPAREL |
| pared | DISPLATE |
| objeto | GORRA, MUG, MOCHILA, TOTE BAG, FUNDA MÓVIL |

Comprobado en navegador sobre los prompts de los 10: prendas con mockup de modelo y
talla; DISPLATE con “lámina en pared… nunca sobre cuerpo humano”; objetos con “objeto en
uso o en escena”. Valores desconocidos/vacíos → `objeto` (respaldo declarado).

## 2. Coherencia de COPY en Explore
`formatPrompt` (motor) usa el mensaje explícito como único copy autorizado cuando no hay
copy canónico (`typedMessage`), en las ramas Explore gospel y secular. Verificado en los 10
prompts: `MENSAJE EXACTO` y `COPY` contienen «Que tu luz alumbre el camino».

## 3. Orquestación multiproducto
`generarMuchos({ctxBase, productos, onProgreso})` secuencial, con snapshot/restore por
producto y resultados parciales. API POC conservadas (`generarProducto`, `generar`,
`generarAislado`). La POC original da 10/10 con el código actual.

## 4. Aislamiento y restauración
`tests/multiproducto-aislamiento.test.js`: fallo inyectado en MUG, los 9 restantes
conservados; `try/finally` por producto. Restauración verificada en navegador
(`motorDifiereEn=[]`, `domDifiereEn=[]`, `lastResultIgual=true`, `locksNulos=true`).

## 5. Errores parciales
Cancelación durante lote de 10 → `Cancelado por el usuario con resultados parciales: 3 OK ·
0 errores · 3/10`; chips 3×OK y 7×`—`; `lote.ok=false`. ZIP con error → `02_MUG_ERROR.txt`
y PARCIAL.

## 6. Historial y recuperación
`POD2|multiproduct|` en LocalStorage, máx. 20 lotes / ~4 MB, rotación, deduplicación,
tumbas y barrera global. Guardar/cargar/eliminar/listar verificados; carga = ~0,5 s sin
regenerar (10 productos, mismas longitudes).

## 7. Exportación ZIP
STORE sin dependencias, CRC32 propio, UTF-8 (EFS 0x800). Lote de 10: 12 entradas,
392.895 bytes, `testzip()=None`, CRC coincidente, COMPLETO.

## 8. Interfaz y responsive
Panel `#mpPanel` con selección, modos, contexto, progreso real, pestañas, copiado,
historial y ZIP. 390 px: 2 columnas, `scrollWidth 382 < innerWidth 390` (sin scroll
horizontal); 1280 px sin desbordes.

## 9. Regeneración individual
Cambia solo el producto elegido (hash distinto) y los otros 9 quedan idénticos.

## 10. Compatibilidad del generador individual
`#btnDirector`/`#btnBuild` generan en `#out` (38.944 caracteres verificados) y el panel
multiproducto conserva su lote (10 productos, 10 pestañas).

## 11. Carga y orden de dependencias
`index.html` (final): `… sync-supabase.js` → `orquestador-multiproducto.js` →
`multiproducto-historial.js` → `multiproducto-zip.js` → `multiproducto-ui.js`, todos `defer`
(mismo orden de ejecución garantizado). El motor se carga antes que el orquestador.
Sin dependencias externas: solo scripts propios; ZIP implementado a mano (CRC32/STORE).

## 12. Problemas de integración entre módulos (revisión específica)
- **UI ↔ orquestador**: la UI pasa exactamente las claves que `_escribirContexto` entiende;
  los campos de variación vivían en el DOM y ahora se leen con `val()` (no estaban en
  `MOTOR_STATE`). Corregido y verificado con los 10 productos.
- **`ctxFromDom` usa `MOTOR_STATE` primero y el DOM como respaldo**: si el motor y el DOM
  discrepan (p. ej. `subniche` tras un cambio de mercado), el prompt sigue al motor. Es
  coherente con el generador individual, pero conviene conocerlo.
- **El lote cargado del historial traía `id: null` y `ok` ausente** → el ZIP decía
  `(sin id)` y PARCIAL. Corregido (la UI conserva `id`/`createdAt`/`ok`/`errores`).
- **Sin tests de UI en Node**: la interfaz se validó por CDP (no hay harness Node para
  `multiproducto-ui.js`); declarado como limitación.
