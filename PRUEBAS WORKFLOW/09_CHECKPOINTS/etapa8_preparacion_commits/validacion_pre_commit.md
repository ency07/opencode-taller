# Etapa 8 — Validación pre-commit (checklist por commit)

Todos los comandos son para ejecutar **después** de cada commit; aquí solo se documentan.
Ninguno de ellos modifica código.

## Genérico (antes de cada commit)
```bash
cd "C:/Users/Administrator/Desktop/POD/Taller-pod-copia opencode"
git status --porcelain                 # solo deben aparecer los archivos del commit
git diff --cached --stat               # alcance exacto del commit
```

## Commit 1 · Superficies
- [ ] `node tests/mockup-superficie.test.js` → PASS (117 aserciones esperadas en el estado actual)
- [ ] `node tests/product-contract.test.js` → rc=0
- [ ] Los 10 prompts siguen mencionando su superficie (smoke CDP breve, no obligatorio aquí)
- [ ] El hunk de copy NO está incluido (`grep typedMessage js/motor-nucleo.js | grep -c isExplore` debe dar 0 en este commit)
- Riesgo principal: repartir mal el hunk → lo detecta `mockup-superficie`.

## Commit 2 · Copy Explore
- [ ] `node tests/copy-explore-coherencia.test.js` → 42 aserciones, 0 fallos
- [ ] `node tests/product-contract.test.js` → rc=0
- [ ] `js/motor-nucleo.js` restaurado con ambos cambios (mismo sha256 que el actual `8be0b40980fc…`)
- [ ] Smoke CDP: generar un producto en modo explore con mensaje explícito y comprobar que
      `COPY` contiene el mensaje literal.

## Commit 3 · Núcleo multiproducto
- [ ] `node tests/multiproducto-contratos.test.js` → 118 aserciones
- [ ] `node tests/multiproducto-aislamiento.test.js` → 63 aserciones
- [ ] `node tests/multiproducto-historial.test.js` → 41 aserciones
- [ ] `node tests/multiproducto-zip.test.js` → 61 aserciones
- [ ] POC en navegador: `poc_multiproducto_harness.js` → 10/10 OK

## Commit 4 · Interfaz
- [ ] Suite Node completa (los tests de UI no existen en Node)
- [ ] Smoke CDP: recargar `index.html`, sin errores en consola (`window.__errs === []`)
- [ ] Generar 1 producto desde el panel, pestaña activa, historial guarda/carga, ZIP descarga
- [ ] Iframe 390 px sin scroll horizontal

## Commit 5 · Evidencias
- [ ] `git show --stat HEAD` solo toca `PRUEBAS WORKFLOW/09_CHECKPOINTS/**`
- [ ] No se incluye ningún `_tmp_*`, `TallerPOD-UI-rediseno.html`, `.gitignore`,
      `DESIGN.md`, `scripts/`, ni `PRUEBAS WORKFLOW/01_GOSPEL_ES/`

## Referencias ya verificadas en la preparación (estado actual del árbol)
- `partir_motor.py` genera la versión intermedia del commit 1 (5.735 líneas LF,
  `node --check` rc=0) y la reconstrucción con los hunks de copy reproduce el working tree.
- Partición verificada por sustitución textual: `real − copy == base + superficie`.
- Suite actual: 98 ficheros · 10.646 PASS · 0 FAIL · 0 SKIP.
- POC actual: 10/10. Generador individual: `#out` verificado.

## Comando de humo rápido (CDP, tras el commit 4)
```js
// en http://127.0.0.1:8080/index.html con CDP
document.querySelectorAll('#mpGrid .mp-chip').length          // 10
document.getElementById('mpGenerate').click();                  // arranca lote
window.MultiproductoUI._state()                                 // {generando:true,...}
```
