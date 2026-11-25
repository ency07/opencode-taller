# Etapa "referencia visual" — Informe final

**Fecha:** 2026-11-24
**Rama:** `feat/multiproducto-definitivo-2026-11`
**HEAD:** `6ff2906ba85249c3037610cba05406642aad44e7` (sin commit nuevo)
**Referencia:** captura de la interfaz TallerPOD adjunta por el usuario (dashboard oscuro con panel lateral, barra de contexto, pestañas y tres tarjetas A/B/C).

---

## 1. Objetivo y alcance

Reproducir la organización y jerarquía de la captura de referencia sobre la arquitectura F0–F6 ya existente,
**conservando toda la funcionalidad** (generador individual, multiproducto, historial, ZIP, regeneración,
copiado, selectores creativos, validadores y navegación entre herramientas).

Trabajo de presentación: no se modificó el motor, los contratos, los bancos, los umbrales ni `PRODUCT_BIAS`.

## 2. Archivos modificados

| Archivo | Cambio |
|---|---|
| `js/taller-shell.js` | +378 / −1 líneas. Cabecera reordenada, laterales con pestañas, indicadores, vistas, previews, tooltips y ajustes de chip. |
| `styles.css` | +172 líneas. Bloque nuevo con prefijo `tp-` (solo adiciones; sin redefinir `:root`). |

Sin dependencias externas nuevas. Sin cambios en `index.html` ni en los módulos del motor.

## 3. Cambios implementados

1. **Barra de contexto en una sola fila**: chips (`◆ Colombia · Todas`, `Marca`, `Producto`, `Serie`),
   stepper `Configurar → Generar → Revisar → Exportar` centrado, y controles a la derecha
   (rail de configuración + selector `Un producto / Multiproducto`).
2. **Panel lateral con pestañas `Ajustes / Lote (n) / Historial`** (`js/taller-shell.js` → `organizarLaterales()`).
   El contador de Lote refleja los productos seleccionados.
   Las acciones se reparten: las del lote (`Generar`, `Cancelar`, `Guardar lote`, `Exportar ZIP`) viven en
   el pane **Lote**; las individuales (`Crear los 3 diseños`, validar set, limpiar fichas, banco, copiar) en **Ajustes**.
3. **Acordeones renombrados** según la referencia: `Contexto`, `Producto e impresión`,
   `La idea y audiencia`, `Avanzado y bancos`. No se eliminó ningún campo ni ID.
4. **Indicadores de estado** (`#tpIndicadores`): Audiencia n/100, Producto n/100, Árbitro y QA visual,
   derivados del mensaje de estado real (sin inventar valores). Se actualizan con el estado.
5. **Zona principal con pestañas**: `Fichas 01A · 01B · 01C`, `Matriz comparativa`,
   `Árbitro y Validador`, `Prompt final`. Los paneles existentes se reagrupan; no se duplica contenido.
6. **Tarjetas A/B/C**: rejilla de tres columnas en escritorio (`auto-fit`), paleta de color visible,
   barras de verificación y estado inferior. Cada tarjeta conserva sus controles independientes.
7. **Previsualización ampliable por tarjeta** (`construirPreviews()`): estado vacío explícito
   ("Vista previa: aparecerá aquí cuando se genere la imagen") y botón Ampliar/Reducir.
   Nunca se simula una imagen inexistente.
8. **Acción principal en naranja** (`--tp-cta`), manteniendo el comportamiento original del botón.
9. **Tooltips en selects** truncados (`title` con la opción completa).
10. **Responsive**: envolvido de chips/indicadores/pestañas, una columna en móvil y padding para que el pie
    sticky no tape el último control.

## 4. Fallos encontrados y corregidos

1. **Bloqueo de la generación individual** (hilo JS colgado tras pulsar "Crear los 3 diseños").
   *Causa:* un `MutationObserver` sobre `#cards` que insertaba las previews alimentaba su propia mutación.
   *Corrección:* las previews se construyen **una sola vez por render**, detectadas desde el mensaje de
   `#status` (nunca observando `#cards`). Verificado: la generación vuelve a completarse (~8–12 s).
2. **Botones del lote visibles en modo individual** (`Generar 10 productos` / `Exportar ZIP` aparecían en el
   pane Ajustes). *Causa:* al reagrupar, `.actions-primary` con los botones del MP se movió al pane Ajustes.
   *Corrección:* reparto por pane según los botones que contiene. Verificado: `mpGenerate` → `lote`,
   `btnDirector` → `ajustes`.
3. **Chip de mercado truncado** ("Colombia · Todas /"). *Corrección:* la región "Todas / …" se resume a "Todas".
4. **Dos tarjetas por fila en escritorio** (el mínimo de 230 px no cabía en 674 px). *Corrección:* mínimo 205 px.

## 5. Pruebas ejecutadas (resultados reales)

- **Suite Node completa:** **97 PASS · 0 FAIL · 1 SKIP**
  (`security-browser.test.js`, requiere `playwright`, no instalado).
- **Generación individual (navegador real, CDP):** `Prompt y selectores verificados · audiencia 79/100 ·
  producto 100/100`; `#out` ≈ 38.600 caracteres; **3 tarjetas** y **3 previews**; consola sin errores.
- **Multiproducto:** selección 10/10 → `Lote terminado: 10 OK · 0 errores · 10/10`; botón ZIP habilitado;
  guardado de lote y claves `POD2|` presentes.
- **Pestañas de vista:** Fichas / Matriz / Árbitro / Prompt activables y con el contenido esperado en cada pane.
- **Laterales:** pestaña Lote activa al entrar en modo multiproducto; Historial accesible; contador 10.
- **Responsive (ancho real, medido con iframes de 1280 / 768 / 390 px):** `scrollWidth` 1272 / 760 / 382,
  **sin scroll horizontal ni elementos fuera del viewport** en los tres anchos. La emulación CDP de métricas
  no es fiable en este Edge headless (`innerWidth` no cambia), por eso la medición se hizo con iframes reales
  del ancho destino (`_responsive_check.html`, temporal ya eliminado).

### Capturas (esta carpeta)

- `ind_desktop.png` (1440 px), `ind_tablet.png` (768 px), `ind_movil.png` (390 px) — modo individual con resultado.
- `ref_multi_lote.png` (1440 px) — pane Lote con los 10 productos seleccionados.
- `preview_vercel_desktop.png` — Preview de Vercel (commit previo).

## 6. Estado Git

- `git diff --check`: **sin avisos**.
- `git diff --stat`: `js/taller-shell.js` +378/−1; `styles.css` +172.
- Restaurado `PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa5_zip/muestra_10.zip`, modificado como efecto colateral
  de probar el exportador.
- **Sin commit, push, merge ni despliegue.** `main` sigue en `d0ca672db4ea7ad2d5ae0f950f8958e6397fd1d2`.
- HEAD de la rama: `6ff2906ba85249c3037610cba05406642aad44e7` (sin cambios).

## 6b. Design system aplicado: Warm Graphite & Amber

Fuente: `C:/Users/Administrator/Downloads/taller_pod_design_system.md` (paleta YAML del documento).

**Tokens actualizados en `:root`** (`styles.css`), sin tocar funcionalidad:

| Token | Valor | Rol |
|---|---|---|
| `--bg` / `--surface` | `#131311` | negro cálido (fondo) |
| `--panel` | `#1C1C19` | surface-container-low |
| `--panel-alt` | `#20201D` | surface-container |
| `--surface-high` / `--surface-highest` / `--surface-lowest` | `#2A2A28` / `#353532` / `#0E0E0C` | gradación tonal |
| `--line` / `--line2` | `#3D3B37` / `#897366` | outline-variant / outline |
| `--text` / `--mut` | `#E5E2DE` / `#ADABA7` | on-surface / on-surface-variant |
| `--acc` / `--acc-ink` | `#A4C9FF` / `#00315D` | secondary (cielo): info, chips y pestañas activas |
| `--good` | `#4EDEA3` | tertiary (esmeralda): verificadores y árbitro |
| `--bad` | `#FFB4AB` | error coral |
| `--warn` | `#FBBF24` | QA pendiente |
| `--tp-cta` / `--tp-cta-ink` | `#E07A2B` / `#4C2200` | CTA primario y pasos activos |

**Uso de roles:** CTA (`Crear los 3 diseños`), `Generar 10 productos`, paso activo del stepper y modo
seleccionado → ámbar; pestañas activas (laterales y de vista) → cielo con texto `#00315D`; verificados
y árbitro → esmeralda; QA pendiente → ámbar oro.

**Contraste WCAG medido (pares del sistema):** texto/fondo 13.23:1 · mut/fondo 8.11:1 · CTA ink/CTA
4.55:1 · acc ink/acc 7.75:1 · esmeralda/ámbar/coral sobre panel ≥10:1.

No se cargaron fuentes externas (Plus Jakarta Sans / Instrument Sans / Spline Sans Mono) para no introducir
dependencias de red no autorizadas; la tipografía queda como mejora pendiente si se desea.

Capturas: `pal_desktop.png`, `pal_movil.png`, `pal_multi_lote.png`.

## 7. Pendientes y limitaciones

- Los textos de los selects pueden quedar con elipsis en columnas estrechas; se añadió `title` con el valor
  completo para hovering.
- La previsualización solo muestra imagen cuando el motor produce una imagen real; hasta entonces queda el
  estado vacío declarado.
- Portapapeles en headless Edge: `navigator.clipboard` denegado; la UI conserva el fallback por selección.
- `security-browser.test.js` sigue en SKIP (falta `playwright`).
- No verificado en dispositivo físico (solo emulación CDP a 1440/768/390).
