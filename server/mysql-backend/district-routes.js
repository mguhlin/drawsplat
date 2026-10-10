const crypto=require('node:crypto');
const {normalizeEmail,isValidEmail,safeString}=require('./security');
function validateRoster(rows){
 if(!Array.isArray(rows)||!rows.length||rows.length>2000)throw Object.assign(new Error('Import 1–2000 roster rows.'),{status:400});
 const roles=new Map();
 return rows.map((row,index)=>{
  const teacherEmail=normalizeEmail(row.teacher_email),studentEmail=normalizeEmail(row.student_email),className=safeString(row.class_name,200);
  if(!isValidEmail(teacherEmail)||!className||(studentEmail&&!isValidEmail(studentEmail)))throw Object.assign(new Error(`Row ${index+2}: a valid teacher_email and class_name are required; student_email must be valid when provided.`),{status:400});
  for(const [email,role] of [[teacherEmail,'teacher'],...(studentEmail?[[studentEmail,'student']]:[])]){if(roles.has(email)&&roles.get(email)!==role)throw Object.assign(new Error(`Row ${index+2}: one email cannot be both teacher and student.`),{status:400});roles.set(email,role);}
  return {teacherEmail,studentEmail,className,teacherName:safeString(row.teacher_name,190)||teacherEmail,studentName:safeString(row.student_name,190)||studentEmail};
 });
}
function attachDistrictRoutes(app,pool,{basePath,auth}){
 const base=basePath+'/district';app.use(base,auth.requireRoles(['district_admin']));
 const route=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
 app.get(base+'/roster',route(async(_req,res)=>{
  const [classes]=await pool.query('SELECT c.id,c.title,u.email AS teacherEmail,u.display_name AS teacherName,COUNT(m.user_id) AS students FROM classrooms c JOIN users u ON u.id=c.teacher_user_id LEFT JOIN classroom_members m ON m.classroom_id=c.id GROUP BY c.id,c.title,u.email,u.display_name ORDER BY c.title');
  const [users]=await pool.query("SELECT id,email,display_name AS displayName,role,provider FROM users WHERE deleted_at IS NULL AND role IN ('teacher','student') ORDER BY role,email");res.json({ok:true,classes,users});
 }));
 app.post(base+'/roster',route(async(req,res)=>{
  const rows=validateRoster(req.body.rows);
  if(req.body.preview===true)return res.json({ok:true,rows:rows.length,teachers:new Set(rows.map(r=>r.teacherEmail)).size,classes:new Set(rows.map(r=>r.teacherEmail+'\0'+r.className)).size,students:new Set(rows.filter(r=>r.studentEmail).map(r=>r.studentEmail)).size});
  const connection=await pool.getConnection();const stats={accountsCreated:0,classesCreated:0,membershipsAdded:0};
  try{await connection.beginTransaction();
   async function account(email,name,role){const [existing]=await connection.execute('SELECT id,role,deleted_at FROM users WHERE email=? FOR UPDATE',[email]);
    if(existing[0]){if(existing[0].deleted_at||existing[0].role!==role)throw Object.assign(new Error('An existing account has a conflicting role: '+email),{status:409});await connection.execute('UPDATE users SET display_name=? WHERE id=?',[name,existing[0].id]);return existing[0].id;}
    const [created]=await connection.execute("INSERT INTO users (email,display_name,student_name,role,provider,age_source) VALUES (?,?,?,?, 'google','district_roster')",[email,name,role==='student'?name:null,role]);stats.accountsCreated++;return created.insertId;
   }
   for(const row of rows){const teacher=await account(row.teacherEmail,row.teacherName,'teacher');const key=crypto.createHash('sha256').update(row.teacherEmail+'\0'+row.className).digest('hex');const [existing]=await connection.execute('SELECT id FROM classrooms WHERE roster_key=?',[key]);let classroomId=existing[0]?.id;
    if(!classroomId){const [cls]=await connection.execute('INSERT INTO classrooms (teacher_user_id,title,invite_hash,roster_key) VALUES (?,?,?,?)',[teacher,row.className,crypto.randomBytes(32),key]);classroomId=cls.insertId;stats.classesCreated++;}
    if(row.studentEmail){const student=await account(row.studentEmail,row.studentName,'student');const [added]=await connection.execute('INSERT IGNORE INTO classroom_members (classroom_id,user_id) VALUES (?,?)',[classroomId,student]);stats.membershipsAdded+=added.affectedRows;}
   }
   await connection.execute("INSERT INTO audit_events (actor,actor_user_id,actor_role,action,target_type,metadata_json) VALUES (?,?,'district_admin','DISTRICT_ROSTER_IMPORT','roster',?)",[req.dsUser.email,req.dsUser.id,JSON.stringify({...stats,rows:rows.length})]);
   await connection.commit();res.json({ok:true,...stats});
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
 }));
}
module.exports={attachDistrictRoutes,validateRoster};
