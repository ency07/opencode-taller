# Corrección del prompt Gospel ES

## Alcance

Esta corrección afecta únicamente a la construcción del prompt cuando
\`MOTOR_STATE.market === 'gospel_es'\`. No modifica las reglas de \`gospel_en\`,
Global, Colombia ni otros mercados.

## Política de copy

La política se resuelve en el motor, antes de construir el prompt:

1. Si el usuario proporciona un mensaje, se conserva literalmente. El mensaje
   explícito prevalece incluso si el copy automático está desactivado.
2. Si no hay mensaje, \`allowAutoCopy !== false\` y existe un concepto, el motor
   deriva una sola frase del concepto y la fija como copy canónico de A/B/C.
3. Si no hay mensaje y el copy automático está desactivado, no se genera texto.
4. Si falta también el concepto, no se toma una frase genérica de un banco para
   rellenar el vacío.

\`SOLO_TEXTO\` significa composición exclusivamente tipográfica; no significa
"sin texto". Usa el mensaje o copy canónico autorizado. \`SOLO_OBJETO\` significa
cero letras. Si no hay copy autorizado, las fichas cuya jerarquía necesita texto
se marcan como incompletas y no deben presentarse como diseños terminados.

El estado \`MOTOR_STATE.allowAutoCopy\` controla la derivación automática. Su valor
predeterminado es \`true\`; establecerlo en \`false\` la desactiva. El mensaje
explícito del usuario siempre se conserva.

## Fidelidad conceptual y doctrina

- El concepto proporcionado permanece como ancla semántica.
- Una idea abstracta no se transforma en un relato bíblico específico.
- No se infieren personajes, pasajes, lugares, milagros, escenas ni objetos
  narrativos que el usuario no haya solicitado.
- La identidad Gospel ES se mantiene cristocéntrica y trinitaria, pero no obliga
  a insertar cruces, coronas, citas, personajes o escenas.
- Las referencias bíblicas explícitas solicitadas por el usuario se conservan;
  la regla no bloquea conceptos bíblicos intencionales.
- La directiva de idioma de Gospel ES exige español natural, ortografía correcta
  y evita traducciones literales del inglés.

## Arte estampado y mockup

Las reglas de figuras humanas del arte estampado se mantienen dentro del bloque
\`REGLAS DEL ARTE ESTAMPADO\`. Las reglas comerciales devueltas por
\`getMockupRule()\` se insertan únicamente en \`REGLAS DEL MOCKUP COMERCIAL\`.
La prohibición de personas en el estampado no prohíbe el modelo comercial.

## Variaciones

En modo variación, el selector \`variationOptions.textos\` sigue siendo la
autoridad: conservar, reformular, crear o eliminar texto según la opción
seleccionada. La política de copy de Contact Sheet no debe sobrescribirla.

## Implementación

- \`_resolveGospelESCopy()\`: resuelve el origen del texto y evita fallback a
  copy genérico cuando falta concepto.
- \`formatPrompt()\`: aplica la política dentro del flujo real; no existe un
  bloque Gospel ES ejecutándose en ámbito global.
- Las fichas que necesitan texto y carecen de copy autorizado se identifican
  como incompletas; no reciben instrucciones contradictorias de proporción o
  integración tipográfica.
- Se eliminó la función de "limpieza" que no modificaba el concepto y el bloque
  global que referenciaba variables locales inexistentes.

## Pruebas

Ejecutar:

\`\`\`bash
node tests/test_gospel_es_prompt_fix.js
node tests/semantic-identity.test.js
\`\`\`

\`test_gospel_es_prompt_fix.js\` carga los módulos reales y llama a
\`formatPrompt()\`. Comprueba mensaje explícito, copy canónico compartido,
\`SOLO_TEXTO\`, copy automático desactivado, concepto vacío, fidelidad conceptual
y separación de arte/mockup. Usa aserciones de Node que hacen fallar el proceso
cuando una condición no se cumple.

## Límite de validación

Estas pruebas verifican la construcción del prompt, no garantizan que un modelo
externo reproduzca texto perfecto ni que una imagen cumpla todas las reglas.
Antes de considerar cerrada la corrección se requiere ejecutar ambos tests en
el entorno del proyecto y realizar pruebas de generación de imágenes con los
escenarios Gospel ES previstos.
