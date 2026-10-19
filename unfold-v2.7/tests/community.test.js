'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const ROOT=path.join(__dirname,'..');
async function start(dir){
 const child=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PORT:'0',UNFOLD_DATA_DIR:dir,UNFOLD_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
 let out='',started=false;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{child.kill();reject(new Error('Startup timeout: '+out))},10000);
  child.stdout.on('data',chunk=>{out+=chunk.toString();if(!started&&out.includes('Press Ctrl+C to stop.')){started=true;clearTimeout(timer);const match=out.match(/http:\/\/127\.0\.0\.1:\d+/),token=out.match(/\n\s+([a-f0-9]{18})\n/);resolve({child,url:match[0],setup:token?.[1]});}});
  child.stderr.on('data',x=>{out+=x.toString()});child.on('error',reject);child.on('exit',code=>{if(!started)reject(new Error(`Child ${code}: ${out}`))});
 });
}
async function call(base,route,{method='GET',cookie,body,origin,read='json'}={}){
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;if(origin)headers.Origin=origin;
 const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 let obj={};if(read==='json'){try{obj=await r.json()}catch{}}else if(read==='text')obj=await r.text();
 return {status:r.status,data:obj,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};
}
test('v2.2 community: accounts isolated, saved+trip persisted, review photos private until approval, moderation and upgrade',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-v22-community-'));
 let run;try{
  run=await start(dir);const base=run.url;
  // In-place upgrade: old v2.1 fields remain usable (no destructive migrations).
  assert.equal((await call(base,'/api/health')).data.version,'2.7.0');
  const missing=await call(base,'/api/me/collections');assert.equal(missing.status,401);
  const place={en:'Community Test Cafe',th:'คาเฟ่ทดสอบ',locEn:'Chiang Mai, Thailand',locTh:'เชียงใหม่',category:'food',region:'north',lat:18.8,lon:98.98,visit:'1h',storyEn:'For verified test only',storyTh:'ตัวอย่าง',photo:'',gallery:[],status:'draft'};
  let r=await call(base,'/api/admin/setup',{method:'POST',body:{setupToken:run.setup,password:'very-long-admin-pass-2026'}});
  assert.equal(r.status,201);const admin=r.cookie;
  r=await call(base,'/api/admin/places',{method:'POST',cookie:admin,body:place});assert.equal(r.status,201);const slug=r.data.place.id;
  const img=fs.readFileSync(path.join(ROOT,'assets','terraced-fields.webp'));
  r=await call(base,'/api/admin/uploads',{method:'POST',cookie:admin,body:{dataUrl:'data:image/webp;base64,'+img.toString('base64')}});assert.equal(r.status,201);
  r=await call(base,`/api/admin/places/${slug}`,{method:'PUT',cookie:admin,body:{...place,photo:r.data.url,status:'published'}});assert.equal(r.status,200);
  r=await call(base,`/api/places/${slug}/reviews`);assert.equal(r.status,200);assert.deepEqual(r.data.reviews,[]);
  r=await call(base,'/api/auth/register',{method:'POST',body:{name:'A',email:'a@a.test',password:'short'}});assert.equal(r.status,400);
  r=await call(base,'/api/auth/register',{method:'POST',body:{name:'Avery',email:'avery@example.test',password:'unfold-avery-secure-2026'}});assert.equal(r.status,201);const userA=r.cookie;assert.match(userA,/unfold_user=/);
  r=await call(base,'/api/auth/register',{method:'POST',body:{name:'Avery 2',email:'AVERY@EXAMPLE.TEST',password:'another-long-secret-2026'}});assert.equal(r.status,409);
  r=await call(base,'/api/auth/register',{method:'POST',body:{name:'Bea',email:'bea@example.test',password:'unfold-bea-secure-2026'}});assert.equal(r.status,201);const userB=r.cookie;
  r=await call(base,'/api/auth/me',{cookie:userA});assert.equal(r.data.user.email,'avery@example.test');assert.ok(!JSON.stringify(r.data).includes('password_hash'));
  r=await call(base,'/api/me/collections',{method:'PUT',cookie:userA,body:{saved:[slug],trip:[slug]}});assert.equal(r.status,200);assert.deepEqual(r.data.trip,[slug]);
  r=await call(base,'/api/me/collections',{cookie:userB});assert.deepEqual(r.data.saved,[]);assert.deepEqual(r.data.trip,[]);
  r=await call(base,'/api/me/collections',{method:'PUT',cookie:userB,body:{saved:[slug,'missing-place'],trip:[]}});assert.equal(r.status,404);
  r=await call(base,'/api/me/collections',{cookie:userB});assert.deepEqual(r.data.saved,[],'failed replacement cannot change data');
  r=await call(base,'/api/me/collections',{method:'PUT',cookie:userB,origin:'https://attacker.example',body:{saved:[],trip:[]}});assert.equal(r.status,403);
  r=await call(base,`/api/places/${slug}/my-review`,{method:'PUT',body:{stars:5,text:'Unverified guest review'}});assert.equal(r.status,401);
  r=await call(base,`/api/places/${slug}/my-review`,{method:'PUT',cookie:userA,body:{stars:7,text:'A long review to test moderation'}});assert.equal(r.status,400);
  r=await call(base,'/api/reviews/upload',{method:'POST',cookie:userA,body:{dataUrl:'data:image/webp;base64,'+img.toString('base64')}});assert.equal(r.status,201);const reviewPhoto=r.data.url;assert.match(reviewPhoto,/^\/review-media\/[a-f0-9-]+\.webp$/);
  assert.equal((await call(base,reviewPhoto,{read:'text'})).status,404,'unapproved review media private');
  assert.equal((await call(base,reviewPhoto,{cookie:userB,read:'text'})).status,404,'review image cannot be browsed by another user');
  assert.equal((await call(base,reviewPhoto,{cookie:userA,read:'text'})).status,200,'image owner can preview');
  assert.equal((await call(base,'/api/admin'+reviewPhoto,{cookie:admin,read:'text'})).status,200,'admin can preview unapproved review images');
  assert.equal((await call(base,'/api/admin'+reviewPhoto,{read:'text'})).status,401,'unapproved admin preview protected');
  r=await call(base,`/api/places/${slug}/my-review`,{method:'PUT',cookie:userB,body:{stars:5,text:'I cannot use another person photo',photo:reviewPhoto}});assert.equal(r.status,403);
  r=await call(base,`/api/places/${slug}/my-review`,{method:'PUT',cookie:userA,body:{stars:4,text:'Warm welcome and a lovely local lunch.',photo:reviewPhoto}});assert.equal(r.status,200);const reviewId=r.data.review.id;assert.equal(r.data.review.status,'pending');
  r=await call(base,`/api/places/${slug}/reviews`);assert.deepEqual(r.data.reviews,[]);
  r=await call(base,'/api/admin/reviews');assert.equal(r.status,401);
  r=await call(base,'/api/admin/reviews',{cookie:admin});assert.equal(r.status,200);assert.equal(r.data.reviews[0].id,reviewId);
  r=await call(base,`/api/admin/reviews/${reviewId}`,{method:'PATCH',cookie:userA,body:{status:'approved'}});assert.equal(r.status,401);
  r=await call(base,`/api/admin/reviews/${reviewId}`,{method:'PATCH',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200);
  r=await call(base,`/api/places/${slug}/reviews`);assert.equal(r.status,200);assert.equal(r.data.reviews.length,1);assert.equal(r.data.reviews[0].stars,4);assert.ok(!('email' in r.data.reviews[0]));
  r=await call(base,reviewPhoto,{read:'text'});assert.equal(r.status,200,'image becomes public only when approved');
  r=await call(base,`/api/places/${slug}/my-review`,{method:'PUT',cookie:userA,body:{stars:3,text:'I have amended my original review.',photo:reviewPhoto}});assert.equal(r.status,200);assert.equal(r.data.review.status,'pending');
  r=await call(base,`/api/places/${slug}/reviews`);assert.equal(r.data.reviews.length,0,'editing automatically removes approval');
  r=await call(base,reviewPhoto,{read:'text'});assert.equal(r.status,404,'photo becomes private again after editing');
  r=await call(base,`/api/admin/reviews/${reviewId}`,{method:'PATCH',cookie:admin,body:{status:'rejected'}});assert.equal(r.status,200);
  r=await call(base,'/api/me/reviews',{cookie:userA});assert.equal(r.data.reviews[0].status,'rejected');
  r=await call(base,`/api/places/${slug}/reviews`);assert.equal(r.data.reviews.length,0);
  r=await call(base,'/api/auth/logout',{method:'POST',cookie:userA});assert.equal(r.status,200);assert.equal((await call(base,'/api/me/collections',{cookie:userA})).status,401);
  r=await call(base,'/api/auth/login',{method:'POST',body:{email:'avery@example.test',password:'unfold-avery-secure-2026'}});assert.equal(r.status,200);const logged=r.cookie;
  r=await call(base,'/api/me/collections',{cookie:logged});assert.deepEqual(r.data.saved,[slug]);assert.deepEqual(r.data.trip,[slug]);
  // Test upgrade preserves existing v2.1 public content AND new user account data.
  run.child.kill();await new Promise(resolve=>run.child.once('exit',resolve));run=await start(dir);
  assert.equal((await call(run.url,'/api/places')).data.places.length,1);
  r=await call(run.url,'/api/auth/login',{method:'POST',body:{email:'avery@example.test',password:'unfold-avery-secure-2026'}});assert.equal(r.status,200);
  r=await call(run.url,'/api/me/collections',{cookie:r.cookie});assert.deepEqual(r.data.saved,[slug]);
  // Existing admin re-login works after migration.
  r=await call(run.url,'/api/admin/login',{method:'POST',body:{password:'very-long-admin-pass-2026'}});assert.equal(r.status,200);
  assert.equal((await call(run.url,'/api/admin/reviews?status=all',{cookie:r.cookie})).data.reviews.length,1);
 }finally{
  if(run?.child&&!run.child.killed){run.child.kill();await new Promise(resolve=>run.child.once('exit',resolve));}
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
