# Etapa 8A — Plan de implementación del rediseño (propuesta)

Estado: **no implementado**; pendiente de aprobación explícita.
Restricción: ninguna fase puede alterar contratos, bancos, umbrales ni lógica del motor.

## Principios de implementación
1. **No reescribir desde cero**: mover y reagrupar lo que existe, conservando `id` de los
   campos para no romper los handlers en cascada (mercado→región→subnicho→producto).
2. **Revalidar cada fase**: suite Node completa + smoke CDP del generador individual y del
   multiproducto.
3. **Archivar la preparación de commits de la etapa 8** (no se ejecutan durante el rediseño):
   los commits quedarían desalineados respecto al nuevo HTML/CSS y habría que rehacer el plan.

## Fases

### F0 · Fundaciones visuales (solo presentación)
- Archivos: `styles.css` (tokens, `.stepper`, `.accordion`, `.chip-state`, estados vacíos).
- Qué: tipografía/ritmo, un solo primario, badges textuales, foco visible.
- Pruebas: `node --check` no aplica; revisión visual CDP a 1440/768/390.
- Riesgo: bajo. Reversible (bloque CSS aislado).

### F1 · Cabecera de contexto y navegación por modos
- Archivos: `index.html` (cabecera), `styles.css`, nuevo `js/taller-shell.js`.
- Qué: chip de contexto (mercado/idioma/marca/serie) y pestañas “Un producto / Multiproducto”.
- Depende de: F0.
- Riesgo: **medio** — los handlers de cascada leen los mismos `id`; hay que conservarlos y
  comprobar que el cambio de contexto sigue actualizando región/subnicho.
- Pruebas: humo CDP (cambiar mercado a `global_en` y verificar región/subnicho), suite Node.

### F2 · Acordeones de configuración
- Archivos: `index.html` (envolver grupos), `styles.css`.
- Qué: agrupar los campos existentes sin eliminar ninguno; “Avanzado” plegado por defecto.
- Depende de: F1 (comparte cabecera).
- Riesgo: **bajo-medio** (markup y estado abierto/cerrado; no toca valores).
- Pruebas: recorrer los 10 productos y los 3 modos de workflow tras plegar/desplegar.

### F3 · Integrar el modo multiproducto
- Archivos: `index.html` (retirar `#mpPanel` como bloque; crear contenedores por modo),
  `js/multiproducto-ui.js` (apuntar a los nuevos contenedores conservando sus `id`
  internos o renombrándolos en cascada), `styles.css`.
- Qué: selección de 10, progreso, pestañas de resultado y regeneración individual.
- Depende de: F1, F2.
- Riesgo: **alto** — es la UI validada en las etapas 6-7; todo cambio debe pasar las mismas
  pruebas (10 productos, seleccionados, regenerar, historial, ZIP, responsive).
- Pruebas: las de la etapa 6 + `tests/multiproducto-*.test.js` (no requieren DOM).

### F4 · Historial global y exportación compartida
- Archivos: `js/multiproducto-historial.js` (opcional: guardar también lotes individuales con
  el mismo prefijo), `js/taller-shell.js`, `index.html`, `styles.css`.
- Qué: un único historial accesible desde ambos modos; cargar un lote individual o multiproducto.
- Depende de: F3.
- Riesgo: **medio** — hay que decidir si el individual guarda lotes (hoy no lo hace); si no,
  el historial mostraría solo multiproducto. Se documenta la decisión antes de programar.

### F5 · Responsive definitivo
- Archivos: `styles.css`, `index.html`, `js/taller-shell.js` (rail plegable, sticky móvil).
- Qué: rail de configuración en tablet, acción primaria fija en móvil, navegación colapsada.
- Depende de: F3.
- Riesgo: **medio** — verificar con iframes reales 1440/768/390 (el emulador CDP de este
  equipo no cambia `innerWidth`).

### F6 · Accesibilidad y pulido
- Archivos: `index.html` (`aria-label`, roles), `styles.css` (foco/contraste).
- Riesgo: bajo.

## Riesgos globales y mitigación
| Riesgo | Mitigación |
|---|---|
| Romper el generador individual | Suite completa + smoke CDP antes/después de cada fase; los ids no se renombran sin actualizar `motor-nucleo.js` y todos los handlers |
| Romper el multiproducto validado | Repetir las 10 comprobaciones de la etapa 6 tras F3 |
| Desalinear los commits de la etapa 8 | Congelar esa preparación; rehacer el plan de commits al terminar el rediseño |
| Cambios de CSS globales con efecto secundario | Aislar en clases nuevas (prefijo `tp-`), no reescribir las existentes |
| Responsive sin dispositivo real | Verificación por iframe del mismo origen a tres anchos |

## Criterios de salida
- Las dos capturas “antes” y “después” (1440/768/390) muestran el mismo contenido y la misma
  densidad de información, con jerarquía y un solo primario por pantalla.
- Los 10 productos se siguen generando; regeneración individual y ZIP intactos.
- Suite Node sin regresiones; POC 10/10; generador individual verificado.
