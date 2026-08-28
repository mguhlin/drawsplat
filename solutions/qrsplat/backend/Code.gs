const SHEET_NAME = 'QRSplat';

function doGet(e) {
  const code = String((e && e.parameter && e.parameter.code) || '').trim();
  if (!code) return json_({ ok:false, error:'Missing QR code ID.' });
  const record = find_(code);
  if (!record || record.disabled) return HtmlService.createHtmlOutput('<h1>QR destination unavailable</h1><p>This editable QR code is missing or disabled.</p>').setTitle('QRSplat');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Opening link…</title><p>Opening destination…</p><script>location.replace(' + JSON.stringify(record.destination) + ')</script>').setTitle('QRSplat redirect');
}

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    authorize_(request.adminKey);
    if (!/^https?:\/\//i.test(String(request.destination || ''))) throw new Error('Destination must use HTTP or HTTPS.');
    if (request.action === 'create') return json_(create_(request.destination));
    if (request.action === 'update') return json_(update_(request.code, request.destination));
    throw new Error('Unsupported action.');
  } catch (error) { return json_({ ok:false, error:error.message }); }
}

function setupQRSplat() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('ADMIN_KEY')) properties.setProperty('ADMIN_KEY', Utilities.getUuid() + Utilities.getUuid());
  sheet_();
  console.log('ADMIN_KEY: ' + properties.getProperty('ADMIN_KEY'));
}

function authorize_(key) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!expected) throw new Error('Run setupQRSplat before deploying.');
  if (!key || !constantTimeEqual_(String(key), expected)) throw new Error('Administrative key rejected.');
}
function constantTimeEqual_(a,b){if(a.length!==b.length)return false;let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0;}
function sheet_(){const spreadsheet=SpreadsheetApp.getActive();let sheet=spreadsheet.getSheetByName(SHEET_NAME);if(!sheet){sheet=spreadsheet.insertSheet(SHEET_NAME);sheet.appendRow(['code','destination','created','updated','disabled']);sheet.setFrozenRows(1);}return sheet;}
function code_(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';let value='';for(let i=0;i<7;i++)value+=chars[Math.floor(Math.random()*chars.length)];return find_(value)?code_():value;}
function find_(code){const values=sheet_().getDataRange().getValues();for(let row=1;row<values.length;row++)if(String(values[row][0])===code)return{row:row+1,code:values[row][0],destination:values[row][1],disabled:Boolean(values[row][4])};return null;}
function create_(destination){const code=code_(),now=new Date();sheet_().appendRow([code,destination,now,now,false]);return{ok:true,code:code};}
function update_(code,destination){const record=find_(String(code||''));if(!record)throw new Error('QR code ID not found.');const sheet=sheet_(),now=new Date();sheet.getRange(record.row,2).setValue(destination);sheet.getRange(record.row,4).setValue(now);return{ok:true,code:record.code};}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
