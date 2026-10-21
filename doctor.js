'use strict';
// Non-destructive local readiness check. Does not create/modify the database.
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const ROOT=__dirname;
const DATA=path.resolve(process.env.UNFOLD_DATA_DIR || (process.platform==='win32'&&process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'unfold-travel','data'):path.join(ROOT,'data')));
const FILE=path.join(DATA,'unfold.sqlite');
const result={app:'unfold',version:'2.7.0',dataDirectory:DATA,checks:[],totals:{},ready:false};
function check(name,status,details){result.checks.push({name,status,details})}
function table(db,name){return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name)?db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get().n:null}
function run(){
 const node=process.versions.node.split('.').map(Number);check('Node.js runtime',(node[0]>22||node[0]===22&&node[1]>=14)?'PASS':'FAIL',process.version);
 if(!fs.existsSync(FILE)){check('SQLite database','FAIL','No database. Start unfold once to initialize.');return}
 let db;try{db=new DatabaseSync(FILE,{readOnly:true});
  const x=db.prepare('PRAGMA integrity_check').all();check('SQLite integrity',x.length===1&&x[0].integrity_check==='ok'?'PASS':'FAIL',JSON.stringify(x).slice(0,500));
  const fk=db.prepare('PRAGMA foreign_key_check').all();check('Foreign keys',fk.length===0?'PASS':'FAIL',fk.length+' violation(s)');
  const names=['admins','places','users','reviews','businesses','business_submissions','user_itineraries','audit_events'];
  for(const name of names){const n=table(db,name);if(n==null)check('Table '+name,'FAIL','Not found');else result.totals[name]=n}
  let missing=[];
  const images=[];
  if(table(db,'places')!==null)for(const p of db.prepare('SELECT slug,cover,gallery_json FROM places').all()){
   if(p.cover)images.push({owner:p.slug,url:p.cover});
   try{for(const url of JSON.parse(p.gallery_json))if(url)images.push({owner:p.slug,url})}catch{missing.push('Invalid gallery JSON: '+p.slug)}
  }
  if(table(db,'reviews')!==null)for(const r of db.prepare('SELECT id,photo FROM reviews WHERE photo<>\'\'').all())images.push({owner:r.id,url:r.photo});
  for(const img of images){const folder=img.url.startsWith('/review-media/')?'review-media':'uploads',basename=path.basename(img.url);
   if(!/^\/(?:review-media|uploads)\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(img.url)||!fs.existsSync(path.join(DATA,folder,basename)))missing.push(img.owner+' references missing media '+img.url);
  }
  check('Referenced images',missing.length?'FAIL':'PASS',missing.length?missing.slice(0,10):images.length+' references checked');
  check('Email delivery','WARN',process.env.UNFOLD_RESEND_API_KEY&&process.env.UNFOLD_EMAIL_FROM&&process.env.UNFOLD_PUBLIC_URL?'Provider environment variables supplied; delivery not tested':'Real email delivery not configured / not verified');
  check('Public hosting','WARN','Designed for local-only HTTP. Do not open directly to public internet.');
 }catch(e){check('Database check','FAIL',e.message)}finally{if(db)db.close()}
}
run();result.ready=!result.checks.some(c=>c.status==='FAIL');
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));else{
 console.log('\nUNFOLD v2.7 READINESS REPORT\nData:',DATA);
 for(const x of result.checks)console.log(`[${x.status}] ${x.name}:`,typeof x.details==='string'?x.details:JSON.stringify(x.details));
 console.log('Record counts:',JSON.stringify(result.totals));console.log(result.ready?'[LOCAL DATA CHECK PASS]':'[LOCAL DATA CHECK FAIL]');
}
if(!result.ready)process.exitCode=1;
