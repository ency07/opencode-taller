# Etapa 8A — Propuesta visual e identidad

Se conserva la identidad actual (tema oscuro, acento azul, radio 6 px, Inter) y se
sistematiza. No es un rediseño estético: es una capa de coherencia sobre lo que ya funciona.

## 1. Tokens (partiendo de los actuales)
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0E1016` | fondo |
| `--panel` / `--panel-alt` | `#161920` / `#1A1E26` | tarjetas y campos |
| `--line` / `--line2` | `#2A2E38` / `#3A3E48` | bordes |
| `--text` / `--mut` | `#E0E4EC` / `#8A90A0` | texto y secundario |
| `--acc` | `#5B8DEF` | acción primaria, modo activo |
| `--good` / `--bad` / `--warn` | `#34D399` / `#F87171` / `#FBBF24` | estados |
| `--r` | `6px` (tarjetas 12 px) | radio |

Reglas nuevas:
- **Un solo botón primario por pantalla**; el resto, secundarios con borde.
- **Estados como texto + color**: “Pendiente”, “OK”, “Error”, “Generando…”; sin badges
  circulares que parezcan botones.
- **Deshabilitado**: `opacity:.5`, `cursor:not-allowed`, nunca confundible con secundario.
- **Enfoque visible**: anillo de 2 px en `--acc`.

## 2. Tipografía y ritmo
- Inter (ya cargada). Escala: 12 / 13 / 14 / 16 / 20 px. Jerarquía por peso (700/600/400).
- Espaciado en múltiplos de 8 px (8/16/24). Acordeones con cabecera de 44 px.
- Labels cortos: “Método de impresión”, “Cara del estampado”, “Acabado (GORRA)” en vez de
  la etiqueta larga actual dentro del select.

## 3. Componentes
| Componente | Descripción |
|---|---|
| Cabecera de contexto | Chip compacto con mercado/idioma/marca/serie; se despliega al pulsarlo |
| Stepper | 4 pasos, estado completado/activo/pendiente |
| Acordeón | Un grupo abierto; cabecera con resumen (“COLOMBIA · COSTA”) |
| Lista de productos | Rejilla de chips con nombre (máx. 2 líneas) + badge textual de estado |
| Barra de progreso | Relleno + etiqueta “Generando X… (i/N)” |
| Pestañas de resultado | Una por producto/resultado, con estado |
| Visor de prompt | Texto monoespaciado con toolbar (Copiar, Copiar 1/2, Regenerar) |
| Estado vacío | Icono + frase + CTA (“Aún no hay diseños: pulsa Crear los 3 diseños”) |
| Tarjeta de historial | Fecha · N productos · COMPLETO/PARCIAL + acciones |

## 4. Layout responsive
- **≥1200 px**: configuración 380 px + área de trabajo; dos columnas.
- **768-1199 px**: rail de configuración plegable (icono) + área de trabajo; el stepper en
  una fila; navegación superior con scroll horizontal o hamburguesa.
- **<640 px**: una columna; acordeones; stepper compacto; **acción primaria fija abajo**
  (sticky); rejilla de productos a 2 columnas con nombres truncados a 2 líneas.

## 5. Criterios de diseño
1. Se entiende qué hay que hacer sin leer el manual (CTA evidente por fase).
2. Los dos modos comparten contexto y resultados: misma cabecera, mismo historial.
3. Cada estado (vacío, cargando, ok, error, deshabilitado) tiene aspecto propio.
4. Ninguna pantalla supera los ~2 saltos de scroll para llegar a la acción principal.
5. Todo control avanzado existe, pero plegado; nada se elimina sin justificación.
