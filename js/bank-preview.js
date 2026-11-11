/* Safe DOM renderer and selection mapping for enriched bank previews.
   Untrusted JSON values are always rendered as text, never parsed as HTML. */
(function (root) {
  'use strict';

  function makeNode(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function renderMessage(container, message) {
    if (!container) return;
    container.textContent = '';
    container.appendChild(makeNode('span', 'badge', message));
  }

  function render(container, payload) {
    if (!container) return;
    container.textContent = '';
    if (!payload || !payload.ok) {
      renderMessage(container, (payload && payload.error) || 'Sin datos para previsualizar. Pega un lote JSON válido.');
      return;
    }

    var validos = Array.isArray(payload.validos) ? payload.validos : [];
    var rechazados = Array.isArray(payload.rechazados) ? payload.rechazados : [];
    var summary = makeNode('div', '');
    summary.style.marginBottom = '8px';
    summary.appendChild(makeNode('span', 'badge', validos.length + ' registros válidos'));
    summary.appendChild(document.createTextNode(' '));
    summary.appendChild(makeNode('span', 'badge', rechazados.length + ' rechazados'));
    container.appendChild(summary);

    if (!validos.length) {
      container.appendChild(makeNode('div', 'hint', 'Ningún registro del lote completo pasó la validación.'));
      return;
    }

    var list = makeNode('div', '');
    list.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-height:220px;overflow:auto;';
    validos.forEach(function (entry, index) {
      var record = entry && entry.record ? entry.record : (entry || {});
      var sourceIndex = entry && Number.isInteger(entry.sourceIndex) ? entry.sourceIndex : index;
      var label = makeNode('label', '');
      label.style.cssText = 'display:flex;gap:8px;align-items:baseline;';
      var checkbox = makeNode('input', '');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('data-fila', String(sourceIndex));
      checkbox.value = String(record.id || '');
      label.appendChild(checkbox);

      var strong = makeNode('strong', '', record.id || '');
      var details = makeNode('span', '');
      details.appendChild(strong);
      details.appendChild(document.createTextNode(' — ' + String(record.motivo || '')
        + ' | ' + String(record.idea_comunicada || '')
        + ' | tensiones: ' + (Array.isArray(record.tensiones) ? record.tensiones : []).join(', ')
        + ' | contextos: ' + (Array.isArray(record.contextos) ? record.contextos : []).join(', ')
        + ' | riesgo: ' + String(record.riesgo_cliche || '')));
      label.appendChild(details);
      list.appendChild(label);
    });
    container.appendChild(list);
  }

  function selectRecords(records, indices) {
    if (!Array.isArray(records) || !Array.isArray(indices)) return [];
    var seen = Object.create(null);
    var selected = [];
    indices.forEach(function (raw) {
      var index = Number(raw);
      if (!Number.isInteger(index) || index < 0 || index >= records.length || seen[index]) return;
      seen[index] = true;
      selected.push(records[index]);
    });
    return selected;
  }

  var api = { render: render, renderMessage: renderMessage, selectRecords: selectRecords };
  if (root) root.PODBankPreview = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : null);
