'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.join(__dirname,'..');
async function start(dir){
 const child=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,UNFOLD_DATA_DIR:dir,UNFOLD_NO_BROWSER:'1',UNFOLD_REQUIRE_EMAIL_VERIFICATION:'1',PORT:'0',UNFOLD_RESEND_API_KEY:'',UNFOLD_EMAIL_FROM:''},stdio:['ignore','pipe','pipe']});
 let logs='';let done=false;
 child.stdout.on('data',x=>logs+=x.toString());child.stderr.on('data',x=>logs+=x.toString());
 await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Server did not start. '+logs)),15000);
   const poll=setInterval(()=>{if(logs.includes('Press Ctrl+C to stop.')){clearInterval(poll);clearTimeout(timer);done=true;resolve();}},25);
   child.once('exit',code=>{if(!done){clearInterval(poll);clearTimeout(timer);reject(new Error(`Unexpected exit ${code}: ${logs}`));}});
 });
 const url=logs.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0],setup=logs.match(/\n\s+([a-f0-9]{18})\n/)?.[1];
 return {child,url,setup,get logs(){return logs}};
}
async function call(base,route,{method='GET',body,cookie}={}){
 const headers={};if(body!==undefined)headers['content-type']='application/json';if(cookie)headers.cookie=cookie;
 const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 let data;try{data=await r.json()}catch{data={}};
 return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
async function waitToken(proc,type){
 for(let i=0;i<75;i++){
  const matches=[...proc.logs.matchAll(new RegExp(`\\[DEV MAIL ${type}\\].*\\?(?:verify|reset)=([a-f0-9]{64})#profile`,'g'))];
  if(matches.length)return matches.at(-1)[1];await new Promise(r=>setTimeout(r,20));
 }
 throw new Error(`No development ${type} link printed`);
}
test('v2.4 near-me search, price filters, verification, recovery and saved v2.2 compatibility',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-v24-'));
 let proc;
 try{
  proc=await start(dir);const base=proc.url;
  let r=await call(base,'/api/health');assert.equal(r.data.version,'2.7.0');
  r=await call(base,'/api/admin/setup',{method:'POST',body:{setupToken:proc.setup,password:'secure-admin-for-tests-2026'}});assert.equal(r.status,201);const admin=r.cookie;
  const image=fs.readFileSync(path.join(ROOT,'assets','terraced-fields.webp'));
  r=await call(base,'/api/admin/uploads',{method:'POST',cookie:admin,body:{dataUrl:'data:image/webp;base64,'+image.toString('base64')}});assert.equal(r.status,201);const photo=r.data.url;
  const basePlace={en:'Local Family Eatery',th:'ครัวคนท้องถิ่น',locEn:'Chiang Mai',locTh:'เชียงใหม่',category:'food',region:'north',lat:18.8,lon:98.98,visit:'1 hour',storyEn:'A real published test record',storyTh:'สำหรับทดสอบเท่านั้น',photo,gallery:[],featured:false,status:'published',priceFrom:220,currency:'THB'};
  r=await call(base,'/api/admin/places',{method:'POST',cookie:admin,body:basePlace});assert.equal(r.status,201);const nearId=r.data.place.id;assert.equal(r.data.place.priceFrom,220);
  r=await call(base,'/api/admin/places',{method:'POST',cookie:admin,body:{...basePlace,en:'Other Side of City',category:'stay',lat:19.5,lon:99.6,priceFrom:1500}});assert.equal(r.status,201);
  r=await call(base,'/api/admin/places',{method:'POST',cookie:admin,body:{...basePlace,en:'Hidden Draft',status:'draft',lat:18.80001,priceFrom:50}});assert.equal(r.status,201);
  r=await call(base,'/api/admin/places',{method:'POST',cookie:admin,body:{...basePlace,en:'Wrong Currency Venue',lat:18.801,lon:98.981,currency:'USD',priceFrom:5}});assert.equal(r.status,201);
  r=await call(base,'/api/places/nearby?lat=18.8&lon=98.98&radiusKm=5');assert.equal(r.status,200);assert.equal(r.data.count,2);
  assert.deepEqual(new Set(r.data.places.map(x=>x.en)),new Set(['Local Family Eatery','Wrong Currency Venue']));
  assert.equal(r.data.places[0].distanceKm,0);
  r=await call(base,'/api/places/nearby?lat=18.8&lon=98.98&radiusKm=5&category=food&maxPrice=300&currency=THB');assert.equal(r.status,200);assert.equal(r.data.count,1);assert.equal(r.data.places[0].id,nearId);
  r=await call(base,'/api/places/nearby?lat=18.8&lon=98.98&radiusKm=5&category=food&maxPrice=5&currency=USD');assert.equal(r.status,200);assert.equal(r.data.count,1);assert.equal(r.data.places[0].en,'Wrong Currency Venue');
  for(const invalid of ['lat=x&lon=98.98','lat=200&lon=99','lat=18&lon=99&radiusKm=-1','lat=18&lon=99&maxPrice=-10','lat=18&lon=99&category=bad']){
   r=await call(base,'/api/places/nearby?'+invalid);assert.equal(r.status,400,invalid);
  }
  r=await call(base,'/api/places/'+nearId);assert.equal(r.status,200);assert.equal(r.data.place.currency,'THB');
  r=await call(base,'/api/auth/register',{method:'POST',body:{name:'Test Traveller',email:'traveller@example.test',password:'secure-very-long-pass-2026'}});
  assert.equal(r.status,201);assert.equal(r.data.user.emailVerified,false);const traveller=r.cookie;
  let verifyToken=await waitToken(proc,'VERIFY');
  r=await call(base,'/api/places/'+nearId+'/my-review',{method:'PUT',cookie:traveller,body:{stars:5,text:'A real account must verify first.'}});assert.equal(r.status,403);
  r=await call(base,'/api/auth/verify',{method:'POST',body:{token:'0'.repeat(64)}});assert.equal(r.status,400);
  r=await call(base,'/api/auth/verify',{method:'POST',body:{token:verifyToken}});assert.equal(r.status,200);
  r=await call(base,'/api/auth/verify',{method:'POST',body:{token:verifyToken}});assert.equal(r.status,400,'Verification links cannot be replayed');
  r=await call(base,'/api/auth/me',{cookie:traveller});assert.equal(r.data.user.emailVerified,true);
  r=await call(base,'/api/me/profile',{method:'PATCH',cookie:traveller,body:{name:'New Traveller'}});assert.equal(r.status,200);assert.equal(r.data.user.name,'New Traveller');
  r=await call(base,'/api/me/collections',{method:'PUT',cookie:traveller,body:{saved:[nearId],trip:[nearId]}});assert.equal(r.status,200);
  r=await call(base,'/api/places/'+nearId+'/my-review',{method:'PUT',cookie:traveller,body:{stars:5,text:'Verified account review for the test.'}});assert.equal(r.status,200);
  r=await call(base,'/api/auth/password/forgot',{method:'POST',body:{email:'unknown@example.test'}});assert.equal(r.status,200);assert.match(r.data.message,/If this email/);
  r=await call(base,'/api/auth/password/forgot',{method:'POST',body:{email:'traveller@example.test'}});assert.equal(r.status,200);
  const resetToken=await waitToken(proc,'RESET');
  r=await call(base,'/api/auth/password/reset',{method:'POST',body:{token:resetToken,password:'short'}});assert.equal(r.status,400,'Weak password must not consume token');
  r=await call(base,'/api/auth/password/reset',{method:'POST',body:{token:resetToken,password:'a-brand-new-very-long-secret'}});assert.equal(r.status,200);
  r=await call(base,'/api/auth/password/reset',{method:'POST',body:{token:resetToken,password:'another-very-long-secret'}});assert.equal(r.status,400,'Reset links are one-time');
  r=await call(base,'/api/me/collections',{cookie:traveller});assert.equal(r.status,401,'Password reset invalidates existing sessions');
  r=await call(base,'/api/auth/login',{method:'POST',body:{email:'traveller@example.test',password:'secure-very-long-pass-2026'}});assert.equal(r.status,401);
  r=await call(base,'/api/auth/login',{method:'POST',body:{email:'traveller@example.test',password:'a-brand-new-very-long-secret'}});assert.equal(r.status,200);
  r=await call(base,'/api/me/collections',{cookie:r.cookie});assert.deepEqual(r.data.saved,[nearId]);
  proc.child.kill();await new Promise(resolve=>proc.child.once('exit',resolve));proc=await start(dir);
  r=await call(proc.url,'/api/places/nearby?lat=18.8&lon=98.98&radiusKm=5&maxPrice=300');assert.equal(r.status,200);assert.equal(r.data.count,1);
  r=await call(proc.url,'/api/auth/login',{method:'POST',body:{email:'traveller@example.test',password:'a-brand-new-very-long-secret'}});assert.equal(r.status,200);assert.equal(r.data.user.emailVerified,true);
  r=await call(proc.url,'/api/me/collections',{cookie:r.cookie});assert.deepEqual(r.data.trip,[nearId]);
 }finally{
  if(proc?.child&&!proc.child.killed){proc.child.kill();await new Promise(resolve=>proc.child.once('exit',resolve));}
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
