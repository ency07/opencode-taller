/* Test de config Supabase por defecto: URL + anon key van en código
   (públicas por diseño) para que cada dispositivo solo pida correo+clave.
   El panel puede sobrescribirlas; si se vacían, se vuelve al default.

   Ejecutar:  node tests/supabase-cfg.test.js */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const failures = [];
function ok(cond, msg) { checks++; if (!cond) failures.push(msg); }

const src = fs.readFileSync(path.join(ROOT, 'js', 'sync-supabase.js'), 'utf8');

ok(/var DEFAULT_CFG = \{/.test(src), 'falta DEFAULT_CFG en sync-supabase.js');
ok(/url: 'https:\/\/[a-z0-9-]+\.supabase\.co'/.test(src), 'DEFAULT_CFG.url no es URL Supabase válida');
const jm = src.match(/anonKey: '(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)'/);
ok(!!jm, 'DEFAULT_CFG.anonKey no es JWT');
if (jm) {
  try {
    const payload = JSON.parse(Buffer.from(jm[1].split('.')[1], 'base64').toString('utf8'));
    ok(payload.role === 'anon', 'el JWT por defecto no es rol anon (rol=' + payload.role + ')');
    ok(payload.ref && src.indexOf(payload.ref) !== -1, 'el JWT no corresponde a la URL del proyecto');
  } catch (e) {
    ok(false, 'JWT por defecto no decodificable');
  }
}
ok(/saved\.url \|\| DEFAULT_CFG\.url/.test(src), 'getCfg no usa la URL por defecto como respaldo');
ok(/saved\.anonKey \|\| DEFAULT_CFG\.anonKey/.test(src), 'getCfg no usa la anon key por defecto como respaldo');
const allowedWarnings = ['NO usa service_role', 'Nunca uses service_role', 'No uses service_role'];
const others = src.split('\n').filter(function (ln, i) {
  if (ln.toLowerCase().indexOf('service_role') === -1) return false;
  return !allowedWarnings.some(function (w) { return ln.indexOf(w) !== -1; });
});
ok(others.length === 0, 'service_role fuera de avisos conocidos: ' + JSON.stringify(others.slice(0, 2)));


const sql = fs.readFileSync(path.join(ROOT, 'supabase-sync.sql'), 'utf8');
ok(/alter table public\.pod_project_sync enable row level security/i.test(sql), 'RLS no se habilita');
ok(/from pg_policies[\s\S]*?drop policy if exists %I on public\.pod_project_sync/i.test(sql), 'no limpia políticas heredadas de la tabla');
ok(/revoke all on table public\.pod_project_sync from public, anon, authenticated/i.test(sql), 'no revoca permisos previos de PUBLIC/anon/authenticated');
ok(/grant select, insert, update on table public\.pod_project_sync to authenticated/i.test(sql), 'no concede el conjunto mínimo de permisos');
ok(/using \(\(select auth\.uid\(\)\) = user_id\)/i.test(sql), 'SELECT/UPDATE no restringe por auth.uid');
ok(/with check \(\(select auth\.uid\(\)\) = user_id\)/i.test(sql), 'INSERT/UPDATE no valida auth.uid');


const hardening = fs.readFileSync(path.join(ROOT, 'supabase-hardening-handle-new-user.sql'), 'utf8');
ok(/ALTER FUNCTION public\\.handle_new_user\\(\\)[\\s\\S]*?SET search_path = pg_catalog, public, pg_temp/i.test(hardening), 'handle_new_user no fija search_path seguro y ordenado');
ok(/REVOKE EXECUTE ON FUNCTION public\\.handle_new_user\\(\\)[\\s\\S]*?FROM PUBLIC, anon, authenticated/i.test(hardening), 'handle_new_user no revoca EXECUTE de roles cliente');
ok(!/GRANT EXECUTE ON FUNCTION public\\.handle_new_user\\(\\)[\\s\\S]*?TO (PUBLIC|anon|authenticated)/i.test(hardening), 'handle_new_user vuelve a conceder EXECUTE a roles cliente');
ok(/Do not run this if the function is also intentionally called as an RPC/i.test(hardening), 'falta advertencia sobre uso RPC de handle_new_user');

const passed = failures.length === 0;
console.log((passed ? 'PASS' : 'FAIL') + '  supabase-cfg  (' + checks + ' aserciones, ' + failures.length + ' fallos)');
failures.forEach(function (f) { console.log('  ✗ ' + f); });
process.exit(passed ? 0 : 1);
