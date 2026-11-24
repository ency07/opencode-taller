# Etapa 7 — Auditoría de código y Git (diff acumulado desde la base)

Base: `33df81d5823850767a28f9ec54f64104cd5547ce` · HEAD actual: idéntico (sin commits).

## Inventario (rastreado)
| Archivo | Diff | Contenido |
|---|---|---|
| `index.html` | +60 | Panel multiproducto (sección, selects, chips, barra, pestañas, visor, historial) + 4 `<script defer>` |
| `styles.css` | +154 | Bloque `Etapa 6 · Multiproducto`: chips, estados, pestañas, progreso, visor, historial, responsive y acciones que envuelven |
| `js/data-productos.js` | +21 | `PRODUCT_SURFACE`, `getProductSurface()`, 2 exports |
| `js/motor-nucleo.js` | +35 / −4 | COPY Explore con mensaje explícito (2 ramas) y bloque de mockup por superficie |

## Inventario (nuevos, sin trackear)
| Archivo | Líneas | Uso |
|---|---|---|
| `js/orquestador-multiproducto.js` | 252 | POC + `generarMuchos`; snapshot/restore |
| `js/multiproducto-historial.js` | 254 | LocalStorage `POD2|multiproduct|` |
| `js/multiproducto-zip.js` | 267 | ZIP STORE + CRC32 |
| `js/multiproducto-ui.js` | 724 | Interfaz del flujo |
| `tests/*.test.js` (6) | — | mockup-superficie, copy-explore, contratos, aislamiento, historial, zip |

Los `_tmp_*` y `TallerPOD-UI-rediseno.html`, `.gitignore`, `DESIGN.md`,
`scripts/live_runner.py` son ajenos a este desarrollo (preexistentes); no se tocaron.

## Código duplicado
No hay copias de `buildCandidate`, `evaluaSetOk`, `formatPrompt` ni `generateSet`
(verificado por grep: solo existen en `motor-nucleo.js`). Los módulos nuevos llaman a las
funciones existentes.

## Funciones sin uso
Análisis automático de definiciones vs usos en los 4 módulos: **0 funciones huérfanas**
(se eliminó `textoDe()`, que quedaba sin uso tras una refactorización).

## Dependencias de carga
`defer` preserva el orden: motor → orquestador → historial → zip → ui. Cada módulo
comprueba sus dependencias en ejecución (`typeof window.<módulo>`), y la UI avisa si
falta alguna (“Orquestador multiproducto no disponible”). El orquestador usa solo símbolos
globales del motor ya cargados.

## Riesgos de estado global
- El orquestador aísla por snapshot/restore (motor, DOM, `LAST_RESULT`, locks) con
  `try/finally`; verificado por tests y por el harness POC.
- La UI es dueña de un solo objeto `lote` en memoria; regenerar sustituye solo el elemento
  del producto activo.
- `MOTOR_STATE` queda restaurado tras cada lote: el generador individual no ve residuos.

## Posibles pérdidas de datos
- Al generar un lote nuevo se descarta el lote anterior **en memoria**; el historial no se
  toca (los lotes guardados persisten). Declarado.
- Al cargar un lote se sustituye el lote en memoria; nada se borra del almacenamiento.
- Guardar nunca sobrescribe: crea uno nuevo o detecta duplicado (deduplicación).
- Exportar es de solo lectura.
- Al recargar la página se pierde el lote en memoria; se recupera desde el historial.

## Manejo de errores
- Generación: fallo por producto no cancela el lote (resultado `error` conservado).
- Almacenamiento: cuota → rotación y reintentos; errores devueltos con mensaje.
- ZIP: valida nombres duplicados y estructura; devuelve `{ok:false,error}`.
- UI: estados `good/warn/bad` con mensajes accionables; nunca un silencio.

## Verificación expresa de prohibidos
- `grep` sobre el diff completo: **ninguna** modificación de `UMBRAL_*`, `_PRODUCT_BIAS`,
  `PRODUCT_BIAS`, `PRODUCT_RULES`, `PLACEMENT`, familias de color ni `PRINT_PREP_RULES`.
  (La única coincidencia es un comentario que dice que no se alteran.)
- Bancos: sin cambios (`banco-*.js` intactos).
- Reglas de impresión: intactas (`PRINT_METHOD_LABELS`, `PRINT_PREP_RULES`).
- POC: hashes idénticos a los registrados (`poc_multiproducto_harness.js` `9a13a103…`,
  `INFORME_POC_MULTIPRODUCTO_2026-11.md` `8c5bb5ff…`) y evidencias sin modificar.
- `main` `d0ca672` y `fix/creative-contract-guard-2026-11` `8acd294` intactas.
