# Etapa 8A — Plan técnico hasta la Preview de Vercel

Fecha: 2026-11-24 · Rama `feat/multiproducto-definitivo-2026-11` @ `33df81d` (sin commits)
Documento rector de fases: `plan_implementacion.md` (etapa 8A).
Restricciones activas: sin commits/push/merge/deploy; `main` y la POC intactas.

## 1. Estado y alcance de F0–F6
| Fase | Alcance | Modifica código | Depende de | Esfuerzo |
|---|---|---|---|---|
| **F0** Fundaciones visuales | Bloque CSS nuevo y aislado (`tp-*`): stepper, acordeón, badges textuales, botones, foco, estados vacíos + demostrador | Sí: `styles.css` (solo adición) | — | corto |
| **F1** Cabecera de contexto y modos | Chip de contexto + pestañas “Un producto / Multiproducto” | Sí: `index.html`, `styles.css`, nuevo `js/taller-shell.js` | F0 | medio |
| **F2** Acordeones de configuración | Reagrupar los campos existentes en 4 acordeones; nada se elimina | Sí: `index.html`, `styles.css` | F1 | medio |
| **F3** Integrar el modo multiproducto | Selección de 10, progreso, pestañas de resultado, regeneración individual | Sí: `index.html`, `js/multiproducto-ui.js`, `styles.css` | F1, F2 | alto |
| **F4** Historial global | Un historial para ambos modos (cargar/guardar/exportar) | Sí: `js/taller-shell.js`, `index.html`, `styles.css`; opcional `js/multiproducto-historial.js` | F3 | medio |
| **F5** Responsive definitivo | Rail plegable en tablet, acción primaria sticky en móvil, navegación colapsada | Sí: `styles.css`, `js/taller-shell.js`, `index.html` | F3 | medio |
| **F6** Accesibilidad y pulido | `aria-label`, roles, contraste, foco | Sí: `index.html`, `styles.css` | F5 | corto |

Dependencia crítica: **F3 → F4/F5**. F0 puede ir primero sola (preparatoria).

## 2. Criterios de aceptación por fase
- **F0**: diff de `styles.css` solo adiciones; app actual idéntica (capturas 1440/768/390); demostrador con todos los componentes; suite Node verde.
- **F1**: cambiar mercado/idioma sigue actualizando región/subnichos (handlers intactos); las dos pestañas cambian el contenido visible sin recargar; stepper refleja la fase.
- **F2**: los 4 acordeones abren/cierran; ningún campo desaparece (los 25 selects y 40 botones siguen existiendo); los 10 productos generan igual.
- **F3**: las 10 comprobaciones de la etapa 6 se repiten (lote 10, seleccionados, regenerar uno, historial, ZIP, cancelar); `#mpPanel` deja de ser un bloque rival.
- **F4**: el historial lista lotes de ambos modos; cargar no regenera; exportar funciona desde ambos modos.
- **F5**: iframes reales 1440/768/390 sin scroll horizontal ni solapes; acción principal accesible en móvil.
- **F6**: sin botones de icono sin etiqueta; foco visible en recorrido con teclado.

## 3. Pruebas que protegen el generador individual y el multiproducto
| Prueba | Uso |
|---|---|
| Suite Node completa (98 ficheros) | Regresión global tras cada fase |
| `tests/product-contract.test.js` | Contratos y prompt del individual |
| `tests/multiproducto-contratos.test.js` | 10 productos y contratos |
| `tests/multiproducto-aislamiento.test.js` | Aislamiento/restauración |
| `tests/multiproducto-historial.test.js` / `-zip.test.js` | Historial y ZIP |
| POC `poc_multiproducto_harness.js` (10/10) en CDP | Compatibilidad de APIs |
| Smoke CDP: `#btnDirector/#btnBuild` → `#out` verificado | Generador individual intacto |
| Smoke CDP: lote de 10 + regenerar uno + historial + ZIP | Multiproducto intacto |
| Capturas 1440/768/390 antes/después | Responsive y no-regresión visual |

## 4. Calendario técnico (secuencia; cada fase termina con tu revisión)
```
F0 ──▶ (revisión) ──▶ F1 ──▶ (revisión) ──▶ F2 ──▶ (revisión)
     ──▶ F3 ──▶ (revisión) ──▶ F4 ──▶ (revisión) ──▶ F5 ──▶ (revisión) ──▶ F6
     ──▶ VALIDACIÓN PREVIEW ──▶ push autorizado ──▶ PREVIEW EN VERCEL
```
Puntos de control obligatorios: al cierre de F3 (cambio mayor de UI) y antes del push.

## 5. Cuándo estará técnicamente preparada para la Preview
Se considera lista cuando se cumplan **todas**:
1. F0–F6 implementadas y revisadas.
2. Suite Node verde (0 FAIL, 0 SKIP nuevos) + POC 10/10 + generador individual verificado.
3. Las 10 comprobaciones multiproducto repetidas sobre la UI nueva.
4. Capturas 1440/768/390 de la UI nueva sin desbordes.
5. `git status` coherente y plan de commits de la etapa 8 rehacerse (la preparación actual queda como referencia histórica, tal como pediste).
6. Autorización expresa para hacer **push de la rama**.

## 6. Punto exacto de publicación
**Publicación = push de `feat/multiproducto-definitivo-2026-11` a `origin` + Preview automática de Vercel.**
No hay paso de build: la app es estática (HTML/CSS/JS en la raíz). La Preview servirá
`index.html` y los módulos nuevos tal cual.

Acción concreta (a ejecutar solo con autorización):
```bash
git push -u origin feat/multiproducto-definitivo-2026-11
# Vercel: si el proyecto esta enlazado a GitHub, la Preview aparece por PR/rama.
# Alternativa con CLI (instalada, v65.15.0): vercel deploy (sin --prod)
```

## 7. Configuración Git–Vercel actual (comprobada)
- Remoto: `origin https://github.com/ency07/opencode-taller.git`.
- Vercel: **proyecto ya enlazado** localmente (`.vercel/project.json`):
  `projectName "opencode-taller"`, `orgId team_8r4IecsVNwcqbFm5c419SNra`,
  `projectId prj_ATXQnps215VswudM2MwEHGFFF4O9`. `.vercel` está en `.gitignore`.
- No existe `vercel.json`, `netlify.toml` ni `package.json`: Vercel lo detectará como
  **sitio estático** (sin build, salida en la raíz). No requiere variables de entorno.
- `index.html` no referencia URLs externas; usa rutas relativas (`js/…`, `styles.css`).
- GitHub Actions: `.github/workflows/node-regression.yml` cubre `main` y varias ramas, pero
  **no** `feat/multiproducto-definitivo-2026-11`. Un push a la rama no ejecuta CI (no
  bloquea); conviene añadirla cuando se autorice.

## 8. Riesgos que podrían impedir o degradar la Preview
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin push de la rama | Bloquea la Preview | Requiere autorización expresa |
| `js/sync-supabase.js` carga `@supabase/supabase-js@2.119.0` por CDN en runtime | Solo afecta a la sincronización opcional | No usar sync durante la prueba; si falla, el taller base sigue funcionando |
| `js/ia-client.js` apunta a Groq/OpenRouter/Gemini | Solo si se configura IA | Sin clave no interfiere |
| CI no cubre la rama | No valida en GitHub | Añadir la rama al workflow en una intervención aparte |
| Cambios de HTML/CSS desalinean los commits de la etapa 8 | Confusión de integración | Rehacer el plan de commits tras el rediseño (ya acordado) |
| `localStorage` con datos de pruebas locales | Ver historial ajeno | Probar con perfil limpio o borrar `POD2|multiproduct|` antes |

## 9. Definition of Done de la Preview
URL de Preview accesible con: nueva interfaz; individual generando; multiproducto con 10;
selección TODOS/SELECCIONADOS; regeneración individual; pestañas de resultados; historial
con guardar/cargar; exportación ZIP descargable; responsive en móvil y escritorio.

**Pendiente de tu autorización: empezar por F0 (ya definida en `f0_alcance_y_criterios.md`).**
