# INFORME — POC MULTIPRODUCTO (CAMISETA SOFT / DISPLATE)

- **Fecha:** 2026-11-23
- **Autorización:** "AUTORIZACIÓN CONTROLADA — POC MULTIPRODUCTO"
- **Rama de trabajo:** `feat/multiproduct-poc-2026-11` @ `33df81d`
- **Rama de salvaguarda:** `backup/pre-multiproduct-poc-2026-11` @ `33df81d`
- **Rama de referencia de la que partió:** `feat/product-contract-completion-2026-11` @ `33df81d`
- **Estado:** POC ejecutada y verificada · **sin commit, sin merge, sin despliegue**

---

## 1. Archivos nuevos y modificados

### Nuevos

| Archivo | Descripción |
|---|---|
| `js/orquestador-multiproducto.js` | Orquestador de la POC. Expone `window.OrquestadorMultiProducto` con `generarProducto`, `generar` y `generarAislado`. No esta referenciado desde `index.html`: se inyectó por CDP solo para la prueba. |
| `PRUEBAS WORKFLOW/09_CHECKPOINTS/poc_multiproducto_harness.js` | Harness de verificación que corre dentro de la pagina y ejecuta las 10 pruebas obligatorias. |
| `PRUEBAS WORKFLOW/09_CHECKPOINTS/poc_evidencia_2026-11/prompt_CAMISETA_SOFT.txt` | Prompt completo generado (38.671 chars, sha256 `3abde291…`) . |
| `PRUEBAS WORKFLOW/09_CHECKPOINTS/poc_evidencia_2026-11/prompt_DISPLATE.txt` | Prompt completo generado (37.867 chars, sha256 `b860e906…`). |
| `PRUEBAS WORKFLOW/09_CHECKPOINTS/poc_evidencia_2026-11/resumen_poc.json` | Resultado estructurado de la corrida definitiva (10 pruebas + snapshots + hashes). |
| `PRUEBAS WORKFLOW/09_CHECKPOINTS/regresion_poc_2026-11.resumen.txt` | Resumen por suite de la regresion Node (91 pass / 0 fail / 1 skip). |

### Modificados

**Ninguno.** `index.html`, `js/motor-nucleo.js`, `js/data-productos.js` no tienen ningun diff. No se toco `main` ni `fix/creative-contract-guard-2026-11`.

---

## 2. Diseno y justificacion

La POC reutiliza el pipeline existente (`generateSet` → `evaluaSetOk` interno → `formatPrompt`) y **no duplica** `buildCandidate`, `evaluaSetOk` ni `formatPrompt`.

Decisiones:

1. **Aislamiento por snapshot/restore con `try/finally`.** Antes de cada producto se captura el estado mutable que interviene: `MOTOR_STATE` (clon profundo), `LAST_RESULT`, los valores de los 27 selectores del DOM que el motor lee, `_ACTIVE_GEN_LOCKS` y `_GEN_LOCK_WARNINGS`. En el `finally` se restaura todo, incluso si `generateSet` lanza.
2. **Fallo aislado por producto.** `generar()` delega en `generarProductoAislado`, que captura la excepcion de un producto y devuelve `{ok:false, error}` sin abortar los hermanos (prueba 9). Sin esto, un fallo destruiria el resultado ya obtenido.
3. **Selects validados contra sus opciones.** Si se inyecta un valor que no existe como opcion (`region: 'global'` no existia en `#region`), asignarlo dejaba `selectedIndex=-1` y el motor leia region vacia. Ahora solo se escribe el valor si existe opcion, y despues se alinea `MOTOR_STATE` con lo que el DOM va a leer realmente (`_alinearConDom`), sin efectos secundarios del pipeline.
4. **Sin concurrencia.** La POC es secuencial: dos generaciones intercaladas compartirian el estado global. Documentado como limitacion.

Que **no** hace la POC: UI multiproducto, ZIP, historial, catalogo completo.

---

## 3. Pruebas obligatorias — resultados (10/10)

Corrida definitiva: `2026-11-23T22:35:38Z`, memoria `POD2|` limpia antes de arrancar, contexto unico para ambos productos (`concepto: farolito de papel iluminando la noche`, `mensaje: Que tu luz alumbre el camino`, serie `POC-AISLAMIENTO-2026-11`, mercado `colombia`).

| # | Prueba | Resultado | Evidencia |
|---|---|---|---|
| P1 | Mismo concepto y mensaje en ambos productos | OK | Los dos prompts extraen exactamente el concepto y el mensaje inyectados. |
| P2 | Set A/B/C independiente por producto | OK | Ternas de estilo/jerarquia/tratamiento/layout distintas entre productos (p. ej. CAMISETA: Cómic-Halftone / Stencil Urbano / Superflat; DISPLATE: Foil Stamp / Pop art / Line art) y las 3 fichas de cada set son diversas. |
| P3 | Reglas textiles en CAMISETA SOFT | OK | Presente la regla completa de producto, `pecho centrado medio`, `costuras laterales`. |
| P4 | Reglas de arte mural en DISPLATE | OK | Presente `DISPLATE: … obra mural premium`, `margen de seguridad minimo del 5%`, mockup `placa mural metalica`. |
| P5 | Ausencia de instrucciones textiles en DISPLATE | OK | No aparece la regla de CAMISETA SOFT, ni `pecho centrado medio`, ni `costuras laterales`. Si aparece la negacion explicita `NO es una camiseta ni un estampado textil`. |
| P6 | Ausencia de contaminacion entre locks y memorias | OK | `_ACTIVE_GEN_LOCKS` nulo antes/despus; avisos sin cambios; 6 claves de memoria nuevas por producto (12 en total) con el producto en la clave y **0 mezclas** detectadas. |
| P7 | Restauracion completa del estado original | OK | `MOTOR_STATE` sin ninguna clave distinta, DOM sin diferencias, `LAST_RESULT` igual. |
| P8 | Recuperacion independiente de ambos resultados | OK | Los dos resultados quedan accesibles; cada `context.product` es el correcto. |
| P9 | Fallo de un producto sin perdida del otro | OK | Con `generateSet` parcheado para lanzar en DISPLATE: CAMISETA devuelve prompt valido, DISPLATE devuelve `error: FALLO_INYECTADO_POC`, locks nulos y estado restaurado. |
| P10 | Regeneracion de un producto sin modificar el otro | OK | Regenerar CAMISETA no introduce registro mural; el prompt guardado no cambia; la regeneracion produce un set distinto. |

**Rendimiento:** CAMISETA ~4,6 s y DISPLATE ~4,5 s por producto (generateSet evalua hasta 3000 candidatos por set). Total de la corrida completa: ~28 s.

---

## 4. Regresion del sistema existente

`node tests/*.test.js` en la rama de la POC: **91 pass, 0 fail, 1 skip**.
El skip es `tests/security-browser.test.js`, que requiere `playwright` (no instalado en este equipo); no es un fallo de codigo. Resumen completo por suite: `regresion_poc_2026-11.resumen.txt` (el log íntegro peso ~98 MB y se elimino despues de extraer el resumen).
El orquestador, al no estar referenciado desde `index.html`, no puede afectar al motor ni a los tests.

---

## 5. Problemas encontrados (no ocultados)

1. **Defecto del motor (no de la POC):** el bloque `REGLAS DEL MOCKUP COMERCIAL` de DISPLATE conserva lenguaje textil y de prenda (`el modelo que lleva la prenda`, `camiseta de corte y talla`) aunque la regla DISPLATE anade `Nunca sobre cuerpo humano` y `placa mural metalica`. Es una contradiccion real en el prompt de DISPLATE. **No se corrigio** porque alterar contratos creativos esta prohibido en esta autorizacion.
2. **Defecto del motor (no de la POC):** en el sandbox quedaba `de la region .` cuando la region inyectada no existe como opcion del select. **Corregido del lado del orquestador** (validacion de opciones + alineacion con el DOM); verificado que ahora dice `de la region todas` en ambos productos.
3. **Defecto del motor (no de la POC):** en mercado colombia + modo exploracion, el prompt dice `COPY: no hay mensaje ni concepto autorizado para derivarlo` y a la vez usa `COPY PRINCIPAL LITERAL: «Que tu luz alumbre el camino»`. Contradiccion interna del motor. No corregida.
4. **Senal de calidad:** en el set DISPLATE, 2 de 3 fichas muestran `COINCIDENCIA DE REGLAS DEL PROMPT ... producto 67/100` (CAMISETA queda 100/100). No es un fallo de aislamiento; se deja constancia.

---

## 6. Confirmacion de proteccion del repositorio

Verificado con `git`:

- Rama activa: `feat/multiproduct-poc-2026-11` @ `33df81d`.
- `backup/pre-multiproduct-poc-2026-11` @ `33df81d` (creada antes de tocar nada).
- `feat/product-contract-completion-2026-11` @ `33df81d` (intacta, mismo commit).
- `main` @ `d0ca672` (intacta, sin cambios).
- `fix/creative-contract-guard-2026-11` @ `8acd294` (intacta, sin cambios).
- `git status` sin cambios en archivos rastreados; unicamente `?? js/orquestador-multiproducto.js` como archivo nuevo.
- Sin commits, sin merges, sin pushes, sin despliegue.

---

## 7. Limitaciones

- **Secuencial, no concurrente:** el aislamiento depende de que no se intercale otra generacion; con async simultaneo el estado global se comparte.
- **`generateSet` es costoso (~5 s por producto)**; N productos = N × ~5 s.
- **El restore no cubre contadores internos ni memoria anti-repeticion:** `_generationCounter` y `_rerollNonce` avanzan, y las claves `POD2|patterns|…|<producto>` se graban por diseño. No son contexto de producto, pero dejan rastro persistente.
- **Depende del DOM:** el motor lee selectores; no es un modulo Node puro, requiere navegador (o un DOM simulado).
- **Alcance limitado a CAMISETA SOFT y DISPLATE.** No incluye UI, ZIP, historial ni catalogo.

---

## 8. Como reproducir

1. Servidor estatico en el repo (`python -m http.server 8080`) y Edge headless con `--remote-debugging-port=9224`.
2. En la consola CDP de la pagina `http://127.0.0.1:8080/`:

```js
const orch = await (await fetch('/js/orquestador-multiproducto.js')).text();
(0, eval)(orch);
const h = await (await fetch('/PRUEBAS%20WORKFLOW/09_CHECKPOINTS/poc_multiproducto_harness.js')).text();
(0, eval)(h);
await window.__POC__.runTodo();   // devuelve el JSON con las 10 pruebas
```
