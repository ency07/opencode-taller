# Etapa 6 — Registro de ejecución real en navegador (CDP)

Entorno: Edge headless `Edg/158.0.4370.33`, CDP 1.3, puerto 9224, servidor `http://127.0.0.1:8080/`.
Método: `browser_cdp` (Runtime.evaluate / Page.navigate / Input.dispatchMouseEvent) y `browser_exec` solo para capturas.
Sin modificar el código de producción para adaptar las pruebas.

## 0. Carga inicial
- `index.html` carga sin errores JS (`window.__errs === []` con colector inyectado por `Page.addScriptToEvaluateOnNewDocument`).
- Panel `#mpPanel` presente, 10 chips (leídos del `<select id="product">`), contador 10, modo `all`.
- Módulos cargados: `OrquestadorMultiProducto`, `MultiproductoHistorial`, `MultiproductoZip`, `MultiproductoUI`.

## 1. Generación de los 10 productos (modo TODOS)
- Contexto fijado por DOM: `region=costa_caribe`, `subniche=fe_popular_col`, `serie=ETAPA6`, `concept=farolito de papel iluminando la noche`, `message=Que tu luz alumbre el camino`.
- Progreso intermedio observado a los 4 s: `barra=40%`, `status="Generando MUG… (5 de 10)"`, chips `OK OK OK OK … — — — — —`, `#mpGenerate.disabled=true` (anti-duplicados), 4 pestañas ya creadas.
- Final: `Lote terminado: 10 OK · 0 errores · 10/10`, 10 chips OK, 10 prompts.
- Longitudes: 38.922 / 38.174 / 38.161 / 38.646 / 37.560 / 38.353 / 38.033 / 37.503 / 38.016 / 37.308.
- Los 10 prompts son distintos entre sí (`Set.size === 10`).
- Todos mencionan su producto, el concepto (`farolito`) y el mensaje exacto.
- Verificación de superficie en texto:
  - CAMISETA SOFT: `PRODUCTO: CAMISETA SOFT … costuras laterales, cuello y dobladillo` + mockup con modelo.
  - GORRA / MUG: `REGLAS DEL MOCKUP COMERCIAL (el objeto en uso o en escena — NO el arte)` (sin lenguaje textil impropio).
  - DISPLATE: `El mockup debe mostrar la lámina en pared o ambiente real, nunca sobre cuerpo humano`, `pieza de pared, no prenda`.

## 2. Generación de productos seleccionados
- Modo `SELECCIONADOS` con 3 marcas (CAMISETA SOFT, MUG, DISPLATE) → botón `Generar 3 productos`.
- Progreso intermedio: `barra=66.6667%`, `"Generando DISPLATE… (3 de 3)"`.
- Final: `3 OK · 0 errores · 3/3`. Chips no seleccionados quedan `—`.

## 3. Visualización de resultados
- 10/10 pestañas clicables; cada click carga su prompt en `#mpPrompt` con su meta (`producto · OK · N caracteres · contexto mercado/región/producto`).
- Los demás resultados se conservan (longitudes intactas tras recorrer todas las pestañas).

## 4. Copiado
- `navigator.clipboard.writeText` y `execCommand('copy')` están denegados en este Edge headless (`NotAllowedError` con permisos concedidos, foco activo y `Input.dispatchMouseEvent` real). Limitación del entorno, no de la app.
- El fallback dejó el visor seleccionado: mecanismo registrado `fallback-seleccion`, selección `0-38.504`, estado `Prompt copiado (fallback-seleccion).`
- En navegador con portapapeles permitido usa `clipboard`; si no, selecciona el tramo y avisa para Ctrl+C (nunca muestra un callejón sin salida).

## 5. Regeneración individual
- Primera versión devolvía el mismo prompt (el restore de estado repetía la semilla). Corregido pasando `rerollNonce` por el orquestador (adición aditiva).
- Tras la corrección: DISPLATE cambia de contenido (hash distinto, 37.554 → 37.277 caracteres) y **los otros dos productos conservan su prompt exacto** (`otrosIguales: true`). Estado `Regenerado DISPLATE: OK`.

## 6. Historial: guardado y recuperación
- Guardar: `Lote guardado: 1795522653326-ueate0`; visible en el historial (`2026-11-24 07:17 · 3 productos · COMPLETO`).
- Recuperación tras recargar la página: `Lote cargado sin regenerar: … · 3 productos` en ~0,5 s (500 ms de espera de la sonda), con las longitudes originales (38.390 / 37.717 / 37.312), no las regeneradas. No hubo generación.
- Metadatos del lote conservados al cargar: `id`, `createdAt`, `ok`, `errores`.

## 7. Exportación ZIP y extracción real
- Botón `Exportar ZIP del lote`: `ZIP generado y descargado: lote-multiproducto-1795522653326-ueate0.zip · 117.575 bytes`.
- ZIP enviado tal cual al receptor HTTP de evidencia y abierto con Python `zipfile`:
  - Entradas: `00_LOTE.txt`, `01_CAMISETA_SOFT_OK.txt`, `02_MUG_OK.txt`, `03_DISPLATE_OK.txt`, `99_RESUMEN.txt`.
  - `testzip()` → `None`; `compress_type=0` (STORE); `flag_bits=0x800` (UTF-8); CRC recalculado por Python coincide.
  - `00_LOTE.txt` con ID, fecha, `Resultado global: COMPLETO`, contexto; `99_RESUMEN.txt` con tabla por producto.
- Lote con error inyectado (vía `generarZip`): `02_MUG_ERROR.txt`, `Resultado global: PARCIAL`, `Errores: 1`.

## 8. Errores y resultados parciales
- Cancelación durante un lote de 10: `Cancelado por el usuario con resultados parciales: 3 OK · 0 errores · 3/10`; chips 3×OK y 7×`—`; `lote.ok=false` (se exporta como PARCIAL).
- Fallos de producto dentro del motor: cubiertos por `multiproducto-aislamiento.test.js` (fallo inyectado en MUG, los 9 restantes conservados).

## 9. Generador individual intacto
- Tras pulsar `#btnDirector`/`#btnBuild`: `#out` con 38.594 caracteres y estado `Prompt y selectores verificados · audiencia 79/100 · producto 100/100…`.
- El panel multiproducto conservó sus 3 pestañas después del uso del generador individual.

## 10. Responsive
- La emulación de métricas (`Emulation.setDeviceMetricsOverride`) no surtió efecto en este Edge headless (`innerWidth` siguió en 756, `devicePixelRatio=1`), así que se verificó el CSS con un iframe real de 390×844 y 1280×900 (mismo origen).
- A 390 px: `.mp-grid` = 2 columnas (~145–152 px por ficha), panel 346 px, `scrollWidth=378 < innerWidth=386` → **sin desbordamiento horizontal**. Se corrigió un desbordamiento de 4 px causado por `#mpZip` (acciones que ahora envuelven).
- A 1280 px: 2 columnas según el ancho real de la columna izquierda; sin desbordamiento.
- Nota: el encaje a 390 px se verificó recargando el iframe tras el cambio de CSS (primera medición: 4 px de desborde; tras la corrección: 0).

## 11. Suite Node
- `suite_node_resumen.txt`: 98 ficheros, **10.623 PASS · 0 FAIL · 0 SKIP**.

## 12. Correcciones surgidas de la propia validación
1. `framing()` quedó con un temporizador de seguridad (150 ms): si `requestAnimationFrame` no dispara (headless/segundo plano), la generación no se colgaba. Detectado en `browser_exec`.
2. Regeneración individual con `rerollNonce` (orquestador + UI).
3. Acciones del panel con `flex-wrap` y `flex-basis` para no desbordar en móvil.
4. Mensaje de cancelación y `lote.ok=false` cuando el lote queda incompleto.
5. Conservación de `id`/`createdAt`/`ok`/`errores` al cargar un lote (el ZIP antes decía `(sin id)` y PARCIAL).
