# Etapa 1 — Verificación de superficie, nombres e integración

Comprobaciones pedidas en la revisión: normalización de nombres de producto,
comportamiento de `getProductSurface()` ante valores desconocidos, y que el
`typeof getProductSurface` del motor no oculte un problema de carga entre módulos.

## 1. Normalización de nombres

**No existe normalización.** `MOTOR_STATE.product` recibe el valor tal cual del
`select#product` (o del orquestador). La clasificación es por igualdad exacta de
cadena, con `trim()` en la entrada.

Los 10 valores reales del select (`index.html:129-140`) coinciden exactamente con
las claves de `PRODUCT_BIAS`, `PLACEMENT`, `PRODUCT_RULES` y `PRODUCT_SURFACE`:

| valor del select | surface | regla | placement | bias |
|---|---|---|---|---|
| CAMISETA SOFT | prenda | sí | sí | sí |
| CAMISETA APPAREL | prenda | sí | sí | sí |
| HOODIE | prenda | sí | sí | sí |
| GORRA | objeto | sí | sí | sí |
| MUG | objeto | sí | sí | sí |
| MOCHILA | objeto | sí | sí | sí |
| TOTE BAG | objeto | sí | sí | sí |
| FUNDA MÓVIL | objeto | sí | sí | sí |
| ILUSTRACION PREMIUM APPAREL | prenda | sí | sí | sí |
| DISPLATE | pared | sí | sí | sí |

Casos límite (sonda en Node): `'DISPLATE '` y `' DISPLATE'` → `pared` (trim);
`'camiseta soft'`, `'ILUSTRACIÓN PREMIUM APPAREL'` (con tilde), `''`, `'   '`,
`null`, `undefined`, `{}`, `'NO EXISTE'` → `objeto` y sin regla. Nunca lanza excepción.

## 2. Integración real en navegador

Recarga **con caché deshabilitada** (`Network.setCacheDisabled` + `Page.reload ignoreCache`)
en `http://127.0.0.1:8080/`:

```json
{
  "orden": ["js/data-productos.js", "js/motor-nucleo.js"],
  "tipoGlobal": "function",
  "tipoWindow": "function",
  "surfaceKeys": ["prenda", "pared", "objeto"],
  "porProducto": {
    "CAMISETA SOFT": "prenda", "CAMISETA APPAREL": "prenda", "HOODIE": "prenda",
    "GORRA": "objeto", "MUG": "objeto", "MOCHILA": "objeto", "TOTE BAG": "objeto",
    "FUNDA MÓVIL": "objeto", "ILUSTRACION PREMIUM APPAREL": "prenda", "DISPLATE": "pared"
  },
  "wrapperPorSuperficie": {
    "prenda_SOFT": "el modelo que lleva la prenda — NO el arte estampado",
    "prenda_APPAREL": "el modelo que lleva la prenda — NO el arte estampado",
    "pared_DISPLATE": "la pieza de pared en su ambiente — NO el arte",
    "objeto_MUG": "el objeto en uso o en escena — NO el arte"
  },
  "fallbackEnCodigo": true
}
```

El orden de carga es correcto (`data-productos.js` antes que `motor-nucleo.js`),
`getProductSurface` está disponible como global y como `window.getProductSurface`,
y el envoltorio del prompt coincide con la superficie para los cuatro casos probados.

## 3. Hallazgo: caché del navegador (limitación, no defecto de código)

Al abrir la pestaña, el navegador sirvió versiones **anteriores** de ambos scripts:
`window.getProductSurface` era `undefined` y `formatPrompt` no contenía la rama
nueva. Tras recargar sin caché, todo quedó correcto.

Riesgo asociado: si el script de datos quedara cacheado y el motor nuevo cargara
(o al inversa), el `typeof getProductSurface === 'function' ? … : 'objeto'`
aplicaría `objeto` a **todos** los productos. Es un escenario de desarrollo
(no hay despliegue) y se resuelve recargando, pero conviene tenerlo presente en la
etapa de UI/integración.

## 4. Resumen de la reserva

- Nombres: sin normalización; dependencia de igualdad exacta. Los valores reales
  están alineados; entradas anómalas caen a `objeto` sin reventar.
- Desconocidos: `getProductSurface` devuelve `objeto` y no lanza excepciones.
- Integración: verificada en navegador con carga fresca; el `typeof` **sí** puede
  enmascarar un fallo de carga (caso de caché observado).

### Pendientes propuestos (no implementados, requieren decisión)
1. En la UI/integración, validar la superficie contra los valores reales del select
   y avisar si un producto no tiene clasificación.
2. Valorar que el respaldo del motor no sea `objeto` (p. ej. registrar/abortar) o
   añadir cache-busting a los scripts.
