/* Fuente: feat/creative-territory-engine. Adaptación segura: catálogo aislado, sin globals ni colisiones con data-estilos.js. */
(function (root) {
  'use strict';
  /**
   * DATA TÉCNICAS — Catálogo independiente de técnicas de ilustración
   * Fase 2 (Plan creativo): complemento de data-estilos.js, NO lo reemplaza.
   * No se importa en motor-nucleo.js todavía (eso es Fase 4).
   */
  
  'use strict';
  
  const illustrationTechniques = [
    "grabado a buril con tramas",
    "manchado acuoso",
    "caligráfico de un solo trazo",
    "stencil urbano con bordes duros",
    "halftone de puntos y contornos gruesos",
    "acuarela suelta con reserva de papel",
    "tinta lavada oriental (sumi-e)",
    "boceto de cuaderno imperfecto",
    "grabado en linóleo de alto contraste",
    "talla en madera con marca de gubia",
    "collage de recortes superpuestos",
    "papercraft con capas y sombra",
    "airbrush con degradados suaves",
    "blueprint técnico sobre azul",
    "fotomontaje Dada con un acento de color",
    "pixel art con retícula visible",
    "risograph de dos tintas desregistradas",
    "tatuaje old school con línea gruesa",
    "foil stamp metálico con relieve",
    "puff print con tinta expandida",
    "barroco ornamental con talla dorada",
    "vaporwave con pasteles ácidos",
    "photomontage con fotografía B/N recortada",
    "Kids storybook con formas amables"
  ];
const api = { illustrationTechniques };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.PODCreativeCatalogs = root.PODCreativeCatalogs || {};
    root.PODCreativeCatalogs.techniques = api;
  }
})(typeof window !== 'undefined' ? window : null);
