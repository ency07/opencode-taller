# Cierre — Etapa 1 · Mockups por superficie

**Estado:** COMPLETADA (autorizada su clausura junto con el inicio de la etapa 2).

## Alcance aceptado
- Corrección del bloque «REGLAS DEL MOCKUP COMERCIAL» por superficie (prenda / pared / objeto).
- Archivos: `js/data-productos.js` (+21, `PRODUCT_SURFACE`/`getProductSurface`), `js/motor-nucleo.js` (+25/−2, envoltorio del mockup), `tests/mockup-superficie.test.js` (nuevo).
- Resultados: `mockup-superficie` **PASS** (117 aserciones), `product-contract` **PASS** (101), suite **92 PASS / 0 FAIL / 1 SKIP**.
- Evidencia: `resumen_etapa1.md`, `diff_etapa1.patch`, `suite_resumen.txt`, `tests_*.log`, `verificacion_superficie_navegador.md`.

## Limitación detectada y solución
La primera carga del navegador sirvió versiones **cacheadas anteriores** de `data-productos.js` y `motor-nucleo.js`: `window.getProductSurface` aparecía `undefined` y el motor no tenía la rama nueva. Con recarga sin caché (`Network.setCacheDisabled` + `Page.reload ignoreCache`) ambos scripts cargan correctamente y el envoltorio coincide con la superficie en los cuatro casos verificados (prenda/pared/objeto).

**Solución:** recargar sin caché; comprobado en navegador real. No se introdujo cache-busting ni cambios de integración (fuera de la autorización).

## Riesgo conocido (registrado, no corregido)
El motor usa `typeof getProductSurface === 'function' ? getProductSurface(MOTOR_STATE.product) : 'objeto'`. Si el módulo de datos no estuviera disponible (fallo de carga/caché parcial), **todos** los productos caerían al respaldo `'objeto'`, incluido DISPLATE. Escenario de desarrollo, sin despliegue; documentado como pendiente de decisión en la etapa de UI/integración:

1. Validar la superficie contra los valores reales del select.
2. Valorar un respaldo más seguro o aviso explícito.

No se modificó la implementación de la etapa 1 durante el cierre.
