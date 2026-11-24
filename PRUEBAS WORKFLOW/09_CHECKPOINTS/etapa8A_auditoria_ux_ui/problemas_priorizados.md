# Etapa 8A — Problemas priorizados

Criterio: **impacto = fricción en la tarea principal × frecuencia de uso**.
Evidencia: DOM medido (13 secciones, 25 selects, 40 botones, left-col 5.486 px) y capturas
`ux_desktop.png`, `ux_tablet.png`, `ux_movil.png`.

| # | Problema | Impacto | Evidencia | ¿Bloquea? |
|---|---|---|---|---|
| P1 | Dos flujos superpuestos: panel multiproducto encima del individual, con el mismo contexto duplicado (mercado/serie/concepto) | Alto | Captura desktop/móvil; inventario DOM (panel MP + “Mercado y Producto”) | Sí, genera confusión de “dos apps” |
| P2 | Columna de configuración tipo túnel: 400 px × 5.486 px, ~70 controles, sin plegado de las secciones principales | Alto | Medición de alturas por panel | Sí, impide orientarse |
| P3 | Sin modelo de pasos: no se ve qué falta ni dónde se está (configurar → generar → revisar → exportar) | Alto | Inventario (4 botones de acción individual + 5 del MP, sin stepper) | Sí, la tarea se siente improvisada |
| P4 | Zona de resultado vacía muy grande que roba protagonismo; estados vacíos sin CTA | Medio | Captura tablet (textarea gigante) | No, pero degrada la primera impresión |
| P5 | Historial y exportación solo existen dentro del panel multiproducto | Medio | Inventario (historial solo en `#mpPanel`) | No, pero rompe la unidad |
| P6 | Navegación superior sin colapsar: pestaña huérfana en tablet, tres filas de píldoras en móvil | Medio | Captura tablet/móvil | No |
| P7 | Badges de estado ambiguos: el indicador “—/OK/ERROR” se percibe como un botón de resta | Medio | Revisión visual de la captura móvil | No, pero induce al error |
| P8 | Jerarquía plana de opciones: 25 selects con hasta 28 opciones, 13 estéticas, todas con igual peso | Medio | Inventario DOM | No |
| P9 | Sin ancho máximo ni layout maestro-detalle: en tablet todo se estira a una columna | Medio | Captura tablet; columnas `728px` | No |
| P10 | Accesibilidad: botones de solo icono sin etiqueta visible; labels largos en selects; contraste del texto de ayuda | Bajo | Inventario DOM | No |

## Orden de ataque recomendado
1. **P1 + P2 + P3** (arquitectura y organización) — son la causa raíz; el resto se ordena
   mejor sobre una arquitectura nueva.
2. **P4 + P5** (resultados e historial compartido).
3. **P6 + P7 + P9 + P10** (responsive, componentes y accesibilidad).
4. **P8** (jerarquía de opciones) se resuelve en la misma reagrupación de P2.
