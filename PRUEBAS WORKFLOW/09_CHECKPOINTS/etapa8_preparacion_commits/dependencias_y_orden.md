# Etapa 8 — Dependencias y orden de los commits

## Grafo de dependencias
```
1 Superficies ─┐
               ├─→ 3 Núcleo multiproducto ─→ 4 Interfaz ─→ 5 Evidencias
2 Copy Explore ┘
```
- **3 depende de 1 (funcional, no sintáctica)**: el orquestador genera prompts que usan el
  bloque de mockup por superficie. Sin el commit 1, el código sigue funcionando (respaldo
  `'objeto'`), pero los prompts serían menos precisos. No es un bloqueo estricto.
- **3 es independiente de 2**: el copy Explore y el mockup por superficie no se llaman entre sí.
- **4 depende de 3 (estricta)**: `multiproducto-ui.js` consume `window.OrquestadorMultiProducto`,
  `MultiproductoHistorial` y `MultiproductoZip`; `index.html` los carga en ese orden.
- **4 depende de 1 y 2 (indirecta)**: a través del orquestador y del motor.
- **5 depende de todo**: la evidencia describe el resultado final.

## Orden propuesto y por qué
1. Superficies → 2. Copy Explore → 3. Núcleo → 4. Interfaz → 5. Evidencias.

El orden 1↔2 es intercambiable (huntiles disjuntos, verificado). El orden 3→4 es obligatorio.
5 siempre al final.

¿Qué pasaría si se reordenara?
- 3 antes de 1/2: funciona técnicamente (respaldo `'objeto'`); se perdería precisión de mockup.
- 4 antes de 3: la UI carga scripts inexistentes → avisos “no disponible” y botones inertes.
- 5 antes de tiempo: commitaría evidencias que describen una etapa no terminada.

## Caso especial resuelto
`js/motor-nucleo.js` no puede repartirse con `git add <archivo>`; requiere partición por hunks.
Verificado: los 3 hunks son disjuntos y reversibles; `partir_motor.py` produce el estado del
commit 1 y la reconstrucción con los hunks de copy reproduce el working tree exacto.
Si se prefiere no usar el script, el equivalente manual es `git add -p js/motor-nucleo.js`
(aceptando los hunks 1-2 primero o el 3, según el orden elegido).

## Riesgos de la partición
- **Medio**: equivocarse de hunk en el reparto dejaría un commit a medias (lo detectarían los
  tests del grupo: `mockup-superficie` fallaría si falta el hunk 3; `copy-explore-coherencia`
  si faltan los 1-2).
- **Bajo**: EOL. El repo guarda LF y el checkout usa CRLF; `git add` normaliza, así que no
  hay acción especial.
- **Bajo**: `/tmp/motor.full.js` debe conservarse hasta el commit 2; si se pierde, el contenido
  está en este plan (`diff_acumulado_desde_base.patch`) y en el working tree antes de empezar.

## Comprobación de que no se rompe el generador individual
Los commits 1 y 2 tocan `formatPrompt`, que usa el generador individual. La suite completa
(98 ficheros, 10.646 PASS) ya valida el estado combinado; para cada commit intermedio,
`tests/product-contract.test.js` y el smoke CDP del generador individual son el control
(ver `validacion_pre_commit.md`).
