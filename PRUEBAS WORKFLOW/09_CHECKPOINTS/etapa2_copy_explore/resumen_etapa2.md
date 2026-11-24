# Etapa 2 — Coherencia de copy en exploración · Resumen

**Estado: COMPLETADA** (clausura en `cierre_etapa2.md`).

- **Rama:** `feat/multiproducto-definitivo-2026-11` @ `33df81d`
- **Autorización:** «AUTORIZACIÓN EXPRESA — CIERRE ETAPA 1 E INICIO ETAPA 2»
- **Alcance:** coherencia entre MENSAJE EXACTO, COPY y TEXTO cuando el usuario da un mensaje explícito en modo Explore. Sin commits.

## Archivos modificados en esta etapa

- `js/motor-nucleo.js` — únicamente las dos ramas del bloque COPY:
  - rama `isGospel` + sub-rama `isExplore` (`formatPrompt`, ~4291)
  - rama `else if (isSecular)` (~4305)
- `tests/copy-explore-coherencia.test.js` — nuevo.
- `js/data-productos.js`: sin cambios en esta etapa (su modificación corresponde a la etapa 1 y permanece intacta).

No se tocó `index.html`, la POC, los contratos, los bancos, los umbrales ni `PRODUCT_BIAS`/`PRODUCT_RULES`/`PLACEMENT`/print prep (verificado: el diff no contiene ninguna línea que altere esos símbolos).

## Explicación concreta de los cambios

**Antes:** `sharedDerivedCopy` solo existía si NO había mensaje (`!typedMessage`) y `sharedExploreCopy` solo si explore sin mensaje. En explore con mensaje, ambas quedaban vacías y el bloque COPY imprimía:

- secular: `COPY: no hay mensaje ni concepto autorizado para derivarlo…`
- gospel: `COPY: no hay texto autorizado…`

…mientras `MENSAJE EXACTO` y los `TEXTO:` de A/B/C ya usaban el mensaje del usuario: contradicción interna del prompt.

**Ahora:** si hay mensaje explícito en explore, el literal del usuario es el copy autorizado:

```diff
       o += sharedExploreCopy
         ? 'COPY CANÓNICO: «' + sharedExploreCopy + '»…'
-        : 'COPY: no hay texto autorizado. No generar letras, frases, citas, versículos ni microtexto.\n';
+        : (typedMessage
+          ? 'COPY: conserva literalmente el mensaje del usuario: «' + typedMessage + '». Es el único copy autorizado; repítelo igual en A/B/C donde la jerarquía admita texto; SOLO_OBJETO permanece sin letras.\n'
+          : 'COPY: no hay texto autorizado. No generar letras, frases, citas, versículos ni microtexto.\n');
...
     o += sharedDerivedCopy
       ? 'COPY CANÓNICO SECULAR: «' + sharedDerivedCopy + '»…'
-      : 'COPY: no hay mensaje ni concepto autorizado para derivarlo…\n';
+      : (isExplore && typedMessage
+        ? 'COPY: conserva literalmente el mensaje del usuario: «' + typedMessage + '». Único copy autorizado; idéntico en A/B/C; sin añadir apoyos, citas, cifras ni microtexto.\n'
+        : 'COPY: no hay mensaje ni concepto autorizado para derivarlo…\n');
```

Comportamiento resultante (verificado en los 4 mercados): `MENSAJE EXACTO: <msg>`, `COPY: conserva literalmente… «<msg>»` y las tres fichas `TEXTO: COPY PRINCIPAL LITERAL: «<msg>»`. Sin mensaje, se mantiene el canónico derivado del concepto (o el brief) y el bloqueo cuando no hay nada autorizado.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `tests/copy-explore-coherencia.test.js` (nuevo; 4 mercados × {con mensaje, sin mensaje} + control de modo new) | **PASS** — 42 aserciones, 0 fallos |
| `tests/product-contract.test.js` | **PASS** — 101 aserciones, 0 fallos |
| Suite Node completa (94 ficheros) | **93 PASS / 0 FAIL / 1 SKIP** |
| SKIP | `security-browser.test.js` (requiere playwright, no instalado) |

Sin conflictos con tests existentes: ninguno fijaba el caso explore-con-mensaje. El test `secular-prompt-contract` (caso sin mensaje) y `test_gospel_es_prompt_fix` / `prompt-fixes` (casos sin mensaje o modo new) siguen verdes, por lo que no fue necesario reescribir aserciones.

## Diff

`diff_etapa2_motor_acumulado.patch` es el diff de `motor-nucleo.js` acumulado (etapas 1 + 2, sin commit intermedio). Sus 3 hunks:

- `@@ -4291` y `@@ -4303` → las dos ramas de copy de **esta etapa**.
- `@@ -4333` → el envoltorio de superficie de la **etapa 1**.

Diff de etapa 1 (ambos archivos): `../etapa1_mockups/diff_etapa1.patch`.

## Evidencias guardadas

`PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa2_copy_explore/`:
`resumen_etapa2.md` (este archivo), `diff_etapa2_motor_acumulado.patch`, `suite_resumen.txt`, `tests_copy_explore.log`, `tests_product_contract.log`.
Cierre de etapa 1: `../etapa1_mockups/cierre_etapa1.md`.

## Limitaciones y pendientes

1. **Fuera de explore (modo `new`/contacto) el mercado secular con mensaje sigue imprimiendo la negación** — medido en Node: `modo new + mensaje secular → "no hay mensaje ni concepto autorizado"` = true. Está fuera del alcance autorizado (solo Explore) y ningún test fija ese caso; se deja como incidencia documentada, no corregida.
2. Heredado de la etapa 1: si `getProductSurface()` no estuviera disponible por carga/caché, el respaldo `'objeto'` aplicaría a todos los productos. Pendiente de decisión en UI/integración.
3. La verificación de esta etapa es a nivel de prompt en Node; la comprobación E2E en navegador se reserva para la integración (etapa 6).
