# Arquitectura de motores — P4

## Gospel Engine (existente y protegido)
- Ubicación: `js/motor-nucleo.js`, `js/ia-*.js`, `banco-gospel-*.js`.
- Reglas: doctrinales, mensajes bíblicos y QA teológico.
- Bancos: `banco-gospel-es.js`, `banco-gospel-en.js` y bancos personales Gospel.
- No se modifica para incorporar reglas seculares.

## Secular Engine (aislado)
- Ubicación: `secular-engine/secular-engine.js`.
- Mercados previstos: Streetwear, Sports, Lifestyle, Music, Outdoor, Automotive, Humor, Art y Professional.
- Reglas comerciales, sin requisito de base teológica.
- QA comercial, separado del QA teológico.

## Infraestructura compartida
- Ubicación: `shared/shared-infra.js`.
- Solo referencias neutrales: productos, métodos de impresión, almacenamiento y UI.
- No debe contener reglas creativas Gospel o seculares.

## Regla de aislamiento
Ningún motor debe escribir en bancos, memoria o prompts del otro. La integración futura debe consumir contratos explícitos y pruebas de aislamiento; compartir interfaz no implica compartir reglas.
