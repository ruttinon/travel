'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
function hashFile(file){const h=crypto.createHash('sha256');h.update(fs.readFileSync(file));return h.digest('hex')}
function walk(root,sub=''){
 const dir=path.join(root,sub);if(!fs.existsSync(dir))return [];
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
   if(item.isSymbolicLink())throw new Error('Symlink rejected in backup: '+path.join(sub,item.name));
   const p=path.join(sub,item.name);
   if(item.isDirectory())return walk(root,p);
   if(!item.isFile())throw new Error('Unexpected non-file in backup: '+p);
   return [p.split(path.sep).join('/')];
 }).sort();
}
function contentsFor(root){const names=['unfold.sqlite',...walk(root,'uploads'),...walk(root,'review-media')].filter((v,i,a)=>a.indexOf(v)===i).sort();
 return names.map(file=>{
   const absolute=path.resolve(root,file);const stat=fs.statSync(absolute);
   if(!stat.isFile()||stat.isSymbolicLink())throw new Error('Invalid backup file: '+file);
   return {file,size:stat.size,sha256:hashFile(absolute)};
 });
}
function integrity(file){
 const db=new DatabaseSync(file,{readOnly:true});
 try{
  const check=db.prepare('PRAGMA integrity_check').all();
  if(check.length!==1||check[0].integrity_check!=='ok')throw new Error('SQLite integrity_check failed: '+JSON.stringify(check).slice(0,300));
  const fk=db.prepare('PRAGMA foreign_key_check').all();if(fk.length)throw new Error('SQLite foreign_key_check failed: '+fk.length+' violation(s)');
  return true;
 }finally{db.close()}
}
function verifyBackup(folder){
 const root=path.resolve(folder),file=path.join(root,'manifest.json');
 if(!fs.existsSync(file))throw new Error('Missing manifest.json. This tool needs a v2.7 verified backup (older backups need manual migration).');
 const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
 if(manifest.format!==1||!Array.isArray(manifest.files))throw new Error('Unsupported backup manifest format');
 const actual=contentsFor(root);
 if(JSON.stringify(manifest.files)!==JSON.stringify(actual))throw new Error('Backup failed hash / size / file inventory verification');
 if(!manifest.files.some(f=>f.file==='unfold.sqlite'))throw new Error('Database missing from backup');
 integrity(path.join(root,'unfold.sqlite'));
 return {root,manifest,files:actual.length};
}
module.exports={hashFile,walk,contentsFor,integrity,verifyBackup};
