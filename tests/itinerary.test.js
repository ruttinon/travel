'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
async function launch(dataDir){return new Promise((resolve,reject)=>{
 const proc=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,UNFOLD_DATA_DIR:dataDir,UNFOLD_NO_BROWSER:'1',PORT:'0'},stdio:['ignore','pipe','pipe']});
 let out='',err='';const timer=setTimeout(()=>{proc.kill();reject(new Error('Server timeout: '+out+err))},12000);let done=false;
 proc.stdout.on('data',d=>{out+=d.toString();const u=out.match(/\[READY\] unfold v2\.7\s+(http:\/\/127\.0\.0\.1:\d+)/);if(u&&out.includes('Press Ctrl+C to stop.')&&!done){done=true;clearTimeout(timer);resolve({proc,url:u[1],setup:out.match(/\n\s+([a-f0-9]{18})\n/)?.[1]})}});
 proc.stderr.on('data',d=>err+=d.toString());proc.on('error',reject);proc.on('exit',()=>{if(!done)reject(new Error('Server exit '+out+err))});
})}
async function req(url,route,method='GET',body,cookie){const headers={};if(body!==undefined)headers['content-type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(url+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let data={};try{data=await r.json()}catch{}return{status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]}}
const place=(name,photo,status='published')=>({en:name,th:'สถานที่ทดลอง',locEn:'Chiang Mai',locTh:'เชียงใหม่',category:'nature',region:'north',lat:18.72,lon:98.98,visit:'2–4h',storyEn:'For integration testing only',storyTh:'ทดสอบ',photo,gallery:[],featured:false,status,priceFrom:120,currency:'THB'});
test('v2.6 trip plans: validation, account isolation, draft visibility, updates and persistence',async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-v26-'));let run;try{
 run=await launch(data);const base=run.url;
 let r=await req(base,'/api/admin/setup','POST',{setupToken:run.setup,password:'test-admin-password-2026'});assert.equal(r.status,201);const admin=r.cookie;
 const image=fs.readFileSync(path.join(ROOT,'assets','terraced-fields.webp'));
 r=await req(base,'/api/admin/uploads','POST',{dataUrl:'data:image/webp;base64,'+image.toString('base64')},admin);assert.equal(r.status,201);const photo=r.data.url;
 r=await req(base,'/api/admin/places','POST',place('Forest Site',photo),admin);assert.equal(r.status,201);const id=r.data.place.id;
 r=await req(base,'/api/admin/places','POST',place('Hidden Draft',photo,'draft'),admin);assert.equal(r.status,201);const draftId=r.data.place.id;
 const register=async(email)=>{const q=await req(base,'/api/auth/register','POST',{name:'Visitor Example',email,password:'a-long-password-2026'});assert.equal(q.status,201);return q.cookie};
 const a=await register('a@trip.example'),b=await register('b@trip.example');
 assert.equal((await req(base,'/api/me/itineraries')).status,401);
 const valid={title:'My mountains',days:2,hoursPerDay:6,currency:'THB',budget:2000,travelMode:'driving',groups:[[id],[]]};
 for(const bad of [{...valid,days:9},{...valid,groups:[[id],[id]]},{...valid,groups:[[draftId],[]]},{...valid,groups:[['not-found'],[]]},{...valid,budget:-1},{...valid,travelMode:'rocket'}, {...valid,title:''}]){
  r=await req(base,'/api/me/itineraries','POST',bad,a);assert.ok([400,404].includes(r.status),JSON.stringify(bad));
 }
 r=await req(base,'/api/me/itineraries','POST',valid,a);assert.equal(r.status,201,JSON.stringify(r.data));const tripId=r.data.itinerary.id;
 r=await req(base,'/api/me/itineraries','GET',undefined,a);assert.equal(r.data.itineraries.length,1);assert.equal(r.data.itineraries[0].groups[0][0],id);
 r=await req(base,'/api/me/itineraries','GET',undefined,b);assert.deepEqual(r.data.itineraries,[],'other user must see zero');
 r=await req(base,`/api/me/itineraries/${tripId}`,'GET',undefined,b);assert.equal(r.status,404);
 r=await req(base,`/api/me/itineraries/${tripId}`,'PUT',{...valid,title:'attack'},b);assert.equal(r.status,404);
 r=await req(base,`/api/me/itineraries/${tripId}`,'DELETE',undefined,b);assert.equal(r.status,404);
 r=await req(base,`/api/me/itineraries/${tripId}`,'PUT',{...valid,title:'Revised escape',groups:[[],[id]]},a);assert.equal(r.status,200);assert.equal(r.data.itinerary.title,'Revised escape');
 // Publishing changes immediately affect public plan exposure; drafts are never returned.
 r=await req(base,`/api/admin/places/${id}`,'PUT',place('Forest Site',photo,'draft'),admin);assert.equal(r.status,200);
 r=await req(base,`/api/me/itineraries/${tripId}`,'GET',undefined,a);assert.deepEqual(r.data.itinerary.groups,[[],[]]);
 run.proc.kill();await new Promise(done=>run.proc.once('exit',done));run=await launch(data);
 r=await req(run.url,'/api/auth/login','POST',{email:'a@trip.example',password:'a-long-password-2026'});assert.equal(r.status,200);const session=r.cookie;
 r=await req(run.url,'/api/me/itineraries','GET',undefined,session);assert.equal(r.data.itineraries.length,1);assert.equal(r.data.itineraries[0].title,'Revised escape');
 r=await req(run.url,`/api/me/itineraries/${tripId}`,'DELETE',undefined,session);assert.equal(r.status,200);
 r=await req(run.url,'/api/me/itineraries','GET',undefined,session);assert.equal(r.data.itineraries.length,0);
 }finally{if(run?.proc?.exitCode===null){run.proc.kill();await new Promise(done=>run.proc.once('exit',done))}fs.rmSync(data,{recursive:true,force:true})}
});
