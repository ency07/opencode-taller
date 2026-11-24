# Etapa 8A — Wireframes propuestos

Wireframe navegable (las tres pantallas): `wireframes_propuestos.html`.
Capturas reales de la interfaz actual: `ux_desktop.png`, `ux_tablet.png`, `ux_movil.png`.

## Escritorio · 1440 px
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Taller POD   [Un producto] [Multiproducto]      Colombia·ES  Serie  ⚙  │
├──────────────────────────────────────────────────────────────────────────┤
│ ① Configurar  ② Generar  ③ Revisar  ④ Exportar                            │
├───────────────────────┬──────────────────────────────────────────────────┤
│ ▸ Contexto            │ SELECCIÓN DE PRODUCTOS   [Todos][Seleccionados]  │
│   Mercado / Idioma    │ CAMISETA SOFT OK  MUG Pendiente  DISPLATE Error │
│   Marca · Región      │ HOODIE Generando…  (rejilla de 10)               │
│   Serie               │ ████████░░ 45%  Generando DISPLATE… (8/10)      │
│ ▾ Producto e impres.  │ [Generar lote][Cancelar][Guardar][Exportar ZIP] │
│   Producto · Método   ├──────────────────────────────────────────────────┤
│ ▸ La idea             │ RESULTADO  [CAMISETA SOFT][MUG][DISPLATE]       │
│ ▸ Avanzado            │ Prompt + metadatos + [Copiar][1/2][Regenerar]   │
│                       ├──────────────────────────────────────────────────┤
│ [Crear los 3 diseños] │ HISTORIAL LOCAL                                  │
│                       │ hoy 12:03 · 10 · COMPLETO   [Cargar][ZIP]        │
└───────────────────────┴──────────────────────────────────────────────────┘
```

## Tablet · 768 px
- Cabecera con contexto colapsado en chip y menú hamburguesa.
- Stepper en una fila.
- Rail de configuración plegable a la izquierda (se abre con “Configurar”); área de trabajo
  a la derecha cuando el rail está abierto, a todo el ancho si se cierra.
- Productos a 5 columnas (horizontal) o 2 (vertical).
- Resultado debajo de la selección; historial en aside plegable.

## Móvil · 390 px
- Cabecera: marca + pestañas de modo + hamburguesa (1 fila).
- Stepper compacto en una fila desplazable.
- Acordeones de configuración apilados.
- Productos en rejilla de 2 columnas con nombres a 2 líneas.
- Resultado con pestaña y visor compacto.
- **Acción primaria fija abajo** (sticky), para no depender del scroll.

## Qué conserva / reorganiza / rediseña
| Componente actual | Decisión | Motivo |
|---|---|---|
| `#market/#region/#brand/#language/#serie` | **Reorganizar** en cabecera/acordeón de contexto | Es el contexto de ambos modos |
| `#product/#marketplace/#printMethod/#stampSide/#capApplication` | **Reorganizar** en acordeón “Producto e impresión” | Se usa poco y es extenso |
| `#concept/#message/#support/#audienceSet` | **Conservar** en “La idea” | Ya están bien agrupados |
| `#dominio/#subniche/#creativeTerritory/#aestheticPreference` | **Reorganizar** en “Avanzado” | Ruido para el caso común |
| Banco de motivos / Variación / Mezclas | **Reorganizar** en acordeones plegados | Opcionales por naturaleza |
| Panel multiproducto (`#mpPanel`) | **Rediseñar** como modo con stepper y selección propia | Hoy compite con el flujo individual |
| Fichas A/B/C, árbitro, matriz, revisión visual | **Conservar** en “Revisar” | Flujo validado |
| Prompt final + copiado | **Conservar** y ampliar metadatos | Reutilizable en multiproducto |
| Historial y ZIP | **Reorganizar** a un historial global | Hoy solo existe dentro del MP |
| Botones de icono de cabecera | **Rediseñar** con etiqueta accesible | Falta `aria-label`/texto |
