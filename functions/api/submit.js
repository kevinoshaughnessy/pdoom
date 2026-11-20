// Cloudflare Pages Function: POST /api/submit
// Stores one quiz response in the D1 database bound as DB.
// Only called when the respondent chose "Save my answers".

const MAX_BYTES = 20000;

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json({ ok: false, error: 'too large' }, 413);

  let r;
  try { r = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad json' }, 400); }

  const id = typeof r.id === 'string' && /^[\w-]{8,64}$/.test(r.id) ? r.id : null;
  const pdoom = Number(r?.result?.pdoom);
  if (!id || !(pdoom >= 0 && pdoom <= 1)) return json({ ok: false, error: 'invalid' }, 400);

  const name = typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 80) : null;
  const num = v => (typeof v === 'number' && v >= 0 && v <= 1 ? v : null);

  // INSERT OR REPLACE: a respondent who changes their answers overwrites their own row.
  await env.DB.prepare(
    `INSERT OR REPLACE INTO responses
       (id, created_at, version, name, field, gut_before, gut_after, pdoom, archetype, payload)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
  ).bind(
    id, new Date().toISOString(), String(r.version || '').slice(0, 20), name,
    typeof r.field === 'string' ? r.field.slice(0, 60) : null,
    num(r.gut_before), num(r.gut_after), pdoom,
    String(r?.result?.archetype || '').slice(0, 40), raw
  ).run();

  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: 'POST only' }, 405);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
