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
['data-mercados.js', 'data-audiencias.js', 'data-bancos.js', 'banco-global.js', 'data-estilos.js', 'dominios.js', 'data-productos.js', 'memoria-local.js', 'motor-nucleo.js'].forEach(function (file) {
  vm.runInThisContext(fs.readFileSync(path.join(JS, file), 'utf8'), { filename: file });
});
const marketAudienceResolver = global.getAudiencesForSubniche;
ok(typeof marketAudienceResolver === 'function', 'data-audiencias registra el resolver de audiencias');
// banco-global se carga después y declara audienciasGenericas para los bancos globales.
ok(global.getAudiencesForSubniche === marketAudienceResolver, 'data-bancos no sobrescribe el resolver demográfico del mercado');
ok(typeof global.getBankAudiencesForSubniche === 'function', 'el resolver de compatibilidad del banco tiene nombre propio');
const colombiaPool = global.getAudiencesForSubniche('humor_costeno', 'todas', 'colombia');
ok(colombiaPool.length === 5, 'los bancos locales conservan su lista demográfica específica');
const globalPool = global.getAudiencesForSubniche('pets', 'global', 'global_en');
ok(globalPool.length > 0 && globalPool.every(function (id) { return id === 'global_family_en' || id === 'global_young_en' || id === 'global_adult_en'; }),
  'los bancos globales no mezclan audiencias EN/ES ni restringen a seis perfiles genéricos');
ok(globalPool.indexOf('global_family_en') !== -1, 'el subnicho pets conserva audiencia familiar global EN');
ok(globalPool.every(function (id) { return !!global.AUD_PROFILES[id]; }), 'el pool demográfico solo contiene perfiles declarados');
console.log((failures.length ? 'FAIL' : 'PASS') + ' redteam-audience-collision (' + checks + ' comprobaciones, ' + failures.length + ' fallos)');
failures.forEach(function (failure) { console.error(' - ' + failure); });
process.exit(failures.length ? 1 : 0);
