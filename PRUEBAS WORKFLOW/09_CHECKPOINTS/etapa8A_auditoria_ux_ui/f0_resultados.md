# F0 · Resultados de la implementación

Fecha: 2026-11-24 · Rama: `feat/multiproducto-definitivo-2026-11` @ `33df81d` · Sin commits.
Alcance autorizado: `f0_alcance_y_criterios.md`.

## Cambios realizados
| Archivo | Operación |
|---|---|
| `styles.css` | **Solo adición** del bloque `Etapa 8A · F0 · Fundaciones visuales` (prefijo `tp-`, ~230 líneas) |
| `PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa8A_auditoria_ux_ui/f0_componentes.html` | Nuevo demostrador (no producción) |

No se modificó `index.html` ni ningún JavaScript. No se tocó `:root` ni ninguna regla previa.

Diff completo: `f0_styles_diff.patch`.
Comprobación de solo-adiciones:
```
$ git diff --numstat -- styles.css
384    0    styles.css      # 0 lineas eliminadas
$ git diff -- styles.css | grep -c "^-[^-]"   # -> 0
```
(Las 384 líneas frente a HEAD incluyen las 154 de la etapa 6, ya presentes; el bloque F0
añade ~230.)

Componentes entregados: `.tp-stepper/.tp-step(.done/.active/.pending)`, `.tp-accordion`
(+ summary con resumen), `.tp-state(.ok/.err/.run/.idle)`, `.tp-btn(.primary/[disabled])`,
`.tp-empty`, `.tp-topbar`, `.tp-context-chip`, `.tp-mode`, `.tp-title/.tp-help/.tp-muted`,
y `:focus-visible` **restringido a la capa `tp-`** para no alterar la UI actual.

## Evidencia de no-regresión (la app no cambia)
Capturas tomadas con el mismo método (browser real) antes y después:

| Ancho | sha256 antes | sha256 después | Resultado |
|---|---|---|---|
| 1440 | `6897bd42e998234c` | `6897bd42e998234c` | **byte a byte idéntica** |
| 768 | `2126ec16a8489c9b` | `2126ec16a8489c9b` | **byte a byte idéntica** |
| 390 | `d4c41342787c591a` | `d4c41342787c591a` | **byte a byte idéntica** |

Métricas medidas dentro de la app (iframes reales del mismo origen):

| Métrica | 1440 antes/después | 768 antes/después | 390 antes/después |
|---|---|---|---|
| `scrollHeight` | 5.747 / 5.747 | 6.754 / 6.754 | 8.051 / 8.051 |
| `<select>` | 25 / 25 | 25 / 25 | 25 / 25 |
| botones | 40 / 40 | 40 / 40 | 40 / 40 |
| chips MP | 10 / 10 | 10 / 10 | 10 / 10 |
| paneles | 13 / 13 | 13 / 13 | 13 / 13 |

Consola: `window.__errs === []` antes y después (colector de `error` y `unhandledrejection`).

## Pruebas ejecutadas
- **Suite Node completa**: 98 ficheros · **10.688 PASS · 0 FAIL · 0 SKIP**
  (`f0_suite_resumen.txt`, `f0_suite_completa.log`).
- **Smoke CDP**: carga limpia, 10 chips, contador 10, 25 selects, 40 botones, sin errores.
- **Comparación visual**: tres anchos idénticos (arriba).
- **Demostrador**: `f0_componentes_desktop.png` y `f0_componentes_movil.png` verifican
  topbar/modos, stepper con estados, acordeones abierto/cerrado, badges textuales,
  botones primario/secundario/deshabilitado y estado vacío con CTA.

## Criterios de aceptación
| Criterio | Estado |
|---|---|
| Diff solo adiciones | ✅ `384 / 0` |
| App actual idéntica (capturas) | ✅ idénticas a nivel de bytes |
| Componentes visibles y correctos | ✅ (demostrador) |
| Suite Node verde | ✅ 0 FAIL / 0 SKIP |
| Consola sin errores | ✅ |
| `index.html` y JS intactos | ✅ |
| Demostrador fuera de producción | ✅ (solo en evidencias) |

## Estado Git
- Rama `feat/multiproducto-definitivo-2026-11`, HEAD `33df81d`; **staging vacío**, 0 commits.
- Modificados: `styles.css` (+adición F0). Nuevos: `PRUEBAS WORKFLOW/…/f0_*`.
- Fuera de alcance respetado: no se inició F1; nada más fue tocado.

**F0 terminada. Pendiente de tu revisión para autorizar F1.**
