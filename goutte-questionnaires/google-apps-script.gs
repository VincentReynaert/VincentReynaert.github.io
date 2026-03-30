function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById('PASTE_SPREADSHEET_ID_HERE');
    var sheetName = data.kind === 'global_bundle' ? 'global' : 'individual';
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['submittedAt', 'kind', 'questionnaireKey', 'pid', 'condition', 'phase', 'json']);
    }

    var participant = data.participant || {};
    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.kind || 'questionnaire',
      data.questionnaireKey || '',
      participant.pid || '',
      participant.condition || '',
      participant.phase || '',
      JSON.stringify(data)
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
