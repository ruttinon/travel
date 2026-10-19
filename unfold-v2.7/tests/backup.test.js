'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
test('backup retains SQLite, place pictures and review images',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'unfold-backup-v22-'));const data=path.join(tmp,'live'),out=path.join(tmp,'backup');fs.mkdirSync(path.join(data,'uploads'),{recursive:true});fs.mkdirSync(path.join(data,'review-media'));
 try{
  const source=path.join(data,'unfold.sqlite');const db=new DatabaseSync(source);db.exec('CREATE TABLE sample (value TEXT); INSERT INTO sample VALUES (\'saved collections\');');db.close();
  fs.writeFileSync(path.join(data,'uploads','place.png'),'place bytes');fs.writeFileSync(path.join(data,'review-media','review.png'),'review bytes');
  const result=spawnSync(process.execPath,[path.join(__dirname,'..','backup.js'),out],{env:{...process.env,UNFOLD_DATA_DIR:data},encoding:'utf8',timeout:15000});
  assert.equal(result.status,0,result.stderr+result.stdout);assert.match(result.stdout,/BACKUP PASS/);
  const restored=new DatabaseSync(path.join(out,'unfold.sqlite'));assert.equal(restored.prepare('SELECT value FROM sample').get().value,'saved collections');restored.close();
  assert.equal(fs.readFileSync(path.join(out,'uploads','place.png'),'utf8'),'place bytes');
  assert.equal(fs.readFileSync(path.join(out,'review-media','review.png'),'utf8'),'review bytes');
 }finally{fs.rmSync(tmp,{force:true,recursive:true})}
});
