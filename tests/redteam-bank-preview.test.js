'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(value, message) { checks++; if (!value) failures.push(message); }

function element(tag) {
  return {
    tagName: tag,
    className: '',
    textContent: '',
    value: '',
    style: {},
    attributes: {},
    children: [],
    setAttribute: function (key, value) { this.attributes[key] = String(value); },
    appendChild: function (child) { this.children.push(child); return child; }
  };
}
global.window = global;
global.document = {
  createElement: element,
  createTextNode: function (text) { return { nodeType: 3, textContent: String(text) }; }
};
const source = fs.readFileSync(path.join(ROOT, 'js/bank-preview.js'), 'utf8');
vm.runInThisContext(source, { filename: 'bank-preview.js' });
const api = global.PODBankPreview;
ok(!!api && typeof api.render === 'function', 'el renderer seguro se expone');
ok(typeof api.selectRecords === 'function', 'el mapeador de selección se expone');

const hostile = '<img src=x onerror=alert(1)><svg/onload=alert(2)>';
const root = element('div');
api.render(root, { ok: false, error: hostile });
ok(root.children.length === 1 && root.children[0].textContent === hostile, 'errores hostiles se insertan como texto');
ok(!root.children.some(function (n) { return n.tagName === 'img' || n.tagName === 'svg'; }), 'un error no crea elementos ejecutables');

const records = [
  { id: 'bad-0', motivo: '<script>alert(1)</script>' },
  { id: 'good-1', motivo: hostile, idea_comunicada: '<b>idea</b>', tensiones: ['<iframe>'], contextos: ['<img>'], riesgo_cliche: hostile },
  { id: 'good-2', motivo: 'texto válido' }
];
const preview = element('div');
api.render(preview, {
  ok: true,
  validos: [{ record: records[1], sourceIndex: 1 }, { record: records[2], sourceIndex: 2 }],
  rechazados: ['registro rechazado']
});
const list = preview.children[1];
const firstLabel = list.children[0];
const checkbox = firstLabel.children[0];
const detail = firstLabel.children[1];
ok(checkbox.attributes['data-fila'] === '1', 'el checkbox conserva el índice original del registro válido');
ok(detail.children[0].textContent === 'good-1', 'el ID se representa con textContent');
ok(detail.children[1].textContent.indexOf(hostile) !== -1, 'campos hostiles del banco se muestran como texto');
ok(!detail.children.some(function (n) { return /script|img|svg|iframe/i.test(n.tagName || '') && n.tagName !== 'strong'; }), 'el contenido del banco no crea nodos HTML');
ok(preview.children[0].children[1].textContent === '1 rechazados', 'el contador de rechazados recibe la propiedad correcta');

const selected = api.selectRecords(records, [1, 2, 1, -1, 999, 'no']);
ok(selected.length === 2 && selected[0] === records[1] && selected[1] === records[2], 'la importación usa índices originales, elimina duplicados e ignora índices inválidos');
ok(api.selectRecords(records, []).length === 0, 'selección vacía no importa registros');

console.log((failures.length ? 'FAIL' : 'PASS') + ' redteam-bank-preview (' + checks + ' comprobaciones, ' + failures.length + ' fallos)');
failures.forEach(function (failure) { console.error(' - ' + failure); });
process.exit(failures.length ? 1 : 0);
