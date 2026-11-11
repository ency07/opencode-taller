'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(value, message) { checks++; if (!value) failures.push(message); }
global.window = global;
global.document = { getElementById: function () { return null; }, addEventListener: function () {} };
const JS = path.join(ROOT, 'js');
['data-mercados.js', 'data-audiencias.js'].forEach(function (file) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, file), 'utf8'), { filename: file });
});
const marketAudienceResolver = global.getAudiencesForSubniche;
ok(typeof marketAudienceResolver === 'function', 'data-audiencias registra el resolver de audiencias');
vm.runInThisContext(fs.readFileSync(path.join(JS, 'data-bancos.js'), 'utf8'), { filename: 'data-bancos.js' });
ok(global.getAudiencesForSubniche === marketAudienceResolver, 'data-bancos no sobrescribe el resolver demográfico del mercado');
ok(typeof global.getBankAudiencesForSubniche === 'function', 'el resolver de compatibilidad del banco tiene nombre propio');
const globalPool = global.getAudiencesForSubniche('pets', 'global', 'global_en');
ok(globalPool.indexOf('global_family_en') !== -1 && globalPool.indexOf('global_young_en') !== -1,
  'el resolver mantiene perfiles compatibles del mercado global EN');
ok(globalPool.every(function (id) { return !!global.AUD_PROFILES[id]; }), 'el pool demográfico solo contiene perfiles declarados');
console.log((failures.length ? 'FAIL' : 'PASS') + ' redteam-audience-collision (' + checks + ' comprobaciones, ' + failures.length + ' fallos)');
failures.forEach(function (failure) { console.error(' - ' + failure); });
process.exit(failures.length ? 1 : 0);
