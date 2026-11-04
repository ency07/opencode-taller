/* Fuente: feat/creative-territory-engine. Adaptación segura: catálogo aislado, sin globals ni colisiones con data-estilos.js. */
(function (root) {
  'use strict';
  /**
   * DATA TRATAMIENTOS — Catálogo independiente de tratamientos estructurales y visuales
   * Fase 2 (Plan creativo): complemento de data-estilos.js, NO lo reemplaza.
   * No se importa en motor-nucleo.js todavía (eso es Fase 4).
   * 
   * structuralTreatment: cómo se construyen las formas (masas, líneas, geometría).
   * visualTreatment: cómo se integra el texto con el símbolo.
   */
  
  'use strict';
  
  const structuralTreatments = [
    "HEAVY: contornos gruesos y masas sólidas dominantes; contraste alto; textura marcada solo en áreas amplias; conserva huecos abiertos y letras grandes legibles",
    "SOFT: formas abiertas, aire y textura ligera; transiciones suaves solo en áreas amplias; conserva contraste suficiente para separar símbolo y texto al imprimir",
    "MODERN: geometría limpia, bordes nítidos y tintas planas; paleta controlada; silueta clara y sin ruido que compita con el mensaje"
  ];
  
  const visualTreatments = [
    "silueta sólida a una tinta",
    "contorno lineal calibrado",
    "geometrizado por módulos",
    "orgánico gestual con pincel",
    "fragmentado en planos",
    "tallado en bloque",
    "grabado a buril con tramas",
    "manchado acuoso",
    "construido por retícula visible",
    "caligráfico de un solo trazo"
  ];
  
  const textIntegrations = [
    "las letras brotan del propio símbolo: el título nace de su humo, su luz o su estructura",
    "el título abraza y parte el símbolo: mitad de la palabra dentro de la forma, mitad fuera",
    "palabras construidas con elementos del objeto: la tipografía ES materia del símbolo",
    "el texto corre por el contorno del símbolo como una cinta que lo envuelve sin esconderlo",
    "las letras habitan la estructura del objeto: se apoyan en sus barras, ventanas o eslabones",
    "el símbolo y el texto se entrelazan: ramas o trazos del objeto atraviesan las palabras y salen al otro lado",
    "el título rompe la silueta del símbolo y lo extiende: el objeto sigue dibujado dentro de las letras",
    "texto y símbolo comparten una sola línea de dibujo: donde termina el trazo empieza la letra",
    "la palabra principal es un elemento más del objeto: un letrero que cuelga de él, una luz dentro, un sello sobre él",
    "el texto fluye con el movimiento del símbolo: sube con el humo, cae con el agua, gira con la rueda"
  ];
const api = { structuralTreatments, visualTreatments, textIntegrations };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.PODCreativeCatalogs = root.PODCreativeCatalogs || {};
    root.PODCreativeCatalogs.treatments = api;
  }
})(typeof window !== 'undefined' ? window : null);
