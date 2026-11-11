'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(value, message) { checks++; if (!value) failures.push(message); }

const storage = {};
global.window = global;
global.localStorage = {
  setItem: function (k, v) { storage[k] = String(v); },
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
  removeItem: function (k) { delete storage[k]; },
  key: function (i) { return Object.keys(storage)[i] || null; },
  clear: function () { Object.keys(storage).forEach(function (k) { delete storage[k]; }); }
};
global.document = { getElementById: function () { return null; }, addEventListener: function () {} };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/memoria-local.js'), 'utf8'), { filename: 'memoria-local.js' });

const key = 'POD2|locks|colombia|CAMISETA SOFT';
const metaKey = global.SYNC_META_KEY;
POD_LS.setItem(key, JSON.stringify({ value: 'old' }));
ok(JSON.parse(POD_LS.getItem(metaKey))[key].op === 'set', 'una escritura registra metadato op=set');
POD_LS.removeItem(key);
ok(POD_LS.getItem(key) === null, 'removeItem elimina el valor local');
const localDeleted = exportMemoryObject();
ok(JSON.parse(localDeleted[metaKey])[key].op === 'delete', 'removeItem registra tombstone de eliminación');

const remoteOld = {
  [key]: JSON.stringify({ value: 'remote-old' }),
  [metaKey]: JSON.stringify({ [key]: { op: 'set', at: '2026-11-10T10:00:00.000Z' } })
};
const mergedDeleted = mergeMemoryObjects(localDeleted, remoteOld);
ok(!Object.prototype.hasOwnProperty.call(mergedDeleted, key), 'una eliminación local vence al valor remoto anterior');
ok(JSON.parse(mergedDeleted[metaKey])[key].op === 'delete', 'la fusión conserva el tombstone para propagarlo');

const remoteDeleted = {
  [metaKey]: JSON.stringify({ [key]: { op: 'delete', at: '2026-11-10T10:00:00.000Z' } })
};
const localRecreated = {
  [key]: JSON.stringify({ value: 'new-after-delete' }),
  [metaKey]: JSON.stringify({ [key]: { op: 'set', at: '2026-11-11T10:00:00.000Z' } })
};
const mergedRecreated = mergeMemoryObjects(localRecreated, remoteDeleted);
ok(!!mergedRecreated[key] && JSON.parse(mergedRecreated[key]).value === 'new-after-delete',
  'una recreación posterior vence a un tombstone anterior sin resucitar el valor viejo');
ok(JSON.parse(mergedRecreated[metaKey])[key].op === 'set', 'la recreación posterior actualiza el metadato');

const applyKey = 'POD2|history|global_en|CAMISETA SOFT';
POD_LS.setItem(applyKey, 'stale');
const applyPayload = { [metaKey]: JSON.stringify({ [applyKey]: { op: 'delete', at: '2026-11-11T11:00:00.000Z' } }) };
applyMergedMemoryObject(applyPayload);
ok(POD_LS.getItem(applyKey) === null, 'applyMergedMemoryObject elimina localmente claves tombstoned');
ok(JSON.parse(POD_LS.getItem(metaKey))[applyKey].op === 'delete', 'la aplicación conserva el metadato remoto');

console.log((failures.length ? 'FAIL' : 'PASS') + ' redteam-tombstones (' + checks + ' comprobaciones, ' + failures.length + ' fallos)');
failures.forEach(function (failure) { console.error(' - ' + failure); });
process.exit(failures.length ? 1 : 0);
