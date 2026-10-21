'use strict';
// Offline, verified restore. Default is dry-run; --apply requires the local app to be stopped.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {verifyBackup,integrity}=require('./backup-lib');
const ROOT=__dirname;
const DATA=path.resolve(process.env.UNFOLD_DATA_DIR || (process.platform==='win32'&&process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'unfold-travel','data'):path.join(ROOT,'data')));
const args=process.argv.slice(2),source=args.find(x=>!x.startsWith('--'));const apply=args.includes('--apply');
function fail(msg){throw new Error(msg)}
function activeServer(){const lock=path.join(DATA,'server.pid');if(!fs.existsSync(lock))return false;
 let pid;try{pid=JSON.parse(fs.readFileSync(lock,'utf8')).pid}catch{fail('Unrecognizable server.pid lock. Stop server and inspect this file.')}if(!Number.isInteger(pid)||pid<1)fail('Invalid server.pid lock');
 try{process.kill(pid,0);return true}catch(e){return e.code!=='ESRCH'}
}
function run(){
 if(!source)fail('Usage: node restore.js PATH_TO_BACKUP [--apply]. Default: DRY RUN only.');
 const sourceRoot=path.resolve(source);
 if(sourceRoot===DATA||sourceRoot.startsWith(DATA+path.sep))fail('Choose backup outside the live data folder');
 if(DATA.startsWith(sourceRoot+path.sep))fail('Backup folder may not contain live data directory');
 const report=verifyBackup(sourceRoot);
 console.log('[VERIFY PASS] SHA256 + SQLite integrity + foreign keys:',report.files,'files');
 if(activeServer())fail('Unfold server is still running. Stop START-WINDOWS.cmd before restoring.');
 if(!apply){console.log('[DRY RUN] Live data has NOT changed. To apply: node restore.js "'+sourceRoot+'" --apply');return;}
 const stamp=new Date().toISOString().replaceAll(':','-').replace(/\..+Z$/,'Z');
 const holding=DATA+'.pre-restore-'+stamp,staging=DATA+'.staging-'+stamp;
 const safety=path.join(ROOT,'backups','pre-restore-'+stamp);
 if(fs.existsSync(holding)||fs.existsSync(staging))fail('Temporary restore folder already exists');
 if(fs.existsSync(path.join(DATA,'unfold.sqlite'))){
   const result=spawnSync(process.execPath,[path.join(ROOT,'backup.js'),safety],{encoding:'utf8',env:process.env,timeout:120000});
   if(result.status!==0)fail('Could not create safety backup, restore aborted: '+(result.stderr||result.stdout).slice(0,600));
   console.log('[SAFETY BACKUP]',safety);
 }
 fs.mkdirSync(staging,{recursive:true});
 let moved=false,swapped=false;
 try{
  fs.copyFileSync(path.join(sourceRoot,'unfold.sqlite'),path.join(staging,'unfold.sqlite'));
  for(const folder of ['uploads','review-media','safety-media']){
   if(fs.existsSync(path.join(sourceRoot,folder)))fs.cpSync(path.join(sourceRoot,folder),path.join(staging,folder),{recursive:true});
  }
  integrity(path.join(staging,'unfold.sqlite'));
  if(fs.existsSync(DATA)){fs.renameSync(DATA,holding);moved=true;}
  fs.renameSync(staging,DATA);swapped=true;
  integrity(path.join(DATA,'unfold.sqlite'));
  if(moved)fs.rmSync(holding,{recursive:true,force:true});
  console.log('[RESTORE PASS]',report.files,'verified files restored to',DATA);
 }catch(e){
  if(swapped&&fs.existsSync(DATA))fs.renameSync(DATA,staging);
  if(moved&&fs.existsSync(holding))fs.renameSync(holding,DATA);
  fail('Restore aborted / rolled back: '+e.message);
 }finally{if(fs.existsSync(staging))fs.rmSync(staging,{recursive:true,force:true})}
}
try{run()}catch(e){console.error('[RESTORE FAIL]',e.message);process.exitCode=1}
