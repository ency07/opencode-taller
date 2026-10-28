(function () {
  'use strict';

  /* ============================================================
     MEMORIA LOCAL — Taller POD Comercial Multi-Mercado
     Gestiona persistencia local, locks, banco personal, historial,
     memoria creativa, patrones anti-repetición y export/import.
     No genera prompts. No toca IA. No depende de imágenes.
     ============================================================ */

  const MEM_PREFIX = 'POD2|';

  const POD_LS = (function () {
    let mem = {};
    let ok = false;

    try {
      window.localStorage.setItem('__pod_test__', '1');
      window.localStorage.removeItem('__pod_test__');
      ok = true;
    } catch (e) {
      ok = false;
    }

    return {
      getItem: function (k) {
        if (Object.prototype.hasOwnProperty.call(mem, k)) return mem[k];
        if (ok) {
          try {
            return window.localStorage.getItem(k);
          } catch (e) {
            return null;
          }
        }
        return null;
      },
      setItem: function (k, v) {
        if (ok) {
          try {
            window.localStorage.setItem(k, v);
            delete mem[k];
            return true;
          } catch (e) {
            // storage full or blocked; fallback to session memory (not durable)
            mem[k] = String(v);
            return false;
          }
        }
        mem[k] = String(v);
        return true;
      },
      removeItem: function (k) {
        delete mem[k];
        if (ok) {
          try {
            window.localStorage.removeItem(k);
          } catch (e) {
            // ignore
          }
        }
      },
      keys: function () {
        if (ok) {
          try {
            const ks = Object.keys(window.localStorage);
            Object.keys(mem).forEach(function (mk) {
              if (ks.indexOf(mk) === -1) ks.push(mk);
            });
            return ks;
          } catch (e) {
            return Object.keys(mem);
          }
        }
        return Object.keys(mem);
      }
    };
  })();

  function safeAsk(message) {
    try {
      return window.confirm(message);
    } catch (e) {
      return true;
    }
  }

  function safeTell(message) {
    try {
      window.alert(message);
    } catch (e) {
      // ignore
    }
  }

  function confirmDestructive(message, expected) {
    expected = String(expected || 'BORRAR').toUpperCase();
    try {
      const response = window.prompt(
        message + '\nEscribe ' + expected + ' para confirmar.',
        ''
      );
      return String(response || '').trim().toUpperCase() === expected;
    } catch (e) {
      return false;
    }
  }

  function memKey(parts) {
    const clean = (Array.isArray(parts) ? parts : [parts]).map(function (p) {
      return String(p === undefined || p === null ? '' : p).trim();
    });
    return MEM_PREFIX + clean.join('|');
  }

  function getRaw(key) {
    return POD_LS.getItem(key);
  }

  function setRaw(key, value) {
    return POD_LS.setItem(key, value) === true;
  }

  function removeRaw(key) {
    POD_LS.removeItem(key);
  }

  function getJSON(key, fallback) {
    try {
      const raw = POD_LS.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    try {
      return POD_LS.setItem(key, JSON.stringify(value)) === true;
    } catch (e) {
      return false;
    }
  }

  function listMemoryKeys() {
    return POD_LS.keys().filter(function (k) {
      return String(k).indexOf(MEM_PREFIX) === 0;
    });
  }

  /* ============================================================
     CONFIGURACIÓN DE PATRONES ANTI-REPETICIÓN
     ============================================================ */

  const DEFAULT_PATTERN_CONFIG = {
    window: 12,
    tolerance: 2
  };

  function getPatternConfig() {
    const saved = getJSON(memKey(['config', 'patterns']), {});
    return Object.assign({}, DEFAULT_PATTERN_CONFIG, saved || {});
  }

  function savePatternConfig(config) {
    return setJSON(
      memKey(['config', 'patterns']),
      Object.assign({}, DEFAULT_PATTERN_CONFIG, config || {})
    );
  }

  /* ============================================================
     PATRONES VISUALES ANTI-REPETICIÓN
     Patrón real: estilo + forma + tratamiento + layout + familia color.
     No usa audiencia como eje visual.
     ============================================================ */

  const PATTERN_AXES = [
    'estilo',
    'formaSimbolo',
    'tratamiento',
    'layout',
    'familiaColor'
  ];

  function baseStyleValue(value) {
    return String(value || '')
      .split(' × ')[0]
      .trim();
  }

  function basePrefixValue(value) {
    return String(value || '')
      .split(':')[0]
      .trim();
  }

  function normalizePattern(card) {
    card = card || {};
    const pattern = {};
    pattern.estilo = baseStyleValue(card.estilo);
    pattern.formaSimbolo = String(card.formaSimbolo || '').trim();
    pattern.tratamiento = basePrefixValue(card.tratamiento);
    pattern.layout = basePrefixValue(card.layout);
    pattern.familiaColor = String(card.familiaColor || '').trim();
    return pattern;
  }

  function countEqualAxes(a, b) {
    let count = 0;
    PATTERN_AXES.forEach(function (axis) {
      const va = String((a || {})[axis] || '').trim();
      const vb = String((b || {})[axis] || '').trim();
      if (va && va === vb) count += 1;
    });
    return count;
  }

  function loadPatternMemory(market, product) {
    return getJSON(memKey(['patterns', market, product]), []);
  }

  function savePatternMemory(market, product, memory) {
    return setJSON(
      memKey(['patterns', market, product]),
      (memory || []).slice(-80)
    );
  }

  function findPatternConflicts(pattern, market, product, config) {
    config = config || getPatternConfig();
    const memory = loadPatternMemory(market, product).slice(
      -(config.window || DEFAULT_PATTERN_CONFIG.window)
    );

    const conflicts = [];
    let maxMatches = 0;

    memory.forEach(function (entry, index) {
      const matches = countEqualAxes(pattern, entry.pattern || {});
      if (matches > maxMatches) maxMatches = matches;

      if (matches > (config.tolerance || DEFAULT_PATTERN_CONFIG.tolerance)) {
        conflicts.push({
          index: index,
          matches: matches,
          entry: entry
        });
      }
    });

    return {
      ok: conflicts.length === 0,
      conflicts: conflicts,
      maxMatches: maxMatches
    };
  }

  function recordPattern(card, market, product, meta) {
    const pattern = normalizePattern(card);
    const memory = loadPatternMemory(market, product);

    memory.push({
      t: new Date().toISOString(),
      pattern: pattern,
      meta: meta || {}
    });

    savePatternMemory(market, product, memory);
    return pattern;
  }

  function clearPatternMemory(market, product) {
    removeRaw(memKey(['patterns', market, product]));
  }

  /* ============================================================
     LOCKS DE SELECTORES POR TARJETA
     ============================================================ */

  function defaultLocks() {
    return {
      estilo: { A: 'Auto', B: 'Auto', C: 'Auto' },
      audiencia: { A: 'Auto', B: 'Auto', C: 'Auto' },
      jerarquia: { A: 'Auto', B: 'Auto', C: 'Auto' },
      layout: { A: 'Auto', B: 'Auto', C: 'Auto' }
    };
  }

  function loadLocks(market, product) {
    const saved = getJSON(memKey(['locks', market, product]), {});
    const base = defaultLocks();

    ['estilo', 'audiencia', 'jerarquia', 'layout'].forEach(function (field) {
      ['A', 'B', 'C'].forEach(function (card) {
        if (saved && saved[field] && saved[field][card]) {
          base[field][card] = saved[field][card];
        }
      });
    });

    return base;
  }

  function saveLocks(market, product, locks) {
    return setJSON(memKey(['locks', market, product]), locks || defaultLocks());
  }

  function setLockValue(market, product, field, card, value) {
    const locks = loadLocks(market, product);
    if (!locks[field]) locks[field] = defaultLocks()[field];
    locks[field][card] = value;
    const persisted = saveLocks(market, product, locks);
    return { locks: locks, persisted: persisted };
  }

  function clearLocks(market, product) {
    removeRaw(memKey(['locks', market, product]));
  }

  /* ============================================================
     BANCO PERSONAL POR MERCADO Y SUBNICHO
     ============================================================ */

  const COMMON_BANK_KEY = 'comun';

  function loadPersonalBank(market) {
    return getJSON(memKey(['personalBank', market]), {}) || {};
  }

  function savePersonalBank(market, bank) {
    return setJSON(memKey(['personalBank', market]), bank || {});
  }

  function getPersonalPhrases(market, subniche) {
    const bank = loadPersonalBank(market);
    const out = [];
    const add = function (key) {
      if (Array.isArray(bank[key])) out.push.apply(out, bank[key]);
    };
    if (subniche) add('__phrase__' + subniche);
    if (subniche !== COMMON_BANK_KEY) add('__phrase__' + COMMON_BANK_KEY);
    // Banco nombrado activo para este contexto (Fase 2).
    try {
      const active = getActivePersonalBank(market, subniche);
      if (active && Array.isArray(active.phrases)) out.push.apply(out, active.phrases);
    } catch (e) {}
    return Array.from(new Set(out.filter(Boolean)));
  }

  function getPersonalConcepts(market, subniche) {
    const bank = loadPersonalBank(market);
    const out = [];
    const add = function (key) {
      if (Array.isArray(bank[key])) out.push.apply(out, bank[key]);
    };
    if (subniche) add('__concept__' + subniche);
    if (subniche !== COMMON_BANK_KEY) add('__concept__' + COMMON_BANK_KEY);
    // Banco nombrado activo para este contexto (Fase 2).
    try {
      const active = getActivePersonalBank(market, subniche);
      if (active && Array.isArray(active.concepts)) out.push.apply(out, active.concepts);
    } catch (e) {}
    return Array.from(new Set(out.filter(Boolean)));
  }

  function useBankConcept(market, subniche, conceptField) {
    const bank = loadPersonalBank(market);
    const key = '__concept__' + subniche;
    const concepts = Array.isArray(bank[key]) ? bank[key] : [];
    if (!concepts.length) {
      tell('Aún no hay conceptos guardados en este subnicho. ¡Añádelos primero!', 'info');
      return;
    }
    // Elegir un concepto aleatorio
    const choice = concepts[Math.floor(Math.random() * concepts.length)];
    const conceptFieldEl = conceptField || document.getElementById('concept');
    if (!conceptFieldEl) {
      tell('No se encontró el campo de concepto', 'bad');
      return;
    }
    // Si el campo ya tiene texto, pedir confirmación
    const current = conceptFieldEl.value.trim();
    if (current && confirm('El campo de concepto ya tiene texto: "' + current + '".\n¿Deseas reemplazarlo con "' + choice + '"?')) {
      conceptFieldEl.value = choice;
    } else if (!current) {
      conceptFieldEl.value = choice;
    } else {
      tell('Concepto no cambiado.', 'info');
    }
  }

  function addPersonalConcept(market, subniche, concept) {
    const bank = loadPersonalBank(market);
    const key = subniche || COMMON_BANK_KEY;
    const current = Array.isArray(bank[key]) ? bank[key] : [];

    const norm = function (s) {
      return String(s || '').toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    };

    const sig = norm(concept);
    if (!sig || current.some(function (c) { return norm(c) === sig; })) return { ok: false, error: 'Concepto duplicado' };

    const newBank = Object.assign({}, bank);
    current.push(concept);
    newBank[key] = current;
    savePersonalBank(market, newBank);
    return { ok: true, added: 1 };
  }

  function getPersonalObjects(market, subniche) {
    const bank = loadPersonalBank(market);
    const out = [];

    if (subniche && Array.isArray(bank[subniche])) {
      out.push.apply(out, bank[subniche]);
    }

    if (Array.isArray(bank[COMMON_BANK_KEY])) {
      out.push.apply(out, bank[COMMON_BANK_KEY]);
    }

    // Banco nombrado activo para este contexto (Fase 2).
    try {
      const active = getActivePersonalBank(market, subniche);
      if (active && Array.isArray(active.objects)) out.push.apply(out, active.objects);
    } catch (e) {}

    return Array.from(new Set(out.filter(Boolean)));
  }

  function addPersonalObjects(market, subniche, lines) {
    const bank = loadPersonalBank(market);
    const key = subniche || COMMON_BANK_KEY;
    const current = Array.isArray(bank[key]) ? bank[key] : [];

    let added = 0;
    let duplicates = 0;

    (lines || []).forEach(function (line) {
      const value = String(line || '').trim();
      if (value.length < 4) return;

      if (current.includes(value)) {
        duplicates += 1;
      } else {
        current.push(value);
        added += 1;
      }
    });

    if (added > 0) {
      bank[key] = current;
      savePersonalBank(market, bank);
    }

    return {
      added: added,
      duplicates: duplicates,
      total: current.length
    };
  }

  function removePersonalBank(market, subniche) {
    if (subniche) {
      const bank = loadPersonalBank(market);
      delete bank[subniche];
      savePersonalBank(market, bank);
    } else {
      removeRaw(memKey(['personalBank', market]));
    }
  }

  /* ============================================================
     BANCOS PERSONALES NOMBRADOS (Fase 2)
     Varios bancos con nombre por mercado, cada uno atado a un subnicho.
     El banco ACTIVO por (mercado, subnicho) alimenta getPersonalObjects/
     getPersonalPhrases y por tanto al motor. El banco legacy sigue intacto.
     ============================================================ */

  function _loadNamedBanks(market) {
    const raw = getJSON(memKey(['personalBanks', market]), null);
    if (raw && raw.banks && typeof raw.banks === 'object') {
      if (!raw.active || typeof raw.active !== 'object') raw.active = {};
      return raw;
    }
    return { banks: {}, active: {} };
  }

  function _saveNamedBanks(market, data) {
    return setJSON(memKey(['personalBanks', market]), data || { banks: {}, active: {} });
  }

  function _newBankId() {
    try {
      return 'pb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    } catch (e) {
      return 'pb_' + String(Math.floor(Math.random() * 1e9));
    }
  }

  function _normBankEntry(s) {
    return String(s || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }

  function createPersonalBank(market, name, subniche) {
    const clean = String(name || '').trim();
    if (clean.length < 2) return { ok: false, error: 'el banco necesita un nombre (mínimo 2 caracteres)' };
    const data = _loadNamedBanks(market);
    const dup = Object.keys(data.banks).some(function (id) {
      return String(data.banks[id].name || '').toLowerCase() === clean.toLowerCase();
    });
    if (dup) return { ok: false, error: 'ya existe un banco con ese nombre en este mercado' };
    const id = _newBankId();
    data.banks[id] = {
      id: id,
      name: clean,
      subniche: subniche || COMMON_BANK_KEY,
      objects: [],
      phrases: [],
      updatedAt: new Date().toISOString()
    };
    if (!_saveNamedBanks(market, data)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true, id: id };
  }

  function listPersonalBanks(market) {
    const data = _loadNamedBanks(market);
    return Object.keys(data.banks).map(function (id) { return data.banks[id]; }).sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  function getPersonalBank(market, id) {
    if (!id) return null;
    return _loadNamedBanks(market).banks[id] || null;
  }

  function renamePersonalBank(market, id, name) {
    const data = _loadNamedBanks(market);
    if (!data.banks[id]) return { ok: false, error: 'el banco no existe' };
    const clean = String(name || '').trim();
    if (clean.length < 2) return { ok: false, error: 'nombre muy corto' };
    const dup = Object.keys(data.banks).some(function (other) {
      return other !== id && String(data.banks[other].name || '').toLowerCase() === clean.toLowerCase();
    });
    if (dup) return { ok: false, error: 'ya existe otro banco con ese nombre' };
    data.banks[id].name = clean;
    data.banks[id].updatedAt = new Date().toISOString();
    if (!_saveNamedBanks(market, data)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true };
  }

  function deletePersonalBank(market, id) {
    const data = _loadNamedBanks(market);
    if (!data.banks[id]) return { ok: false, error: 'el banco no existe' };
    delete data.banks[id];
    Object.keys(data.active).forEach(function (ctx) {
      if (data.active[ctx] === id) delete data.active[ctx];
    });
    if (!_saveNamedBanks(market, data)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true };
  }

  function clonePersonalBank(market, id, newName) {
    const data = _loadNamedBanks(market);
    const src = data.banks[id];
    if (!src) return { ok: false, error: 'el banco no existe' };
    const clean = String(newName || (src.name + ' copia')).trim();
    if (clean.length < 2) return { ok: false, error: 'nombre muy corto' };
    const dup = Object.keys(data.banks).some(function (other) {
      return String(data.banks[other].name || '').toLowerCase() === clean.toLowerCase();
    });
    if (dup) return { ok: false, error: 'ya existe un banco con ese nombre en este mercado' };
    const newId = _newBankId();
    data.banks[newId] = Object.assign({}, src, {
      id: newId,
      name: clean,
      objects: (src.objects || []).slice(),
      phrases: (src.phrases || []).slice(),
      updatedAt: new Date().toISOString()
    });
    if (!_saveNamedBanks(market, data)) return { ok: false, error: 'No se pudo guardar la copia: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true, id: newId };
  }

  function saveToPersonalBank(market, id, entries) {
    const data = _loadNamedBanks(market);
    const bank = data.banks[id];
    if (!bank) return { ok: false, error: 'el banco no existe' };
    const e = entries || {};
    let added = 0, duplicates = 0;
    [['objects', 4], ['phrases', 2]].forEach(function (pair) {
      const field = pair[0], minLen = pair[1];
      const current = Array.isArray(bank[field]) ? bank[field] : [];
      const sigs = new Set(current.map(_normBankEntry).filter(Boolean));
      (Array.isArray(e[field]) ? e[field] : []).forEach(function (line) {
        const value = String(line || '').trim();
        if (value.length < minLen) return;
        const sig = _normBankEntry(value);
        if (!sig || sigs.has(sig)) { duplicates++; return; }
        current.push(value);
        sigs.add(sig);
        added++;
      });
      bank[field] = current;
    });
    bank.updatedAt = new Date().toISOString();
    if (!_saveNamedBanks(market, data)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.', added: 0, duplicates: duplicates };
    return { ok: true, added: added, duplicates: duplicates };
  }

  function getActivePersonalBank(market, subniche) {
    const data = _loadNamedBanks(market);
    const ctx = subniche || COMMON_BANK_KEY;
    const id = data.active[ctx] || data.active[COMMON_BANK_KEY];
    if (!id || !data.banks[id]) return null;
    return data.banks[id];
  }

  function setActivePersonalBank(market, subniche, id) {
    const data = _loadNamedBanks(market);
    const ctx = subniche || COMMON_BANK_KEY;
    if (id && !data.banks[id]) return { ok: false, error: 'el banco no existe' };
    if (id) data.active[ctx] = id;
    else delete data.active[ctx];
    if (!_saveNamedBanks(market, data)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true };
  }

  /* ============================================================
     BANCO DE DIRECCIONES APROBADAS
     ============================================================ */

  function loadApprovedDirections() {
    return getJSON(memKey(['approvedDirections']), []) || [];
  }

  function saveApprovedDirections(list) {
    return setJSON(memKey(['approvedDirections']), (list || []).slice(-300));
  }

  function addApprovedDirection(record) {
    const list = loadApprovedDirections();

    const item = Object.assign(
      {
        id: 'dir_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        createdAt: new Date().toISOString()
      },
      record || {}
    );

    const exists = list.some(function (x) {
      return (
        x.market === item.market &&
        x.subniche === item.subniche &&
        x.product === item.product &&
        x.mode === item.mode &&
        x.field === item.field &&
        x.value === item.value
      );
    });

    if (exists) {
      return { saved: false, list: list };
    }

    list.unshift(item);
    saveApprovedDirections(list);

    return { saved: true, list: list };
  }

  function removeApprovedDirection(id) {
    const list = loadApprovedDirections().filter(function (x) {
      return x.id !== id;
    });
    saveApprovedDirections(list);
    return list;
  }

  /* ============================================================
     HISTORIAL DE SERIES Y OBJETOS USADOS
     ============================================================ */

  function makeHistoryKey(state) {
    state = state || {};
    return memKey([
      'history',
      state.market || 'global',
      state.subniche || 'auto',
      state.product || 'GENERIC',
      state.mode || 'new',
      String(state.serie || '').trim().toUpperCase(),
      String(state.concept || '').trim().toUpperCase()
    ]);
  }

  function loadSetHistory(key) {
    return getJSON(key, {
      history: [],
      usedObjects: [],
      prevPicks: null
    });
  }

  function saveSetHistory(key, data) {
    const safe = {
      history: (data.history || []).slice(-40),
      usedObjects: (data.usedObjects || []).slice(-250),
      prevPicks: data.prevPicks || null,
      updatedAt: new Date().toISOString()
    };
    return setJSON(key, safe);
  }

  function addUsedObjects(key, objects) {
    const data = loadSetHistory(key);
    const set = new Set(data.usedObjects || []);

    (objects || []).forEach(function (obj) {
      if (obj && typeof obj === 'string' && obj.indexOf('(') !== 0) {
        set.add(obj);
      }
    });

    data.usedObjects = Array.from(set).slice(-250);
    return saveSetHistory(key, data);
  }

  function clearSetHistory(key) {
    removeRaw(key);
  }

  /* ============================================================
     MEMORIA CREATIVA POR MERCADO Y PRODUCTO
     ============================================================ */

  function loadCreativeMemory(market, product) {
    return getJSON(memKey(['creative', market, product]), {
      archetypes: [],
      motifs: []
    });
  }

  function saveCreativeMemory(market, product, memory) {
    return setJSON(memKey(['creative', market, product]), {
      archetypes: (memory.archetypes || []).slice(-20),
      motifs: (memory.motifs || []).slice(-20),
      updatedAt: new Date().toISOString()
    });
  }

  function clearCreativeMemory(market, product) {
    removeRaw(memKey(['creative', market, product]));
  }

  /* ============================================================
     CONTADOR DE USO DE ESTILOS (cobertura de cola larga)
     Garantiza que los 49 estilos roten: los no usados suben prioridad.
     ============================================================ */

  function getStyleUsageCounter(market, product) {
    return getJSON(memKey(['styleUsage', market || 'global', product || 'all']), {}) || {};
  }

  function recordStyleUse(market, product, style) {
    if (!style) return;
    const key = memKey(['styleUsage', market || 'global', product || 'all']);
    const c = getJSON(key, {}) || {};
    c[style] = (c[style] || 0) + 1;
    // Decaimiento: los no usados suben prioridad relativa
    Object.keys(c).forEach(function (s) {
      c[s] = Math.max(0, c[s] - 0.1);
    });
    setJSON(key, c);
  }

  function clearStyleUsage(market, product) {
    removeRaw(memKey(['styleUsage', market || 'global', product || 'all']));
  }

  /* ============================================================
     BANCO DE TEMPLATES — Patrón repetido por producto
     Solo: MOCHILA, TOTE BAG, FUNDA MÓVIL.
     Cada template: { id, nombre, producto, imagen (dataURL), zonas, notas, updatedAt }.
     Zonas por defecto por producto; 'usar' | 'opcional' | 'excluir' | 'precaucion'.
     ============================================================ */

  const TEMPLATE_PRODUCTS = ['MOCHILA', 'TOTE BAG', 'FUNDA MÓVIL'];
  const TEMPLATE_MAX_IMAGE_BYTES = 700 * 1024;

  const TEMPLATE_DEFAULT_ZONES = {
    'MOCHILA': [
      { id: 'panel_frontal', label: 'Panel frontal', uso: 'usar' },
      { id: 'bolsillo', label: 'Bolsillo delantero', uso: 'usar' },
      { id: 'laterales', label: 'Laterales', uso: 'opcional' },
      { id: 'correas_herrajes', label: 'Correas y herrajes', uso: 'excluir' },
      { id: 'base', label: 'Base', uso: 'excluir' }
    ],
    'TOTE BAG': [
      { id: 'cara_frontal', label: 'Cara frontal', uso: 'usar' },
      { id: 'cara_trasera', label: 'Cara trasera', uso: 'usar' },
      { id: 'fuelle', label: 'Fuelle / laterales', uso: 'opcional' },
      { id: 'asas', label: 'Asas', uso: 'excluir' },
      { id: 'dobladillo', label: 'Dobladillo inferior', uso: 'excluir' }
    ],
    'FUNDA MÓVIL': [
      { id: 'area_total', label: 'Área total trasera', uso: 'usar' },
      { id: 'recorte_camara', label: 'Recorte de cámara', uso: 'excluir' },
      { id: 'bordes', label: 'Bordes curvos', uso: 'precaucion' },
      { id: 'botones', label: 'Botones laterales', uso: 'excluir' }
    ]
  };

  function _loadTemplateBank() {
    const raw = getJSON(memKey(['templateBank']), null);
    if (raw && raw.templates && raw.active) return raw;
    return { templates: {}, active: {} };
  }

  function _saveTemplateBank(bank) {
    return setJSON(memKey(['templateBank']), bank || { templates: {}, active: {} });
  }

  function _newTemplateId() {
    try {
      if (typeof Date !== 'undefined' && Date.now) {
        return 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      }
    } catch (e) {}
    return 'tpl_' + String(Math.floor(Math.random() * 1e9));
  }

  function listTemplates(product) {
    const bank = _loadTemplateBank();
    const all = Object.keys(bank.templates).map(function (id) { return bank.templates[id]; });
    const filtered = product ? all.filter(function (t) { return t.producto === product; }) : all;
    filtered.sort(function (a, b) { return String(a.nombre || '').localeCompare(String(b.nombre || '')); });
    return filtered;
  }

  function getTemplate(id) {
    if (!id) return null;
    const bank = _loadTemplateBank();
    return bank.templates[id] || null;
  }

  function saveTemplate(data) {
    const d = data || {};
    if (TEMPLATE_PRODUCTS.indexOf(d.producto) === -1) {
      return { ok: false, error: 'producto no admitido para templates (solo MOCHILA, TOTE BAG, FUNDA MÓVIL)' };
    }
    const nombre = String(d.nombre || '').trim();
    if (nombre.length < 2) return { ok: false, error: 'el template necesita un nombre (mínimo 2 caracteres)' };
    if (d.imagen && String(d.imagen).length > TEMPLATE_MAX_IMAGE_BYTES) {
      return { ok: false, error: 'imagen muy pesada (máx ~700KB tras reducir); usa una plantilla más liviana' };
    }
    const bank = _loadTemplateBank();
    const id = d.id && bank.templates[d.id] ? d.id : _newTemplateId();
    const prev = bank.templates[id] || {};
    bank.templates[id] = {
      id: id,
      nombre: nombre,
      producto: d.producto,
      imagen: d.imagen || prev.imagen || '',
      zonas: Array.isArray(d.zonas) && d.zonas.length ? d.zonas : (prev.zonas || defaultTemplateZones(d.producto)),
      notas: String(d.notas || prev.notas || ''),
      updatedAt: new Date().toISOString()
    };
    if (!_saveTemplateBank(bank)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true, id: id };
  }

  function renameTemplate(id, nombre) {
    const bank = _loadTemplateBank();
    if (!bank.templates[id]) return { ok: false, error: 'template no existe' };
    const clean = String(nombre || '').trim();
    if (clean.length < 2) return { ok: false, error: 'nombre muy corto' };
    bank.templates[id].nombre = clean;
    bank.templates[id].updatedAt = new Date().toISOString();
    if (!_saveTemplateBank(bank)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true };
  }

  function deleteTemplate(id) {
    const bank = _loadTemplateBank();
    if (!bank.templates[id]) return { ok: false, error: 'template no existe' };
    delete bank.templates[id];
    Object.keys(bank.active).forEach(function (p) {
      if (bank.active[p] === id) delete bank.active[p];
    });
    if (!_saveTemplateBank(bank)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true };
  }

  function defaultTemplateZones(product) {
    const z = TEMPLATE_DEFAULT_ZONES[product] || [];
    return z.map(function (x) { return { id: x.id, label: x.label, uso: x.uso }; });
  }

  function getActiveTemplate(product) {
    if (!product) return null;
    const bank = _loadTemplateBank();
    const id = bank.active[product];
    if (!id || !bank.templates[id]) return null;
    return bank.templates[id];
  }

  function setActiveTemplate(product, id) {
    if (TEMPLATE_PRODUCTS.indexOf(product) === -1) return { ok: false, error: 'producto no admitido' };
    const bank = _loadTemplateBank();
    if (id && !bank.templates[id]) return { ok: false, error: 'template no existe' };
    if (id) bank.active[product] = id;
    else delete bank.active[product];
    if (!_saveTemplateBank(bank)) return { ok: false, error: 'No se pudo guardar: el almacenamiento del navegador puede estar lleno.' };
    return { ok: true };
  }

  /* ============================================================
     EXPORT / IMPORT / FUSIÓN
     ============================================================ */

  function mergeArraysUnique(remoteArr, localArr) {
    const seen = {};
    const out = [];

    (remoteArr || [])
      .concat(localArr || [])
      .forEach(function (item) {
        const key =
          typeof item === 'string'
            ? item
            : JSON.stringify(item);

        if (!seen[key]) {
          seen[key] = true;
          out.push(item);
        }
      });

    return out;
  }

  function exportMemoryObject() {
    const out = {};
    listMemoryKeys().forEach(function (k) {
      out[k] = POD_LS.getItem(k);
    });
    return out;
  }

  function exportMemoryJSON() {
    return JSON.stringify(exportMemoryObject(), null, 2);
  }

  // Export/import de bancos en un solo archivo portátil. Conserva las claves
  // reales que ya entiende el motor (mercado -> subnicho -> arrays de strings)
  // y también los bancos nombrados, sin copiar el resto de la memoria del taller.
  function _isPersonalBankMemoryKey(key) {
    return /^POD2\|personalBanks?\|[^|]+$/.test(String(key || ''));
  }

  function _validatePersonalBankMemoryValue(key, raw) {
    let value;
    try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (e) { throw new Error('JSON interno inválido en ' + key); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Estructura de banco inválida en ' + key);
    if (String(key).indexOf('|personalBanks|') !== -1) {
      if (!value.banks || typeof value.banks !== 'object' || Array.isArray(value.banks)) throw new Error('Falta la colección de bancos nombrados en ' + key);
      Object.keys(value.banks).forEach(function (id) {
        const bank = value.banks[id];
        if (!bank || typeof bank !== 'object' || Array.isArray(bank)) throw new Error('Banco nombrado inválido: ' + id);
        ['objects', 'phrases'].forEach(function (field) {
          if (bank[field] !== undefined && (!Array.isArray(bank[field]) || !bank[field].every(function (x) { return typeof x === 'string'; }))) {
            throw new Error('Lista ' + field + ' inválida en ' + id);
          }
        });
      });
    } else {
      Object.keys(value).forEach(function (subniche) {
        if (!Array.isArray(value[subniche]) || !value[subniche].every(function (x) { return typeof x === 'string'; })) {
          throw new Error('Lista de objetos/frases inválida para ' + subniche + ' en ' + key);
        }
      });
    }
    return value;
  }

  function normalizeGeneratedBankOutput(input) {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('La salida del generador debe ser un objeto JSON.');
    const market = String(parsed.mercado || parsed.market || '').trim();
    const family = String(parsed.familia || parsed.family || '').trim();
    if (!market || !family) return null;
    const kind = String(parsed.tipo || parsed.type || 'ambos').toLowerCase();
    if (!['ambos', 'both', 'objetos', 'objects', 'frases', 'phrases'].includes(kind)) throw new Error('Tipo de banco no reconocido: ' + kind);
    let objects = parsed.objetos || parsed.objects || ((kind === 'objetos' || kind === 'objects') ? parsed.items : []);
    let phrases = parsed.frases || parsed.phrases || ((kind === 'frases' || kind === 'phrases') ? parsed.items : []);
    if (kind === 'objetos' || kind === 'objects') phrases = [];
    if (kind === 'frases' || kind === 'phrases') objects = [];
    if (!Array.isArray(objects) || !Array.isArray(phrases)
      || !objects.every(function (x) { return typeof x === 'string'; })
      || !phrases.every(function (x) { return typeof x === 'string'; })) {
      throw new Error('Objetos y frases deben ser listas de textos.');
    }
    return { market: market, family: family, objects: objects, phrases: phrases };
  }
  function exportPersonalBanksObject() {
    const data = {};
    listMemoryKeys().filter(_isPersonalBankMemoryKey).forEach(function (key) {
      const raw = POD_LS.getItem(key);
      if (raw !== null && raw !== undefined) data[key] = raw;
    });
    return {
      format: 'taller-pod-personal-banks',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: data
    };
  }

  function exportPersonalBanksJSON() {
    return JSON.stringify(exportPersonalBanksObject(), null, 2);
  }

  function importPersonalBanksJSON(input) {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('El archivo debe contener un objeto JSON.');
    if (parsed.format && (parsed.format !== 'taller-pod-personal-banks' || parsed.schemaVersion !== 1)) {
      throw new Error('Formato o versión de bancos no compatible.');
    }
    // También acepta la exportación antigua de memoria POD2, filtrando siempre
    // para no importar historial, locks ni preferencias.
    const source = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    const incoming = {};
    Object.keys(source).forEach(function (key) {
      if (!_isPersonalBankMemoryKey(key)) return;
      _validatePersonalBankMemoryValue(key, source[key]);
      incoming[key] = typeof source[key] === 'string' ? source[key] : JSON.stringify(source[key]);
    });
    const keys = Object.keys(incoming);
    if (!keys.length) throw new Error('No encontré bancos personales en este archivo. Acepto exportaciones POD2 del taller.');

    const current = {};
    listMemoryKeys().filter(_isPersonalBankMemoryKey).forEach(function (key) { current[key] = POD_LS.getItem(key); });
    const merged = mergeMemoryObjects(current, incoming);
    const writeKeys = Object.keys(merged).filter(_isPersonalBankMemoryKey);
    const previous = {};
    writeKeys.forEach(function (key) { previous[key] = POD_LS.getItem(key); });
    try {
      writeKeys.forEach(function (key) {
        _validatePersonalBankMemoryValue(key, merged[key]);
        if (POD_LS.setItem(key, merged[key]) !== true) throw new Error('No se pudo guardar ' + key + '; revisa el espacio del navegador.');
      });
    } catch (e) {
      // Si el almacenamiento se llena a mitad de una fusión, restaura el estado anterior.
      writeKeys.forEach(function (key) {
        if (previous[key] === null || previous[key] === undefined) POD_LS.removeItem(key);
        else POD_LS.setItem(key, previous[key]);
      });
      throw e;
    }

    const summary = { markets: [], namedBanks: 0, objects: 0, phrases: 0 };
    Object.keys(merged).filter(_isPersonalBankMemoryKey).forEach(function (key) {
      const match = key.match(/^POD2\|personalBanks?\|([^|]+)$/);
      if (match && summary.markets.indexOf(match[1]) === -1) summary.markets.push(match[1]);
      const value = _validatePersonalBankMemoryValue(key, merged[key]);
      if (key.indexOf('|personalBanks|') !== -1) {
        Object.keys(value.banks || {}).forEach(function (id) {
          summary.namedBanks++;
          summary.objects += (value.banks[id].objects || []).length;
          summary.phrases += (value.banks[id].phrases || []).length;
        });
      } else {
        Object.keys(value).forEach(function (subniche) {
          const isPhrase = subniche.indexOf('__phrase__') === 0;
          summary[isPhrase ? 'phrases' : 'objects'] += value[subniche].length;
        });
      }
    });
    summary.markets.sort();
    summary.keysMerged = keys.length;
    return { ok: true, importedKeys: keys.length, summary: summary };
  }
  function mergeMemoryObjects(local, remote) {
    local = local || {};
    remote = remote || {};

    const out = Object.assign({}, remote, local);

    Object.keys(out).forEach(function (k) {
      if (String(k).indexOf(MEM_PREFIX) !== 0) return;

      try {
        const a = local[k] ? JSON.parse(local[k]) : null;
        const b = remote[k] ? JSON.parse(remote[k]) : null;

        if (!a && !b) return;
        if (!a) {
          out[k] = remote[k];
          return;
        }
        if (!b) {
          out[k] = local[k];
          return;
        }

        if (k.indexOf('|personalBanks|') > -1) {
          const merged = { banks: {}, active: Object.assign({}, b.active || {}, a.active || {}) };
          const ids = Object.keys(b.banks || {}).concat(Object.keys(a.banks || {}));
          ids.forEach(function (id) {
            const rb = (b.banks || {})[id], lb = (a.banks || {})[id];
            if (!rb || !lb) { merged.banks[id] = lb || rb; return; }
            const remoteTime = Date.parse(rb.updatedAt || '') || 0;
            const localTime = Date.parse(lb.updatedAt || '') || 0;
            const latest = localTime >= remoteTime ? lb : rb;
            merged.banks[id] = Object.assign({}, rb, lb, {
              name: latest.name || lb.name || rb.name,
              subniche: latest.subniche || lb.subniche || rb.subniche,
              objects: mergeArraysUnique(rb.objects, lb.objects),
              phrases: mergeArraysUnique(rb.phrases, lb.phrases),
              updatedAt: latest.updatedAt || lb.updatedAt || rb.updatedAt
            });
          });
          out[k] = JSON.stringify(merged);
        } else if (k.indexOf('|templateBank') > -1) {
          const merged = { templates: {}, active: Object.assign({}, b.active || {}, a.active || {}) };
          const ids = Object.keys(b.templates || {}).concat(Object.keys(a.templates || {}));
          ids.forEach(function (id) {
            const rt = (b.templates || {})[id], lt = (a.templates || {})[id];
            if (!rt || !lt) { merged.templates[id] = lt || rt; return; }
            const remoteTime = Date.parse(rt.updatedAt || '') || 0;
            const localTime = Date.parse(lt.updatedAt || '') || 0;
            merged.templates[id] = Object.assign({}, rt, lt, localTime >= remoteTime ? lt : rt);
          });
          out[k] = JSON.stringify(merged);
        } else if (k.indexOf('|personalBank|') > -1) {
          const merged = {};
          const keys = Object.keys(b).concat(Object.keys(a));
          keys.forEach(function (id) { merged[id] = mergeArraysUnique(b[id], a[id]); });
          out[k] = JSON.stringify(merged);
        } else if (k.indexOf('|approvedDirections|') > -1) {
          out[k] = JSON.stringify(mergeArraysUnique(b, a).slice(-300));
        } else if (k.indexOf('|patterns|') > -1) {
          out[k] = JSON.stringify((b || []).concat(a || []).slice(-80));
        } else if (k.indexOf('|creative|') > -1) {
          out[k] = JSON.stringify({
            archetypes: mergeArraysUnique(b.archetypes, a.archetypes).slice(-20),
            motifs: mergeArraysUnique(b.motifs, a.motifs).slice(-20)
          });
        } else if (k.indexOf('|history|') > -1) {
          const merged = {
            history: mergeArraysUnique(b.history, a.history).slice(-40),
            usedObjects: mergeArraysUnique(b.usedObjects, a.usedObjects).slice(-250),
            prevPicks: a.prevPicks || b.prevPicks || null,
            updatedAt: a.updatedAt || new Date().toISOString()
          };
          out[k] = JSON.stringify(merged);
        }
      } catch (e) {
        // Si una clave no es JSON válido, se conserva la versión local.
      }
    });

    return out;
  }

  function importMemoryJSON(text, mode) {
    const data = JSON.parse(text);
    mode = mode || 'overwrite';

    if (mode === 'merge') {
      const local = exportMemoryObject();
      const merged = mergeMemoryObjects(local, data);

      Object.keys(merged).forEach(function (k) {
        POD_LS.setItem(k, merged[k]);
      });

      return {
        restored: Object.keys(merged).length,
        merged: true
      };
    }

    let count = 0;

    Object.keys(data).forEach(function (k) {
      if (String(k).indexOf(MEM_PREFIX) === 0) {
        POD_LS.setItem(k, data[k]);
        count += 1;
      }
    });

    return {
      restored: count,
      merged: false
    };
  }

  function downloadMemoryFile(filename) {
    try {
      const text = exportMemoryJSON();
      const blob = new Blob([text], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || 'taller-pod-memoria.json';
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
      }, 800);
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAllMemory() {
    listMemoryKeys().forEach(function (k) {
      POD_LS.removeItem(k);
    });
  }

  /* ============================================================
     IMPORTANCIA / EXPORTACION DE BANCOS DE MOTIVOS ENRIQUECIDOS
     Formato: taller-pod-motif-candidates (schemaVersion 1).
     El motor consume arrays de strings; los registros enriquecidos
     conservan motivo, idea_comunicada, tensiones, contextos,
     justificacion y riesgo_cliche hasta el punto de seleccion.
     ============================================================ */

  const ENRICHED_BANK_FORMAT_VERSION = 1;

  function validateEnrichedBankFormat(texto) {
    try {
      const parsed = JSON.parse(texto);
      if (!parsed || typeof parsed !== "object") {
        return { ok: false, error: "JSON invalido" };
      }
      if (parsed.format !== "taller-pod-motif-candidates") {
        return { ok: false, error: "Formato JSON no reconocido" };
      }
      if (typeof parsed.schemaVersion !== "number" || parsed.schemaVersion < 1) {
        return { ok: false, error: "Version de esquema no compatible" };
      }
      if (typeof parsed.mercado !== "string" || !parsed.mercado) {
        return { ok: false, error: "ID de mercado requerido" };
      }
      if (typeof parsed.registros !== "object" || !Array.isArray(parsed.registros)) {
        return { ok: false, error: "registros debe ser un array" };
      }
      return { ok: true, data: parsed };
    } catch (e) {
      return { ok: false, error: "JSON invalido: " + e.message };
    }
  }

  function validateMotifRegistro(registro, fila) {
    if (!registro || typeof registro !== "object") {
      return { ok: false, error: "Registro invalido: debe ser un objeto" };
    }
    const errores = [];
    if (typeof registro.id !== "string" || !registro.id.trim()) {
      errores.push("id requerido y no vacio");
    }
    if (typeof registro.motivo !== "string" || !registro.motivo.trim()) {
      errores.push("motivo requerido y no vacio");
    }
    if (typeof registro.idea_comunicada !== "string" || !registro.idea_comunicada.trim()) {
      errores.push("idea_comunicada requerido y no vacio");
    }
    if (!Array.isArray(registro.tensiones) || !registro.tensiones.length) {
      errores.push("tensiones debe ser un array no vacio");
    }
    if (!Array.isArray(registro.contextos) || !registro.contextos.length) {
      errores.push("contextos debe ser un array no vacio");
    }
    if (typeof registro.justificacion !== "string" || !registro.justificacion.trim()) {
      errores.push("justificacion requerido y no vacio");
    }
    if (!["bajo", "medio", "alto"].includes(registro.riesgo_cliche)) {
      errores.push("riesgo_cliche debe ser uno de: bajo, medio, alto");
    }
    if (errores.length) {
      return { ok: false, error: "Registro " + (fila + 1) + " (" + registro.id + "): " + errores.join(", ") };
    }
    return { ok: true };
  }

  function mergeEnrichedBankData(existingBank, subniche, nuevosRegistros) {
    const targetKey = "__concept__" + (subniche || "comun");
    const bank = existingBank || {};
    const current = Array.isArray(bank[targetKey]) ? bank[targetKey] : [];
    const byId = {};
    current.forEach(function (item) {
      const id = (item && typeof item === "object") ? item.id : item;
      if (id) byId[id] = item;
    });
    const added = [];
    const updated = [];
    const duplicates = [];
    const rejected = [];
    for (let i = 0; i < nuevosRegistros.length; i++) {
      const reg = nuevosRegistros[i];
      const validation = validateMotifRegistro(reg, i);
      if (!validation.ok) {
        rejected.push({ fila: i + 1, id: reg.id, error: validation.error });
        continue;
      }
      const existing = byId[reg.id];
      if (existing) {
        duplicates.push({ id: reg.id, accion: "existente" });
        existing.motivo = reg.motivo;
        existing.idea_comunicada = reg.idea_comunicada;
        existing.tensiones = reg.tensiones;
        existing.contextos = reg.contextos;
        existing.justificacion = reg.justificacion;
        existing.riesgo_cliche = reg.riesgo_cliche;
        updated.push(reg.id);
        continue;
      }
      added.push(reg.id);
      current.push(reg);
      byId[reg.id] = reg;
    }
    const merged = Object.assign({}, bank);
    merged[targetKey] = current;
    return {
      ok: true,
      bank: merged,
      stats: { added: added, updated: updated, duplicates: duplicates, rejected: rejected }
    };
  }

  function importarMotivosEnriquecidos(texto, mercado, subniche, marcarActivos) {
    const validacion = validateEnrichedBankFormat(texto);
    if (!validacion.ok) {
      return { ok: false, error: validacion.error, stats: { added: [], updated: [], duplicates: [], rejected: [{ fila: 0, id: "", error: validacion.error }] } };
    }
    const datos = validacion.data;
    if (datos.mercado !== mercado) {
      return { ok: false, error: "mercado del JSON no coincide con el mercado especificado", stats: { added: [], updated: [], duplicates: [], rejected: [] } };
    }
    const existingBank = loadPersonalBank(mercado);
    const contexto = subniche || "comun";
    const fusion = mergeEnrichedBankData(existingBank, contexto, datos.registros);
    if (fusion.stats.rejected.length > 0) {
      return { ok: false, error: "El lote contiene registros invalidos; no se modifico ningun dato", stats: fusion.stats };
    }
    const saved = savePersonalBank(mercado, fusion.bank);
    if (!saved) {
      return { ok: false, error: "No se pudo guardar el banco de datos enriquecido", stats: fusion.stats };
    }
    const stats = fusion.stats;
    const nuevosActivos = stats.added.concat(stats.updated);
    if (marcarActivos) {
      const key = "__concept__" + contexto;
      if (Array.isArray(fusion.bank[key])) {
        fusion.bank[key].forEach(function (item) {
          if (typeof item === "object") nuevosActivos.push(item.id);
        });
      }
    }
    return { ok: true, stats: stats, activos: nuevosActivos };
  }

  /* ============================================================
     BANDEJA DE PROPUESTAS DE BANCO (cola de revision)
     Propuestas de concepto / frase / objeto para revision.
     Nunca se guarda sin accion explicita del usuario.
     ============================================================ */

  const PROPOSED_BANK_KEY = "__propuestas_banco_global__";

  function getPropuestasBanco() {
    const bank = loadPersonalBank("global");
    const list = Array.isArray(bank[PROPOSED_BANK_KEY]) ? bank[PROPOSED_BANK_KEY] : [];
    return list;
  }

  function guardarPropuestasBanco(list) {
    const bank = loadPersonalBank("global");
    bank[PROPOSED_BANK_KEY] = (list || []).slice();
    return savePersonalBank("global", bank);
  }

  function proponerEnBanco(tipo, texto, metadatos) {
    const item = {
      id: "prop_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
      tipo: tipo,
      texto: String(texto || "").trim(),
      origen: "banco",
      mercado: (metadatos && metadatos.mercado) || "global",
      subniche: (metadatos && metadatos.subniche) || "comun",
      motivo: (metadatos && metadatos.motivo) || "",
      idea: (metadatos && metadatos.idea) || "",
      tensiones: (metadatos && metadatos.tensiones) || [],
      contextos: (metadatos && metadatos.contextos) || [],
      riesgo_cliche: (metadatos && metadatos.riesgo_cliche) || "bajo",
      estado: "pendiente",
      creadaEn: new Date().toISOString()
    };
    const list = getPropuestasBanco();
    list.push(item);
    guardarPropuestasBanco(list);
    return item;
  }

  function descartarPropuestaBanco(id) {
    const list = getPropuestasBanco().filter(function (p) { return p.id !== id; });
    guardarPropuestasBanco(list);
    return { ok: true, restantes: list.length };
  }

  function aceptarPropuestaBanco(id) {
    const list = getPropuestasBanco();
    const item = list.filter(function (p) { return p.id === id; })[0];
    if (!item) return { ok: false, error: "propuesta-no-encontrada" };
    let res = { ok: false, error: "tipo-no-soportado" };
    if (item.tipo === "concepto") {
      res = addPersonalConcept(item.mercado, item.subniche, item.texto);
    } else if (item.tipo === "frase" || item.tipo === "objeto") {
      res = addPersonalObjects(item.mercado, item.subniche, [item.texto]);
    }
    const restantes = list.filter(function (p) { return p.id !== id; });
    guardarPropuestasBanco(restantes);
    return { ok: true, aceptada: true, res: res, restantes: restantes.length };
  }

  function proponerConceptoDesdeBanco(market, subniche) {
    const conceptos = getPersonalConcepts(market, subniche).filter(Boolean);
    if (!conceptos.length) return { ok: false, error: "sin-conceptos" };
    const c = conceptos[Math.floor(Math.random() * conceptos.length)];
    const texto = (c && typeof c === "object") ? String(c.motivo || c.idea_comunicada || c.idea || "") : String(c || "");
    const metas = { mercado: market, subniche: subniche || "comun", motivo: texto, idea: (c && typeof c === "object") ? String(c.idea_comunicada || "") : "", tensiones: (c && typeof c === "object") ? (c.tensiones || []) : [], contextos: (c && typeof c === "object") ? (c.contextos || []) : [], riesgo_cliche: (c && typeof c === "object") ? (c.riesgo_cliche || "bajo") : "bajo" };
    return proponerEnBanco("concepto", texto, metas);
  }

  function proponerObjetoDesdeBanco(market, subniche) {
    const objs = getPersonalObjects(market, subniche).filter(Boolean);
    if (!objs.length) return { ok: false, error: "sin-objetos" };
    const o = objs[Math.floor(Math.random() * objs.length)];
    const texto = String((o && typeof o === "object") ? (o.motivo || o.idea || o.texto || "") : o || "");
    return proponerEnBanco("objeto", texto, { mercado: market, subniche: subniche || "comun", motivo: texto, idea: texto, riesgo_cliche: "bajo" });
  }

  function proponerFraseDesdeBanco(market, subniche) {
    const frases = getPersonalPhrases(market, subniche).filter(Boolean);
    if (!frases.length) return { ok: false, error: "sin-frases" };
    const f = frases[Math.floor(Math.random() * frases.length)];
    const texto = String((f && typeof f === "object") ? (f.motivo || f.idea || f.texto || f) : f || "");
    return proponerEnBanco("frase", texto, { mercado: market, subniche: subniche || "comun", motivo: texto, idea: texto, riesgo_cliche: "bajo" });
  }

  /* ============================================================
     EXPOSICIÓN GLOBAL
     ============================================================ */

  window.POD_LS = POD_LS;

  window.safeAsk = safeAsk;
  window.safeTell = safeTell;
  window.confirmDestructive = confirmDestructive;

  window.memKey = memKey;
  window.getRaw = getRaw;
  window.setRaw = setRaw;
  window.removeRaw = removeRaw;
  window.getJSON = getJSON;
  window.setJSON = setJSON;
  window.listMemoryKeys = listMemoryKeys;

  window.getPatternConfig = getPatternConfig;
  window.savePatternConfig = savePatternConfig;

  window.PATTERN_AXES = PATTERN_AXES;
  window.normalizePattern = normalizePattern;
  window.countEqualAxes = countEqualAxes;
  window.loadPatternMemory = loadPatternMemory;
  window.savePatternMemory = savePatternMemory;
  window.findPatternConflicts = findPatternConflicts;
  window.recordPattern = recordPattern;
  window.clearPatternMemory = clearPatternMemory;

  window.defaultLocks = defaultLocks;
  window.loadLocks = loadLocks;
  window.saveLocks = saveLocks;
  window.setLockValue = setLockValue;
  window.clearLocks = clearLocks;

  window.COMMON_BANK_KEY = COMMON_BANK_KEY;
  window.loadPersonalBank = loadPersonalBank;
  window.savePersonalBank = savePersonalBank;
  window.getPersonalObjects = getPersonalObjects;
  window.getPersonalPhrases = getPersonalPhrases;
  window.addPersonalObjects = addPersonalObjects;
  window.removePersonalBank = removePersonalBank;
  window.getPersonalConcepts = getPersonalConcepts;
  window.useBankConcept = useBankConcept;
  window.addPersonalConcept = addPersonalConcept;

  window.createPersonalBank = createPersonalBank;
  window.listPersonalBanks = listPersonalBanks;
  window.getPersonalBank = getPersonalBank;
  window.renamePersonalBank = renamePersonalBank;
  window.deletePersonalBank = deletePersonalBank;
  window.clonePersonalBank = clonePersonalBank;
  window.saveToPersonalBank = saveToPersonalBank;
  window.getActivePersonalBank = getActivePersonalBank;
  window.setActivePersonalBank = setActivePersonalBank;

  window.loadApprovedDirections = loadApprovedDirections;
  window.saveApprovedDirections = saveApprovedDirections;
  window.addApprovedDirection = addApprovedDirection;
  window.removeApprovedDirection = removeApprovedDirection;

  window.makeHistoryKey = makeHistoryKey;
  window.loadSetHistory = loadSetHistory;
  window.saveSetHistory = saveSetHistory;
  window.addUsedObjects = addUsedObjects;
  window.clearSetHistory = clearSetHistory;

  window.loadCreativeMemory = loadCreativeMemory;
  window.saveCreativeMemory = saveCreativeMemory;
  window.clearCreativeMemory = clearCreativeMemory;

  window.getStyleUsageCounter = getStyleUsageCounter;
  window.recordStyleUse = recordStyleUse;
  window.clearStyleUsage = clearStyleUsage;

  window.TEMPLATE_PRODUCTS = TEMPLATE_PRODUCTS;
  window.TEMPLATE_DEFAULT_ZONES = TEMPLATE_DEFAULT_ZONES;
  window.listTemplates = listTemplates;
  window.getTemplate = getTemplate;
  window.saveTemplate = saveTemplate;
  window.renameTemplate = renameTemplate;
  window.deleteTemplate = deleteTemplate;
  window.defaultTemplateZones = defaultTemplateZones;
  window.getActiveTemplate = getActiveTemplate;
  window.setActiveTemplate = setActiveTemplate;

  window.mergeArraysUnique = mergeArraysUnique;
  window.exportMemoryObject = exportMemoryObject;
  window.exportMemoryJSON = exportMemoryJSON;  window.normalizeGeneratedBankOutput = normalizeGeneratedBankOutput;
  window.exportPersonalBanksObject = exportPersonalBanksObject;
  window.exportPersonalBanksJSON = exportPersonalBanksJSON;
  window.importPersonalBanksJSON = importPersonalBanksJSON;
  window.mergeMemoryObjects = mergeMemoryObjects;
  window.importMemoryJSON = importMemoryJSON;
  window.downloadMemoryFile = downloadMemoryFile;
  window.clearAllMemory = clearAllMemory;

  window.MEMORIA_LOCAL_VERSION = '1.0.0';
  window.ENRICHED_BANK_FORMAT_VERSION = ENRICHED_BANK_FORMAT_VERSION;
  window.validateEnrichedBankFormat = validateEnrichedBankFormat;
  window.validateMotifRegistro = validateMotifRegistro;
  window.mergeEnrichedBankData = mergeEnrichedBankData;
  window.importarMotivosEnriquecidos = importarMotivosEnriquecidos;
  window.getPropuestasBanco = getPropuestasBanco;
  window.proponerEnBanco = proponerEnBanco;
  window.descartarPropuestaBanco = descartarPropuestaBanco;
  window.aceptarPropuestaBanco = aceptarPropuestaBanco;
  window.proponerConceptoDesdeBanco = proponerConceptoDesdeBanco;
  window.proponerObjetoDesdeBanco = proponerObjetoDesdeBanco;
  window.proponerFraseDesdeBanco = proponerFraseDesdeBanco;
})();