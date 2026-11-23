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

// Tommy 2026-11-06: SME shop pages (backend/shop-pages.js). First version needs admin approval; later edits go live.
test('SME shop pages: first version approved by admin, later edits publish directly, safety checks',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-shop-'));let run;
 try{
  run=await launch(dir);const base=run.base;const admin=await adminSetup(run);
  const alice=await user(base,'shop1@example.com'),bob=await user(base,'shop2@example.com');
  await verified(base,alice,run,'shop1@example.com');await verified(base,bob,run,'shop2@example.com');
  const aId=await registerBusiness(base,alice,'Baan Coffee'),bId=await registerBusiness(base,bob,'Other Shop');
  for(const id of [aId,bId]){const d=await req(base,'/api/admin/businesses/'+id+'/decision',{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(d.status,200)}
  const cover=await upload(base,alice),bobPhoto=await upload(base,bob);
  let r=await req(base,'/api/business/submissions',{method:'POST',cookie:alice,body:{action:'create',payload:{...validPlace('Baan Coffee'),photo:cover}}});assert.equal(r.status,201);
  const sub=r.data.submission.id;
  r=await req(base,`/api/business/submissions/${sub}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,200);
  r=await req(base,`/api/admin/business-submissions/${sub}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200);
  const slug=r.data.submission.placeId;

  // Owner list gives a starter draft built from the place
  r=await req(base,'/api/business/shop-pages',{cookie:alice});assert.equal(r.status,200);assert.equal(r.data.pages.length,1);
  assert.equal(r.data.pages[0].page.status,'new');assert.equal(r.data.pages[0].page.content.sections[0].type,'hero');
  r=await req(base,'/api/business/shop-pages',{cookie:bob});assert.equal(r.data.pages.length,0);

  const gallery=[upload(base,alice),upload(base,alice)];const pics=await Promise.all(gallery);
  const content=(title,extra={})=>({template:'market',color:'sunset',sections:[
    {type:'hero',title,subtitle:'Slow coffee in the old town',image:cover},
    {type:'story',heading:'Our story',text:'Family roastery since 2019.\n\nBeans from Doi Chang.'},
    {type:'menu',heading:'Menu',items:[{name:'Latte',price:65,description:'Hot or iced'},{name:'Banana cake',price:'45'}]},
    {type:'gallery',images:pics},
    {type:'hours',lines:[{days:'Mon–Fri',time:'08:00–17:00'}]},
    {type:'contact',phone:'+66 81 234 5678',line:'baancoffee',facebook:'https://www.facebook.com/baancoffee'}],...extra});

  // Safety: no HTML injection survives, only our upload paths, https-only, Google links only from Google
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('x',{sections:[{type:'hero',title:'ok',image:'https://evil.example/a.jpg'}]})}});assert.equal(r.status,400);
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('x',{sections:[{type:'contact',website:'javascript:alert(1)'}]})}});assert.equal(r.status,400);
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('x',{sections:[{type:'contact',facebook:'https://evil.example/x'}]})}});assert.equal(r.status,400);
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('x',{google:{url:'https://evil.example/maps'}})}});assert.equal(r.status,400);
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('x',{sections:[{type:'script'}]})}});assert.equal(r.status,400);
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:bob,body:{content:content('Stolen')}});assert.equal(r.status,403,'other owner cannot edit');
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('Baan Coffee',{sections:[{type:'hero',title:'t',image:bobPhoto}]})}});assert.equal(r.status,403,'cannot use another business photo');
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('<img src=x onerror=alert(1)>Baan')}});assert.equal(r.status,200);
  assert.equal(r.data.page.content.sections[0].title,'<img src=x onerror=alert(1)>Baan','text stored as text; renderer escapes it');
  assert.equal(r.data.page.content.sections[5].line,'@baancoffee');

  // Nothing public yet; owner preview works; others cannot preview
  r=await req(base,`/api/shop-pages/${slug}`);assert.equal(r.status,404);
  r=await req(base,`/api/shop-pages/${slug}?draft=1`,{cookie:alice});assert.equal(r.status,200);assert.equal(r.data.page.content.template,'market');
  r=await req(base,`/api/shop-pages/${slug}?draft=1`,{cookie:bob});assert.equal(r.status,403);
  r=await req(base,`/api/shop-pages/${slug}?draft=1`);assert.equal(r.status,403);
  assert.equal((await fetch(base+pics[0])).status,404,'gallery photo private before approval');

  // First version → pending → admin approves
  r=await req(base,`/api/business/shop-pages/${slug}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,200);assert.equal(r.data.published,false);assert.equal(r.data.page.status,'pending');
  r=await req(base,`/api/business/shop-pages/${slug}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,409);
  r=await req(base,`/api/shop-pages/${slug}`);assert.equal(r.status,404,'pending first version is not public');
  r=await req(base,'/api/admin/shop-pages?status=pending',{cookie:alice});assert.equal(r.status,401);
  r=await req(base,'/api/admin/shop-pages?status=pending',{cookie:admin});assert.equal(r.status,200);assert.equal(r.data.pages.length,1);assert.equal(r.data.pages[0].businessName,'Baan Coffee');
  r=await req(base,`/api/admin/shop-pages/${slug}`,{cookie:admin});assert.equal(r.status,200);assert.equal(r.data.live,null);
  r=await req(base,`/api/admin/shop-pages/${slug}/decision`,{method:'POST',cookie:admin,body:{status:'rejected'}});assert.equal(r.status,400,'reject needs a note');
  r=await req(base,`/api/admin/shop-pages/${slug}/decision`,{method:'POST',cookie:admin,body:{status:'approved'}});assert.equal(r.status,200);
  r=await req(base,`/api/shop-pages/${slug}`);assert.equal(r.status,200);assert.equal(r.data.page.content.color,'sunset');assert.equal(r.data.googleUrl,'','no Google button for an SME without a Google listing');
  assert.equal((await fetch(base+pics[0])).status,200,'gallery photo public after approval');
  r=await req(base,'/api/shop-pages');assert.deepEqual(r.data.pages.map(p=>p.id),[slug]);
  assert.equal((await fetch(base+'/shop/'+slug)).status,200);
  for(const f of ['/shop-render.js','/shop-render.css','/shop.js'])assert.equal((await fetch(base+f)).status,200,f);

  // Later edits publish directly (no admin), including linking Google
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('Baan Coffee v2',{google:{url:'https://maps.app.goo.gl/AbCdEf123'}})}});assert.equal(r.status,200);
  assert.equal(r.data.page.status,'approved');assert.equal(r.data.page.hasChanges,true);
  r=await req(base,`/api/shop-pages/${slug}`);assert.equal(r.data.page.content.sections[0].title,'<img src=x onerror=alert(1)>Baan','saved but unpublished edits stay hidden');
  r=await req(base,`/api/business/shop-pages/${slug}/submit`,{method:'POST',cookie:alice});assert.equal(r.status,200);assert.equal(r.data.published,true);
  r=await req(base,`/api/shop-pages/${slug}`);assert.equal(r.data.page.content.sections[0].title,'Baan Coffee v2');assert.equal(r.data.googleUrl,'https://maps.app.goo.gl/AbCdEf123');
  r=await req(base,'/api/admin/shop-pages?status=pending',{cookie:admin});assert.equal(r.data.pages.length,0,'edits did not wait for admin');

  // Admin can hide; owner fix → back to admin
  r=await req(base,`/api/admin/shop-pages/${slug}/unpublish`,{method:'POST',cookie:admin,body:{note:'Wrong phone number'}});assert.equal(r.status,200);
  r=await req(base,`/api/shop-pages/${slug}`);assert.equal(r.status,404);
  r=await req(base,`/api/business/shop-pages/${slug}/submit`,{method:'POST',cookie:alice});assert.equal(r.data.published,false);assert.equal(r.data.page.status,'pending');
  r=await req(base,`/api/admin/shop-pages/${slug}/decision`,{method:'POST',cookie:admin,body:{status:'approved',note:'Fixed'}});assert.equal(r.status,200);
  r=await req(base,`/api/shop-pages/${slug}`);assert.equal(r.status,200);

  // Google Place ID linked on a page goes onto the place (used by the app's Google button)
  r=await req(base,`/api/business/shop-pages/${slug}`,{method:'PUT',cookie:alice,body:{content:content('Baan Coffee v3',{google:{placeId:'ChIJN1t_tDeuEmsRUsoyG83frY4'}})}});assert.equal(r.status,200);
  r=await req(base,`/api/business/shop-pages/${slug}/submit`,{method:'POST',cookie:alice});assert.equal(r.data.published,true);
  r=await req(base,'/api/places');assert.equal(r.data.places.find(p=>p.id===slug).googlePlaceId,'ChIJN1t_tDeuEmsRUsoyG83frY4');
  r=await req(base,`/api/shop-pages/${slug}`);assert.match(r.data.googleUrl,/query_place_id=ChIJN1t_tDeuEmsRUsoyG83frY4/);
 }finally{await stop(run);fs.rmSync(dir,{recursive:true,force:true})}
});
