function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || '{}');
    var ss = SpreadsheetApp.openById('PASTE_SPREADSHEET_ID_HERE');

    if (payload.action === 'roster_lookup') {
      var rosterSheet = ss.getSheetByName('roster') || ss.insertSheet('roster');
      ensureHeaders(rosterSheet, ['pid', 'lastName', 'firstName', 'condition']);
      var values = rosterSheet.getDataRange().getValues();
      var rows = values.slice(1).map(function(row) {
        return { pid: row[0] || '', lastName: row[1] || '', firstName: row[2] || '', condition: row[3] || '' };
      });
      var targetLast = normalizeName(payload.lastName);
      var targetFirst = normalizeName(payload.firstName);
      var prefix = targetLast.slice(0, 3).padEnd(3, 'X') + targetFirst.slice(0, 3).toLowerCase().padEnd(3, 'x');
      var matches = rows.filter(function(row) {
        return normalizeName(row.lastName) === targetLast && normalizeName(row.firstName) === targetFirst;
      });
      var prefixMatches = rows.filter(function(row) {
        return String(row.pid || '').indexOf(prefix) === 0;
      });
      return ContentService.createTextOutput(JSON.stringify({ ok: true, matches: matches, prefixMatches: prefixMatches, roster: rows })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'roster_create') {
      var entry = payload.entry || {};
      var roster = ss.getSheetByName('roster') || ss.insertSheet('roster');
      ensureHeaders(roster, ['pid', 'lastName', 'firstName', 'condition']);
      var existing = roster.getDataRange().getValues().slice(1);
      var pid = String(entry.pid || '');
      var found = existing.some(function(row) { return String(row[0] || '') === pid; });
      if (!found) roster.appendRow([pid, entry.lastName || '', entry.firstName || '', entry.condition || '']);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, created: !found, entry: entry })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheetName = payload.kind === 'global_bundle' ? 'global_bundles' : 'questionnaire_submissions';
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    ensureHeaders(sheet, ['timestamp', 'questionnaireKey', 'kind', 'participantPid', 'phase', 'condition', 'payload_json']);
    var participant = payload.participant || {};
    sheet.appendRow([
      new Date(),
      payload.questionnaireKey || '',
      payload.kind || 'individual',
      participant.pid || '',
      participant.phase || '',
      participant.condition || '',
      JSON.stringify(payload)
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) })).setMimeType(ContentService.MimeType.JSON);
  }
}
