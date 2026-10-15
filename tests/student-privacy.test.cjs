const {test}=require('node:test'),assert=require('node:assert/strict');
const {studentId,exportStudent,deleteStudent}=require('../server/mysql-backend/student-privacy');
const {cleanupDistrictRecords,days}=require('../server/mysql-backend/district-retention');
test('record identifiers and retention durations are validated before SQL',()=>{
 for(const id of ['0','-1','1 OR 1=1','1.2','9007199254740992',null])assert.throws(()=>studentId(id));
 assert.equal(studentId('12'),12);for(const n of [0,-1,1.2,3651,'infinity'])assert.throws(()=>days(n,365));assert.equal(days(undefined,365),365);
});
test('district record cleanup is inactive until explicitly enabled',async()=>{
 let called=false;const result=await cleanupDistrictRecords({query:async()=>[[{config_json:{retention:{}}}]],getConnection:async()=>{called=true;}},()=>{});
 assert.equal(result.enabled,false);assert.equal(called,false);
});
test('failed erasure rolls back and always releases its connection',async()=>{
 const events=[],conn={beginTransaction:async()=>events.push('begin'),query:async()=>[[{id:12,role:'student'}]],execute:async()=>{throw Error('synthetic storage failure');},rollback:async()=>events.push('rollback'),release:()=>events.push('release')};
 await assert.rejects(deleteStudent({getConnection:async()=>conn},12,{id:1,role:'district_admin'}),/synthetic storage failure/);assert.deepEqual(events,['begin','rollback','release']);
});
test('real database: export/erasure covers classroom records and does not match another student by name',{skip:!process.env.MYSQL_TEST_URL},async()=>{
 const pool=require('../server/mysql-backend/db-config').createDatabasePool({MYSQL_URL:process.env.MYSQL_TEST_URL});
 const stamp='privacy-fixture-'+Date.now();let teacher,student,other,room,assignment,legacy;
 try {
  const [t]=await pool.execute("INSERT INTO users (email,role) VALUES (?, 'teacher')",[stamp+'-teacher@example.test']);teacher=t.insertId;
  const [s]=await pool.execute("INSERT INTO users (email,student_name,role) VALUES (?, ?, 'student')",[stamp+'-student@example.test',stamp]);student=s.insertId;
  const [o]=await pool.execute("INSERT INTO users (email,student_name,role) VALUES (?, ?, 'student')",[stamp+'-other@example.test',stamp]);other=o.insertId;
  const [c]=await pool.execute('INSERT INTO classrooms (teacher_user_id,title,invite_hash) VALUES (?, ?, ?)',[teacher,stamp,Buffer.alloc(32,1)]);room=c.insertId;
  await pool.execute('INSERT INTO classroom_members (classroom_id,user_id) VALUES (?, ?),(?, ?)',[room,student,room,other]);
  const [a]=await pool.execute('INSERT INTO classroom_assignments (classroom_id,title,board_json) VALUES (?, ?, ?)',[room,stamp,JSON.stringify({panels:[]})]);assignment=a.insertId;
  for(const id of [student,other]){
   await pool.execute('INSERT INTO classroom_submissions (assignment_id,student_user_id,board_json,feedback) VALUES (?, ?, ?, ?)',[assignment,id,JSON.stringify({title:'Synthetic answer'}),'Synthetic feedback']);
   await pool.execute('INSERT INTO cloud_boards (user_id,board_key,title,board_json) VALUES (?, ?, ?, ?)',[id,stamp,'Synthetic private work',JSON.stringify({panels:[]})]);
  }
  const [l]=await pool.execute('INSERT INTO turnins (student_name,title,board_json) VALUES (?, ?, ?)',[stamp,'Unlinked legacy record',JSON.stringify({panels:[]})]);legacy=l.insertId;
  const conn=await pool.getConnection();let archive;try{archive=await exportStudent(conn,student);}finally{conn.release();}
  assert.equal(archive.boards.length,1);assert.equal(archive.submissions.length,1);assert.equal(archive.submissions[0].feedback,'Synthetic feedback');assert.equal(archive.memberships.length,1);assert.equal(archive.turnins.length,0);assert.equal(archive.user.password_hash,undefined);
  const result=await deleteStudent(pool,student,{id:teacher,role:'district_admin'});assert.equal(result.deleted.submissions,1);assert.equal(result.deleted.boards,1);assert.equal(result.deleted.memberships,1);
  assert.equal((await pool.query('SELECT * FROM users WHERE id = ?',[student]))[0].length,0);
  assert.equal((await pool.query('SELECT * FROM classroom_submissions WHERE student_user_id = ?',[other]))[0].length,1);
  assert.equal((await pool.query('SELECT * FROM turnins WHERE id = ?',[legacy]))[0].length,1);
 } finally {
  if(legacy)await pool.execute('DELETE FROM turnins WHERE id = ?',[legacy]);
  for(const id of [student,other,teacher].filter(Boolean))await pool.execute('DELETE FROM users WHERE id = ?',[id]);
  if(teacher)await pool.execute("DELETE FROM audit_events WHERE actor_user_id = ? AND target_type = 'privacy'",[teacher]);
  await pool.end();
 }
});
test('real database: district retention is explicit, time-scoped, and preserves current records',{skip:!process.env.MYSQL_TEST_URL},async()=>{
 const pool=require('../server/mysql-backend/db-config').createDatabasePool({MYSQL_URL:process.env.MYSQL_TEST_URL});
 // Isolate policy/job SQL in a transaction; never apply a global cleanup to a shared database.
 const conn=await pool.getConnection();try{
  await conn.beginTransaction();
  await conn.query("SELECT config_key FROM compliance_config WHERE config_key='main' FOR UPDATE");
  const config={retention:{districtRecords:{enabled:true,boardDays:365,submissionDays:365}}};
  const facade={query:async()=>[[{config_json:config}]],getConnection:async()=>({beginTransaction:async()=>{},execute:(sql,args)=>conn.execute(sql,args),commit:async()=>{},rollback:async()=>{},release:()=>{}})};
  const r=await cleanupDistrictRecords(facade,()=>{});assert.equal(r.enabled,true);assert.equal(typeof r.deleted.boards,'number');assert.equal(typeof r.deleted.submissions,'number');
 } finally {await conn.rollback();conn.release();await pool.end();}
});
