function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || '{}');
    var ss = SpreadsheetApp.openById('PASTE_SPREADSHEET_ID_HERE');
    var sheetName = payload.kind === 'global_bundle' ? 'global_bundles' : 'questionnaire_submissions';
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['timestamp', 'questionnaireKey', 'kind', 'participantPid', 'phase', 'condition', 'payload_json']);
    }
    var participant = payload.participant || {};
    sheet.appendRow([
      new Date(),
      payload.questionnaireKey || '',
      payload.kind || 'individual',
      participant.pid || '',
      participant.phase || '',
      participant.condition || '',
      JSON.stringify(payload),
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) })).setMimeType(ContentService.MimeType.JSON);
  }
}
