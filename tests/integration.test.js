'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function spawnServer(dataDir){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,UNFOLD_DATA_DIR:dataDir,PORT:'0',UNFOLD_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
    let output='',started=false;
    const timer=setTimeout(()=>reject(new Error('Startup timeout: '+output)),15000);
    child.stdout.on('data',chunk=>{output+=chunk.toString();const url=output.match(/\[READY\] unfold v2\.7\s+(http:\/\/127\.0\.0\.1:\d+)/);if(url&&!started){started=true;setTimeout(()=>{const setup=output.match(/\[FIRST TIME SETUP\][\s\S]*?\n\s+([a-f0-9]{18})/);clearTimeout(timer);resolve({child,url:url[1],setupToken:setup?.[1],output})},250)}});
    child.stderr.on('data',d=>{output+=d.toString()});
    child.once('error',reject);child.once('exit',code=>{if(!started)reject(new Error(`Exited ${code}: ${output}`))});
  });
}
async function request(base,pathname,{method='GET',cookie,body,origin}={}){
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;if(origin)headers.Origin=origin;
 const res=await fetch(base+pathname,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let json;try{json=await res.json()}catch{json={}}return {status:res.status,json,headers:res.headers};
}
test('unfold v2.2 backend: setup, draft, photo, publish, auth and restart persistence',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-test-'));
  let run;try{
    run=await spawnServer(dir);const base=run.url;
    assert.ok(run.setupToken,'setup code must be printed only in server stdout');
    let r=await request(base,'/api/health');assert.equal(r.status,200);assert.equal(r.json.published,0);
    r=await request(base,'/api/places');assert.deepEqual(r.json.places,[]);
    r=await request(base,'/api/admin/status');assert.equal(r.json.setupRequired,true);
    r=await request(base,'/api/admin/places');assert.equal(r.status,401);
    r=await request(base,'/api/admin/setup',{method:'POST',body:{setupToken:'000000',password:'a-valid-long-password'}});assert.equal(r.status,403);
    r=await request(base,'/api/admin/setup',{method:'POST',body:{setupToken:run.setupToken,password:'weak'}});assert.equal(r.status,400);
    r=await request(base,'/api/admin/setup',{method:'POST',body:{setupToken:run.setupToken,password:'long-test-passphrase-2026'}});assert.equal(r.status,201);
    const cookie=r.headers.get('set-cookie').split(';')[0];assert.match(cookie,/^unfold_admin=[a-f0-9]{64}$/);
    r=await request(base,'/api/admin/status',{cookie});assert.equal(r.json.authenticated,true);
    r=await request(base,'/api/admin/places',{cookie});assert.equal(r.status,200);assert.deepEqual(r.json.places,[]);
    const draft={en:'Test Mountain Homestay',th:'บ้านพักทดลอง',locEn:'Chiang Mai, Thailand',locTh:'เชียงใหม่',category:'stay',region:'north',lat:'',lon:'',visit:'2 nights',storyEn:'Test-only place, no public ratings.',storyTh:'ข้อมูลทดสอบ',photo:'',gallery:[],featured:true,status:'draft'};
    r=await request(base,'/api/admin/places',{method:'POST',cookie,body:draft});assert.equal(r.status,201);const slug=r.json.place.id;
    r=await request(base,'/api/places');assert.equal(r.json.places.length,0);
    r=await request(base,`/api/admin/places/${slug}`,{method:'PUT',cookie,body:{...draft,status:'published'}});assert.equal(r.status,400);assert.match(r.json.error,/coordinates and a photo/i);
    const img=fs.readFileSync(path.join(ROOT,'assets','terraced-fields.webp'));
    r=await request(base,'/api/admin/uploads',{method:'POST',cookie,body:{dataUrl:'data:image/webp;base64,'+img.toString('base64')}});assert.equal(r.status,201);const cover=r.json.url;assert.match(cover,/^\/uploads\/[a-f0-9-]+\.webp$/);
    const newPlace={...draft,photo:cover,lat:18.49,lon:98.45,gallery:[cover],status:'published'};
    r=await request(base,`/api/admin/places/${slug}`,{method:'PUT',cookie,body:newPlace});assert.equal(r.status,200);
    r=await request(base,'/api/places');assert.equal(r.json.places.length,1);assert.equal(r.json.places[0].id,slug);assert.equal(r.json.places[0].locTh,'เชียงใหม่');assert.equal(r.json.places[0].photo,cover);
    r=await request(base,'/api/places/'+slug);assert.equal(r.status,200);
    r=await request(base,cover);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/webp');
    r=await request(base,'/api/admin/uploads',{method:'POST',cookie,body:{dataUrl:'data:image/png;base64,'+img.toString('base64')}});assert.equal(r.status,400);
    r=await request(base,'/api/admin/places',{method:'POST',cookie,body:draft,origin:'https://attacker.invalid'});assert.equal(r.status,403);
    r=await request(base,'/data/unfold.sqlite');assert.equal(r.status,404);
    r=await request(base,'/admin.html');assert.equal(r.status,200);
    r=await request(base,'/api/admin/logout',{method:'POST',cookie});assert.equal(r.status,200);
    r=await request(base,'/api/admin/places',{cookie});assert.equal(r.status,401);
    run.child.kill();await new Promise(res=>run.child.once('exit',res));
    run=await spawnServer(dir);r=await request(run.url,'/api/places');assert.equal(r.json.places.length,1,'SQLite data must persist across restarts');
    r=await request(run.url,'/api/admin/status');assert.equal(r.json.setupRequired,false);
    r=await request(run.url,'/api/admin/login',{method:'POST',body:{password:'wrong-password'}});assert.equal(r.status,401);
    r=await request(run.url,'/api/admin/login',{method:'POST',body:{password:'long-test-passphrase-2026'}});assert.equal(r.status,200);
    const loggedInCookie=r.headers.get('set-cookie').split(';')[0];
    r=await request(run.url,`/api/admin/places/${slug}`,{method:'PUT',cookie:loggedInCookie,body:{...newPlace,status:'draft'}});assert.equal(r.status,200);
    r=await request(run.url,'/api/places');assert.equal(r.json.places.length,0,'Draft is never shown to public');
    r=await request(run.url,`/api/admin/places/${slug}`,{method:'DELETE',cookie:loggedInCookie});assert.equal(r.status,200);
    r=await request(run.url,'/api/admin/places',{cookie:loggedInCookie});assert.equal(r.json.places.length,0);
  }finally{if(run?.child&&run.child.exitCode===null){run.child.kill();await new Promise(res=>run.child.once('exit',res));}fs.rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
});
