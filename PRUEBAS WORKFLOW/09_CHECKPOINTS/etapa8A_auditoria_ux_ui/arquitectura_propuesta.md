# Etapa 8A — Arquitectura de interfaz propuesta

Principio rector: **el usuario no necesita saber cómo funciona el motor**. El Taller POD
debe sentirse como una sola aplicación con un contexto compartido y dos modos de trabajo.

## 1. Modelo conceptual
```
Taller POD
├── Contexto (compartido por ambos modos)
│     Mercado · Idioma · Marca · Región · Serie
├── Modo de trabajo (pestaña persistente)
│     ├── Un producto   → flujo A/B/C actual (fichas, árbitro, matriz)
│     └── Multiproducto → selección, lote, resultados por producto
├── Flujo guiado (stepper)  Configurar → Generar → Revisar → Exportar
├── Resultados (compartidos)
│     Pestañas por resultado · prompt con herramientas · metadatos
└── Historial y exportación (compartidos)
      Lotes individuales y multiproducto en un único historial
```

## 2. Pantallas y regiones
1. **Cabecera**: marca, selector compacto de contexto, menú de herramientas, acción de IA.
   Altura fija 56 px; en móvil colapsa a menú hamburguesa.
2. **Selector de modo**: dos pestañas grandes (“Un producto” / “Multiproducto”) que comparten
   el contexto de la cabecera. Sustituye al panel MP encima del flujo individual.
3. **Stepper**: 4 pasos con estado; muestra dónde está el usuario y qué falta.
4. **Columna de configuración** (340-400 px en escritorio): acordeones por grupo
   (Contexto · Producto e impresión · La idea · Avanzado). Solo un grupo abierto a la vez.
5. **Área de trabajo** (resto): acciones primarias, selección de productos (solo modo multi),
   progreso con etiqueta, resultados con pestañas y visor de prompt.
6. **Historial** (aside plegable o sección inferior): accesible desde ambos modos.

## 3. Flujo de uso (dos ejemplos)
### Un producto
Configurar (mercado/producto/idea) → “Crear los 3 diseños” → stepper avanza a Revisar
(fichas A/B/C, árbitro, revisión visual) → “Guardar lote” / “Exportar ZIP”.

### Multiproducto
El mismo contexto ya está elegido → pestaña “Multiproducto” → marcar productos →
“Generar lote” (progreso real por producto) → pestaña por producto para revisar/copiar →
“Regenerar solo este” si falla → “Exportar ZIP”.

Ambos desembocan en el mismo historial y el mismo exportador; cambia solo la pantalla de
generación.

## 4. Cambios estructurales respecto a hoy
| Hoy | Propuesto |
|---|---|
| Panel MP antes que el flujo individual | Pestaña de modo en la cabecera; el panel MP deja de existir como bloque separado |
| 13 secciones planas | 4 acordeones + área de trabajo |
| 4 botones de acción dispersos | Acciones agrupadas por fase (configurar/generar/revisar/exportar) |
| Historial solo en el MP | Historial global (individual y multiproducto) |
| Estado del producto en badge circular | Badge textual claro (Pendiente/OK/Error/Generando) |
| Barra de progreso sin etiqueta | Barra con “Generando X… (i/N)” |

## 5. Consecuencias para el motor (ninguna funcional)
- Se mantiene `MOTOR_STATE`, `generateSet`, `formatPrompt`, locks y contratos intactos.
- La UI nueva consume los mismos módulos (`OrquestadorMultiProducto`, `MultiproductoHistorial`,
  `MultiproductoZip`) y reutiliza `#out`/fichas/árbitro existentes.
- No se elimina ningún control: los avanzados pasan a un acordeón “Avanzado”.
