# Estado de consolidación P0–P7

Rama de trabajo: `integration/taller-pod-consolidation`

Este documento registra únicamente lo verificado. No equivale a declarar P0–P7 completos.

## Principios
- Las ramas fuente se conservan intactas.
- No se fusionan ramas completas cuando divergen; se extraen cambios puntuales.
- Los catálogos experimentales y motores no se conectan al runtime hasta tener contratos y pruebas.
- Una prueba Node con DOM simulado no se presenta como E2E de navegador.

## Estado por fase

| Fase | Estado | Evidencia / límite |
|---|---|---|
| P0 | Integrada | Corrección de clave de banco personal y regresión de guardado/lectura/uso. |
| P1 | Parcial | Compatibilidad layout × arquitectura textual y fallback; pruebas Node. |
| P2 | Parcial | Catálogos de composición, técnicas y tratamientos aislados; aún no consumidos por el runtime. |
| P3 | Bloqueada por fuente | Contrato definido en `contracts/creative-contract.md`; faltan el catálogo y la fuente original de los diez territorios. UI y prompt permanecen desactivados. |
| P4 | Contrato definido; runtime aislado | Routing documentado en `contracts/engine-routing.md`. Los mercados no Gospel permanecen sin clasificar y no se enrutan automáticamente a Secular. |
| P5 | Contrato y API explícita | Separación semántica entre perfiles HEAVY/SOFT/MODERN y estilos visuales; integración con `buildCandidate()` pendiente. |
| P6 | Parcial | Sincronización de producto/idioma y formato de salida; falta E2E de navegador. |
| P7 | Parcial | CI ejecuta pruebas Node y sintaxis; todavía no acredita comportamiento real de navegador. |

## Catálogos y ejes
- Estilo visual, tratamiento gráfico, técnica, perfil estructural, integración tipográfica y composición son categorías distintas.
- La distribución HEAVY/SOFT/MODERN corresponde al perfil estructural, no a estilos artísticos.
- `resolveEstilos()` ya contiene lógica de diversidad e historial de estilos. P5 no debe duplicarla sin contrato y prueba.

## Bloqueos
1. Recuperar la fuente original de los diez territorios P3. No inventar sus nombres ni directivas.
2. Clasificar explícitamente los mercados UI antes de activar el router Gospel/Secular.
3. Integrar P5 respetando locks e historial por eje.
4. Incorporar Playwright o equivalente y ejecutar un flujo real en navegador.

## Validación
La suite actual es Node/mocks y comprobaciones de sintaxis. Un resultado verde valida esas pruebas, no la fidelidad visual de imágenes ni todos los controles en navegador.
