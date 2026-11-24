# PROMPT MAESTRO — AUDITORÍA TOTAL QA TALLER POD

**Ejecutar en una NUEVA conversación de Hermes.** Copia TODO el contenido de abajo y pégalo como primer mensaje.

---

## 📋 RESUMEN DE VOLUMEN TOTAL

| Fase | Qué | Cuánto | Tiempo estimado |
|------|-----|--------|-----------------|
| **FASE 1 Piloto** | 4 casos × 1 producto × 3 propuestas | 12 prompts | ~15 min |
| **FASE 2 Lote Gospel** | 46 casos × 10 productos × 3 propuestas | 1,380 prompts | ~3-4 h |
| **FASE 3 Lote Global/Secular/Otros** | 72 casos × 10 productos × 3 propuestas | 2,160 prompts | ~5-6 h |
| **TOTAL** | **118 casos × 10 productos = 1,180 workflows** | **3,540 prompts** | **~9-10 h** |

**Productos por caso (10):** CAMISETA SOFT, CAMISETA APPAREL, HOODIE, ILUSTRACION PREMIUM APPAREL, TOTE BAG, MOCHILA, GORRA, MUG, FUNDA MÓVIL, DISPLATE  
**Contratos:** GENERIC (9 textiles) + DISPLATE (1 metal)  
**Mercados (11):** gospel_es, gospel_en, global_es, global_en, colombia, latam, spain, anglo, diaspora_col, custom (+ regiones)

---

## ⚙️ CONFIGURACIÓN OBLIGATORIA ANTES DE EMPEZAR (una sola vez)

```bash
# 1. Matar Edge existente
taskkill /f /im msedge.exe

# 2. Levantar Edge CON CDP en puerto 9224 (perfil dedicado, sin extensiones)
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9224 --user-data-dir="C:\temp\edge-qa-pod" --no-first-run --no-default-browser-check --disable-extensions --disable-background-networking http://127.0.0.1:8080/

# 3. Verificar CDP (esperar 5s)
powershell -Command "Start-Sleep 5; Invoke-WebRequest http://127.0.0.1:9224/json/version -UseBasicParsing | Select-Object -ExpandProperty Content"

# 4. Servir app (si no está corriendo)
cd "C:/Users/Administrator/Desktop/POD/Taller-pod-copia opencode"
python3 -m http.server 8080 --bind 127.0.0.1 &
```

> **Si CDP no responde:** revisa firewall Windows (permitir puerto 9224 local), antivirus, o que Edge no tenga `--remote-debugging-port` en otro proceso.

---

## 🛡️ ESTRATEGIA ANTI-BLOQUEO PARA HERMES (CRÍTICO)

### 1. **Un caso por llamada a `browser_exec`** — NUNCA múltiples casos en un solo `browser_exec`. Cada caso = una llamada independiente.

### 2. **Timeouts generosos y esperas explícitas:**
```python
await page.goto(url, wait_until='networkidle', timeout=60000)
await page.wait_for_timeout(3000)  # entre selectores
await page.wait_for_selector('.propuesta-panel', timeout=120000)  # generación puede tardar
```

### 3. **Recuperación automática de pestaña perdida:**
```python
# Al inicio de CADA browser_exec:
try:
    await page.goto('http://127.0.0.1:8080/')
except:
    # Re-conectar a CDP y nueva pestaña
    pass
```

### 4. **Guardado incremental tras CADA caso** — Escribe archivos en disco inmediatamente después de extraer datos. No acumules en memoria.

### 5. **Checkpoint cada 10 casos** — Crea `CHECKPOINT_FASE_X_LOTE_Y.md` con resumen, hashes y rutas. Si Hermes se cae, reanudas desde el último checkpoint.

### 6. **Modo headless NO** — Usa `local=true` en `browser_exec` (tu Edge real visible). Así ves fallos y no hay timeouts de CI.

### 7. **Selectores robustos — usa `data-testid` o XPath relativo**, no IDs frágiles. Si falla selector, logea y continua.

### 8. **Limpieza de estado entre casos:**
```python
await page.reload(wait_until='networkidle')
await page.wait_for_timeout(2000)
# Reset selectores a defaults si la UI no lo hace sola
```

---

## 📂 ESTRUCTURA DE SALIDA (ya creada en FASE 0)

```
PRUEBAS WORKFLOW/
├── 01_GOSPEL_ES/           # 23 casos
├── 02_GOSPEL_EN/           # 23 casos
├── 03_GLOBAL_ES/           # 23 casos
├── 04_GLOBAL_EN/           # 23 casos
├── 05_SECULARES_BEST_SELLER/
│   ├── ES/                 # 10 casos (colombia, latam, spain)
│   └── EN/                 # 10 casos (global_en, anglo)
├── 06_OTROS_MERCADOS/      # 6 casos
├── 07_REGRESION_SELECTORES/
├── 08_PRUEBAS_AUTOMATICAS/
├── 09_CHECKPOINTS/
│   ├── CHECKPOINT_FASE_0_PREPARACION.md
│   ├── CHECKPOINT_FASE_1_PILOTO.md           ← créalo al terminar 4 casos
│   ├── CHECKPOINT_FASE_2_GOSPEL_LOTE_1.md    ← cada 10 casos
│   ├── CHECKPOINT_FASE_2_GOSPEL_LOTE_2.md
│   ├── CHECKPOINT_FASE_2_GOSPEL_LOTE_3.md
│   ├── CHECKPOINT_FASE_2_GOSPEL_LOTE_4.md
│   ├── CHECKPOINT_FASE_2_GOSPEL_LOTE_5.md    ← 46 casos = 5 lotes
│   ├── CHECKPOINT_FASE_3_GLOBAL_LOTE_1.md    ← cada 10 casos
│   ... (7 lotes para 72 casos)
│   └── CHECKPOINT_FASE_FINAL.md
└── 99_INFORME_FINAL/
    ├── RESUMEN_EJECUTIVO.md
    ├── MATRIZ_COBERTURA.csv
    ├── ERRORES_BLOQUEOS.md
    └── HASHES_TODOS.json
```

---

## 🔄 FLUJO EXACTO POR CASO (copia-pega este patrón en cada `browser_exec`)

```python
# === INICIO CASO: gospel_es / DIOS_NUNCA_FALLA / CAMISETA SOFT / GENERIC ===
CASO = {
    "mercado": "gospel_es",
    "carpeta": "DIOS_NUNCA_FALLA",
    "producto": "CAMISETA SOFT",
    "contrato": "GENERIC",
    "ejecucion": "EJECUCION_01",
    "datos": {
        "concepto": "Dios nunca falla",
        "mensaje": "DIOS NUNCA FALLA",
        "apoyo": "SU PROMESA ES ETERNA",
        "subnicho": "fe",
        "territorio": "espiritual",
        "preferencia": "Minimal Modern",
        "serie": "GOSPEL_PILOTO",
        "set": "FASE_1"
    }
}

BASE_DIR = f"PRUEBAS WORKFLOW/01_GOSPEL_ES/{CASO['carpeta']}/{CASO['contrato']}/{CASO['producto']}/{CASO['ejecucion']}"

# 1. Navegar y esperar UI
await page.goto('http://127.0.0.1:8080/', wait_until='networkidle', timeout=60000)
await page.wait_for_timeout(2000)
await page.screenshot(path=f"{BASE_DIR}/capturas/00_inicio.png")

# 2. Configurar selectores EN ORDEN (market → language → region → brand → product → printMethod → workflowMode → decisionMode → subnicho → audienceSet → creativeTerritory → visualIdentity → aestheticPreference → concepto → mensaje → apoyo → serie → set)
# USA page.select_option('#selector', value) o page.fill('#selector', text)
# ESPERA 1-2s entre cada selector: await page.wait_for_timeout(1500)

# 3. Disparar generación
await page.click('#btn-generar')  # o el selector real del botón
await page.wait_for_selector('.propuesta-panel', timeout=180000)  # hasta 3 min

# 4. Extraer 3 propuestas A/B/C
propuestas = {}
for letra in ['A', 'B', 'C']:
    texto = await page.locator(f'#propuesta-{letra} .contenido').inner_text()
    hash_sha256 = hashlib.sha256(texto.encode()).hexdigest()
    propuestas[letra] = {"texto": texto, "hash": hash_sha256}
    await page.screenshot(path=f"{BASE_DIR}/capturas/0{ord(letra)-64}_propuesta_{letra}.png")

# 5. Guardar TODO en disco (write_file via tool_call o python local)
import json, hashlib, datetime
for letra, data in propuestas.items():
    with open(f"{BASE_DIR}/prompts_originales/propuesta_{letra}.txt", "w", encoding="utf-8") as f:
        f.write(data["texto"])
with open(f"{BASE_DIR}/prompts_originales/hashes.json", "w") as f:
    json.dump({k: v["hash"] for k, v in propuestas.items()}, f, indent=2)
with open(f"{BASE_DIR}/configuracion/datos_caso.json", "w") as f:
    json.dump(CASO, f, indent=2)
with open(f"{BASE_DIR}/configuracion/selectores.json", "w") as f:
    json.dump(selectores_usados, f, indent=2)  # captura los valores reales seleccionados
with open(f"{BASE_DIR}/logs/ejecucion.log", "w") as f:
    f.write(f"{datetime.datetime.now()} - OK - {CASO['carpeta']}\n")
    for k, v in propuestas.items():
        f.write(f"  {k}: {v['hash'][:16]}...\n")

print(f"✅ CASO COMPLETO: {CASO['carpeta']} - {CASO['producto']} - {len(propuestas)} propuestas")
# === FIN CASO ===
```

---

## 📦 PLAN DE EJECUCIÓN POR LOTES (para que no se bloquee)

### LOTE 1 — FASE 1 PILOTO (4 casos) — **EJECUTAR PRIMERO**
| Orden | Mercado | Carpeta | Producto | Contrato |
|-------|---------|---------|----------|----------|
| 1 | gospel_es | DIOS_NUNCA_FALLA | CAMISETA SOFT | GENERIC |
| 2 | gospel_en | GOD_NEVER_FAILS | CAMISETA SOFT | GENERIC |
| 3 | global_es | ARQUITECTURA_MINIMALISTA | CAMISETA SOFT | GENERIC |
| 4 | global_en | URBAN_GEOMETRY | CAMISETA SOFT | GENERIC |

→ Al terminar: crea `CHECKPOINT_FASE_1_PILOTO.md` con 12 hashes, rutas, observaciones.

---

### LOTES 2-6 — FASE 2 GOSPEL (46 casos = 5 lotes de ~9-10)
**Mercados:** gospel_es (23) + gospel_en (23)  
**Producto base:** CAMISETA SOFT (luego repetir para los 9 productos textiles + DISPLATE)

> **Estrategia:** Ejecuta **SOLO CAMISETA SOFT** para los 46 casos gospel primero. Luego, en FASE 3, replicas para los otros 9 productos (batch script o loop manual).

**Lote 2 (casos 1-10 gospel_es):** DIOS_NUNCA_FALLA, SALVOS_POR_GRACIA, FE_QUE_MUEVE_MONTANAS, EL_SEÑOR_ES_MI_PASTOR, REDENTOR_VIVE, GRACIA_AMAZING, CRUZ_VACIA, ESPERANZA_VIVA, FIEL_ES_EL_SEÑOR, PAZ_QUE_SOBREPASA  
**Lote 3 (casos 11-20 gospel_es):** AMOR_INCONDICIONAL, LUZ_DEL_MUNDO, ROCA_FIRME, CAMINA_POR_FE, VIDA_ETERNA, OBEDIENCIA_BENDICE, MISERICORDIA_NUEVA, SOBERANO_REY, ADORACION_ESPIRITU, SACRIFICIO_VIVO  
**Lote 4 (casos 21-23 gospel_es + 1-7 gospel_en):** ANCLA_DEL_ALMA, FUEGO_SANTO, VICTORIA_EN_CRISTO, GOD_NEVER_FAILS, SAVED_BY_GRACE, FAITH_MOVES_MOUNTAINS, THE_LORD_MY_SHEPHERD, MY_REDEEMER_LIVES, AMAZING_GRACE, THE_CROSS_IS_EMPTY  
**Lote 5 (casos 8-23 gospel_en):** LIVING_HOPE, GOD_IS_FAITHFUL, PEACE_BEYOND, NOTHING_SEPARATES, LIGHT_OF_WORLD, SOLID_ROCK, WALK_BY_FAITH, ETERNAL_LIFE, OBEDIENCE_BLESSES, NEW_MERCIES, SOVEREIGN_KING, WORSHIP_IN_SPIRIT, LIVING_SACRIFICE, ANCHOR_OF_SOUL, HOLY_FIRE, VICTORY_IN_CHRIST

→ Cada lote = 1 `CHECKPOINT_FASE_2_GOSPEL_LOTE_X.md`

---

### LOTES 7-13 — FASE 3 GLOBAL/SECULAR/OTROS (72 casos = 7 lotes de ~10)
**Mercados:** global_es (23), global_en (23), colombia (3), latam (3), spain (2), anglo (4), diaspora_col (1), custom (1)  
**Mismo patrón:** lotes de 10, checkpoint cada lote, solo CAMISETA SOFT primero.

---

### FASE 4 — REPLICACIÓN PRODUCTOS (opcional, si da tiempo)
Para cada caso ya ejecutado con CAMISETA SOFT, repetir cambiando `producto` a: CAMISETA APPAREL, HOODIE, ILUSTRACION PREMIUM APPAREL, TOTE BAG, MOCHILA, GORRA, MUG, FUNDA MÓVIL, DISPLATE.  
**Total adicional:** 118 casos × 9 productos = 1,062 workflows extra.  
→ Solo si FASE 1-3 completan sin problemas. Documentar en `CHECKPOINT_FASE_FINAL.md`.

---

## ✅ CRITERIOS DE ÉXITO POR CASO
- [ ] 3 propuestas A/B/C extraídas con texto completo
- [ ] Hash SHA-256 calculado y guardado en `hashes.json`
- [ ] 4 capturas (inicio + A + B + C) en `capturas/`
- [ ] `datos_caso.json`, `selectores.json`, `ejecucion.log` en `configuracion/` y `logs/`
- [ ] Sin errores JavaScript en consola (logear si hay)
- [ ] Tiempo total por caso < 5 min (si > 5 min, documentar y continuar)

---

## 🚨 MANEJO DE ERRORES (no te detengas)
| Error | Acción |
|-------|--------|
| Selector no encontrado | Logear en `ejecucion.log`, intentar selector alternativo, si falla → marcar caso como "PARCIAL" y continuar |
| Generación timeout (>3 min) | Logear, capturar pantalla, marcar "TIMEOUT", continuar |
| CDP desconectado | Re-conectar: nueva `browser_exec` con `local=true`, recargar página, reintentar caso actual |
| Pestaña cerrada | `await page.goto('http://127.0.0.1:8080/')` al inicio de cada `browser_exec` |
| Memoria llena / Hermes lento | Checkpoint inmediato, cerrar conversación, abrir nueva y continuar desde último checkpoint |

---

## 🎯 TU PRIMERA ACCIÓN AHORA MISMO

1. **Ejecuta los comandos de configuración** (matar Edge, levantar con CDP, verificar, servir app)
2. **Ejecuta CASO 1** (gospel_es / DIOS_NUNCA_FALLA / CAMISETA SOFT / GENERIC) con el patrón de código de arriba
3. **Confirma que se guardaron los 4 archivos** en `PRUEBAS WORKFLOW/01_GOSPEL_ES/DIOS_NUNCA_FALLA/GENERIC/CAMISETA_SOFT/EJECUCION_01/`
4. **Reporta:** "Caso 1 OK — hashes: A=..., B=..., C=..." y pasa al caso 2

---

**NO MODIFIQUES CÓDIGO DEL PROYECTO.** Solo auditoría, evidencia y checkpoints.  
**USA `browser_exec` CON `local=true` EN CADA CASO.**  
**CREA CHECKPOINT CADA 10 CASOS.**  
**SI ALGO FALLA: LOGEA, CAPTURA, CONTINÚA.**

---

¡Empieza YA con la configuración de Edge y el Caso 1!