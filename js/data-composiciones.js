/**
 * DATA COMPOSICIONES — Catálogo independiente de composiciones, tipografías y paletas
 * Fase 2 (Plan creativo): complemento de data-estilos.js, NO lo reemplaza.
 * Catálogo aislado: no se inyecta al motor hasta que exista contrato de consumo.
 */
'use strict';
const LAYOUTS = [
  "Composición centrada con símbolo dominante y texto arriba/abajo",
  "Composición diagonal con texto en movimiento",
  "Composición asimétrica con texto al margen",
  "Composición en retícula de 2x2",
  "Composición con texto envolvente (wrap)",
  "Composición de dos mitades (split)",
  "Composición radial desde el centro",
  "Composición en Z (lectura natural)",
  "Composición en F (escaneo rápido)",
  "Composición de texto como elemento visual principal"
];
const COLOR_MODES = [
  "monocromático", "duotono", "tricromático", "paleta completa",
  "alto contraste", "bajo contraste / tono sobre tono", "complementario",
  "análogo", "triádico", "acromático"
];
if (typeof module !== 'undefined' && module.exports) module.exports = { LAYOUTS, COLOR_MODES };
