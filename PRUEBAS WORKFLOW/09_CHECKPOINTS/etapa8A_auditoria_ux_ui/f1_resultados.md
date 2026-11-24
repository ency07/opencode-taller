# F1 · Resultados — Cabecera de contexto y modos

Fecha: 2026-11-24 · Rama `feat/multiproducto-definitivo-2026-11` @ `33df81d` · Sin commits.
Alcance autorizado por el usuario: cabecera compartida, modos «Un producto / Multiproducto»,
`js/taller-shell.js`, componentes `tp-*`, contexto sin duplicar, ambos modos operativos.

## Archivos modificados / creados
| Archivo | Operación |
|---|---|
| `js/taller-shell.js` | **Nuevo** (sha256 `371fe041302902b4…`) — cabecera de contexto, selector de modo, stepper |
| `index.html` | +1 línea: `<script src="js/taller-shell.js" defer></script>` (solo adición; `+61/−0` total sobre HEAD incluyendo el panel de la etapa 6) |
| `styles.css` | Solo adiciones (`+396/−0` sobre HEAD): bloque `tp-` (F0) + ajuste del stepper en ≤640 px (F1) |

Diff: `f1_diff.patch`. No se tocó ningún otro archivo. Ninguna funcionalidad eliminada;
ningún contrato, banco, umbral ni lógica del motor alterados.

## Comportamiento implementado
- **Cabecera de contexto** (`.tp-topbar`): chips de Mercado+Región, Marca, Producto y Serie.
  Son una **vista** de los campos existentes (`#market`, `#brand`, `#serie`, `#product`);
  se actualizan con `change`/`input` de esos campos. No hay información duplicada ni
  fuente alternativa de verdad.
- **Selector de modo** (`.tp-mode`): «Un producto» / «Multiproducto». Cambia solo la
  visibilidad del panel multiproducto (`#mpPanel`); no altera valores ni comportamiento.
  Por defecto «Un producto»; el modo se persiste en `localStorage` (`POD2|taller|modo`).
- **Stepper**: 1 Configurar · 2 Generar · 3 Revisar · 4 Exportar, derivado de los mensajes de
  estado existentes mediante `MutationObserver` (sin tocar el motor).
- Degradación elegante: si no existe `.main-grid`, la cabecera no se inyecta y la app sigue
  igual.

## Pruebas ejecutadas (resultados reales)
| Prueba | Resultado |
|---|---|
| Suite Node completa | **98 ficheros · 10.638 PASS · 0 FAIL · 0 SKIP** (`f1_suite_resumen.txt`) |
| Consola | `__errs === []` en todas las cargas y cambios de modo |
| Inyección de cabecera | `TallerShell._state().inyectado === true`; chips con contexto real |
| Modo individual | `#mpPanel` oculto; `#btnDirector` → `#out` con 38.498 caracteres verificados |
| Modo multiproducto | `#mpPanel` visible; lote de 2 productos seleccionados: **2/2 OK** |
| Cambio de modo sin pérdida | `mismoContexto: true` (mercado/marca/producto/idioma/serie/región idénticos antes y después) |
| Persistencia | `individual → multiproducto` guardado; tras recargar, el modo restaurado es `multiproducto` y `#mpPanel` vuelve a verse |
| Stepper móvil | `flex-wrap: wrap`; los 4 pasos completos, `scrollWidth === clientWidth` (sin corte) |
| Capturas | `f1_multi_desktop.png`, `f1_multi_tablet.png`, `f1_multi_movil.png`, `f1_individual_desktop.png` |

## Incidencia detectada y corregida durante la fase
- **Incompatibilidad real con la estructura existente**: el DOM tiene **dos** bloques
  `.shell` (el primero envuelve `header.topbar`, el segundo `.main-grid`). La primera versión
  insertaba la cabecera en el primer `.shell` y fallaba con
  `NotFoundError: The node before which the new node is to be inserted is not a child of this node`.
  Corregido usando el padre real de `.main-grid` (`rejilla.parentElement`). Verificado tras la
  corrección (cabecera presente, sin errores).
- **Ajuste fino**: el stepper se cortaba en móvil (`overflow-x:auto` dejaba el paso 4 a medias);
  se añadió un `@media (max-width:640px)` que lo hace envolver (dentro del bloque `tp-`,
  solo adiciones). También se abrevió el chip de mercado/marca para evitar truncados largos.

## Criterios de aceptación
| Criterio | Estado |
|---|---|
| Cabecera con contexto compartido | ✅ |
| Modos Un producto / Multiproducto | ✅ |
| Contexto sin duplicar ni perder | ✅ (`mismoContexto: true`) |
| Ambos modos funcionan | ✅ individual verificado; multiproducto 2/2 |
| Generador individual intacto | ✅ `#out` 38.498 caracteres |
| Orquestador multiproducto intacto | ✅ suite + lote 2/2 |
| Consola sin errores | ✅ |
| Capturas 1440/768/390 | ✅ |
| Solo adiciones en CSS/HTML | ✅ (`+61/−0`, `+396/−0`) |

## Estado Git
Rama `feat/multiproducto-definitivo-2026-11`, HEAD `33df81d`, staging vacío, 0 commits.
Sin push/merge/deploy. `main` y la POC intactas.

**F1 terminada. Detenido hasta tu revisión para autorizar F2.**
