# Etapa 6 — Auditoría UX/UI y propuesta (paso previo a la implementación)

## 1. Auditoría de la interfaz actual (HECHO, verificado en `index.html`/`styles.css`)

### Estructura actual
- Cabecera (`header.topbar`) con logo, botón de memoria portable (`#btnMemory`) y botón IA (`#btnAI`).
- Cuerpo en `.shell > .main-grid` con dos columnas: `.left-col` (configuración) y `.right-col` (resultados).
- Left-col, en orden: panel **1 Mercado y Producto** (`#market`, `#region`, `#subniche`, `#product`, …), panel **2 La idea** (`#serie`, `#concept`, `#message`, `#support`, bancos), *Variación desde imagen* y *Mezclas y banco* (plegables), y los botones del flujo actual: **`#btnDirector` «Crear los 3 diseños»**, `#btnBuild`, `#btnNewSet`, `#btnReset`.
- Right-col: `#status`, Árbitro, Revisión visual, Fichas A/B/C, Matriz comparativa, **Prompt final** (`#out`, textarea) con `#btnCopy`, `#btnCopyPart`, `#btnFmt`, y Validador de hoja.
- Estilos: `.panel`, `.panel-title`, `.actions`, `.btn.primary/.ghost`, `.status`, `.badge`, `.field-row`; responsive en `@media (max-width:1100px)` y `(max-width:900px)` (las dos columnas colapsan a una).

### Qué existe hoy para un solo producto
| Flujo | Elemento | Estado |
|---|---|---|
| Generar | `crearLos3Disenos()` + `#btnDirector` | Funciona |
| Ver resultado | `#out` + tarjetas/fichas/matriz/árbitro | Funciona |
| Copiar | `#btnCopy`, `#btnCopyPart`, `#btnFmt` (leen `#out`) | Funcionan |

### Carencias detectadas
1. **No existe multiproducto en la interfaz**: un solo `#product` por generación y un solo `#out`. No hay dónde mostrar 10 prompts sin perder los demás.
2. **No hay progreso** para operaciones largas (≈5 s/producto; 10 ≈ 50 s): el usuario no sabe si la app responde.
3. **No hay historial accesible** ni recuperación de lotes.
4. **No hay exportación** desde la interfaz.
5. **Riesgo de doble ejecución**: varios botones quedan activos durante la generación; no hay bloqueo ni estado compartido en la UI.
6. **Copiado acoplado a `#out`**: los botones actuales solo copian el textarea; no hay copiado por producto.
7. **Móvil**: el layout colapsa, pero un panel nuevo debe diseñarse responsive desde el inicio (chips, pestañas y barras apilables).

## 2. Propuesta UX/UI

### Principios
- **Un solo lugar para el lote**: panel dedicado, sin mover ni reordenar los paneles actuales; el generador individual queda intacto.
- **Progreso visible y bloqueante**: se sabe qué se está generando y no se puede lanzar otra corrida.
- **Resultados persistentes y comparables**: pestañas por producto, cada una con su prompt y su estado; cambiar de pestaña no destruye nada.
- **Reutilizar lo que ya funciona**: el prompt por pestaña se vuelca en `#out`, así los botones actuales (copiar, copiar 1/2) siguen sirviendo.
- **Lote como objeto**: guardar, cargar, exportar y regenerar actúan siempre sobre el lote completo o sobre el producto explícito.

### Diseño (mockup: `propuesta_mockup.html`)
Panel **“Generación multiproducto”** al inicio de la left-col, con cinco zonas:

1. **Selección** — rejilla de 10 tarjetas-chip (nombre + estado: pendiente · ok · error) con todo el ancho disponible; botones `Todos` / `Ninguno` y contador “N seleccionados”. Estado bloqueado durante la corrida.
2. **Concepto compartido (resumen)** — línea que refleja lo que se usará: mercado/serie/concepto/mensaje leídos de los campos actuales (no se duplican campos; se indica la fuente y se avisa si faltan).
3. **Acción y progreso** — botón primario `Generar N productos` (deshabilitado si N=0 o hay corrida) + barra de progreso con texto `Generando DISPLATE… (7/10)` y botón `Cancelar` (detiene solicitando confirmación). Si un producto falla, el progreso sigue y el chip queda en error.
4. **Resultados** — pestañas por producto (chip con color por estado). Cuerpo: prompt en `#out` (compartido) + metadatos (producto, estado, caracteres) + acciones: `Copiar`, `Copiar 1/2`, `Regenerar solo este`, `Ver error` cuando aplique.
5. **Lote** — acciones: `Guardar en historial` (también automática al terminar), `Exportar ZIP`, `Copiar todos`; lista de historial debajo: fecha · N productos · COMPLETO/PARCIAL, con `Cargar`, `ZIP` y `Eliminar`.

### Comportamiento
- Durante la corrida: botones de generar/regenerar deshabilitados, chips bloqueados, barra real por índice y por fallback inyectado.
- Al terminar: el lote se guarda automáticamente en el historial local (prefijo `POD2|multiproduct|`); los fallidos pueden regenerarse sin tocar los demás.
- Cargar un lote no ejecuta generación: pobla las pestañas desde el historial.
- Exportar descarga `lote-multiproducto-<id>.zip` (12 archivos para 10 productos).
- Responsive: la rejilla de selección pasa de 2–3 columnas a 1 en móvil; las pestañas se disponen en fila desplazable; el progreso y las acciones ocupan el 100%.

### Coexistencia
El flujo actual (pasos 1–2, «Crear los 3 diseños», fichas, matriz, árbitro) no se modifica: el panel multiproducto es adicional y comparte `#out`/historial sin pisarlos fuera de la acción explícita del usuario.
