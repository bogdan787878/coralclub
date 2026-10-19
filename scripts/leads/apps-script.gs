/**
 * Google Apps Script — receives /landing consultation leads (phone only) and
 * appends them to the active sheet. Deploy as a Web app (Execute as: me, Who
 * has access: Anyone), then paste the /exec URL into LEADS_WEB_APP_URL in
 * src/lib/leads.ts.
 */
var HEADER = [
  'Дата',
  'Телефон',
  'Источник',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'Страница'
];

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  var d = JSON.parse(e.postData.contents);
  // the phone goes in as text so Sheets keeps the "+" and leading digits
  sheet.appendRow([
    d.submittedAt ? new Date(d.submittedAt) : new Date(),
    "'" + (d.phone || ''),
    d.source || '',
    d.utm_source || '',
    d.utm_medium || '',
    d.utm_campaign || '',
    d.utm_content || '',
    d.page || ''
  ]);
  return ContentService.createTextOutput('ok');
}
