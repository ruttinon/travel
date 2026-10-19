'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.join(__dirname,'..');
async function runServer(dir){return await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PORT:'0',UNFOLD_DATA_DIR:dir,UNFOLD_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});let output='';let started=false;
 const timer=setTimeout(()=>{child.kill();reject(new Error('Startup timeout: '+output))},15000);
 child.stdout.on('data',buf=>{output+=buf.toString();if(!started&&output.includes('Press Ctrl+C to stop.')){started=true;clearTimeout(timer);resolve({child,url:output.match(/http:\/\/127\.0\.0\.1:\d+/)[0]})}});
 child.stderr.on('data',b=>{output+=b.toString()});child.on('error',reject);
 })}
async function req(base,route,opts={}){const headers={};if(opts.cookie)headers.Cookie=opts.cookie;if(opts.body)headers['Content-Type']='application/json';const response=await fetch(base+route,{method:opts.method||'GET',headers,body:opts.body?JSON.stringify(opts.body):undefined});return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]}}
test('v2.1 original-schema SQLite upgrades additively to v2.2 with existing places and Admin login preserved',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-migration-'));
 let processInfo;
 try{
 const db=new DatabaseSync(path.join(dir,'unfold.sqlite'));
 // Original v2.1 schema, before the new users/reviews tables exist.
 db.exec(`CREATE TABLE admins(id INTEGER PRIMARY KEY CHECK(id=1),salt TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
 CREATE TABLE places(slug TEXT PRIMARY KEY,name_en TEXT NOT NULL,name_th TEXT NOT NULL DEFAULT '',location_en TEXT NOT NULL,location_th TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,region TEXT NOT NULL,lat REAL,lon REAL,visit TEXT NOT NULL DEFAULT '',description_en TEXT NOT NULL DEFAULT '',description_th TEXT NOT NULL DEFAULT '',cover TEXT NOT NULL DEFAULT '',gallery_json TEXT NOT NULL DEFAULT '[]',featured INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'draft',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);`);
 const salt=crypto.randomBytes(16).toString('hex'),password='already-registered-admin-2026';const hash=crypto.scryptSync(password,salt,64,{maxmem:128*1024*1024}).toString('hex');
 db.prepare('INSERT INTO admins VALUES(1,?,?,?)').run(salt,hash,'2026-10-16T00:00:00.000Z');
 db.prepare('INSERT INTO places(slug,name_en,name_th,location_en,location_th,category,region,lat,lon,visit,description_en,description_th,cover,gallery_json,featured,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('old-mountain-cafe','Old Mountain Cafe','คาเฟ่บนเขา','Chiang Mai','เชียงใหม่','food','north',18.7,98.8,'1h','Existing content','ข้อมูลเดิม','/uploads/11111111-1111-4111-8111-111111111111.webp','[]',1,'published','2026-10-16','2026-10-16');
 db.close();
 processInfo=await runServer(dir);const base=processInfo.url;
 let res=await req(base,'/api/admin/status');assert.equal(res.body.setupRequired,false);
 res=await req(base,'/api/admin/login',{method:'POST',body:{password}});assert.equal(res.status,200);const adminCookie=res.cookie;
 res=await req(base,'/api/admin/places',{cookie:adminCookie});assert.equal(res.status,200);assert.equal(res.body.places[0].id,'old-mountain-cafe');
 res=await req(base,'/api/places');assert.equal(res.body.places.length,1);
 res=await req(base,'/api/auth/register',{method:'POST',body:{name:'Traveller',email:'traveller@example.test',password:'long-enough-password-2026'}});assert.equal(res.status,201);
 res=await req(base,'/api/me/collections',{method:'PUT',cookie:res.cookie,body:{saved:['old-mountain-cafe'],trip:['old-mountain-cafe']}});assert.equal(res.status,200);assert.deepEqual(res.body.saved,['old-mountain-cafe']);
 res=await req(base,'/api/admin/reviews?status=all',{cookie:adminCookie});assert.equal(res.status,200);
 }finally{if(processInfo?.child){processInfo.child.kill();await new Promise(resolve=>processInfo.child.once('exit',resolve))}fs.rmSync(dir,{recursive:true,force:true})}
});
