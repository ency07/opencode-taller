# Etapa 1 — Mockups por superficie · Resumen

**Estado: COMPLETADA** (clausura registrada en `cierre_etapa1.md`).

- **Fecha:** 2026-11-23
- **Rama:** `feat/multiproducto-definitivo-2026-11` @ `33df81d`
- **Autorización:** «AUTORIZO EXCLUSIVAMENTE LA ETAPA 1 — MOCKUPS POR SUPERFICIE»
- **Alcance:** corrección del bloque «REGLAS DEL MOCKUP COMERCIAL» según la superficie del producto. Sin commits.

## Archivos modificados

```
 js/data-productos.js | 21 +++++++++++++++++++++
 js/motor-nucleo.js   | 27 +++++++++++++++++++++++++--
 2 files changed, 46 insertions(+), 2 deletions(-)
```

**`js/data-productos.js`** (+21): nuevo `PRODUCT_SURFACE` (`prenda` / `pared` / `objeto`) y `getProductSurface()`, con sus exports en `window`. No toca `PRODUCT_BIAS`, `PRODUCT_RULES`, `PLACEMENT`, mockups, print prep ni umbrales.

**`js/motor-nucleo.js`** (+25/−2): el envoltorio del bloque de mockup ahora deriva de la superficie:

- **prenda** (CAMISETA SOFT, CAMISETA APPAREL, HOODIE, ILUSTRACIÓN PREMIUM APPAREL) → texto original: «el modelo que lleva la prenda» y «camiseta de corte y talla infantil».
- **pared** (DISPLATE) → «la pieza de pared en su ambiente — NO el arte»; **NUNCA sobre cuerpo humano ni con modelos/personas**; la audiencia orienta el ambiente, no un portador.
- **objeto** (GORRA, MUG, MOCHILA, TOTE BAG, FUNDA MÓVIL) → «el objeto en uso o en escena»; presentación acorde a la audiencia, sin imposición textil.

El resto del prompt (regla de producto, placement, ubicación/escala, márgenes, preparación técnica, fichas A/B/C) queda igual. El generador de un solo producto conserva su estructura; solo cambia el lenguaje del mockup que le correspondía mal.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `tests/mockup-superficie.test.js` (nuevo, 10 productos) | **PASS** — 117 aserciones, 0 fallos |
| `tests/product-contract.test.js` | **PASS** — 101 aserciones, 0 fallos |
| Suite Node completa (93 ficheros) | **92 PASS / 0 FAIL / 1 SKIP** |
| SKIP | `security-browser.test.js` (requiere playwright, no instalado) |

Logs guardados: `tests_mockup_superficie.log`, `tests_product_contract.log`, `suite_resumen.txt`.

## Criterios de aceptación

- [x] Ningún producto de pared u objeto recibe instrucciones textiles impropias (asserts individuales por producto: sin «el modelo que lleva la prenda», sin «camiseta de corte y talla»).
- [x] DISPLATE conserva su presentación en pared y «NUNCA sobre cuerpo humano»; ya no pide persona.
- [x] Las prendas conservan su lenguaje (modelo con prenda, talla infantil).
- [x] Los 10 productos conservan sus reglas específicas (regla, placement, ubicación/escala, preparación técnica, vista específica).
- [x] Sin regresiones: product-contract y la suite completa en verde.

## Verificación de protección

- Rama activa: `feat/multiproducto-definitivo-2026-11`; HEAD `33df81d` (sin commit nuevo).
- `main`: `d0ca672` — intacta. `fix/creative-contract-guard-2026-11`: `8acd294` — intacta.
- POC intacta (sha256): orquestador `c2c2a50401a8b4b0…`, harness `9a13a103bbe5653f…`.
- `index.html`: 0 cambios. Sin push, merge ni despliegue. Etapa 2 no iniciada.

## Notas

- Se usó una lista explícita (`PRODUCT_SURFACE`) en vez de `isTextile()`, porque este clasifica como textil a GORRA/MOCHILA/TOTE y como no textil a MUG/FUNDA/DISPLATE, lo que no corresponde a la superficie del mockup.
- Umbrales, `PRODUCT_BIAS` y reglas de impresión intactos.

## Diferencias (diff completo)

```diff
diff --git a/js/data-productos.js b/js/data-productos.js
index 0eb11f1..abcd972 100644
--- a/js/data-productos.js
+++ b/js/data-productos.js
@@ -295,6 +295,25 @@ function isBag(product) {
   return product === "MOCHILA" || product === "TOTE BAG";
 }
 
+/* Superficie de presentación del mockup comercial (etapa 1 multiproducto).
+   Clasifica el SOPORTE del mockup, no la imprimibilidad: prenda / pared / objeto.
+   No altera PRODUCT_BIAS, reglas de producto, umbrales ni preparación técnica.
+   Nota: isTextile() no sirve para esto (marca como textil a GORRA/MOCHILA/TOTE y
+   como no textil a MUG/FUNDA/DISPLATE), porque la superficie del mockup es otra
+   categoría. */
+const PRODUCT_SURFACE = {
+  prenda: ["CAMISETA SOFT", "CAMISETA APPAREL", "HOODIE", "ILUSTRACION PREMIUM APPAREL"],
+  pared: ["DISPLATE"],
+  objeto: ["GORRA", "MUG", "MOCHILA", "TOTE BAG", "FUNDA MÓVIL"]
+};
+function getProductSurface(product) {
+  const p = String(product === undefined || product === null ? "" : product).trim();
+  if (PRODUCT_SURFACE.prenda.indexOf(p) !== -1) return "prenda";
+  if (PRODUCT_SURFACE.pared.indexOf(p) !== -1) return "pared";
+  if (PRODUCT_SURFACE.objeto.indexOf(p) !== -1) return "objeto";
+  return "objeto";
+}
+
 function getProductScaleDirective(product) {
   const bias = getProductBias(product);
   return bias.scale || "escala y superficie de impresión adecuadas al producto";
@@ -330,6 +349,8 @@ window.PRINT_METHOD_LABELS = PRINT_METHOD_LABELS;
 window.PRINT_PREP_RULES = PRINT_PREP_RULES;
 window.getPrintMethods = getPrintMethods;
 window.getPrintPrepRule = getPrintPrepRule;
+window.getProductSurface = getProductSurface;
+window.PRODUCT_SURFACE = PRODUCT_SURFACE;
 window.isDrinkware = isDrinkware;
 window.isCase = isCase;
 window.isBag = isBag;
\ No newline at end of file
diff --git a/js/motor-nucleo.js b/js/motor-nucleo.js
index 5a0b9bd..26b81f8 100644
--- a/js/motor-nucleo.js
+++ b/js/motor-nucleo.js
@@ -4332,8 +4332,31 @@ function formatPrompt(result) {
   if (printPrepRule) o += 'ACABADO / PREPARACION TECNICA (' + printMethodName + '): ' + printPrepRule + '\n';
   if (mockupRule) {
     const colsByAudience = MOTOR_STATE.audienceMulti === 'si';
-    o += 'REGLAS DEL MOCKUP COMERCIAL (el modelo que lleva la prenda — NO el arte estampado): ' + mockupRule + '\n';
-    o += 'IMPORTANTE: la prohibición de figuras humanas del bloque de arte (CONTROL DE ELEMENTOS / FIGURAS HUMANAS) NO aplica aquí. El mockup DEBE mostrar una persona acorde a la audiencia de la columna. MOCKUP OBLIGATORIO POR AUDIENCIA: infantil = niño o niña de apariencia inequívocamente infantil (proporciones corporales infantiles: cabeza grande, extremidades cortas; rostro y anatomía de niño, no de adulto joven; camiseta de corte y talla infantil; un adulto de baja estatura NO cumple). femenino = mujer con corte y talla femeninos. masculino = hombre con corte y talla masculinos. unisex = modelo acorde al perfil sin forzar género. Un modelo adulto en una ficha infantil invalida la hoja. Prohibido usar adultos como sustitutos.\n';
+    /* FIX superficie (etapa 1 multiproducto): el lenguaje del mockup debe
+       corresponder a la naturaleza del producto. Un texto único imponía "el
+       modelo que lleva la prenda" y "camiseta de corte y talla" a DISPLATE,
+       GORRA, MUG, MOCHILA, TOTE BAG y FUNDA MÓVIL. No cambia reglas de producto,
+       contratos, bancos ni umbrales: solo el envoltorio del bloque de mockup. */
+    const surface = typeof getProductSurface === 'function' ? getProductSurface(MOTOR_STATE.product) : 'objeto';
+    const mockupHeader = surface === 'prenda'
+      ? 'REGLAS DEL MOCKUP COMERCIAL (el modelo que lleva la prenda — NO el arte estampado): '
+      : (surface === 'pared'
+        ? 'REGLAS DEL MOCKUP COMERCIAL (la pieza de pared en su ambiente — NO el arte): '
+        : 'REGLAS DEL MOCKUP COMERCIAL (el objeto en uso o en escena — NO el arte): ');
+    o += mockupHeader + mockupRule + '\n';
+    if (surface === 'pared') {
+      o += 'IMPORTANTE: la prohibición de figuras humanas del bloque de arte (CONTROL DE ELEMENTOS / FIGURAS HUMANAS) NO aplica a la lámina. Excepción de pared: la pieza se presenta en pared, habitación o setup, NUNCA sobre cuerpo humano ni con modelos/personas; el bloque de audiencia orienta el ambiente y la escala de presentación, no un portador.\n';
+    } else {
+      const mockupPerson = surface === 'prenda'
+        ? ' El mockup DEBE mostrar una persona acorde a la audiencia de la columna.'
+        : ' El mockup DEBE mostrar el objeto en uso o en escena, con presentación acorde a la audiencia de la columna.';
+      const audienceInfantil = surface === 'prenda'
+        ? 'niño o niña con apariencia inequívocamente infantil (proporciones corporales infantiles: cabeza grande, extremidades cortas; rostro y anatomía de niño, no de adulto joven; camiseta de corte y talla infantil; un adulto de baja estatura NO cumple)'
+        : 'escena o referencia de escala infantil (un adulto como sustituto NO cumple)';
+      const audienceFem = surface === 'prenda' ? 'mujer con corte y talla femeninos' : 'presentación acorde al perfil femenino';
+      const audienceMasc = surface === 'prenda' ? 'hombre con corte y talla masculinos' : 'presentación acorde al perfil masculino';
+      o += 'IMPORTANTE: la prohibición de figuras humanas del bloque de arte (CONTROL DE ELEMENTOS / FIGURAS HUMANAS) NO aplica aquí.' + mockupPerson + ' MOCKUP OBLIGATORIO POR AUDIENCIA: infantil = ' + audienceInfantil + '. femenino = ' + audienceFem + '. masculino = ' + audienceMasc + '. unisex = modelo acorde al perfil sin forzar género. Un modelo adulto en una ficha infantil invalida la hoja. Prohibido usar adultos como sustitutos.\n';
+    }
     o += 'EJE DE COLUMNAS: ' + (colsByAudience
       ? 'las 3 columnas se encabezan por AUDIENCIA, en palabras simples del idioma del mercado.'
       : 'las 3 columnas se encabezan por FICHA (01A · 01B · 01C) con su estilo.') + '\n';
```
