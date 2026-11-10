# STEWARDSHIP_CONTEXT.md — Taller POD · opencode-taller
# Documento de evidencia para hermes-teammates / Project Stewardship.
# Estado actual, main, ramas, deuda, riesgos y regla de trabajo. NO modifica main.

## 1. Identidad del proyecto
- Repositorio: ency07/opencode-taller
- Ruta local: C:\Users\Administrator\Desktop\POD\Taller-pod-copia opencode
- Tipo: aplicación web vanila (HTML/CSS/JS), sin build step, no framework
- Titulo: "Taller POD — Dirección de Arte Comercial"
- Objetivo: herramienta multi-mercado POD (Print on Demand): orquestación de mercados, audiencias,
  bancos, estilos, productos y memoria; generador de prompts denso con locks, anti-repetición y
  reglas legales. Incluye motor de lenguajes, sistema matriz, constructor de prompt, editor de bancos.

## 2. Estado de git (evidencia 2026-11-03)
- Rama local activa: feat/ui-ux-layout-improvements-preview
- main: d0ca672 (últimos commits: debt-015-profile-governs fix, aud-origen-label, carga-por-edad, copiar-prompt-partes)
- feat/ui-ux-layout-improvements-preview está 37 commits AHEAD de main, 0 atrás
- Árbol de trabajo: limpio (nothing to commit)
- origin: https://github.com/ency07/opencode-taller.git
- Rama local principal: main
- Rama feature: feat/ui-ux-layout-improvements-preview (trabajo activo)
- Otras ramas locales: codex/redteam-audit-fixes, feat/aud-origen-label, feat/aud-propias-c3,
  feat/bancos-motivos-14, feat/carga-por-edad, feat/copy-feedback, feat/ui-ux-layout-improvements,
  feat/unified-banks, fix/debt-015-profile-governs, fix/redteam-prompt-engine

## 3. Archivos y carpetas clave
- index.html — app principal (nav: Taller, Editor de bancos, Motor de lenguajes, Sistema matriz,
  Constructor de Prompt, Constructor de Prompt IA)
- styles.css — estilos
- js/motor-nucleo.js — motor de orquestación (~232KB), NO datos. Referencias a POD_MARKETS,
  AUD_PROFILES, POD_SUBNICHES, ESTILOS_LIST, etc.
- js/data-*.js — datos: data-bancos.js, data-estilos.js, data-mercados.js, data-productos.js,
  data-audiencias.js, memoria-local.js (localStorage), sync-supabase.js
- js/ia-*.js — generación de IA: copy-ia.js, ia-analisis.js, ia-client.js, ia-revisor.js,
  ia-validador.js
- js/banco-global.js, banco-gospel-es.js, banco-gospel-en.js
- js/dominios.js, pod-nav.js
- banco-personal-colombia.json, banco-personal-gospel-es.json, banco-personal-gospel-en.json
- bancos.txt (35KB), supabase-sync.sql, supabase-hardening-handle-new-user.sql
- docs/DEBT.md — registro de deuda operativa y técnica (DEBT-001...DEBT-018+)
- docs/verification/
- tests/*.test.js — suite de pruebas; se ejecutan con `node <file>` (sin framework propio)
- .github/workflows/node-regression.yml — CI: node --check + `node tests/*.test.js` en main,
  fix/redteam-semantic-identity, fix/debt-015-profile-governs

## 4. Deuda registrada (docs/DEBT.md)
- DEBT-001 (closed): setLockValue fallaba en silencio si localStorage rechazaba escritura
- DEBT-002 (closed): gate del set no exigía unicidad de jerarquía/densidad/espacio negativo
- DEBT-003 (abierta, alto riesgo): `<option>` value="nuevo_texto" pero motor compara textMode ===
  'nuevo' → fuese conserva literalmente, contradictorio con el bloque "crear copy original".
- Otras deudas: DEBT-004..DEBT-018+ (la mayoría cerradas). La ABIERTA más crítica en la rama
  actual es DEBT-003 (alta). No se ha verificado estado de otras abiertas allí.

## 5. Principios de gobernanza (GOVERNANCE.md, v1.0.0)
- Obligatorio: todo lo marcado como debe/obligatorio/gate es bloqueante.
- No suposición: si no está declarado, verificarlo o preguntar.
- Evidencia sobre opinión: solo evidencia reproducible cierra tarea.
- Cierre condicional: 100% de gates aplicables = PASS.
- Jerarquía: Constitución > Flujo de estados > Gates de cierre > Criterios medibles > Operativos.

## 6. Regla de trabajo (estricta)
- NO tocar main bajo ninguna circunstancia, salvo que el usuario lo autorice explícitamente.
- Solo se trabaja sobre feat/ui-ux-layout-improvements-preview (37 commits del punto de
  arranque sobre main).
- Cualquier cambio antes de merge debe pasar: node --check (sintaxis) + suite tests (node tests/*.test.js).
- La rama actual no está mergeada a main (0 commits atrás).

## 7. Puntos de observación para el steward
- [OPEN] DEBT-003: selector "nuevo_texto" vs textMode === 'nuevo' — alta. Test
  tests/copi? no: pruebas relevantes de selector-texto.test.js / lang-reset.test.js.
- [OPEN] La rama actual lleva 37 commits; confirmar si están todos en el mismo scope de
  "ui-ux-layout-improvements" o hay trabajo fuera del scope.
- [OPEN] docs/DEBT.md menciona DEBT-003 como ABIERTA (alto). Sin verificar estado real.
- [INFO] Suite de tests sin runner externo: `node tests/*.test.js` en CI. Revisar prioridad.
- [INFO] archivo index.html es único (no hay README). Wording del nav sugiere el proyecto es un
  "taller" interno, no un producto público.

## 8. Lista de chequeo antes de cualquier commit/PR
- [ ] node --check js/motor-nucleo.js  y cada js/*.js
- [ ] node tests/*.test.js — toda suite PASS
- [ ] No se toca main
- [ ] Cambios comprobados en node (no solo planificados)
