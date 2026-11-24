# Cierre — Etapa 2 · Coherencia de copy en exploración

**Estado:** COMPLETADA (autorizada junto con el inicio de la etapa 3).

## Resultado
- Cambio acotado a las dos ramas del bloque COPY en `formatPrompt` (rama gospel explore y rama secular explore) más el test nuevo.
- `copy-explore-coherencia`: **PASS** (42 aserciones). `product-contract`: **PASS** (101). Suite: **93 PASS / 0 FAIL / 1 SKIP**.
- Evidencia en `PRUEBAS WORKFLOW/09_CHECKPOINTS/etapa2_copy_explore/`.

## Pendientes documentados (no corregidos; no bloquean la etapa 3)

1. **Negación de COPY en modo `new` secular con mensaje explícito.** Medido: `modo new + mensaje secular → «no hay mensaje ni concepto autorizado…»` = true. Fuera del alcance de la etapa 2 (solo Explore); ningún test fija ese caso. Requiere decisión de contrato.
2. **Respaldo `'objeto'` si `getProductSurface()` no está disponible** (riesgo heredado de la etapa 1, con la limitación de caché ya documentada). Requiere decisión en UI/integración.

No se modificó la implementación de la etapa 2 durante el cierre. Los cambios y evidencias quedan conservados.
