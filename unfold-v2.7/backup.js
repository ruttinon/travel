'use strict';
// Consistent SQLite snapshot and uploaded photos with per-file SHA256 manifest.
// Never overwrites an existing backup; restores are handled by restore.js.
const {DatabaseSync,backup}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
const {integrity,contentsFor,verifyBackup}=require('./backup-lib');
const ROOT=__dirname;
const DATA=path.resolve(process.env.UNFOLD_DATA_DIR || (process.platform==='win32'&&process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'unfold-travel','data'):path.join(ROOT,'data')));
const DB=path.join(DATA,'unfold.sqlite');
const stamp=new Date().toISOString().replaceAll(':','-').replace(/\..+Z$/,'Z');
const target=path.resolve(process.argv[2]||path.join(ROOT,'backups',stamp));
function inside(candidate,parent){return candidate===parent||candidate.startsWith(parent+path.sep)}
async function run(){
 if(!fs.existsSync(DB))throw new Error('Database not found: '+DB);
 if(inside(target,DATA))throw new Error('Backup target cannot be inside the live data folder');
 if(fs.existsSync(target)&&fs.readdirSync(target).length)throw new Error('Backup destination already contains files: '+target);
 fs.mkdirSync(target,{recursive:true});
 const db=new DatabaseSync(DB);
 try{await backup(db,path.join(target,'unfold.sqlite'));}finally{db.close()}
 integrity(path.join(target,'unfold.sqlite'));
 for(const kind of ['uploads','review-media']){
  const src=path.join(DATA,kind);if(fs.existsSync(src))fs.cpSync(src,path.join(target,kind),{recursive:true,force:false});
 }
 const manifest={format:1,app:'unfold',version:'2.7.0',createdAt:new Date().toISOString(),files:contentsFor(target)};
 fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 verifyBackup(target);
 console.log('[BACKUP PASS]',manifest.files.length,'verified files,',manifest.files.filter(f=>f.file.startsWith('uploads/')).length,'place images,',manifest.files.filter(f=>f.file.startsWith('review-media/')).length,'review images at:',target);
}
run().catch(error=>{console.error('[BACKUP FAIL]',error.message);process.exitCode=1});
