# Contrato de enrutamiento Gospel / Secular — P4

Estado: reglas de enrutamiento especificadas; runtime principal todavía no conectado.

## 1. Principio

El motor se elige mediante una clasificación explícita del mercado. No inferir el motor por idioma, subnicho, producto, palabras del concepto ni presencia/ausencia de theologicalBasis.

## 2. Clasificación inicial permitida

| Mercado UI | Motor | Estado |
|---|---|---|
| `gospel_es` | Gospel | Activo en motor existente |
| `gospel_en` | Gospel | Activo en motor existente |
| `colombia` | Sin clasificar | Requiere decisión de producto |
| `global_en` | Sin clasificar | Requiere decisión de producto |
| `global_es` | Sin clasificar | Requiere decisión de producto |
| `anglo` | Sin clasificar | Requiere decisión de producto |
| `latam` | Sin clasificar | Requiere decisión de producto |
| `spain` | Sin clasificar | Requiere decisión de producto |
| `diaspora_col` | Sin clasificar | Requiere decisión de producto |
| `custom` | Sin clasificar | Requiere decisión de producto |

No convertir automáticamente todos los mercados no Gospel en Secular: algunos pueden ser religiosos, mixtos o personalizados.

## 3. Contrato de resolución

La capa de routing deberá devolver uno de estos resultados:

- `{ status: "resolved", engine: "gospel" }`
- `{ status: "resolved", engine: "secular" }`
- `{ status: "unclassified", market: "<id>" }`

Un mercado no clasificado no se enruta silenciosamente a otro motor. Debe conservar el comportamiento actual o solicitar clasificación explícita, según el flujo de producto.

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

## 5. Activación

Antes de cargar `secular-engine/secular-engine.js` en el runtime principal:
1. clasificar explícitamente los mercados UI;
2. definir el contrato de payload de entrada/salida de ambos motores;
3. separar namespaces de memoria y bancos;
4. probar que los mercados Gospel nunca ejecutan QA secular y viceversa;
5. añadir pruebas E2E de routing y aislamiento.

La función `initSecularEngine()` no constituye por sí sola un router.
