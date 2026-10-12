/**
 * Google Apps Script — receives /landing consultation leads and appends
 * them to the active sheet. Deploy as a Web app (Execute as: me, Who has
 * access: Anyone), then set NEXT_PUBLIC_LEADS_ENDPOINT to the /exec URL.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата', 'Email', 'Телефон', 'Согласие на ПДн', 'Источник', 'Страница']);
  }
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([
    d.submittedAt || new Date().toISOString(),
    d.email || '',
    d.phone || '',
    d.consent ? 'да' : 'нет',
    d.source || '',
    d.page || ''
  ]);
  return ContentService.createTextOutput('ok');
}
