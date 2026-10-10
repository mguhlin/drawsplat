const {test}=require('node:test');const assert=require('node:assert/strict');
const {parseRosterCSV}=require('../assets/js/roster-csv');const {validateRoster}=require('../server/mysql-backend/district-routes');
test('CSV handles BOM, quoted names, line endings, and rejects malformed imports',()=>{
 const rows=parseRosterCSV('\uFEFFteacher_email,class_name,student_email,student_name\r\nteacher@example.test,"Science, 6",student@example.test,"Jones, Sam"\r\n');
 assert.equal(rows[0].student_name,'Jones, Sam');assert.equal(validateRoster(rows)[0].className,'Science, 6');
 assert.throws(()=>parseRosterCSV('teacher_email,class_name\na@b.test,"unfinished'),/unclosed/);
 assert.throws(()=>parseRosterCSV('teacher_email,class_name\na@b.test,class,extra'),/columns/);
 assert.throws(()=>validateRoster([{teacher_email:'a@b.test',class_name:'A',student_email:'a@b.test'}]),/both/);
});
test('Google tokens must match audience, issuer, expiry, verified email and school domain',async()=>{
 const {verifyGoogle}=require('../server/mysql-backend/oauth-routes');const original=global.fetch,domain=process.env.GOOGLE_ALLOWED_DOMAINS;process.env.GOOGLE_ALLOWED_DOMAINS='school.example';
 let payload={iss:'https://accounts.google.com',sub:'verified-user',exp:String(Math.floor(Date.now()/1000)+3600),aud:'district-client',email:'learner@school.example',email_verified:'true'};
 global.fetch=async()=>({ok:true,json:async()=>payload});
 try{assert.equal((await verifyGoogle('fake-test-token','district-client')).email,'learner@school.example');for(const change of [{aud:'other-client'},{iss:'https://attacker.example'},{exp:'0'},{exp:'invalid'},{email_verified:'false'},{email:'learner@outside.example'}]){const before=payload;payload={...payload,...change};await assert.rejects(verifyGoogle('fake-test-token','district-client'));payload=before;}}finally{global.fetch=original;if(domain===undefined)delete process.env.GOOGLE_ALLOWED_DOMAINS;else process.env.GOOGLE_ALLOWED_DOMAINS=domain;}
});
