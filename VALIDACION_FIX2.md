# VALIDACIÓN VISUAL — FIX #2 (Cumplimiento de Audiencias)

> **Sin modificar código.** Este documento es solo una guía de validación.
> No hacer commit/push/merge/deploy. No tocar `main` ni PR #43.

## Pre-requisitos
- Rama: `integration/taller-pod-consolidation` (HEAD `f88bee3` + cambios locales Fix #1 y Fix #2).
- Preview de Vercel: disparar manualmente con commit+push **solo si autorizas** (este agente no lo hará sin autorización expresa).
- Navegador con la app abierta (`index.html`).
- Capturas de pantalla para cada escenario.

## Escenarios y entradas exactas

Para cada escenario, configurar en la UI:
- Mercado: `colombia` · Región: `todas` · Producto: `CAMISETA SOFT`
- Audiencia del set: `Auto` · "Explorar 3 audiencias": `no` (o `sí` solo en el escenario mixto)
- Concepto/mensaje: `águila calva sobre el cañón` / `Aguanta firme`

### 1. Infantil (`infantil_col`)
- Bloquear A/B/C a `infantil_col` (o usar Audiencia del set = `infantil_col`).
- Generar hoja.
- **Verificar:** cada columna muestra modelo **infantil** (niño/niña) con **talla infantil**; ningún modelo adulto.
- **No debe aparecer:** modelo adulto genérico, corte femenino/masculino.

### 2. Femenino (`coste_adulta_f`)
- Bloquear A/B/C a `coste_adulta_f`.
- **Verificar:** modelo **mujer** con corte y talla femeninos, coherente con perfil costeño adulta.

### 3. Masculino (`coste_adulto_m`)
- Bloquear A/B/C a `coste_adulto_m`.
- **Verificar:** modelo **hombre** con corte y talla masculinos.

### 4. Unisex (`unisex_nacional`)
- Bloquear A/B/C a `unisex_nacional`.
- **Verificar:** modelo **neutral/acorde al perfil**, sin forzar género ni edad.

### 5. Mixto (infantil A · femenina B · masculina C)
- Bloquear: A=`infantil_col`, B=`coste_adulta_f`, C=`coste_adulto_m`.
- **Verificar:** cada columna mantiene su audiencia independiente; no se contaminan.

## Checklist por escenario

- [ ] Audiencia seleccionada llega a la ficha correcta (texto `AUDIENCIA DE LA FICHA` y `ID DE VALIDACIÓN DE AUDIENCIA`).
- [ ] A/B/C mantienen audiencias independientes (sin mezcla en el prompt ni en el mockup).
- [ ] Mockup representa la audiencia indicada (modelo/edad/género/talla).
- [ ] Ejecutar el validador sobre el resultado (subir hoja generada).
- [ ] Comparar resultado visual con `audiencia_ok` del validador.
- [ ] Registrar falsos positivos, falsos negativos e indeterminados.

## Tabla de resultados (rellenar)

| Escenario | Resultado visual (modelo/edad/género/talla) | Resultado validador (audiencia_ok) | Discrepancias | Captura |
|---|---|---|---|---|
| 1. Infantil | | | | |
| 2. Femenino | | | | |
| 3. Masculino | | | | |
| 4. Unisex | | | | |
| 5. Mixto (A/B/C) | | | | |

## Criterios de aceptación
- Ningún escenario infantil genera modelo adulto.
- Ningún escenario unisex impone género/edad.
- El validador marca `audiencia_ok=false` ante representación incorrecta.
- El validador marca `audiencia_ok=null` (INDETERMINADO) si no hay evidencia visual suficiente.
- No hay contaminación cruzada entre columnas.

## Pruebas automatizadas de referencia
- `node tests/fix2-escenarios-controlados.test.js` → PASS (64/64).
- `node tests/fix2-audiencia-validador.test.js` → PASS (45/45).
- `node tests/validador-hoja.test.js` → PASS (27/27).
- `node tests/audiencia-mockup.test.js` → PASS (12/12).

## Fallo preexistente (no bloqueante)
- `tests/creative-integration.test.js` → `diversity.contarEstilos` (deepStrictEqual null prototype), idéntico en `1c662d3~1`. Fuera de alcance de Fix #2.

## Estado
- Sin modificar código. Sin commit/push/merge/deploy.
- `main` = `d0ca672`, PR #43 = `e491295` intactos.
- Fix #1 y Fix #2 separados.

⏸ **Detenido. Espero tus capturas/resultados de la validación visual para cerrar definitivamente Fix #2.**