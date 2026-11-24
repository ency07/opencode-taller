# F0 · Fundaciones visuales — alcance exacto (pendiente de autorización)

Documento rector: `plan_implementacion.md` (etapa 8A). Esta fase es la primera de F0–F6.

## 1. Qué comprende exactamente F0
Solo **capa de presentación nueva y aislada**. No reescribe ninguna regla existente, no toca
`:root`, no modifica el HTML de producción y no toca JavaScript.

Entregables de la fase:
1. **Adición** al final de `styles.css` de un bloque comentado
   `/* Etapa 8A · F0 · Fundaciones */` con clases nuevas de prefijo `tp-`:
   - `.tp-stepper` / `.tp-step` (pasos: completado, activo, pendiente).
   - `.tp-accordion` / `.tp-accordion summary` (un grupo abierto a la vez; estado visual).
   - `.tp-state` / `.tp-state.ok|.err|.run|.idle` (badge **textual**: Pendiente/OK/Error/Generando).
   - `.tp-empty` (estado vacío con icono, frase y hueco para CTA).
   - `.tp-btn.primary` / `.tp-btn.ghost` / `.tp-btn[disabled]` (un solo primario; deshabilitado inequívoco).
   - `:focus-visible` global con anillo de 2 px.
   - Tipas/ritmo: `.tp-title`, `.tp-help`, `.tp-muted`.
   Los tokens siguen leyendo las variables ya definidas (`--panel`, `--line`, `--acc`,
   `--good`, `--bad`, `--warn`, `--mut`, `--r`); **no se redefine ninguna**.
2. **Nuevo** `PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa8A_auditoria_ux_ui/f0_componentes.html`
   (demostrador autocontenido que enlaza el `styles.css` real del taller) para validar las
   fundaciones con capturas. No entra en producción.

## 2. Archivos afectados
| Archivo | Operación |
|---|---|
| `styles.css` | **solo adición** al final (~120-150 líneas); cero cambios en reglas previas |
| `PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa8A_auditoria_ux_ui/f0_componentes.html` | nuevo |

No se tocan: `index.html`, `js/**`, `tests/**`, `main`, la POC.

## 3. Criterios de aceptación
1. `git diff styles.css` muestra **únicamente líneas añadidas** (sin `-`).
2. La interfaz actual no cambia: captura de `index.html` antes/después idéntica en contenido y
   distribución a 1440/768/390 (las clases nuevas no aplican a elementos existentes).
3. El demostrador muestra: stepper con tres estados, acordeón con un grupo abierto, badges
   textuales OK/Error/Generando/Pendiente, estado vacío con CTA, botones primario/ghost/
   deshabilitado distinguibles y anillo de foco visible.
4. Suite Node completa sin regresiones.
5. Sin errores de carga en consola al abrir `index.html`.

## 4. Pruebas de regresión de la fase
- Suite Node completa (F0 no toca JS, pero es la red de seguridad).
- Smoke CDP: recargar `index.html` con y sin el bloque nuevo → `window.__errs === []`, 10 chips,
  contador 10, mismo número de selects/botones y mismo `scrollHeight`.
- Capturas: `f0_antes_*.png` / `f0_despues_*.png` a 1440/768/390 (solo el demostrador varía;
  la app actual debe quedar igual).

## 5. Riesgos y reversibilidad
- Riesgo: que alguna regla nueva colisione con una clase existente → mitigado con el prefijo
  `tp-` y leyendo variables existentes.
- Reversible: eliminar el bloque añadido restaura el estado exacto (diff de solo adiciones).

## 6. Fuera de alcance (siguen para fases posteriores)
Acordeones reales sobre los campos (F2), cabecera de contexto y modos (F1), integración del
modo multiproducto (F3), historial global (F4), responsive definitivo (F5), accesibilidad (F6).

**F0 modifica código (`styles.css`). Quedo a la espera de tu autorización expresa.**
