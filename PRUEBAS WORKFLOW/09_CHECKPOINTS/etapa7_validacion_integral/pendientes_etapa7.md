# Etapa 7 — Pendientes conocidos: impacto y clasificación

Criterio de bloqueo: ¿impide usar el sistema multiproducto en producción o pone en riesgo
datos/contratos? Ninguno de ellos impide la integración; todos tienen workaround o son
cosméticos/de entorno.

| # | Pendiente | Gravedad | Impacto real | ¿Bloquea integración? |
|---|---|---|---|---|
| 1 | Negación de COPY en modo `new` secular con mensaje explícito | Baja | En modo `new` (no Explore) con mensaje, el COPY sigue imprimiendo “no hay mensaje ni concepto autorizado”. No afecta al flujo Explore (el usado por el multiproducto) | No |
| 2 | Respaldo `'objeto'` si falta `getProductSurface()` | Baja | Solo si `data-productos.js` no cargara; un síntoma visible serían mockups de objeto para prendas. Los 10 productos reales clasifican bien | No |
| 3 | `clearAllMemory` no borra físicamente las claves del historial | Media | El historial queda oculto funcionalmente pero ocupa bytes; en el peor caso cuota con lotes ocultos. El contador de memoria (QA) lo registra | No |
| 4 | Deduplicación automática del historial | Baja | Dos lotes con mismo contexto y mismos productos se consideran duplicados y no se guardan dos veces. Puede sorprender si se esperaban copias | No |
| 5 | Portapapeles sin confirmar en escritorio real | Baja | El fallback selecciona el texto para Ctrl+C; en headless no se pudo probar la escritura real | No |
| 6 | Responsive sin confirmar en dispositivo real | Baja | Verificado con iframes de 390 px y 1280 px (sin desborde); falta un móvil físico | No |
| 7 | Guardado manual, sin «Copiar todos» y cancelación sin confirmación | Cosmética | Decisiones de diseño ya explicadas; no pérdida de datos (cargar del historial recupera) | No |

## Recomendación
Integrar sin corregir nada ahora (la autorización lo excluye). Los puntos 3 y 4 convienen
tratarlos antes de publicar si el historial se vuelve protagonista; los demás pueden esperar.
