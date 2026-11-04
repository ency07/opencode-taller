# Contrato creativo P3 — Territorios e identidad visual

Estado: contrato de integración definido; catálogo original pendiente de recuperar.

## 1. Propósito

Un territorio creativo es una dirección estratégica de exploración. No es sinónimo de concepto, estilo visual, técnica, tratamiento gráfico, composición ni perfil estructural.

- Concepto: qué comunica la pieza.
- Territorio: desde qué campo de exploración se aborda el concepto.
- Identidad visual: reglas persistentes de reconocimiento de una serie o marca.
- Estilo visual: lenguaje gráfico reconocible.
- Tratamiento gráfico: acabado o comportamiento superficial.
- Técnica: procedimiento de representación.
- Perfil estructural: HEAVY, SOFT o MODERN; regula densidad, masas y espacio.
- Composición: organización espacial y jerarquía.

## 2. Contrato de datos

Cada territorio recuperado de la fuente autoritativa deberá cumplir este esquema:

```js
{
  id: "identificador-estable",
  label: "Nombre visible",
  description: "Definición operativa",
  intent: "Qué tipo de exploración habilita",
  constraints: [],
  compatibleMarkets: [],
  compatibleProducts: [],
  promptDirective: "Instrucción concreta y verificable"
}
```

Reglas:
- `id` es único, estable y no depende del texto traducido.
- `label` y `description` no sustituyen la directiva operativa.
- Un territorio no puede imponer un estilo, layout o tratamiento sin declarar esa relación.
- Los valores incompatibles con mercado/producto se excluyen antes de generar.
- El valor `auto` significa selección asistida; no es un territorio.
- No se permite un catálogo vacío presentado como funcional.

## 3. Fuente y bloqueo actual

La auditoría de la rama de integración no encontró `js/data-territorios.js` ni la definición original de los diez territorios. No se reconstruyen ni se inventan esos diez valores.

Hasta recuperar y validar esa fuente:
- no mostrar selector P3;
- no persistir valores de territorio;
- no insertar directivas territoriales en el prompt;
- mantener P3 explícitamente bloqueado, sin simular disponibilidad.

## 4. Condiciones para activar P3

1. Recuperar la fuente original y registrar su procedencia.
2. Validar unicidad, campos, compatibilidad y número de entradas.
3. Añadir pruebas de catálogo y de filtrado por mercado/producto.
4. Conectar el estado de UI a `buildCandidate()` y `formatPrompt()`.
5. Verificar que cambiar territorio modifica únicamente las decisiones declaradas por el contrato.
6. Añadir prueba de navegador que confirme selección, persistencia y efecto en el prompt.

No declarar P3 completo antes de superar las seis condiciones.
