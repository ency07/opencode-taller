# ARQUITECTURA DE MOTORES — P4

## Gospel Engine (existente, protegido)
- **Ubicación**: `js/motor-nucleo.js`, `js/ia-*.js`, `banco-gospel-*.js`
- **Reglas**: doctrinales, mensajes bíblicos, QA teológico
- **Campos obligatorios**: `message`, `theologicalBasis` (para Gospel)
- **Bancos**: `banco-gospel-es.js`, `banco-gospel-en.js`, `banco-personal-gospel-*.json`
- **No se modifica** sin confirmación explícita

## Secular Engine (nuevo, independiente)
- **Ubicación**: `secular-engine/secular-engine.js`
- **Mercados**: Streetwear, Sports, Lifestyle, Music, Outdoor, Automotive, Humor, Art, Professional
- **Reglas**: comerciales (no doctrinales), `theologicalBasis` opcional, `message` obligatorio
- **Bancos**: propios (separados de los Gospel)
- **QA**: comercial (originalidad, coherencia de marca, legibilidad, viabilidad, no duplicación)

## Infraestructura compartida (neutral)
- **Ubicación**: `shared/shared-infra.js`
- **Compartido**: productos, métodos de impresión, exportación/importación, UI base, utilidades
- **No contiene** reglas creativas de ningún motor

## Regla de aislamiento
- Ningún archivo de `secular-engine/` modifica `gospel-engine/`
- Ningún archivo de `gospel-engine/` escribe en bancos/memoria/prompts del Gospel
- La sincronización a Supabase respeta la separación (claves: `POD2|gospel_...` vs `POD2|secular_...`)
- `shared/` solo contiene infraestructura, sin reglas creativas
