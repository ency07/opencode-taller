/* Regresión del token de concurrencia de sincronización.
   updated_at debe avanzar al menos 1 ms respecto a la versión leída, incluso
   si Date.now() devuelve el mismo milisegundo.
   Ejecutar: node tests/sync-cas.test.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'sync-supabase.js'), 'utf8');
const match = source.match(/function nextSyncTimestamp\(previous, nowMs\) \{[\s\S]*?\n  \}/);
if (!match) {
  console.error('FAIL sync-cas: no existe nextSyncTimestamp');
  process.exit(1);
}

const nextSyncTimestamp = vm.runInNewContext('(' + match[0].replace(/^function nextSyncTimestamp/, 'function') + ')');
let checks = 0;
const failures = [];
function ok(condition, message) {
  checks++;
  if (!condition) failures.push(message);
}

const previous = '2026-11-14T20:00:00.123Z';
const sameMillisecond = nextSyncTimestamp(previous, Date.parse(previous));
ok(sameMillisecond === '2026-11-14T20:00:00.124Z',
  'si el reloj coincide con updated_at, el token debe avanzar 1 ms');

const olderClock = nextSyncTimestamp(previous, Date.parse(previous) - 5000);
ok(olderClock === '2026-11-14T20:00:00.124Z',
  'si el reloj local va atrasado, el token debe seguir siendo posterior al remoto');

const newerClock = nextSyncTimestamp(previous, Date.parse(previous) + 5000);
ok(newerClock === '2026-11-14T20:00:05.123Z',
  'si el reloj ya avanzó, debe conservarse la hora actual');

const noPrevious = nextSyncTimestamp(null, Date.parse('2026-11-14T20:00:00.000Z'));
ok(noPrevious === '2026-11-14T20:00:00.000Z',
  'primera sincronización sin updated_at debe usar el reloj actual');

const invalidPrevious = nextSyncTimestamp('not-a-date', Date.parse('2026-11-14T20:00:00.000Z'));
ok(invalidPrevious === '2026-11-14T20:00:00.000Z',
  'updated_at inválido no debe bloquear la sincronización');

ok(/updated_at: nextSyncTimestamp\(q\.data && q\.data\.updated_at\)/.test(source),
  'mergeAndSync debe utilizar el token monotónico');

if (failures.length) {
  console.error('FAIL sync-cas (' + checks + ' aserciones, ' + failures.length + ' fallos)');
  failures.forEach(function (f) { console.error(' - ' + f); });
  process.exit(1);
}
console.log('PASS sync-cas (' + checks + ' aserciones, 0 fallos)');
