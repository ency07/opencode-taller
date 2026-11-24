# Etapa 6 — Propuesta visual (y desviaciones respecto a lo propuesto)

La propuesta completa está en `auditoria_ux_propuesta.md` (sección 2) y el mockup navegable en `propuesta_mockup.html`.
Capturas: `captura_antes.png` (index original, sin panel) y `captura_despues.png` (panel con lote de 3 OK).

## Cómo quedó implementado (resumen visual)
Panel **“⚡ Generación multiproducto”** al inicio de la columna izquierda, con cinco zonas:

1. **Selección** — `<select id="mpMode">` TODOS/SELECCIONADOS, botones `Todos`/`Ninguno`, contador, y rejilla `.mp-grid` con los 10 chips leídos del `<select id="product">` real (nombre + estado `—`/`OK`/`ERROR`/`…`).
2. **Contexto compartido** — línea `.ctx-line` con mercado · región · serie · concepto (leída del estado vivo del motor, no duplicada).
3. **Acción y progreso** — `Generar N productos` (deshabilitado durante la corrida), barra `.progress`, texto `Generando X… (i/N)`, `Cancelar`, `Guardar lote`, `Exportar ZIP del lote`.
4. **Resultados** — pestañas por producto y visor propio `#mpPrompt` con meta (`producto · estado · caracteres · contexto`) y acciones `Copiar`, `Copiar parte 1/2`, `Regenerar solo este`.
5. **Historial local** — lista con fecha · N productos · COMPLETO/PARCIAL y botones `Cargar`, `ZIP`, `Eliminar`.

Responsive: la rejilla pasa a 2 columnas a ≤640 px; las acciones envuelven; verificado a 390×844 sin scroll horizontal.

## Desviaciones respecto a la propuesta inicial (declaradas)
| Propuesto | Implementado | Motivo |
|---|---|---|
| Volcar cada prompt en `#out` para reutilizar los botones actuales | Visor propio `#mpPrompt` con sus propios botones | No pisa el flujo individual ni comparte estado con el generador de un producto |
| Guardado automático del lote al terminar | Guardado manual con `Guardar lote` | Evita escribir en `localStorage` sin acción explícita; el historial queda a decisión del usuario |
| Cancelar con confirmación | Cancela tras terminar el producto en curso | Más simple; no destruye resultados y el mensaje indica que quedan parciales |
| Botón “Copiar todos” | No implementado | No era un requisito de la autorización; el ZIP cubre la descarga completa |

## Requisitos de la autorización → estado
- Selección de productos: sí (chips + modos).
- Modo TODOS y SELECCIONADOS: sí.
- Concepto compartido: sí (contexto leído y mostrado; mismo contexto en los 10 prompts).
- Generación y progreso: sí, real por producto.
- Resultados independientes: sí (10 prompts distintos, pestañas persistentes).
- Regeneración individual: sí (cambia solo ese producto).
- Copiado: sí (Clipboard API; fallback seleccionable cuando el navegador lo deniega).
- Historial: sí (guardar, listar, cargar sin regenerar, eliminar, exportar).
- Exportación ZIP: sí (descarga + extracción Python verificada).
- Errores y resultados parciales: sí (chip ERROR, lote PARCIAL, cancelación con parciales, ZIP con `_ERROR.txt`).
- Escritorio y móvil: verificado.
- Sin dependencias externas: sí.
