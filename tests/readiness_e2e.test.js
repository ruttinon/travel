'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const ROOT=path.resolve(__dirname,'..');
const PHOTO=fs.readFileSync(path.join(ROOT,'assets','terraced-fields.webp'));
async function start(dir){return new Promise((resolve,reject)=>{
 const proc=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,UNFOLD_DATA_DIR:dir,PORT:'0',UNFOLD_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='',finished=false;
 const timer=setTimeout(()=>{if(!finished){finished=true;proc.kill();reject(new Error('Startup timed out '+stdout+' '+stderr))}},15000);
 proc.stdout.on('data',b=>{stdout+=b.toString();const ready=stdout.match(/\[READY\] unfold v2\.7\s+(http:\/\/127\.0\.0\.1:\d+)/);if(ready&&stdout.includes('Press Ctrl+C to stop.')&&!finished){finished=true;clearTimeout(timer);resolve({proc,url:ready[1],setup:stdout.match(/\[FIRST TIME SETUP\][\s\S]*?\n\s+([a-f0-9]{18})/)?.[1],get output(){return stdout+stderr}})}});
 proc.stderr.on('data',b=>stderr+=b.toString());proc.on('error',reject);proc.on('exit',code=>{if(!finished){finished=true;clearTimeout(timer);reject(new Error('Unexpected exit '+code+' '+stdout+stderr))}});
})}
async function stop(run){if(run?.proc&&run.proc.exitCode===null&&!run.proc.killed){run.proc.kill('SIGTERM');await new Promise(res=>run.proc.once('exit',res))}}
async function call(url,endpoint,{method='GET',cookie,body,origin}={}){
 const headers={};if(cookie)headers.Cookie=cookie;if(body!==undefined)headers['Content-Type']='application/json';if(origin)headers.Origin=origin;
 const response=await fetch(url+endpoint,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 let data;try{data=await response.json()}catch{data={}};
 return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
function cli(name,args,dir){return spawnSync(process.execPath,[path.join(ROOT,name),...args],{env:{...process.env,UNFOLD_DATA_DIR:dir},cwd:ROOT,encoding:'utf8',timeout:120000})}
function place(name='Lanna Riverside Homestay'){
 return {en:name,th:'บ้านพักท้องถิ่น',locEn:'Chiang Mai, Thailand',locTh:'เชียงใหม่',category:'stay',region:'north',lat:18.856,lon:98.962,visit:'2 hours',priceFrom:650,currency:'THB',storyEn:'Test record for integrated local lifecycle, not a real location.',storyTh:'ข้อมูลทดสอบ',photo:'',gallery:[],featured:false,status:'draft'};
}
async function expectStatus(result,status,label){assert.equal(result.status,status,label+': '+JSON.stringify(result.data));return result.data}
test('real HTTP lifecycle + Admin audit + verified backup and safe restore',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-v27-'));
 const data=path.join(temp,'live'),backupDir=path.join(temp,'snapshot');let run;
 try{
  run=await start(data);const base=run.url;
  assert.ok(run.setup);
  await expectStatus(await call(base,'/api/admin/audit'),401,'Audit restricted');
  let r=await call(base,'/api/admin/setup',{method:'POST',body:{setupToken:run.setup,password:'Secure admin password 2026'}});
  await expectStatus(r,201,'Admin setup');const admin=r.cookie;
  r=await call(base,'/api/admin/uploads',{method:'POST',cookie:admin,body:{dataUrl:'data:image/webp;base64,'+PHOTO.toString('base64')}});
  await expectStatus(r,201,'Admin photo');const cover=r.data.url;
  assert.equal((await fetch(base+cover)).status,404,'Unpublished admin photo is private');
  assert.equal((await fetch(base+cover.replace('/uploads/','/api/admin/place-media/'),{headers:{Cookie:admin}})).status,200,'Admin can preview private photo');
  r=await call(base,'/api/admin/places',{method:'POST',cookie:admin,body:{...place(),photo:cover,status:'published'}});
  await expectStatus(r,201,'Admin published place');const slug=r.data.place.id;
  assert.equal((await call(base,'/api/places')).data.places.length,1);
  let reg=await call(base,'/api/auth/register',{method:'POST',body:{name:'Test Tourist',email:'tourist@example.com',password:'Secure traveler 2026'}});
  await expectStatus(reg,201,'Traveler register');const traveler=reg.cookie;
  r=await call(base,`/api/places/${slug}/my-review`,{method:'PUT',cookie:traveler,body:{stars:5,text:'A lovely place for a careful test trip.'}});
  await expectStatus(r,200,'Traveler review submitted');const reviewId=r.data.review.id;
  assert.equal((await call(base,`/api/places/${slug}/reviews`)).data.count,0,'Pending reviews not public');
  r=await call(base,`/api/admin/reviews/${reviewId}`,{method:'PATCH',cookie:admin,body:{status:'approved'}});
  await expectStatus(r,200,'Admin approves review');
  assert.equal((await call(base,`/api/places/${slug}/reviews`)).data.count,1,'Approved reviews public');
  await expectStatus(await call(base,'/api/me/collections',{method:'PUT',cookie:traveler,body:{saved:[slug],trip:[slug]}}),200,'Saved+Trip persisted');
  r=await call(base,'/api/me/itineraries',{method:'POST',cookie:traveler,body:{title:'Weekend in Chiang Mai',days:1,hoursPerDay:8,travelMode:'driving',currency:'THB',budget:1800,groups:[[slug]]}});
  await expectStatus(r,201,'Save actual itinerary');
  const itineraryId=r.data.itinerary.id;
  assert.equal((await call(base,'/api/me/itineraries',{cookie:traveler})).data.itineraries[0].id,itineraryId);
  // Owner registers, verifies email using the local-only dev email link, and applies to manage a place.
  reg=await call(base,'/api/auth/register',{method:'POST',body:{name:'Test Owner',email:'owner@example.com',password:'Secure owner 2026'}});
  await expectStatus(reg,201,'Owner register');const owner=reg.cookie;
  const token=run.output.match(/\[DEV MAIL VERIFY\] owner@example.com http:\/\/[^\s]+\?verify=([a-f0-9]{64})/)?.[1];
  assert.ok(token,'Local development verification link produced');
  await expectStatus(await call(base,'/api/auth/verify',{method:'POST',body:{token}}),200,'Verify owner email');
  r=await call(base,'/api/business/register',{method:'POST',cookie:owner,body:{name:'Family Eco Homestay',type:'stay',contactEmail:'hello@example.com',phone:'+66 81 123 4567',website:'https://example.com',description:'A local family-owned place'}});
  await expectStatus(r,201,'Owner business');const biz=r.data.business.id;
  await expectStatus(await call(base,`/api/admin/businesses/${biz}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}}),200,'Admin approves owner');
  r=await call(base,'/api/business/submissions',{method:'POST',cookie:owner,body:{action:'claim',placeId:slug,evidence:'The place is owned by our family; validate using the company documents and direct contact before approval.'}});
  await expectStatus(r,201,'Owner claim draft');const claimId=r.data.submission.id;
  await expectStatus(await call(base,`/api/business/submissions/${claimId}/submit`,{method:'POST',cookie:owner}),200,'Owner submit claim');
  await expectStatus(await call(base,`/api/admin/business-submissions/${claimId}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}}),200,'Admin approves claim');
  assert.equal((await call(base,'/api/business/me',{cookie:owner})).data.places[0].id,slug);
  assert.equal((await call(base,'/api/business/me',{cookie:traveler})).data.business,null,'No owner cross-access');
  r=await call(base,'/api/admin/audit?limit=100',{cookie:admin});await expectStatus(r,200,'Audit read');
  const actions=new Set(r.data.events.map(x=>x.action));
  for(const action of ['admin.setup','place.create','review.moderate','business.register','business.decision','proposal.create','proposal.submit','proposal.decision'])assert.ok(actions.has(action),'Missing audit '+action);
  assert.ok(!JSON.stringify(r.data.events).includes('Secure admin password'));
  await expectStatus(await call(base,'/api/admin/audit?limit=200',{cookie:admin}),400,'Reject oversized audit query');
  await expectStatus(await call(base,'/api/admin/audit',{cookie:traveler}),401,'Tourist cannot read audit');
  for(const name of ['/audit.html','/audit.js','/audit.css'])assert.equal((await fetch(base+name)).status,200,name+' served');
  // Back up a database while the server is alive. Backup must be verifiable and include all media.
  const save=cli('backup.js',[backupDir],data);assert.equal(save.status,0,save.stderr+save.stdout);
  assert.match(save.stdout,/\[BACKUP PASS\]/);
  const manifest=JSON.parse(fs.readFileSync(path.join(backupDir,'manifest.json'),'utf8'));
  assert.ok(manifest.files.some(f=>f.file==='unfold.sqlite'));
  assert.ok(manifest.files.some(f=>f.file===cover.slice(1)));
  const dryWhileAlive=cli('restore.js',[backupDir],data);assert.notEqual(dryWhileAlive.status,0,'Restore refuses active server');
  await stop(run);run=null;
  const liveDb=new DatabaseSync(path.join(data,'unfold.sqlite'));liveDb.exec('DELETE FROM places');liveDb.close();
  const emptyCheckDb=new DatabaseSync(path.join(data,'unfold.sqlite'),{readOnly:true});assert.equal(emptyCheckDb.prepare('SELECT count(*) as n FROM places').get().n,0);emptyCheckDb.close();
  const dry=cli('restore.js',[backupDir],data);assert.equal(dry.status,0,dry.stderr+dry.stdout);assert.match(dry.stdout,/DRY RUN/);
  const apply=cli('restore.js',[backupDir,'--apply'],data);assert.equal(apply.status,0,apply.stderr+apply.stdout);assert.match(apply.stdout,/\[RESTORE PASS\]/);
  const db=new DatabaseSync(path.join(data,'unfold.sqlite'),{readOnly:true});
  assert.equal(db.prepare('SELECT count(*) as n FROM places').get().n,1,'Place restored');
  assert.equal(db.prepare('SELECT count(*) as n FROM reviews').get().n,1,'Review restored');
  assert.equal(db.prepare('SELECT count(*) as n FROM user_itineraries').get().n,1,'Trip restored');
  assert.ok(db.prepare('SELECT count(*) as n FROM audit_events').get().n>=7,'Audits restored');db.close();
  assert.ok(fs.existsSync(path.join(data,cover.slice(1))));
  const doctor=cli('doctor.js',['--json'],data);assert.equal(doctor.status,0,doctor.stderr+doctor.stdout);assert.equal(JSON.parse(doctor.stdout).ready,true);
  // Corrupt one backup image and prove that no restore is allowed.
  fs.appendFileSync(path.join(backupDir,cover.slice(1)),Buffer.from('tampered'));
  const bad=cli('restore.js',[backupDir,'--apply'],data);assert.notEqual(bad.status,0,'Tampered backup rejected');
  assert.match(bad.stderr,/hash \/ size \/ file inventory/i);
 }finally{await stop(run);fs.rmSync(temp,{recursive:true,force:true})}
});
