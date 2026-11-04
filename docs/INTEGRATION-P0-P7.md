# Estado de consolidación P0–P7

Rama de trabajo: `integration/taller-pod-consolidation`

Este documento registra únicamente lo verificado en esta rama. No equivale a declarar P0–P7 completos.

## Principios de integración

- Las ramas fuente se conservan intactas.
- No se fusionan ramas completas cuando divergen; se extraen cambios puntuales.
- Los catálogos experimentales y motores no se conectan al runtime hasta tener contratos y pruebas.
- No se presenta una prueba de Node con DOM simulado como E2E de navegador.

## Estado por fase

| Fase | Estado | Evidencia / límite |
|---|---|---|
| P0 | Integrada | Corrección de clave de banco personal y regresión de guardado/lectura/uso. |
| P1 | Parcial | Se integra compatibilidad layout × arquitectura textual y fallback. El contrato y catálogo de 10 territorios citados en la guía P7 no están presentes en las ramas consultadas. |
| P2 | Parcial | Se conservan los catálogos originales de composiciones, técnicas y tratamientos en namespace aislado. No reemplazan `data-estilos.js` ni se conectan al generador. |
| P3 | Parcial | El estado interno existe. El selector se oculta porque no había catálogo ni consumo en el prompt; no se anuncia una función inactiva. |
| P4 | Parcial | Motor secular e infraestructura compartida aislados en namespace. No se enrutan mercados ni se comparte memoria con Gospel. |
| P5 | Parcial | Diversidad protegida: no sustituye tratamientos sin alternativas explícitas. No se conecta al generador hasta definir el contrato de selección. |
| P6 | Parcial | Se conservan sincronización de producto/idioma y formato de salida; falta prueba real en navegador y revisión de todos los campos. |
| P7 | Parcial | CI ejecuta pruebas Node y comprobaciones de sintaxis. No hay E2E real de navegador; los skips de la prueba heredada no se consideran cobertura. |

## Bloqueos que requieren fuente o decisión

1. `js/data-territorios.js` y `contracts/creative-contract.md` aparecen referenciados en documentación heredada, pero no se localizaron en las ramas consultadas. No se inventan sus diez territorios.
2. El motor secular necesita un contrato de enrutamiento de mercado antes de activarse en la interfaz.
3. La diversidad necesita definir qué eje se redistribuye (estilo, tratamiento u otro) y qué alternativas son válidas por mercado/producto.
4. La interfaz P3 debe reintroducirse cuando cada opción tenga definición, efecto comprobable en el prompt y pruebas.

## Validación

La suite de CI de esta rama es una batería de pruebas Node con mocks. Un resultado verde valida esas pruebas, no la fidelidad visual de imágenes generadas ni el comportamiento de todos los controles en un navegador real.
