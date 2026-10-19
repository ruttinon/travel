'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const IMG=fs.readFileSync(path.join(ROOT,'assets','terraced-fields.webp'));
async function launch(data){return new Promise((resolve,reject)=>{
  const proc=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,UNFOLD_DATA_DIR:data,PORT:'0',UNFOLD_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='',done=false;const timer=setTimeout(()=>reject(new Error('Startup timeout '+stdout+' '+stderr)),15000);
  proc.stdout.on('data',chunk=>{stdout+=chunk.toString();const url=stdout.match(/\[READY\] unfold v2\.7\s+(http:\/\/127\.0\.0\.1:\d+)/);if(url&&!done){done=true;setTimeout(()=>{clearTimeout(timer);resolve({proc,base:url[1],setup:stdout.match(/\[FIRST TIME SETUP\][\s\S]*?\n\s+([a-f0-9]{18})/)?.[1],get output(){return stdout+stderr}})},200)}});
  proc.stderr.on('data',chunk=>stderr+=chunk.toString());proc.on('error',reject);proc.on('exit',code=>{if(!done)reject(new Error('Server exited '+code+': '+stdout+stderr))});
})}
async function req(base,url,{method='GET',cookie,body,origin}={}){const headers={};if(cookie)headers.cookie=cookie;if(body!==undefined)headers['Content-Type']='application/json';if(origin)headers.origin=origin;const res=await fetch(base+url,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let data={};try{data=await res.json()}catch{}return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]}}
const validPlace=(name='Local food stand')=>({en:name,th:'ร้านท้องถิ่น',locEn:'Chiang Mai, Thailand',locTh:'เชียงใหม่',category:'food',region:'north',lat:18.85,lon:98.98,visit:'1 hour',storyEn:'Local neighborhood food, test only',storyTh:'ข้อมูลทดสอบ',priceFrom:80,currency:'THB',photo:'',gallery:[],featured:true,status:'published'});
async function user(base,email){let x=await req(base,'/api/auth/register',{method:'POST',body:{name:email.split('@')[0],email,password:'a-long-test-password-2026'}});assert.equal(x.status,201,JSON.stringify(x.data));return x.cookie}
async function verified(base,cookie,run,email){let timer=0,token;while(timer<20){token=run.output.match(new RegExp('\\[DEV MAIL VERIFY\\] '+email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' http://[^\\s]+\\?verify=([a-f0-9]{64})'))?.[1];if(token)break;await new Promise(r=>setTimeout(r,50));timer++}assert.ok(token,'verification token shown in server stdout');const result=await req(base,'/api/auth/verify',{method:'POST',body:{token}});assert.equal(result.status,200)}
async function adminSetup(run){const r=await req(run.base,'/api/admin/setup',{method:'POST',body:{setupToken:run.setup,password:'a-very-long-admin-password-2026'}});assert.equal(r.status,201);return r.cookie}
async function upload(base,cookie,url='/api/business/uploads'){const result=await req(base,url,{method:'POST',cookie,body:{dataUrl:'data:image/webp;base64,'+IMG.toString('base64')}});assert.equal(result.status,201,JSON.stringify(result.data));return result.data.url}
async function registerBusiness(base,cookie,name='Lanna Home'){const r=await req(base,'/api/business/register',{method:'POST',cookie,body:{name,type:'stay',contactEmail:name.toLowerCase().replaceAll(' ','')+'@example.com',phone:'+66 81 999 9988',website:'https://example.com',description:'A small family-owned local business'}});assert.equal(r.status,201,JSON.stringify(r.data));return r.data.business.id}
async function stop(run){if(run?.proc?.exitCode===null){run.proc.kill();await new Promise(resolve=>run.proc.once('exit',resolve))}}
test('Business Portal v2.5: approval, upload ownership, create, edit, claim, isolation, rollback and persistence',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-business-'));let run;
 try{
  run=await launch(dir);const base=run.base;const admin=await adminSetup(run);
  const alice=await user(base,'owner1@example.com'),bob=await user(base,'owner2@example.com');
  let r=await req(base,'/api/business/me',{cookie:alice});assert.equal(r.status,200);assert.equal(r.data.business,null);
  const aId=await registerBusiness(base,alice,'Lanna Home');
  r=await req(base,'/api/business/me',{cookie:bob});assert.equal(r.data.business,null,'merchant data must not leak to another signed-in member');
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:alice,body:{action:'create',payload:validPlace()}});assert.equal(r.status,403,'pending merchant cannot submit');
  r=await req(base,'/api/admin/businesses/'+aId+'/decision',{method:'POST',cookie:alice,body:{status:'approved'}});assert.equal(r.status,401,'merchant must not impersonate admin');
  r=await req(base,'/api/admin/businesses/'+aId+'/decision',{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,409,'Admin cannot approve unverified owner');
  await verified(base,alice,run,'owner1@example.com');await verified(base,bob,run,'owner2@example.com');
  r=await req(base,'/api/admin/businesses/'+aId+'/decision',{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200);
  const bId=await registerBusiness(base,bob,'Hmong Kitchen');
  r=await req(base,'/api/admin/businesses/'+bId+'/decision',{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200);
  const coverA=await upload(base,alice),coverB=await upload(base,bob);
  assert.equal((await fetch(base+coverA)).status,404,'unapproved merchant photos are not public');
  assert.equal((await fetch(base+coverA,{headers:{Cookie:alice}})).status,200,'uploader can preview own photos');
  assert.equal((await fetch(base+coverA,{headers:{Cookie:bob}})).status,404,'another owner cannot view private upload');
  assert.equal((await fetch(base+'/api/admin/business-media/'+coverA.split('/').pop(),{headers:{Cookie:admin}})).status,200,'Admin can inspect pending private uploads');
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:alice,body:{action:'create',payload:{...validPlace('First local place'),photo:coverB}}});assert.equal(r.status,403,'cannot steal another merchant image');
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:alice,body:{action:'create',payload:{...validPlace('First local place'),lat:'',photo:coverA}}});assert.equal(r.status,201);
  const firstDraft=r.data.submission.id;
  r=await req(base,`/api/business/submissions/${firstDraft}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,400,'missing coordinates cannot submit');
  r=await req(base,`/api/business/submissions/${firstDraft}`,{method:'PUT',cookie:alice,body:{payload:{...validPlace('First local place'),photo:coverA}}});assert.equal(r.status,200);
  r=await req(base,`/api/business/submissions/${firstDraft}/submit`,{method:'POST',cookie:bob});assert.equal(r.status,404,'cannot access another owner draft');
  r=await req(base,`/api/business/submissions/${firstDraft}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,200);assert.equal(r.data.submission.status,'pending');
  r=await req(base,'/api/places');assert.equal(r.data.places.length,0,'pending place must never be public');
  r=await req(base,`/api/admin/business-submissions/${firstDraft}/decision`,{method:'POST',cookie:admin,body:{status:'approved',note:'Verified by phone'}});assert.equal(r.status,200,JSON.stringify(r.data));const slug=r.data.submission.placeId;assert.ok(slug);
  r=await req(base,'/api/places');assert.equal(r.data.places.length,1);assert.equal(r.data.places[0].featured,false,'owner must never self-feature');assert.equal((await fetch(base+coverA)).status,200,'approved public photo becomes visible');
  r=await req(base,'/api/business/me',{cookie:alice});assert.equal(r.data.places.length,1);assert.equal(r.data.places[0].id,slug);
  r=await req(base,'/api/business/me',{cookie:bob});assert.equal(r.data.places.length,0);
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:bob,body:{action:'edit',placeId:slug,payload:validPlace()}});assert.equal(r.status,403,'other owner cannot edit a managed place');
  // Owner edits require independent admin review and should not show before approval.
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:alice,body:{action:'edit',placeId:slug,payload:{...validPlace('Updated local place'),photo:coverA}}});assert.equal(r.status,201);const editId=r.data.submission.id;
  r=await req(base,`/api/business/submissions/${editId}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,200);
  r=await req(base,'/api/places');assert.equal(r.data.places[0].en,'First local place');
  r=await req(base,`/api/admin/business-submissions/${editId}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200);
  r=await req(base,'/api/places');assert.equal(r.data.places[0].en,'Updated local place');
  // Pending claim request vs an already owned place is blocked.
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:bob,body:{action:'claim',placeId:slug,evidence:'I own this venue. Please call us with the contact on file to verify.'}});assert.equal(r.status,409);
  // Admin-published unowned listing can be claimed after proof review.
  const adminPhoto=await upload(base,admin,'/api/admin/uploads');
  r=await req(base,'/api/admin/places',{method:'POST',cookie:admin,body:{...validPlace('Original little cafe'),photo:adminPhoto,status:'published'}});assert.equal(r.status,201);const unowned=r.data.place.id;
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:bob,body:{action:'claim',placeId:unowned,evidence:'tiny'}});assert.equal(r.status,201);const claimId=r.data.submission.id;
  r=await req(base,`/api/business/submissions/${claimId}/submit`,{method:'POST',cookie:bob});assert.equal(r.status,400);
  r=await req(base,`/api/business/submissions/${claimId}`,{method:'PUT',cookie:bob,body:{evidence:'I am the cafe manager. Check our registered address and call our telephone to verify this ownership.'}});assert.equal(r.status,200);
  r=await req(base,`/api/business/submissions/${claimId}/submit`,{method:'POST',cookie:bob});assert.equal(r.status,200);
  r=await req(base,'/api/places');assert.equal(r.data.places.length,2,'claim does not publish an update');
  r=await req(base,`/api/admin/business-submissions/${claimId}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200);
  r=await req(base,'/api/business/me',{cookie:bob});assert.ok(r.data.places.some(p=>p.id===unowned));
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:alice,body:{action:'claim',placeId:unowned,evidence:'This venue is mine, definitely mine, believe me and attach it.'}});assert.equal(r.status,409);
  // Admin changes make old edit proposals stale; approval MUST refuse stale overwrite.
  r=await req(base,'/api/business/submissions',{method:'POST',cookie:alice,body:{action:'edit',placeId:slug,payload:{...validPlace('Stale change'),photo:coverA}}});assert.equal(r.status,201);const staleId=r.data.submission.id;
  r=await req(base,`/api/business/submissions/${staleId}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,200);
  r=await req(base,`/api/admin/places/${slug}`,{method:'PUT',cookie:admin,body:{...validPlace('Changed by admin'),photo:coverA}});assert.equal(r.status,200);
  r=await req(base,`/api/admin/business-submissions/${staleId}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,409);
  r=await req(base,'/api/places');assert.ok(r.data.places.some(p=>p.en==='Changed by admin'));assert.ok(!r.data.places.some(p=>p.en==='Stale change'));
  r=await req(base,'/api/admin/business-submissions?status=pending',{cookie:admin});assert.ok(r.data.submissions.some(x=>x.id===staleId));
  r=await req(base,`/api/admin/business-submissions/${staleId}/decision`,{method:'POST',cookie:admin,body:{status:'rejected',note:'Place was updated; please review the current details'}});assert.equal(r.status,200);
  r=await req(base,`/api/business/submissions/${staleId}`,{method:'PUT',cookie:alice,body:{payload:{...validPlace('Owner update after new baseline'),photo:coverA}}});assert.equal(r.status,200);
  r=await req(base,`/api/business/submissions/${staleId}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,200,'rejected edit can be revised and resubmitted');
  r=await req(base,`/api/admin/business-submissions/${staleId}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200,'resubmission adopts the reviewed, current baseline');
  r=await req(base,'/api/places');assert.ok(r.data.places.some(x=>x.en==='Owner update after new baseline'));
  // Origin/cookie protection.
  r=await req(base,'/api/business/me');assert.equal(r.status,401);
  r=await req(base,'/api/admin/businesses',{cookie:alice});assert.equal(r.status,401);
  r=await req(base,'/api/business/register',{method:'POST',cookie:bob,body:{name:'Foo'},origin:'https://bad.example'});assert.equal(r.status,403);
  for(const page of ['/business.html','/business.js','/business.css','/business-admin.html','/business-admin.js']){const response=await fetch(base+page);assert.equal(response.status,200,page);}
  // No business-specific contact details in public place output.
  r=await req(base,'/api/places');assert.ok(!JSON.stringify(r.data).includes('owner1@example.com'));
  await stop(run);run=await launch(dir);
  const pub=await req(run.base,'/api/places');assert.equal(pub.data.places.length,2);
  r=await req(run.base,'/api/auth/login',{method:'POST',body:{email:'owner1@example.com',password:'a-long-test-password-2026'}});assert.equal(r.status,200);
  r=await req(run.base,'/api/business/me',{cookie:r.cookie});assert.equal(r.data.business.status,'approved');assert.ok(r.data.places.some(p=>p.id===slug));
 }finally{await stop(run);fs.rmSync(dir,{recursive:true,force:true})}
});
