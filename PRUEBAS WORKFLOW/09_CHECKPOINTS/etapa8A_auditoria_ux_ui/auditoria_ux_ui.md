# Etapa 8A — Auditoría UX/UI del Taller POD

Fecha: 2026-11-24 · Sin modificar código · Evidencia: capturas e inventario real del DOM.

Método: inspección del DOM en navegador (`http://127.0.0.1:8080/index.html`), capturas
reales a 1440 / 768 / 390 px (`ux_desktop.png`, `ux_tablet.png`, `ux_movil.png`) y medición
de layout (iframes reales del mismo origen).

## 1. Qué hay hoy (medido)
- 13 secciones/paneles; **25 `<select>` y 40 botones** siempre presentes; 11 campos de texto/área.
- Columnas en escritorio (1440): `400px | 964px`. La columna de configuración mide
  **5.486 px de alto**; el panel “Mercado y Producto” + “La idea” suman **2.112 px**.
- El panel multiproducto mide 1.330 px y repite el contexto (mercado/serie/concepto) que ya
  está en “Mercado y Producto” y “La idea”.
- Alturas totales de documento: 5.747 px (1440), 6.754 px (768), 8.051 px (390).
- Sin desbordamiento horizontal en ningún ancho (verificado).

## 2. Diagnóstico por área

### 2.1 Arquitectura de información y navegación
- La cabecera tiene 6 píldoras de herramientas (Taller, Editor de bancos, Motor de
  lenguajes, Sistema matriz, Constructor de Prompt, Constructor de Prompt IA). En tablet
  envuelven con una pestaña huérfana; en móvil ocupan **tres filas** antes del contenido.
- No hay indicación de que “Individual” y “Multiproducto” son dos modos del mismo taller:
  el panel MP se coloca **encima** del flujo existente y ambos comparten los mismos campos,
  lo que genera la sensación de dos aplicaciones superpuestas.
- El orden de lectura obliga a ver primero el bloque multiproducto, que es el uso
  avanzado, antes que el flujo básico de un producto.

### 2.2 Jerarquía visual y densidad
- Jerarquía plana: 25 desplegables con hasta 28 opciones cada uno (subnichos, dominios),
  13 preferencias estéticas, 9 regiones… todo con el mismo peso visual.
- Solo las secciones 3-5 son plegables; las dos primeras (la carga principal) no.
- En tablet/móvil, un único dato (“Modo”) estira un selector a todo el ancho.
- El textarea de resultado vacío (min-height 160 px) más el historial dejan una gran zona
  muerta que roba protagonismo a los controles (captura tablet).

### 2.3 Flujo de trabajo
- El generador individual usa `#btnDirector` (“Crear los 3 diseños”), `#btnBuild`, `#btnNewSet`
  y `#btnReset`: cuatro acciones de alcance distinto sin jerarquía clara ni Stepper que
  indique dónde está el usuario.
- El multiproducto tiene su propio bloque de acciones; ambos fluyen por caminos paralelos.

### 2.4 Resultados
- El prompt final queda en un textarea plano con 3 botones pequeños; no hay pestañas ni
  metadatos visibles en el flujo individual.
- El panel MP sí tiene pestañas, pero el estado de cada producto se muestra en un badge
  redondo con un guion (“—”) que, en móvil, se interpreta como **un botón de resta**
  (hallazgo de la revisión visual).

### 2.5 Historial, exportación y estados
- El historial vive solo dentro del panel multiproducto; no hay acceso desde el flujo
  individual ni un lugar compartido de lotes.
- Estados vacíos sin ilustración ni llamada a la acción (“Aún no hay diseños”, textarea vacío).
- La barra de progreso vacía se percibe como un separador decorativo (captura tablet).
- Botones deshabilitados apenas se distinguen de los secundarios.

### 2.6 Responsive
- A 1440 funciona bien; a 768 todo se apila en una columna de 728 px con uso pobre del ancho
  (sin layout maestro-detalle); a 390 el contenido es legible pero la zona superior (tabs)
 consume mucho espacio y los chips quedan estrechos.

### 2.7 Consistencia y accesibilidad
- Identidad visual coherente en general (tema oscuro, acento azul, radio 6 px), pero con
  componentes repetidos de formas distintas: `.mp-chip` frente a `.field-row`, pestañas
  propias frente a las fichas A/B/C.
- Botones de icono sin `aria-label` visible; labels larguísimos dentro de selects
  (“Acabado de gorra (solo se usa al elegir GORRA)”).

## 3. Conclusión
La aplicación es funcionalmente completa, pero la interfaz está organizada por **origen
histórico** (se añadió el panel multiproducto encima del flujo individual) y no por
**tareas del usuario**. La propuesta (siguientes documentos) reorganiza la experiencia en
torno al contexto compartido y a dos modos de generación, sin tocar el motor.
