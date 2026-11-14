# Contrato de enrutamiento Gospel / Secular — P4

Estado: reglas de enrutamiento especificadas; runtime principal todavía no conectado.

## 1. Principio

El motor se elige mediante una clasificación explícita del mercado. No inferir el motor por idioma, subnicho, producto, palabras del concepto ni presencia/ausencia de theologicalBasis.

## 2. Clasificación explícita vigente

La clasificación inicial conserva el comportamiento comercial ya existente y evita
inferir Secular por descarte:

| Mercado UI | Motor | Estado |
|---|---|---|
| `gospel_es` | Gospel | Explícito / protegido |
| `gospel_en` | Gospel | Explícito / protegido |
| `global_en` | Secular | Explícito / compatibilidad |
| `global_es` | Secular | Explícito / compatibilidad |
| `colombia` | Secular | Explícito / compatibilidad |
| `anglo` | Secular | Explícito / compatibilidad |
| `latam` | Secular | Explícito / compatibilidad |
| `spain` | Secular | Explícito / compatibilidad |
| `diaspora_col` | Secular | Explícito / compatibilidad |
| `custom` | Sin clasificar | Bloqueado hasta asignación explícita |
| ID vacío/desconocido | Sin clasificar | Bloqueado hasta asignación explícita |
| `christian` (alias heredado, no UI) | Secular | Compatibilidad con integraciones/pruebas anteriores |

La clasificación Secular de los siete mercados comerciales reproduce el
comportamiento que ya tenían en `motor-nucleo.js`; ahora se declara en una
allowlist y no mediante `!isGospelMarket()`.

No se asigna un motor por idioma, subnicho, producto, texto del concepto ni
presencia/ausencia de `theologicalBasis`. El ID `christian`, ausente del selector `POD_MARKETS`, se conserva como alias
Secular heredado para integraciones y pruebas anteriores. No se muestra como
opción de mercado UI ni se interpreta como Gospel.

## 3. Contrato de resolución

La capa de routing deberá devolver uno de estos resultados:

- `{ status: "resolved", engine: "gospel" }`
- `{ status: "resolved", engine: "secular" }`
- `{ status: "unclassified", market: "<id>" }`

Un mercado no clasificado no se enruta silenciosamente a otro motor. La generación, regeneración de fichas y construcción del prompt final se bloquean con un mensaje que solicita seleccionar un mercado configurado.

## 4. Aislamiento de datos y ejecución

Gospel:
- requiere mensaje y base teológica según su contrato;
- usa bancos Gospel y QA teológico;
- no lee ni escribe memoria secular.

Secular:
- requiere mensaje comercial;
- usa bancos seculares y QA comercial;
- theologicalBasis es opcional y no activa reglas Gospel.

Compartido:
- solo infraestructura neutral: productos, impresión, exportación/importación y utilidades;
- no comparte bancos, prompts, QA ni memoria creativa.

## 5. Estado de implementación del router

Implementado en `js/motor-nucleo.js`:
- `resolveEngineForMarket(marketId)` devuelve `resolved/gospel`,
  `resolved/secular` o `unclassified`.
- `isGospelMarket()` y `isSecularMarket()` consultan esa clasificación.
- `generateSet()` y `rerollSingle()` bloquean mercados no clasificados.
- `formatPrompt()` no construye prompts para mercados no clasificados.
- La lista explícita mantiene Gospel ES/EN y los siete mercados comerciales
  previamente operativos en Secular.

## 6. Activación

Antes de cargar `secular-engine/secular-engine.js` en el runtime principal:
1. clasificar explícitamente los mercados UI;
2. definir el contrato de payload de entrada/salida de ambos motores;
3. separar namespaces de memoria y bancos;
4. probar que los mercados Gospel nunca ejecutan QA secular y viceversa;
5. añadir pruebas E2E de routing y aislamiento.

La función `initSecularEngine()` no constituye por sí sola un router.
