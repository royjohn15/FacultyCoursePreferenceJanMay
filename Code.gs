/**
 * Google Apps Script backend for the Faculty Course Preference form.
 * Paste this into Extensions > Apps Script of your Google Sheet, then deploy
 * as a Web App (see README.md).
 */

const SHEET_NAME = 'Responses';
const SEMESTER = 'January – May 2027';
const N_COURSES = 5;
const N_LABS = 3;

const HEADERS = ['Timestamp', 'Name', 'Email',
  'Course Pref 1', 'Course Pref 2', 'Course Pref 3', 'Course Pref 4', 'Course Pref 5',
  'Lab Pref 1', 'Lab Pref 2', 'Lab Pref 3', 'Remarks', 'Email Sent'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const error = validate(d);
    if (error) return json({ ok: false, error: error });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    let sheet, row;
    try {
      sheet = getSheet();
      sheet.appendRow([new Date(), d.name, d.email]
        .concat(d.courses, d.labs, [d.remarks || '', 'pending'])
        .map(safeCell));
      row = sheet.getLastRow();
    } finally {
      lock.releaseLock();
    }

    let emailed = true;
    try {
      sendConfirmation(d);
    } catch (mailErr) {
      emailed = false;
      console.error(mailErr);
    }
    sheet.getRange(row, HEADERS.length).setValue(emailed ? 'Yes' : 'FAILED');

    return json({ ok: true, emailed: emailed });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
}

// Lets you open the Web App URL in a browser to check it is live.
function doGet() {
  return json({ ok: true, message: 'Faculty Course Preference backend is running.' });
}

function validate(d) {
  if (!d || typeof d !== 'object') return 'Invalid submission.';
  if (!d.name || String(d.name).trim().length < 3) return 'Name is required.';
  if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(d.email || '')) return 'A valid email ID is required.';
  if (!Array.isArray(d.courses) || d.courses.length !== N_COURSES || d.courses.some(c => !c)) return 'Exactly 5 course preferences are required.';
  if (!Array.isArray(d.labs) || d.labs.length !== N_LABS || d.labs.some(c => !c)) return 'Exactly 3 lab preferences are required.';
  if (new Set(d.courses).size !== N_COURSES) return 'Duplicate course preferences are not allowed.';
  if (new Set(d.labs).size !== N_LABS) return 'Duplicate lab preferences are not allowed.';
  if (d.remarks && String(d.remarks).length > 1000) return 'Remarks must be 1000 characters or fewer.';
  return null;
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Stop text like "=IMPORTXML(...)" being run as a formula in the sheet.
function safeCell(v) {
  return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;
}

function sendConfirmation(d) {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = items => '<ol>' + items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ol>';
  const html =
    '<p>Dear ' + esc(d.name) + ',</p>' +
    '<p>Thank you for submitting your course preferences for the <b>' + SEMESTER + '</b> semester. Your selections are below.</p>' +
    '<h3>Course preferences</h3>' + list(d.courses) +
    '<h3>Lab preferences</h3>' + list(d.labs) +
    '<h3>Remarks</h3><p>' + (d.remarks ? esc(d.remarks).replace(/\n/g, '<br>') : '—') + '</p>' +
    '<p style="color:#666;font-size:12px">This is an automated confirmation. If you did not submit this form, please ignore this email.</p>';
  const text =
    'Dear ' + d.name + ',\n\nYour course preferences for ' + SEMESTER + ':\n\nCourses:\n' +
    d.courses.map((c, i) => (i + 1) + '. ' + c).join('\n') + '\n\nLabs:\n' +
    d.labs.map((c, i) => (i + 1) + '. ' + c).join('\n') + '\n\nRemarks: ' + (d.remarks || '—') + '\n';

  MailApp.sendEmail({
    to: d.email,
    subject: 'Course Preference Submitted — ' + SEMESTER,
    body: text,
    htmlBody: html,
    name: 'Faculty Course Preference'
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
