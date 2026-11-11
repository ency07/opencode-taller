'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(value, message) { checks++; if (!value) failures.push(message); }
global.window = global;
global.document = {
  readyState: 'loading',
  getElementById: function () { return null; },
  addEventListener: function () {}
};
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/ia-validador.js'), 'utf8'), { filename: 'ia-validador.js' });
const api = global.PODValidador;
const objectVerdict = {
  fichas: [{ ficha: '01A' }, { ficha: '01B' }, { ficha: '01C' }],
  resumen: 'respuesta ya parseada'
};
ok(api && typeof api.parseVerdict === 'function', 'parseVerdict está disponible');
ok(api.parseVerdict(objectVerdict) === objectVerdict, 'un objeto ya parseado se conserva sin String(object)');
ok(api.parseVerdict(JSON.stringify(objectVerdict)).fichas.length === 3, 'una cadena JSON válida se convierte en veredicto');
ok(api.parseVerdict(String.fromCharCode(96,96,96) + 'json\n' + JSON.stringify(objectVerdict) + '\n' + String.fromCharCode(96,96,96)).resumen === objectVerdict.resumen,
  'JSON dentro de cercas Markdown se acepta');
ok(api.parseVerdict({ fichas: [{ ficha: '01A' }] }) === null, 'un objeto incompleto se rechaza');
ok(api.parseVerdict('[object Object]') === null, 'la representación [object Object] no se acepta como JSON');
console.log((failures.length ? 'FAIL' : 'PASS') + ' redteam-ai-verdict (' + checks + ' comprobaciones, ' + failures.length + ' fallos)');
failures.forEach(function (failure) { console.error(' - ' + failure); });
process.exit(failures.length ? 1 : 0);
