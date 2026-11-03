# Taller POD — Dirección de Arte Comercial

Generador de prompts para dirección de arte comercial en productos POD (camisetas, mochilas, fundas, etc.). 
Produce 3 diseños A/B/C con procedencia visible, validación de calidad y exportación de prompts.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      GOSPEL ENGINE                        │
│  (motor-nucleo.js, ia-*.js, banco-gospel-*.js)           │
│  Reglas doctrinales, mensajes bíblicos, QA teológico       │
└──────────────────────┬────────────────────────────────────┘
                       │
┌──────────────────────┴────────────────────────────────────┐
│                   SHARED INFRASTRUCTURE                    │
│  (shared/shared-infra.js)                                 │
│  Productos, métodos de impresión, UI base, utilidades     │
└──────────────────────┬────────────────────────────────────┘
                       │
┌──────────────────────┴────────────────────────────────────┐
│                   SECULAR ENGINE                           │
│  (secular-engine/secular-engine.js)                       │
│  Mercados seculares, benchmarks, reglas comerciales        │
└─────────────────────────────────────────────────────────────┘
```

### Contrato creativo (P1)

Cada proyecto define:
- `creativeTerritory`: SACRED_EDITORIAL, BIBLICAL_BOTANICAL, BIBLICAL_ARCHAEOLOGY, FAITH_WORKWEAR, etc.
- `visualIdentity`: dirección visual de la colección
- `decisionMode`: manual (usuario fija), assisted (IA recomienda), automatic (motor decide)

### Catálogos (P2)

| Archivo | Contenido |
|---|---|
| `js/data-estilos.js` | 60+ estilos visuales (existente) |
| `js/data-tratamientos.js` | HEAVY/SOFT/MODERN + visual treatments + text integrations |
| `js/data-tecnicas.js` | Técnicas de ilustración |
| `js/data-composiciones.js` | Layouts + color modes |
| `js/data-territorios.js` | 10 territorios creativos |

### Territorios (P3)

Selector en `index.html` (Panel 2 "La idea"):
- Auto — detectar del concepto y mercado
- Botánica bíblica
- Sagrado editorial
- Arqueología bíblica
- Workwear de fe

### Motores (P4)

- **Gospel Engine**: `js/motor-nucleo.js` — protegido, no se modifica sin confirmación
- **Secular Engine**: `secular-engine/secular-engine.js` — 9 mercados seculares
- **Shared**: `shared/shared-infra.js` — infraestructura neutra

### Diversidad (P5)

- `SATURACION_UMBRAL`: 40% máximo de un estilo en un set
- `aplicarDiversidad()`: redistribuye estilos si uno supera el umbral
- `estaSaturado()`: verifica si un set está saturado

## Ejecución

### Local
1. Abrir `index.html` en el navegador
2. Configurar mercado, región, concepto, estilo
3. Pulsar "Crear los 3 diseños"

### Tests
```bash
node tests/*.test.js
```
Todos deben pasar (48/48).

### Deploy
- Vercel: push a `feat/*` → preview automático
- Producción: merge a `main` solo cuando CI pase

## Pruebas

```bash
# Suite completa
for f in tests/*.test.js; do node "$f"; done

# Test específico
node tests/unified-banks.test.js
node tests/pattern-template.test.js
```

## Estructura de archivos

```
├── index.html              # UI principal
├── js/
│   ├── motor-nucleo.js     # Motor principal (Gospel Engine)
│   ├── memoria-local.js    # Persistencia local
│   ├── ia-analisis.js      # Análisis IA
│   ├── ia-client.js        # Cliente IA
│   ├── data-estilos.js     # Estilos visuales (existente)
│   ├── data-territorios.js # Territorios creativos (P1)
│   ├── data-tratamientos.js # Tratamientos (P2)
│   ├── data-tecnicas.js    # Técnicas (P2)
│   ├── data-composiciones.js # Composiciones (P2)
│   ├── diversidad-saturacion.js # Diversidad (P5)
│   └── pod-nav.js          # Navegación compartida
├── shared/
│   └── shared-infra.js     # Infraestructura neutra (P4)
├── secular-engine/
│   └── secular-engine.js   # Motor secular (P4)
├── contracts/
│   ├── creative-contract.md # Contrato creativo (P1)
│   └── motores-arch.md     # Arquitectura de motores (P4)
├── tests/                  # Suite de pruebas (48 archivos)
├── docs/
│   └── DEBT.md             # Deuda técnica
└── styles.css              # Estilos UI
```

## Deuda técnica

Ver `docs/DEBT.md` para la lista completa de deuda técnica y issues pendientes.

## Licencia

Propiedad privada. Todos los derechos reservados.
