// Google Apps Script: saves p(Doom) quiz responses to the Google Sheet this script is attached to.
// Deploy as a web app (Execute as: Me, Who has access: Anyone) and paste its URL into CONFIG.endpoint.

const SHEET_NAME = 'responses';
const HEADERS = ['id', 'created_at', 'version', 'name', 'field', 'gut_before', 'gut_after', 'pdoom', 'archetype', 'payload'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const raw = e && e.postData ? e.postData.contents : '';
    if (!raw || raw.length > 20000) return reply({ ok: false });
    const r = JSON.parse(raw);
    const id = typeof r.id === 'string' && /^[\w-]{8,64}$/.test(r.id) ? r.id : null;
    const pdoom = Number(r.result && r.result.pdoom);
    if (!id || !(pdoom >= 0 && pdoom <= 1)) return reply({ ok: false });

    const num = v => (typeof v === 'number' && v >= 0 && v <= 1 ? v : '');
    const row = [
      id, new Date().toISOString(), text(r.version, 20), text(r.name, 80), text(r.field, 60),
      num(r.gut_before), num(r.gut_after), pdoom, text(r.result.archetype, 40), raw
    ];

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);

    // A respondent who changes their answers overwrites their own row.
    const n = sh.getLastRow() - 1;
    const ids = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(x => x[0]) : [];
    const at = ids.indexOf(id);
    if (at >= 0) sh.getRange(at + 2, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

// Short text only, and never let a cell start like a spreadsheet formula.
function text(v, max) {
  if (typeof v !== 'string' || !v.trim()) return '';
  const s = v.trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
