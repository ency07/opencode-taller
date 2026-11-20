# Catálogos creativos inactivos

Estado: **no integrados** (Opción A).

## Archivos

- `js/data-tratamientos.js`
  - 3 `structuralTreatments` (HEAVY / SOFT / MODERN).
  - 10 `visualTreatments` (equivalentes a `FORMAS` de `data-estilos.js`).
  - 10 `textIntegrations` (equivalentes a `INTEGRACION` de `data-estilos.js`).
  - No se carga en `index.html`.

- `js/data-composiciones.js`
  - 10 `compositionDirections` (centrada, diagonal, asimétrica, retícula 2x2, wrap, split, radial, Z, F, texto como elemento principal).
  - 10 `colorModes` (monocromático, duotono, tricromático, paleta completa, alto contraste, bajo contraste, complementario, análogo, triádico, acromático).
  - No se carga en `index.html`.

## Motivo de la decisión

El motor ya tiene una fuente única activa en `js/data-estilos.js`:

- `TRATAMIENTOS`
- `FORMAS`
- `INTEGRACION`
- `LAYOUTS`
- `COLOR_FAMILIES`
- `COLOR_MODES`

`data-tratamientos.js` es un espejo de tratamientos, formas e integraciones. Cargarlo crearía dos fuentes de verdad.

`data-composiciones.js` sí tiene vocabulario distinto, pero no está conectado. Integrarlo sin mapeo y pruebas modificaría la selección de layouts, paletas y diversidad A/B/C.

## Regla actual

No cargar estos archivos. No tratar su existencia como uso efectivo.

## Si en el futuro se integran

Usar un modelo **híbrido controlado**, nunca aleatorio puro:

1. `compositionDirections`: solo como sugerencias de layout, mapeadas a los layouts existentes del motor.
2. `colorModes`: solo como sesgo/filtro de paleta, nunca como modo fijo obligatorio.
3. `data-tratamientos.js`: no integrar como fuente paralela; solo como respaldo si `TRATAMIENTOS` llegara a estar vacío.
4. El usuario no decide directamente estos catálogos; el motor decide por defecto y los locks existentes siguen mandando.
5. Requiere tests de contrato, contraste y regresión completa antes de tocar el prompt.
