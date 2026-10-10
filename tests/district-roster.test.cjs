const {test}=require('node:test');const assert=require('node:assert/strict');
const {parseRosterCSV}=require('../assets/js/roster-csv');const {validateRoster}=require('../server/mysql-backend/district-routes');
test('CSV handles BOM, quoted names, line endings, and rejects malformed imports',()=>{
 const rows=parseRosterCSV('\uFEFFteacher_email,class_name,student_email,student_name\r\nteacher@example.test,"Science, 6",student@example.test,"Jones, Sam"\r\n');
 assert.equal(rows[0].student_name,'Jones, Sam');assert.equal(validateRoster(rows)[0].className,'Science, 6');
 assert.throws(()=>parseRosterCSV('teacher_email,class_name\na@b.test,"unfinished'),/unclosed/);
 assert.throws(()=>parseRosterCSV('teacher_email,class_name\na@b.test,class,extra'),/columns/);
 assert.throws(()=>validateRoster([{teacher_email:'a@b.test',class_name:'A',student_email:'a@b.test'}]),/both/);
});
