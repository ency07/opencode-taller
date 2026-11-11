/**
 * CATALOGO DE TERRITORIOS CREATIVOS — 19 territorios activos.
 * Los datos se consumen desde motor-nucleo.js y el selector creativeTerritory.
 * compatibleStyles son recomendaciones; compatibleTreatments son restricciones del eje estructural.
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
 * - compatibleMarkets:    IDs reales definidos en POD_MARKETS; el motor valida compatibilidad exacta.
 * - compatibleMarketTags: categorías descriptivas (p. ej. lifestyle, streetwear); no son IDs y no habilitan mercados.
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
    promptDirective: "Construye la pieza como una página editorial contemporánea: establece una retícula legible, jerarquía tipográfica deliberada y anotaciones funcionales; deriva el símbolo del concepto y evita cruces genéricas u ornamento tipográfico vacío.",
    resources: ["tipografia", "reticulas", "numeracion", "anotaciones", "bloques_texto", "portadas_libros", "diseno_editorial"],
    themes: ["identidad_cristo", "verdad", "gracia", "santidad", "discipulado"],
    restrictions: ["no_cruces_centrales_genericas", "no_tipografias_decorativas_vacias"],
    // Eje de estilo (data-estilos.js): ids de estilos artisticos compatibles con el territorio.
    // Los ejes de tipoografia (SOLO_TEXTO/BALANCEADO/TEXTO_DOMINANTE/OBJETO_DOMINANTE/SOLO_OBJETO)
    // y los perfiles estructurales (HEAVY/SOFT/MODERN) NO son ids de estilo: se declaran en su eje propio.
    compatibleStyles: ["Minimal Modern", "Gótico Ornamental"],
    // Eje de tratamiento (data-tratamientos.js): ids de tratamiento estructural.
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "streetwear", "lifestyle"],
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
    promptDirective: "Elige una especie o estructura botánica concreta que nazca de la metáfora bíblica indicada; cada raíz, hoja, fruto o rama debe cumplir una función semántica y no convertirse en decoración vegetal gratuita.",
    resources: ["raices", "semillas", "olivos", "vides", "espigas", "ramas", "frutos", "crecimiento", "permanencia"],
    themes: ["permanecer_en_cristo", "crecimiento_espiritual", "fruto_espiritu", "esperanza", "vida_eterna"],
    restrictions: ["no_plantas_ornamentales_sin_metafora_biblica", "las_plantas_deben_nacer_del_texto"],
    compatibleStyles: ["Bohemian", "Acuarela Suelta"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "lifestyle", "nature_outdoor"],
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
    promptDirective: "Trata la pieza como un documento visual del mundo antiguo: usa inscripciones, sellos, mapas o materiales verificables y distingue claramente la interpretación artística de cualquier dato histórico; no inventes hallazgos ni símbolos como hechos.",
    resources: ["inscripciones", "sellos", "mapas_historicos", "tablillas", "papiros", "diagramas_arqueologicos", "documentos_antiguos"],
    themes: ["origenes", "alianzas", "promesas", "exodo", "historia_redencion", "pacto"],
    restrictions: ["no_elementos_inventados_como_historicos", "referencias_deben_ser_verificables"],
    compatibleStyles: ["Vintage Desgastado", "Blueprint / Technical", "Grabado / Linóleo"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "lifestyle", "professional_community"],
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
    promptDirective: "Traduce la tensión teológica central a relaciones espaciales, geometría, escala, contraste y vacío; evita ilustrar literalmente el pasaje y asegúrate de que cada forma abstracta exprese una relación conceptual reconocible.",
    resources: ["geometria", "modulos", "tension", "contraste", "repeticion", "espacio_negativo", "formas_abstractas", "estructuras"],
    themes: ["eternidad", "unidad", "redencion", "transformacion", "esperanza", "poder_en_debilidad"],
    restrictions: ["no_ilustracion_literal_del_texto", "el_concepto_debe_nacer_de_la_tension_teologica"],
    compatibleStyles: ["Minimal Modern", "Brutalist"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "lifestyle", "art_design"],
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
    promptDirective: "Diseña un emblema original con lenguaje de sello, grabado o heráldica reinterpretada; construye su identidad desde el mensaje y no reproduzcas escudos, insignias ni ornamentos identificables de iglesias u organizaciones reales.",
    resources: ["sellos", "emblemas", "grabados", "escudos", "ornamentos", "tipografia_historica", "marcos_decorativos"],
    themes: ["confesion_fe", "fidelidad", "perseverancia", "herencia_espiritual", "tradicion"],
    restrictions: ["no_usar_escudos_de_organizaciones_comerciales_reales_como_ornamento", "no_copiar_escudos_de_iglesias_reales"],
    compatibleStyles: ["Folk Popular", "Bordado / Puntada", "Vintage Desgastado"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "professional_community", "lifestyle"],
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
    promptDirective: "Cuenta una verdad bíblica mediante una escena o secuencia visual con acción, contexto y punto de lectura claros; cada personaje y elemento secundario debe contribuir al relato, sin imitar franquicias ni personajes comerciales existentes.",
    resources: ["vinetas", "secuencias", "personajes_secundarios", "paisajes", "escenas_ilustradas", "narrativa_visual"],
    themes: ["parabolas", "acontecimientos_biblicos", "experiencias_transformacion", "historias_fe"],
    restrictions: ["no_imitar_francises_comerciales_conocidas", "no_usar_personajes_realistas_de_francises_reales"],
    compatibleStyles: ["Kids Storybook", "Cómic / Halftone"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "lifestyle", "music_entertainment", "humor_pop"],
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
    promptDirective: "Parte de una situación u objeto cotidiano reconocible y conecta su función con la verdad espiritual concreta; conserva espontaneidad y claridad, evita escenas recargadas y no añadas símbolos religiosos genéricos sin relación con el concepto.",
    resources: ["objetos_cotidianos", "escritura_manual", "anotaciones", "diarios", "composiciones_espontaneas", "vida_familiar"],
    themes: ["oracion", "descanso", "obediencia", "servicio", "paciencia", "vida_familiar", "practica_diaria"],
    restrictions: ["no_complicaciones_visuales_excesivas", "no_alejarse_de_la_cotidianidad_reconocible"],
    // Tarea 3 (Stage 1 closure): revisión de EVERYDAY_FAITH. Asignación canónica conservada
    // (tratamientos SOFT + MODERN; HEAVY queda fuera por la decisión canónica registrada, sin
    // alterar la asignación sin justificación adicional).
    compatibleStyles: ["Hand-Drawn", "Bordado / Puntada"],
    compatibleTreatments: ["SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "lifestyle", "professional_community", "nature_outdoor"],
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
    promptDirective: "Construye la gráfica como un sistema utilitario de trabajo: etiquetas, nomenclaturas, diagramas o identificadores deben organizar información real del concepto; evita ornamentos promocionales y detalles técnicos inventados que no aporten significado.",
    resources: ["etiquetas_tecnicas", "numeraciones", "diagramas", "nomenclaturas", "identificadores", "graficos_funcionales", "documentacion_tecnica"],
    themes: ["servicio", "fidelidad", "vocacion", "trabajo_para_el_senor", "oficio", "responsabilidad"],
    restrictions: ["no_ornamentos_decorativos_inutiles", "no_estetica_promocional_de_iglesia"],
    compatibleStyles: ["Blueprint / Technical", "Stencil Urbano"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "professional_community", "automotive_industrial", "streetwear"],
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
    promptDirective: "Haz que la composición nazca de una oposición teológica concreta: distribuye fuerzas, escalas, fragmentos y espacios negativos para que el conflicto se entienda visualmente; no reduzcas la tensión a un contraste cromático decorativo.",
    resources: ["dualidad", "fragmentacion", "contraste_escalas", "oposicion_formas", "asimetria", "tension_visual", "espacio_negativo_extremo"],
    themes: ["debilidad_poder", "muerte_resurreccion", "esclavitud_libertad", "culpa_perdon", "transformacion"],
    restrictions: ["no_simplificaciones_visuales_que_ignoren_la_tension_conceptual", "la_composicion_debe_nacer_del_mensaje"],
    compatibleStyles: ["Brutalist", "Photomontage / Dada"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "lifestyle", "art_design", "professional_community"],
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
    promptDirective: "Integra referencias regionales concretas y comprobables en el lenguaje visual sin convertirlas en estereotipos; conserva la identidad local indicada y conecta cada referencia cultural con el mensaje de fe.",
    resources: ["expresiones_regionales", "elementos_arquitectonicos", "referencias_culturales", "escenas_cotidianas", "lenguajes_graficos_locales", "arte_popular"],
    themes: ["fe_en_comunidad", "perseverancia", "servicio", "esperanza", "pertenencia", "identidad_regional"],
    restrictions: ["no_generalizaciones_culturales_que_borren_la_identidad", "cada_region_tiene_sus_propias_referencias"],
    compatibleStyles: ["Folk Popular", "Collage Cut-Paper", "Hand-Drawn"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["gospel_es", "gospel_en"],
    compatibleMarketTags: ["christian", "professional_community", "lifestyle", "music_entertainment", "nature_outdoor"],
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
    promptDirective: "Construye la composición con códigos gráficos urbanos y jerarquía de streetwear; el símbolo debe sostener la identidad de calle sin recurrir a estereotipos ni imitar marcas existentes.",
    resources: ["tipografia_bold"],
    themes: ["identidad_urbana"],
    restrictions: ["no_estereotipos_negativos"],
    compatibleStyles: ["Brutalist", "Stencil Urbano"],
    compatibleTreatments: ["HEAVY", "SOFT", "MODERN"],
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["streetwear", "lifestyle"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle", "nature_outdoor"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle", "art_design"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle", "professional_community"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle", "music_entertainment"],
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
    compatibleMarkets: ["global_en", "anglo", "colombia", "latam", "spain", "diaspora_col", "custom", "global_es"],
    compatibleMarketTags: ["lifestyle", "art_design", "professional_community"],
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

// Exportación para pruebas Node y consumo por el runtime del navegador.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { POD_CREATIVE_TERRITORIES };
}
