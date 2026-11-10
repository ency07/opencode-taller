/**
 * CATALOGO DE TERRITORIOS CREATIVOS — Fase 1 (Plan, sin modificar motor existente)
 * Repositorio: ency07/opencode-taller (rama: feat/creative-territory-engine)
 * Este archivo es un catálogo de datos independiente. No modifica motor-nucleo.js,
 * data-estilos.js ni ningún archivo existente. Su integración al flujo requiere
 * una fase posterior (Fase 3: selector) y luego Fase 4 (integración de motores).
 */

'use strict';

/**
 * CATALOGO DE TERRITORES CREATIVOS — Fase 1 (Stage 1 closure)
 * Estado: catalogo validado contra los ejes declarados (estilo / tratamiento / mercado).
 *
 * ESQUEMA (Tarea 2 — separacion de ejes):
 * - compatibleStyles:     ids de estilo artistico del catalogo de estilos (data-estilos.js / ESTILOS_LIST).
 *                         NO admite perfiles estructurales (HEAVY/SOFT/MODERN) ni ejes de tipografia
 *                         (SOLO_TEXTO/BALANCEADO/TEXTO_DOMINANTE/OBJETO_DOMINANTE/SOLO_OBJETO):
 *                         esos valores pertenecen a sus respectivos catalogos/ejes y se declaran en su lugar.
 * - compatibleTreatments: ids de tratamiento estructural del catalogo de tratamientos (data-tratamientos.js):
 *                         HEAVY / SOFT / MODERN (ORDEN FIJA). NO se mezclan con estilos.
 * - compatibleMarkets:    ids de mercado con los que el territorio puede convivir.
 *
 * Compatibilidades NO verificables:
 * - Los diez territorios se declaran con direcciones propias (description/themes/restrictions); las
 *   combinaciones estilo x territorio convierten en decisiones creativas que exceden la fuente
 *   original (pendiente de recuperacion) y se documentan aqui sin inventar pares nuevos.
 */

const POD_CREATIVE_TERRITORIES = {
  SACRED_EDITORIAL: {
    id: "SACRED_EDITORIAL",
    label: "Sagrado editorial",
    label_es: "Sagrado editorial",
    label_en: "Sacred Editorial",
    description: "La fe interpretada mediante diseño editorial contemporáneo. Tipografía protagonista, retículas, numeración, anotaciones y bloques de texto. Lenguaje visual de una publicación cultural.",
    resources: ["tipografia", "reticulas", "numeracion", "anotaciones", "bloques_texto", "portadas_libros", "diseno_editorial"],
    themes: ["identidad_cristo", "verdad", "gracia", "santidad", "discipulado"],
    restrictions: ["no_cruces_centrales_genericas", "no_tipografias_decorativas_vacias"],
    // Eje de estilo (data-estilos.js): ids de estilos artisticos compatibles con el territorio.
    // Los ejes de tipoografia (SOLO_TEXTO/BALANCEADO/TEXTO_DOMINANTE/OBJETO_DOMINANTE/SOLO_OBJETO)
    // y los perfiles estructurales (HEAVY/SOFT/MODERN) NO son ids de estilo: se declaran en su eje propio.
    compatibleStyles: ["Minimal Modern", "Gótico Ornamental"],
    // Eje de tratamiento (data-tratamientos.js): ids de tratamiento estructural.
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "streetwear", "lifestyle"],
    visualIdentity: "editorial_contemporaneo",
    brandAssociation: ["BERESHITH_CO", "CrossLampCo"],
    priority: 1
  },

  BIBLICAL_BOTANICAL: {
    id: "BIBLICAL_BOTANICAL",
    label: "Creación y botánica bíblica",
    label_es: "Botánica bíblica",
    label_en: "Biblical Botanical",
    description: "La naturaleza como lenguaje visual de las Escrituras. Recursos: raíces, semillas, olivos, vides, espigas, ramas y frutos. Temas: permanecer en Cristo, fruto del Espíritu, esperanza y crecimiento.",
    resources: ["raices", "semillas", "olivos", "vides", "espigas", "ramas", "frutos", "crecimiento", "permanencia"],
    themes: ["permanecer_en_cristo", "crecimiento_espiritual", "fruto_espiritu", "esperanza", "vida_eterna"],
    restrictions: ["no_plantas_ornamentales_sin_metafora_biblica", "las_plantas_deben_nacer_del_texto"],
    compatibleStyles: ["Bohemian", "Acuarela Suelta"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "lifestyle", "nature_outdoor"],
    visualIdentity: "botanica_organica_detallada",
    brandAssociation: ["BERESHITH_CO", "CrossLampCo"],
    priority: 1
  },

  BIBLICAL_ARCHAEOLOGY: {
    id: "BIBLICAL_ARCHAEOLOGY",
    label: "Arqueología y mundo bíblico",
    label_es: "Arqueología bíblica",
    label_en: "Biblical Archaeology",
    description: "Diseños inspirados en la materialidad del mundo antiguo: inscripciones, sellos, mapas históricos, tablillas, papiros y diagramas arqueológicos. Temas: orígenes, alianzas, promesas y redención.",
    resources: ["inscripciones", "sellos", "mapas_historicos", "tablillas", "papiros", "diagramas_arqueologicos", "documentos_antiguos"],
    themes: ["origenes", "alianzas", "promesas", "exodo", "historia_redencion", "pacto"],
    restrictions: ["no_elementos_inventados_como_historicos", "referencias_deben_ser_verificables"],
    compatibleStyles: ["Vintage Desgastado", "Blueprint / Technical", "Grabado / Linóleo"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "lifestyle", "professional_community"],
    visualIdentity: "archivo_documentado",
    brandAssociation: ["BERESHITH_CO"],
    priority: 1
  },

  THEOLOGICAL_ABSTRACTION: {
    id: "THEOLOGICAL_ABSTRACTION",
    label: "Abstracción teológica",
    label_es: "Abstracción teológica",
    label_en: "Theological Abstraction",
    description: "Representar una verdad mediante formas, estructuras, relaciones visuales y geometría. El concepto no depende de ilustrar literalmente el texto bíblico, sino de expresar su significado a través de relaciones espaciales, tensión, contraste y repetición.",
    resources: ["geometria", "modulos", "tension", "contraste", "repeticion", "espacio_negativo", "formas_abstractas", "estructuras"],
    themes: ["eternidad", "unidad", "redencion", "transformacion", "esperanza", "poder_en_debilidad"],
    restrictions: ["no_ilustracion_literal_del_texto", "el_concepto_debe_nacer_de_la_tension_teologica"],
    compatibleStyles: ["Minimal Modern", "Brutalist"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "lifestyle", "art_design"],
    visualIdentity: "geometria_teologica",
    brandAssociation: ["BERESHITH_CO", "CrossLampCo"],
    priority: 2
  },

  CHRISTIAN_HERITAGE: {
    id: "CHRISTIAN_HERITAGE",
    label: "Heritage cristiano",
    label_es: "Heritage cristiano",
    label_en: "Christian Heritage",
    description: "Tradición gráfica reinterpretada como identidad contemporánea: sellos, emblemas, grabados, escudos originales, ornamentos y tipografía histórica. Temas: confesión de fe, fidelidad, perseverancia y herencia espiritual.",
    resources: ["sellos", "emblemas", "grabados", "escudos", "ornamentos", "tipografia_historica", "marcos_decorativos"],
    themes: ["confesion_fe", "fidelidad", "perseverancia", "herencia_espiritual", "tradicion"],
    restrictions: ["no_usar_escudos_de_organizaciones_comerciales_reales_como_ornamento", "no_copiar_escudos_de_iglesias_reales"],
    compatibleStyles: ["Folk Popular", "Bordado / Puntada", "Vintage Desgastado"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "professional_community", "lifestyle"],
    visualIdentity: "emblema_reinterpretado",
    brandAssociation: ["BERESHITH_CO"],
    priority: 2
  },

  NARRATIVE_ILLUSTRATION: {
    id: "NARRATIVE_ILLUSTRATION",
    label: "Ilustración narrativa",
    label_es: "Ilustración narrativa",
    label_en: "Narrative Illustration",
    description: "La fe contada mediante escenas y secuencias visuales: viñetas, secuencias, personajes secundarios, paisajes y escenas ilustradas. Temas: parábolas, acontecimientos bíblicos y experiencias de transformación.",
    resources: ["vinetas", "secuencias", "personajes_secundarios", "paisajes", "escenas_ilustradas", "narrativa_visual"],
    themes: ["parabolas", "acontecimientos_biblicos", "experiencias_transformacion", "historias_fe"],
    restrictions: ["no_imitar_francises_comerciales_conocidas", "no_usar_personajes_realistas_de_francises_reales"],
    compatibleStyles: ["Kids Storybook", "Cómic / Halftone"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "lifestyle", "music_entertainment", "humor_pop"],
    visualIdentity: "narrativa_secuencial",
    brandAssociation: ["BERESHITH_CO", "CrossLampCo"],
    priority: 2
  },

  EVERYDAY_FAITH: {
    id: "EVERYDAY_FAITH",
    label: "Fe cotidiana",
    label_es: "Fe cotidiana",
    label_en: "Everyday Faith",
    description: "La espiritualidad en la vida real. Recursos: objetos cotidianos, escritura manual, anotaciones, diarios y composiciones espontáneas. Temas: oración, descanso, obediencia, servicio, paciencia y vida familiar.",
    resources: ["objetos_cotidianos", "escritura_manual", "anotaciones", "diarios", "composiciones_espontaneas", "vida_familiar"],
    themes: ["oracion", "descanso", "obediencia", "servicio", "paciencia", "vida_familiar", "practica_diaria"],
    restrictions: ["no_complicaciones_visuales_excesivas", "no_alejarse_de_la_cotidianidad_reconocible"],
    // Tarea 3 (Stage 1 closure): revisión de EVERYDAY_FAITH. Asignación canónica conservada
    // (tratamientos SOFT + MODERN; HEAVY queda fuera por la decisión canónica registrada, sin
    // alterar la asignación sin justificación adicional).
    compatibleStyles: ["Hand-Drawn", "Bordado / Puntada"],
    compatibleTreatments: ["SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "lifestyle", "professional_community", "nature_outdoor"],
    visualIdentity: "diario_visual",
    brandAssociation: ["BERESHITH_CO", "CrossLampCo"],
    priority: 2
  },

  FAITH_WORKWEAR: {
    id: "FAITH_WORKWEAR",
    label: "Workwear de fe",
    label_es: "Workwear de fe",
    label_en: "Faith Workwear",
    description: "La fe expresada mediante el lenguaje gráfico del trabajo y la utilidad: etiquetas técnicas, numeraciones, diagramas, nomenclaturas, identificadores y gráficos funcionales. Temas: servicio, fidelidad, vocación y trabajo hecho para el Señor.",
    resources: ["etiquetas_tecnicas", "numeraciones", "diagramas", "nomenclaturas", "identificadores", "graficos_funcionales", "documentacion_tecnica"],
    themes: ["servicio", "fidelidad", "vocacion", "trabajo_para_el_senor", "oficio", "responsabilidad"],
    restrictions: ["no_ornamentos_decorativos_inutiles", "no_estetica_promocional_de_iglesia"],
    compatibleStyles: ["Blueprint / Technical", "Stencil Urbano"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "professional_community", "automotive_industrial", "streetwear"],
    visualIdentity: "funcional_utilitario",
    brandAssociation: ["CrossLampCo", "BERESHITH_CO"],
    priority: 1
  },

  CONTRAST_ART: {
    id: "CONTRAST_ART",
    label: "Arte de contraste",
    label_es: "Arte de contraste",
    label_en: "Contrast Art",
    description: "Contradicciones humanas interpretadas desde la teología cristiana mediante dualidad, fragmentación, contraste de escalas, oposición entre formas y composiciones asimétricas. Temas: debilidad y poder, muerte y resurrección, esclavitud y libertad, culpa y perdón.",
    resources: ["dualidad", "fragmentacion", "contraste_escalas", "oposicion_formas", "asimetria", "tension_visual", "espacio_negativo_extremo"],
    themes: ["debilidad_poder", "muerte_resurreccion", "esclavitud_libertad", "culpa_perdon", "transformacion"],
    restrictions: ["no_simplificaciones_visuales_que_ignoren_la_tension_conceptual", "la_composicion_debe_nacer_del_mensaje"],
    compatibleStyles: ["Brutalist", "Photomontage / Dada"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "lifestyle", "art_design", "professional_community"],
    visualIdentity: "tension_asimetrica",
    brandAssociation: ["BERESHITH_CO", "CrossLampCo"],
    priority: 2
  },

  LOCAL_FAITH_CULTURE: {
    id: "LOCAL_FAITH_CULTURE",
    label: "Cultura y fe local",
    label_es: "Cultura y fe local",
    label_en: "Local Faith Culture",
    description: "La identidad cristiana vinculada a una comunidad, una región y su cultura: expresiones regionales, elementos arquitectónicos, referencias culturales, escenas cotidianas y lenguajes gráficos locales.",
    resources: ["expresiones_regionales", "elementos_arquitectonicos", "referencias_culturales", "escenas_cotidianas", "lenguajes_graficos_locales", "arte_popular"],
    themes: ["fe_en_comunidad", "perseverancia", "servicio", "esperanza", "pertenencia", "identidad_regional"],
    restrictions: ["no_generalizaciones_culturales_que_borren_la_identidad", "cada_region_tiene_sus_propias_referencias"],
    compatibleStyles: ["Folk Popular", "Collage Cut-Paper", "Hand-Drawn"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["christian", "gospel_es", "gospel_en", "professional_community", "lifestyle", "music_entertainment", "nature_outdoor"],
    visualIdentity: "identidad_regional",
    brandAssociation: ["BERESHITH_CO", "CrossLampCo"],
    priority: 2
  },

  URBAN_STREETWEAR: {
    id: "URBAN_STREETWEAR",
    label: "Streetwear urbano",
    label_es: "Streetwear urbano",
    label_en: "Urban Streetwear",
    description: "Estetica de calle, cultura urbana y deporte.",
    promptDirective: "Compon el diseno con lenguaje de calle.",
    resources: ["tipografia_bold"],
    themes: ["identidad_urbana"],
    restrictions: ["no_estereotipos_negativos"],
    compatibleStyles: ["Brutalist", "Stencil Urbano"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "streetwear", "lifestyle"],
    visualIdentity: "urbano_grafico",
    brandAssociation: [],
    priority: 1
  },

  NATURE_ORGANIC: {
    id: "NATURE_ORGANIC",
    label: "Naturaleza organica",
    label_es: "Naturaleza organica",
    label_en: "Organic Nature",
    description: "La naturaleza como lenguaje visual.",
    promptDirective: "Deriva el simbodo de elementos naturales concretos.",
    resources: ["hojas", "ramas"],
    themes: ["sostenibilidad", "bienestar"],
    restrictions: ["no_naturaleza_ornamental_sin_metafora"],
    compatibleStyles: ["Acuarela Suelta", "Folk Popular"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle", "nature_outdoor"],
    visualIdentity: "organico_natural",
    brandAssociation: [],
    priority: 2
  },

  MINIMAL_MODERN: {
    id: "MINIMAL_MODERN",
    label: "Minimalismo moderno",
    label_es: "Minimalismo moderno",
    label_en: "Modern Minimalism",
    description: "Menos es mas. Espacio negativo, tipografia limpia.",
    promptDirective: "Compon el diseno con maxima economia visual.",
    resources: ["espacio_negativo", "tipografia_limpia"],
    themes: ["elegancia", "claridad", "modernidad"],
    restrictions: ["no_sobrecarga_visual"],
    compatibleStyles: ["Minimal Modern", "Brutalist"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle", "art_design"],
    visualIdentity: "minimalista_contemporaneo",
    brandAssociation: [],
    priority: 3
  },

  PET_LOVERS: {
    id: "PET_LOVERS",
    label: "Mascotas",
    label_es: "Mascotas",
    label_en: "Pet Lovers",
    description: "El nicho mas fuerte de POD. Razas especificas, identidad de pet parent, regalos emocionales.",
    promptDirective: "Deriva el simbodo de la mascota concreta (raza, especie) y su vinculo con el humano. Evita mascotas genericas sin identidad.",
    resources: ["silueta_raza", "patas", "collar"],
    themes: ["pet_parent", "rescue_dog", "breed_pride"],
    restrictions: ["no_mascota_generica_sin_identidad", "no_humanizar_en_exceso"],
    compatibleStyles: ["Kids Storybook", "Hand-Drawn", "Minimal Modern", "Retro 70s", "Acuarela Suelta", "Folk Popular", "Collage Cut-Paper", "Pixel / 8-bit"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle"],
    visualIdentity: "mascotas_afecto",
    brandAssociation: [],
    priority: 1
  },

  PROFESSION_PRIDE: {
    id: "PROFESSION_PRIDE",
    label: "Profesiones y oficios",
    label_es: "Profesiones y oficios",
    label_en: "Profession Pride",
    description: "Evergreen. Enfermeras, profesores, bomberos, policias, electricistas. Humor interno y regalos entre colegas.",
    promptDirective: "Construye el diseno desde el orgullo profesional y el humor interno del oficio. El simbolo debe ser reconocible para alguien del gremio.",
    resources: ["herramienta_oficio", "uniforme", "insignia"],
    themes: ["orgullo_profesional", "humor_laboral", "regalo_colega"],
    restrictions: ["no_estereotipo_oficico", "no_humanizar_en_exceso"],
    compatibleStyles: ["Vintage Desgastado", "Blueprint / Technical", "Brutalist", "Hand-Drawn", "Retro 70s", "Bordado / Puntada", "Folk Popular", "Stencil Urbano"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle", "professional_community"],
    visualIdentity: "profesion_orgullo",
    brandAssociation: [],
    priority: 2
  },

  SARCASM_HUMOR: {
    id: "SARCASM_HUMOR",
    label: "Humor sarcastico",
    label_es: "Humor sarcastico",
    label_en: "Sarcastic Humor",
    description: "El mayor motor de compras impulsivas. Humor de oficina, memes, in-jokes especificos que solo un grupo entiende.",
    promptDirective: "El texto es el protagonista: fraSe sarcastica, autoironica o de in-joke. El simbolo debe reforzar el chiste, no competir con el.",
    resources: ["tipografia_bold", "onomatopeya", "cara_expresiva"],
    themes: ["sarcasmo", "introvertido", "burnout", "in_joke"],
    restrictions: ["no_humor_generico_saturado", "no_ofender_grupos"],
    compatibleStyles: ["Brutalist", "Y2K / Cyber", "Retro 80s Neon", "Vaporwave", "Stencil Urbano", "Grunge / DIY", "Risograph", "Pixel / 8-bit"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle"],
    visualIdentity: "humor_sarcastico",
    brandAssociation: [],
    priority: 3
  },

  HOBBY_MICRO: {
    id: "HOBBY_MICRO",
    label: "Hobbies micro-nicho",
    label_es: "Hobbies micro-nicho",
    label_en: "Hobby Micro-Niche",
    description: "Pickleball, disc golf, pesca, caza, jardineria, gaming. Identidad fuerte, busqueda long-tail, comunidades activas.",
    promptDirective: "Deriva el simbolo del hobby concreto: su equipo, su terreno, su vocabulario. El diseno debe ser reconocible para el practicante.",
    resources: ["equipo_hobby", "terreno", "vocabulario_propio"],
    themes: ["identidad_hobby", "regalo_hobby", "comunidad"],
    restrictions: ["no_hobby_generico_sin_equipo", "no_confundir_deporte_con_hobby"],
    compatibleStyles: ["Hand-Drawn", "Retro 70s", "Minimal Modern", "Kids Storybook", "Acuarela Suelta", "Collage Cut-Paper", "Vintage Desgastado", "Blueprint / Technical"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle"],
    visualIdentity: "hobby_identidad",
    brandAssociation: [],
    priority: 4
  },

  RETRO_VINTAGE: {
    id: "RETRO_VINTAGE",
    label: "Retro / Vintage",
    label_es: "Retro / Vintage",
    label_en: "Retro Vintage",
    description: "Nostalgia y tradicion visual.",
    promptDirective: "Compon el diseno con referencias a decadas pasadas.",
    resources: ["tipografia_retro"],
    themes: ["nostalgia", "tradicion"],
    restrictions: ["no_imitacion_literal_de_marcas"],
    compatibleStyles: ["Vintage Desgastado", "Retro 70s", "Grunge / DIY"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle", "music_entertainment"],
    visualIdentity: "retro_nostalgico",
    brandAssociation: [],
    priority: 4
  },

  TECH_DIGITAL: {
    id: "TECH_DIGITAL",
    label: "Tecnologia / Digital",
    label_es: "Tecnologia / Digital",
    label_en: "Tech Digital",
    description: "Lenguaje visual de la era digital.",
    promptDirective: "Compon el diseno con lenguaje digital: geometria precisa, neon, gradientes.",
    resources: ["geometria_precisa", "neon", "gradientes"],
    themes: ["innovacion", "futuro", "conectividad"],
    restrictions: ["no_estereotipos_de_hacker"],
    compatibleStyles: ["Y2K / Cyber", "Pixel / 8-bit", "Vaporwave"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es", "lifestyle", "art_design", "professional_community"],
    visualIdentity: "digital_cyber",
    brandAssociation: [],
    priority: 5
  }
};

// Normaliza las descripciones: el eje temático vive en `themes` (identificadores propios del
// territorio), por lo que ninguna descripción debe duplicar un bloque "Temas: ..." en su texto
// (Tarea 2 — des-duplicación del prompt generado por la directiva).
Object.keys(POD_CREATIVE_TERRITORIES).forEach(function (territoryId) {
  const rec = POD_CREATIVE_TERRITORIES[territoryId];
  const desc = String(rec && rec.description || '');
  const match = desc.match(/^(.*)\s*Temas:\s*[\s\S]*$/);
  if (match) rec.description = match[1].trim();
});

// Exportación para consumo por motor-nucleo.js (en Fase 4).
// En Fase 1 y 2, este archivo solo existe; no se importa en ningún archivo existente.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { POD_CREATIVE_TERRITORIES };
}
