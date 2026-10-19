/**
 * Google Apps Script — receives /landing consultation leads (name, phone,
 * e-mail) and appends them to the first sheet of the spreadsheet SHEET_ID.
 * Deploy as a Web app (Execute as: me, Who has access: Anyone), then paste
 * the /exec URL into LEADS_WEB_APP_URL in src/lib/leads.ts.
 *
 * Columns are found by their header, and a missing one is added on the
 * right — so a sheet that already has rows keeps working when a field is
 * added, and the column order may be rearranged by hand.
 */

// The id of the sheet that collects the leads: the part of its address between
// /d/ and /edit. It is not committed (this repository is public) — paste it
// into the copy of this script that you deploy.
var SHEET_ID = 'PASTE_SHEET_ID_HERE';

// [header in the sheet, field in the request]
var COLUMNS = [
  ['Дата', 'submittedAt'],
  ['Имя', 'name'],
  ['Телефон', 'phone'],
  ['Email', 'email'],
  ['Источник', 'source'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['utm_content', 'utm_content'],
  ['Страница', 'page']
];

function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  var d = JSON.parse(e.postData.contents);

  var header = [];
  if (sheet.getLastRow() > 0) {
    header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(String);
  }
  COLUMNS.forEach(function (c) {
    if (header.indexOf(c[0]) === -1) header.push(c[0]);
  });
  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  sheet.setFrozenRows(1);

  var row = header.map(function (h) {
    var col = COLUMNS.filter(function (c) { return c[0] === h; })[0];
    if (!col) return '';
    var v = d[col[1]];
    if (col[1] === 'submittedAt') return v ? new Date(v) : new Date();
    // the phone goes in as text so Sheets keeps the "+" and leading digits
    if (col[1] === 'phone') return "'" + (v || '');
    return v || '';
  });
  sheet.appendRow(row);
  return ContentService.createTextOutput('ok');
}
