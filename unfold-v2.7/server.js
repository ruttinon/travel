'use strict';
// unfold v2.7 — Functional readiness, audit trails, validated backups and cross-role integration checks.
// Requires Node.js 22.16+ / 24+. No npm install or third-party dependencies.
const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = __dirname;
const DATA = path.resolve(process.env.UNFOLD_DATA_DIR || (process.platform==='win32'&&process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA,'unfold-travel','data') : path.join(ROOT,'data')));
const UPLOADS = path.join(DATA, 'uploads');
const REVIEW_UPLOADS = path.join(DATA,'review-media');
fs.mkdirSync(UPLOADS, { recursive: true });
fs.mkdirSync(REVIEW_UPLOADS, { recursive: true });
// Prevent running two server processes against the same local SQLite data directory.
const SERVER_PID_FILE=path.join(DATA,'server.pid');
function pidAlive(pid){
 if(!Number.isInteger(pid)||pid<1)return false;
 try{process.kill(pid,0);return true;}catch(e){return e.code!=='ESRCH';}
}
function lockDataDirectory(){
 try{fs.writeFileSync(SERVER_PID_FILE,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}),{flag:'wx'});}
 catch(error){
  if(error.code!=='EEXIST')throw error;
  let pid;try{pid=JSON.parse(fs.readFileSync(SERVER_PID_FILE,'utf8')).pid}catch{throw new Error('Existing server.pid is unreadable; inspect the data directory before starting');}
  if(pidAlive(pid))throw new Error('Another unfold server appears to be running with this database (PID '+pid+'). Close it first.');
  fs.rmSync(SERVER_PID_FILE);fs.writeFileSync(SERVER_PID_FILE,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}),{flag:'wx'});
 }
}
lockDataDirectory();
process.on('exit',()=>{try{const entry=JSON.parse(fs.readFileSync(SERVER_PID_FILE,'utf8'));if(entry.pid===process.pid)fs.unlinkSync(SERVER_PID_FILE)}catch{}});
const db = new DatabaseSync(path.join(DATA, 'unfold.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS places (
    slug TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_th TEXT NOT NULL DEFAULT '',
    location_en TEXT NOT NULL, location_th TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL, region TEXT NOT NULL, lat REAL, lon REAL,
    visit TEXT NOT NULL DEFAULT '', description_en TEXT NOT NULL DEFAULT '',
    description_th TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '',
    gallery_json TEXT NOT NULL DEFAULT '[]', featured INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS places_status_updated ON places(status, featured, updated_at);
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS user_sessions_user ON user_sessions(user_id);
  CREATE TABLE IF NOT EXISTS user_collections (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_slug TEXT NOT NULL REFERENCES places(slug) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('saved','trip')),
    position INTEGER NOT NULL,
    PRIMARY KEY (user_id,place_slug,kind)
  );
  CREATE TABLE IF NOT EXISTS review_media (
    filename TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_slug TEXT NOT NULL REFERENCES places(slug) ON DELETE CASCADE,
    stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    text TEXT NOT NULL, photo TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, moderated_at TEXT,
    UNIQUE(user_id,place_slug)
  );
  CREATE INDEX IF NOT EXISTS reviews_place_status ON reviews(place_slug,status,updated_at);
  CREATE TABLE IF NOT EXISTS account_tokens (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')),
    expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS account_tokens_lookup ON account_tokens(user_id,purpose);
`);
// Additive migrations keep all existing v2.1/v2.2 content and accounts.
function addColumn(table,column,definition){
  const names=db.prepare(`PRAGMA table_info(${table})`).all().map(r=>r.name);
  if(!names.includes(column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
addColumn('users','email_verified','INTEGER NOT NULL DEFAULT 1'); // legacy accounts keep their prior permissions
addColumn('places','price_from','REAL');
addColumn('places','price_currency',"TEXT NOT NULL DEFAULT 'THB'");


// Business data is additive: no pre-existing places or accounts are rewritten.
db.exec(`
 CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, type TEXT NOT NULL, contact_email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '', website TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  admin_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
 );
 CREATE TABLE IF NOT EXISTS place_owners (
  place_slug TEXT PRIMARY KEY REFERENCES places(slug) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  attached_at TEXT NOT NULL
 );
 CREATE INDEX IF NOT EXISTS place_owners_business ON place_owners(business_id);
 CREATE TABLE IF NOT EXISTS business_media (
  filename TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
 );
 CREATE TABLE IF NOT EXISTS business_submissions (
  id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create','edit','claim')),
  place_slug TEXT, payload_json TEXT NOT NULL DEFAULT '{}',
  evidence TEXT NOT NULL DEFAULT '', base_updated_at TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending','approved','rejected')),
  admin_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  reviewed_at TEXT
 );
 CREATE INDEX IF NOT EXISTS business_submissions_status ON business_submissions(status,updated_at);
 CREATE INDEX IF NOT EXISTS business_submissions_business ON business_submissions(business_id,updated_at);
`);

// v2.6: account-owned trip plans. Additive migration; leaves v2.1-v2.5 records intact.
db.exec(`
 CREATE TABLE IF NOT EXISTS user_itineraries (
   id TEXT PRIMARY KEY,
   user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   title TEXT NOT NULL,
   days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 7),
   hours_per_day INTEGER NOT NULL CHECK(hours_per_day BETWEEN 2 AND 12),
   currency TEXT NOT NULL,
   budget REAL,
   travel_mode TEXT NOT NULL CHECK(travel_mode IN ('driving','walking','transit')),
   days_json TEXT NOT NULL,
   created_at TEXT NOT NULL,
   updated_at TEXT NOT NULL
 );
 CREATE INDEX IF NOT EXISTS itinerary_by_user ON user_itineraries(user_id,updated_at);
`);

// Immutable-by-API administrative audit trail, append-only and local-only.
// Older databases are upgraded additively and are never cleared.
db.exec(`
 CREATE TABLE IF NOT EXISTS audit_events (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   occurred_at TEXT NOT NULL,
   actor_type TEXT NOT NULL,
   actor_id TEXT NOT NULL,
   action TEXT NOT NULL,
   entity_type TEXT NOT NULL,
   entity_id TEXT NOT NULL,
   context_json TEXT NOT NULL DEFAULT '{}'
 );
 CREATE INDEX IF NOT EXISTS audit_events_by_date ON audit_events(id DESC);
 CREATE INDEX IF NOT EXISTS audit_events_entity ON audit_events(entity_type,entity_id,id DESC);
`);
const writeAudit = db.prepare('INSERT INTO audit_events(occurred_at,actor_type,actor_id,action,entity_type,entity_id,context_json) VALUES(?,?,?,?,?,?,?)');
function audit(actorType,actorId,action,entityType,entityId,context={}){
  // No session tokens, passwords, email addresses or entire payloads are logged.
  writeAudit.run(new Date().toISOString(),actorType,String(actorId),action,entityType,String(entityId),JSON.stringify(context));
}
function placeAuditSummary(row){ return row ? {name:row.name_en,status:row.status,category:row.category} : null; }
const SETUP_TOKEN = crypto.randomBytes(9).toString('hex');
const CATEGORIES = new Set(['nature', 'food', 'stay', 'culture']);
const REGIONS = new Set(['north', 'south', 'central', 'northeast', 'east', 'west', 'world']);
const CURRENCIES=new Set(['THB','USD','EUR','JPY','GBP']);
const REQUIRE_VERIFICATION=process.env.UNFOLD_REQUIRE_EMAIL_VERIFICATION==='1';
const USER_SESS_AGE = 14 * 24 * 60 * 60;
const SESS_AGE = 12 * 60 * 60; // 12 hours
const limits = new Map();
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};
function reply(res,status,body,headers={}) {
  const data=Buffer.from(JSON.stringify(body));
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':String(data.length),...headers});res.end(data);
}
function fail(status,message){const e=new Error(message);e.status=status;throw e;}
function validString(v,max,label,{required=false}={}){
  if(v == null)v=''; if(typeof v !== 'string')fail(400,`${label} must be text`);
  const s=v.trim();if(s.length>max || required&&!s)fail(400,`${label} is required or too long`);return s;
}
function imagePath(value){
  const v=validString(value,256,'image');
  if(!v)return '';
  if(!/^\/uploads\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(v))fail(400,'Image must come from the Admin upload tool');
  if(!fs.existsSync(path.join(UPLOADS,path.basename(v))))fail(400,'Uploaded image no longer exists');
  return v;
}
function normalize(p){
  if(!p||typeof p!=='object'||Array.isArray(p))fail(400,'Invalid place');
  const r={
    name_en:validString(p.en,120,'English name',{required:true}),
    name_th:validString(p.th,120,'Thai name'),
    location_en:validString(p.locEn,160,'English location',{required:true}),
    location_th:validString(p.locTh,160,'Thai location'),
    category:validString(p.category,20,'category'),
    region:validString(p.region,20,'region'),
    lat:p.lat===''||p.lat==null?null:Number(p.lat),
    lon:p.lon===''||p.lon==null?null:Number(p.lon),
    visit:validString(p.visit,40,'visit'),
    description_en:validString(p.storyEn,2000,'English description'),
    description_th:validString(p.storyTh,2000,'Thai description'),
    cover:imagePath(p.photo),
    gallery:[], featured:p.featured===true?1:0,
    status:p.status==='published'?'published':'draft',
    price_from:p.priceFrom===''||p.priceFrom==null?null:Number(p.priceFrom),
    price_currency:validString(p.currency||'THB',3,'Currency')
  };
  if(!CATEGORIES.has(r.category))fail(400,'Invalid category');
  if(!CURRENCIES.has(r.price_currency))fail(400,'Unsupported currency');
  if(r.price_from!==null&&(!Number.isFinite(r.price_from)||r.price_from<0||r.price_from>10_000_000))fail(400,'Invalid starting price');
  if(!REGIONS.has(r.region))fail(400,'Invalid region');
  if(r.lat!==null && (!Number.isFinite(r.lat)||r.lat< -85||r.lat>85))fail(400,'Invalid latitude');
  if(r.lon!==null && (!Number.isFinite(r.lon)||r.lon< -180||r.lon>180))fail(400,'Invalid longitude');
  if(!Array.isArray(p.gallery)||p.gallery.length>8)fail(400,'Gallery accepts up to 8 photos');
  r.gallery=[...new Set(p.gallery.map(imagePath).filter(Boolean))];
  if(r.status==='published'&&(r.lat===null||r.lon===null||!r.cover))fail(400,'Publishing requires coordinates and a photo');
  return r;
}
function rowToPlace(row,includeAdmin=false){
  const result={id:row.slug,en:row.name_en,th:row.name_th||row.name_en,locEn:row.location_en,locTh:row.location_th||row.location_en,
    category:row.category,region:row.region,lat:row.lat,lon:row.lon,visit:row.visit,
    storyEn:row.description_en,storyTh:row.description_th||row.description_en,
    photo:row.cover,gallery:JSON.parse(row.gallery_json),featured:!!row.featured,priceFrom:row.price_from??null,currency:row.price_currency||'THB'};
  if(includeAdmin)Object.assign(result,{status:row.status,createdAt:row.created_at,updatedAt:row.updated_at});
  return result;
}
const getRow=db.prepare('SELECT * FROM places WHERE slug=?');
const getPublic=db.prepare("SELECT * FROM places WHERE status='published' ORDER BY featured DESC,updated_at DESC");
const getAdmin=db.prepare('SELECT * FROM places ORDER BY updated_at DESC');
function pwHash(password,salt){return crypto.scryptSync(password,salt,64,{maxmem:128*1024*1024}).toString('hex');}
function hashToken(token){return crypto.createHash('sha256').update(token).digest('hex');}
function cookieFor(token,req){const parts=[`unfold_admin=${token||''}`,'HttpOnly','SameSite=Strict','Path=/api/admin',`Max-Age=${token?SESS_AGE:0}`];if(req.socket.encrypted)parts.push('Secure');return parts.join('; ');}
function newSession(res,req){const token=crypto.randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)').run(hashToken(token),Math.floor(Date.now()/1000)+SESS_AGE);res.setHeader('Set-Cookie',cookieFor(token,req));}
function tokenOf(req){const m=/(?:^|;\s*)unfold_admin=([a-f0-9]{64})/.exec(req.headers.cookie||'');return m?.[1]||null;}
function isAdmin(req){const token=tokenOf(req);if(!token)return false;const s=db.prepare('SELECT expires_at FROM sessions WHERE token_hash=?').get(hashToken(token));return !!s&&s.expires_at>Date.now()/1000;}
function requireAdmin(req){if(!isAdmin(req))fail(401,'Sign in as an admin first');}
function checkOrigin(req){const origin=req.headers.origin;if(!origin)return;let u;try{u=new URL(origin);}catch{fail(403,'Invalid origin');}
  const host=req.headers.host;if(u.host!==host||!['http:','https:'].includes(u.protocol))fail(403,'Cross-origin requests are not allowed');
}
function checkHost(req){const host=(req.headers.host||'').toLowerCase();if(!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))fail(403,'This local server accepts localhost only');}
async function jsonBody(req){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))fail(415,'Send application/json');
  let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>8_000_000)fail(413,'Request too large');chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(400,'Invalid JSON body');}
}
function attemptAllowed(ip){const now=Date.now(),entry=limits.get(ip)||{count:0,reset:now+15*60_000};if(now>entry.reset){entry.count=0;entry.reset=now+15*60_000;}entry.count++;limits.set(ip,entry);return entry.count<=8;}
function uploadImageTo(body,destination=UPLOADS,prefix='/uploads/'){ const data=validString(body?.dataUrl,8_000_000,'dataUrl',{required:true});const match=/^data:image\/(png|jpeg|webp);base64,([a-z0-9+/=]+)$/i.exec(data);if(!match)fail(400,'Only PNG, JPEG, and WebP images accepted');
  const buf=Buffer.from(match[2],'base64');if(buf.length<64||buf.length>5*1024*1024)fail(400,'Image must be 64 bytes to 5 MB');
  const tag=match[1].toLowerCase(),detected=buf[0]===0xff&&buf[1]===0xd8&&buf[2]===0xff?'jpeg':buf.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))?'png':buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP'?'webp':null;
  if(detected!==tag)fail(400,'Invalid image signature');const ext=tag==='jpeg'?'jpg':tag;const filename=crypto.randomUUID()+'.'+ext;
  fs.writeFileSync(path.join(destination,filename),buf,{flag:'wx'});return {url:prefix+filename,size:buf.length};
}
// Account + community features use distinct sessions from the local Admin.
function userCookie(token,req){const parts=[`unfold_user=${token||''}`,'HttpOnly','SameSite=Strict','Path=/',`Max-Age=${token?USER_SESS_AGE:0}`];if(req.socket.encrypted)parts.push('Secure');return parts.join('; ');}
function userToken(req){return /(?:^|;\s*)unfold_user=([a-f0-9]{64})/.exec(req.headers.cookie||'')?.[1]||null;}
function userSession(req){const token=userToken(req);if(!token)return null;return db.prepare('SELECT u.id,u.name,u.email,u.email_verified FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hashToken(token),Math.floor(Date.now()/1000))||null;}
function userPublic(user){return user?{id:user.id,name:user.name,email:user.email,emailVerified:!!user.email_verified}:null;}
function requireUser(req){const user=userSession(req);if(!user)fail(401,'Sign in to continue');return user;}
function issueUserSession(req,res,id){const token=crypto.randomBytes(32).toString('hex');db.prepare('INSERT INTO user_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hashToken(token),id,Math.floor(Date.now()/1000)+USER_SESS_AGE);res.setHeader('Set-Cookie',userCookie(token,req));}
function normalizeItinerary(b){
 if(!b||typeof b!=='object'||Array.isArray(b))fail(400,'Invalid trip');
 const title=validString(b.title,100,'Trip name',{required:true}),days=Number(b.days),hoursPerDay=Number(b.hoursPerDay);
 if(!Number.isInteger(days)||days<1||days>7)fail(400,'Days must be 1 to 7');
 if(!Number.isInteger(hoursPerDay)||hoursPerDay<2||hoursPerDay>12)fail(400,'Hours per day must be 2 to 12');
 const currency=validString(b.currency||'THB',3,'Currency'),travelMode=validString(b.travelMode||'driving',12,'Travel mode');
 if(!CURRENCIES.has(currency))fail(400,'Invalid currency');
 if(!['driving','walking','transit'].includes(travelMode))fail(400,'Invalid travel mode');
 const budget=b.budget===''||b.budget==null?null:Number(b.budget);
 if(budget!==null&&(!Number.isFinite(budget)||budget<0||budget>100_000_000))fail(400,'Invalid budget');
 if(!Array.isArray(b.groups)||b.groups.length!==days)fail(400,'One group required per day');
 const groups=b.groups.map(g=>{
   if(!Array.isArray(g)||g.length>15)fail(400,'Invalid day group');
   return g.map(id=>{if(typeof id!=='string'||!/[a-z0-9-]{1,65}/.test(id)||id.length>65||!/^[a-z0-9-]+$/.test(id))fail(400,'Invalid place');publishedPlace(id);return id});
 });
 const flat=groups.flat();if(flat.length>30||new Set(flat).size!==flat.length)fail(400,'Maximum 30 unique published places per trip');
 return {title,days,hoursPerDay,currency,travelMode,budget,groups};
}
function itineraryPublic(row){
 const groups=JSON.parse(row.days_json).map(g=>g.filter(id=>{
  const p=getRow.get(id);return !!p&&p.status==='published';
 }));
 return {id:row.id,title:row.title,days:row.days,hoursPerDay:row.hours_per_day,
  budget:row.budget,currency:row.currency,travelMode:row.travel_mode,
  groups,createdAt:row.created_at,updatedAt:row.updated_at};
}
function collectionList(userId,kind){return db.prepare("SELECT c.place_slug FROM user_collections c JOIN places p ON p.slug=c.place_slug WHERE c.user_id=? AND c.kind=? AND p.status='published' ORDER BY c.position ASC").all(userId,kind).map(r=>r.place_slug);}
function reviewPublic(r,own=false){const item={id:r.id,placeId:r.place_slug,name:r.name,stars:r.stars,text:r.text,photo:r.photo,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at};if(!own)delete item.status;return item;}
const pickReviews=db.prepare('SELECT r.*,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.place_slug=? AND r.status=\'approved\' ORDER BY r.updated_at DESC LIMIT 100');
function safeReviewImage(photo,userId){if(!photo)return '';const m=/^\/review-media\/([a-f0-9-]{36}\.(?:png|jpg|webp))$/.exec(photo);if(!m)fail(400,'Use a photo uploaded through the review form');const found=db.prepare('SELECT owner_id FROM review_media WHERE filename=?').get(m[1]);if(!found||found.owner_id!==userId)fail(403,'Review photo belongs to another user or is missing');return photo;}
function reviewFileAccess(req,fileName){const entry=db.prepare('SELECT owner_id FROM review_media WHERE filename=?').get(fileName);if(!entry)return false;const user=userSession(req);if(user?.id===entry.owner_id||isAdmin(req))return true;return !!db.prepare("SELECT 1 FROM reviews r WHERE r.photo=? AND r.status='approved' AND EXISTS(SELECT 1 FROM places p WHERE p.slug=r.place_slug AND p.status='published')").get('/review-media/'+fileName);}
function normalReview(b,userId){if(!b||typeof b!=='object'||Array.isArray(b))fail(400,'Invalid review');const stars=Number(b.stars);if(!Number.isInteger(stars)||stars<1||stars>5)fail(400,'Rating must be 1 to 5 stars');const body=validString(b.text,1500,'Review text',{required:true});if(body.length<10)fail(400,'Review must be at least 10 characters');const photo=safeReviewImage(b.photo,userId);return {stars,text:body,photo};}
function publishedPlace(id){const row=getRow.get(id);if(!row||row.status!=='published')fail(404,'Published place not found');return row;}
function allowUserAttempt(req,label){if(!attemptAllowed(label+':'+(req.socket.remoteAddress||'local')))fail(429,'Too many attempts; try again in 15 minutes');}
function validateEmail(input){const email=validString(input,254,'Email',{required:true}).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Invalid email address');return email;}
function newAccountToken(userId,purpose){
  const token=crypto.randomBytes(32).toString('hex');
  db.prepare('DELETE FROM account_tokens WHERE user_id=? AND purpose=?').run(userId,purpose);
  db.prepare('INSERT INTO account_tokens(token_hash,user_id,purpose,expires_at,created_at) VALUES(?,?,?,?,?)')
    .run(hashToken(token),userId,purpose,Math.floor(Date.now()/1000)+(purpose==='verify'?86400:1800),new Date().toISOString());
  return token;
}
function consumeToken(token,purpose){
  if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))fail(400,'Invalid or expired link');
  const key=hashToken(token),row=db.prepare('SELECT * FROM account_tokens WHERE token_hash=? AND purpose=? AND expires_at>?').get(key,purpose,Math.floor(Date.now()/1000));
  if(!row)fail(400,'Invalid or expired link');
  db.prepare('DELETE FROM account_tokens WHERE token_hash=?').run(key);
  return row.user_id;
}
async function sendAccountMail(req,email,purpose,token){
  // Local-only development preview; no email is claimed sent without a provider.
  const link=`http://127.0.0.1:${req.socket.localPort||5173}/?${purpose==='verify'?'verify':'reset'}=${token}#profile`;
  const key=process.env.UNFOLD_RESEND_API_KEY;
  const from=process.env.UNFOLD_EMAIL_FROM;
  if(Boolean(key)!==Boolean(from))fail(503,'Set both UNFOLD_RESEND_API_KEY and UNFOLD_EMAIL_FROM');
  if(!key){console.log(`[DEV MAIL ${purpose.toUpperCase()}] ${email} ${link}`);return 'dev-console';}
  const host=process.env.UNFOLD_PUBLIC_URL;
  if(!host||! /^https:\/\/[^/?#]+$/.test(host))fail(503,'UNFOLD_PUBLIC_URL must be an HTTPS origin for email delivery');
  const external=host+`/?${purpose==='verify'?'verify':'reset'}=${token}#profile`;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:purpose==='verify'?'Verify your unfold email':'Reset your unfold password',text:`Open this one-time link to ${purpose==='verify'?'verify your email address':'reset your password'}:\n${external}\n\nIf you did not request this, ignore this email.`})});
  if(!response.ok){console.error('Email provider rejected request, status',response.status);fail(503,'Email service is temporarily unavailable');}
  return 'email';
}
function parsedCoord(raw,label,min,max){const val=Number(raw);if(raw==null||raw===''||!Number.isFinite(val)||val<min||val>max)fail(400,`Invalid ${label}`);return val;}
function kmBetween(a,b,c,d){const rad=Math.PI/180,dlat=(c-a)*rad,dlon=(d-b)*rad;const h=Math.sin(dlat/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(dlon/2)**2;return 6371.0088*2*Math.asin(Math.min(1,Math.sqrt(h)));}
function getNearby(u){
  const q=u.searchParams,lat=parsedCoord(q.get('lat'),'latitude',-85,85),lon=parsedCoord(q.get('lon'),'longitude',-180,180);
  const radiusKm=parsedCoord(q.get('radiusKm')??'25','radius',0.1,300);
  const category=q.get('category')||'all';if(category!=='all'&&!CATEGORIES.has(category))fail(400,'Invalid category');
  const currency=q.get('currency')||'THB';if(!CURRENCIES.has(currency))fail(400,'Invalid currency');
  const rawPrice=q.get('maxPrice');const maxPrice=rawPrice===null?null:parsedCoord(rawPrice,'price',0,10_000_000);
  const list=getPublic.all().filter(p=>p.lat!==null&&p.lon!==null&&(category==='all'||p.category===category))
    .map(p=>({place:rowToPlace(p),distanceKm:kmBetween(lat,lon,p.lat,p.lon)}))
    .filter(x=>x.distanceKm<=radiusKm&&(maxPrice===null||(x.place.priceFrom!==null&&x.place.currency===currency&&x.place.priceFrom<=maxPrice)))
    .sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,100)
    .map(x=>({...x.place,distanceKm:Math.round(x.distanceKm*10)/10}));
  return {places:list,count:list.length,radiusKm,currency,unit:'km'};
}

function businessPublic(row){return row?{id:row.id,name:row.name,type:row.type,contactEmail:row.contact_email,phone:row.phone,website:row.website,description:row.description,status:row.status,note:row.admin_note,createdAt:row.created_at,updatedAt:row.updated_at}:null;}
function businessOf(userId){return db.prepare('SELECT * FROM businesses WHERE owner_id=?').get(userId)||null;}
function requireBusiness(req,approved=false){const user=requireUser(req),business=businessOf(user.id);if(!business)fail(403,'Create a business profile first');if(approved&&business.status!=='approved')fail(403,'Your business is waiting for Admin approval');return {user,business};}
const BUSINESS_TYPES=new Set(['food','stay','experience','other']);
function businessInfo(body){if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Invalid business profile');
 const name=validString(body.name,120,'Business name',{required:true});
 const type=validString(body.type,24,'Business type',{required:true});if(!BUSINESS_TYPES.has(type))fail(400,'Invalid business type');
 const contactEmail=validateEmail(body.contactEmail);
 const phone=validString(body.phone,40,'Phone');if(phone&&!/^[+0-9() .-]{6,40}$/.test(phone))fail(400,'Invalid phone');
 const website=validString(body.website,300,'Website');if(website){let url;try{url=new URL(website)}catch{fail(400,'Website must be a complete https URL')}if(url.protocol!=='https:'||!url.hostname||url.username||url.password)fail(400,'Use an HTTPS website without credentials');}
 const description=validString(body.description,1000,'Business details');return {name,type,contactEmail,phone,website,description};
}
function submissionPublic(row){return {id:row.id,businessId:row.business_id,action:row.action,placeId:row.place_slug,payload:JSON.parse(row.payload_json),evidence:row.evidence,baseUpdatedAt:row.base_updated_at,status:row.status,note:row.admin_note,createdAt:row.created_at,updatedAt:row.updated_at,reviewedAt:row.reviewed_at};}
function businessMediaAllowed(businessId,placeSlug,placePayload){
 const urls=[placePayload.photo,...(placePayload.gallery||[])].filter(Boolean);
 let original=[];
 if(placeSlug){const prev=getRow.get(placeSlug);if(prev)original=[prev.cover,...JSON.parse(prev.gallery_json)];}
 for(const url of urls){if(original.includes(url))continue;
   const item=db.prepare('SELECT business_id FROM business_media WHERE filename=?').get(path.basename(url));
   if(!item||item.business_id!==businessId)fail(403,'Upload your own place photos before submitting');
 }
}
function normalizeBusinessPlace(businessId,placeSlug,payload,{forSubmission=false}={}){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))fail(400,'Invalid place data');
 // Business owners never select Published or Featured. Only moderation does.
 const normalized=normalize({...payload,featured:false,status:'draft'});
 businessMediaAllowed(businessId,placeSlug,{photo:normalized.cover,gallery:normalized.gallery});
 if(forSubmission&&(normalized.lat===null||normalized.lon===null||!normalized.cover))fail(400,'Add a real cover photo and coordinates before submitting');
 return {...payload,status:'draft',featured:false,photo:normalized.cover,gallery:normalized.gallery};
}
function checkSubmissionAccess(business,action,placeSlug){
 if(!['create','edit','claim'].includes(action))fail(400,'Invalid submission type');
 if(action==='create'){if(placeSlug)fail(400,'New place cannot have a place ID');return null;}
 if(!/^[a-z0-9-]{1,65}$/.test(placeSlug||''))fail(400,'Choose a valid place');
 const place=publishedPlace(placeSlug);
 const link=db.prepare('SELECT business_id FROM place_owners WHERE place_slug=?').get(placeSlug);
 if(action==='edit'&&link?.business_id!==business.id)fail(403,'Only the verified owner can propose an edit');
 if(action==='claim'&&link)fail(409,'This place is already managed by a business');
 return place;
}
function validateSubmission(business,row,forSubmission=false){
 const place=checkSubmissionAccess(business,row.action,row.place_slug);
 if(row.action==='claim'){
   const statement=validString(row.evidence,2000,'Ownership evidence',{required:forSubmission});
   if(forSubmission&&statement.length<40)fail(400,'Explain your ownership with at least 40 characters of verifiable details');
   return {evidence:statement,place};
 }
 const payload=normalizeBusinessPlace(business.id,row.action==='edit'?row.place_slug:null,JSON.parse(row.payload_json),{forSubmission});
 return {payload,place};
}
function approveSubmission(row,adminNote){
 const business=db.prepare('SELECT * FROM businesses WHERE id=?').get(row.business_id);
 if(!business||business.status!=='approved')fail(409,'Business must be approved first');
 const {payload,place}=validateSubmission(business,row,true);
 const t=new Date().toISOString();
 db.exec('BEGIN IMMEDIATE');try{
   if(row.action==='create'){
     const p=normalize({...payload,status:'published',featured:false});
     const newPlace=saveNew(p);
     db.prepare('INSERT INTO place_owners(place_slug,business_id,attached_at) VALUES(?,?,?)').run(newPlace.id,business.id,t);
     db.prepare("UPDATE business_submissions SET place_slug=? WHERE id=?").run(newPlace.id,row.id);
   }else if(row.action==='edit'){
     const current=getRow.get(row.place_slug);
     if(!current||current.updated_at!==row.base_updated_at)fail(409,'Place changed after submission; please request an updated proposal');
     const p=normalize({...payload,status:'published',featured:!!current.featured});
     saveExisting(row.place_slug,p);
   }else if(row.action==='claim'){
     if(!place||db.prepare('SELECT 1 FROM place_owners WHERE place_slug=?').get(row.place_slug))fail(409,'Place already claimed or removed');
     db.prepare('INSERT INTO place_owners(place_slug,business_id,attached_at) VALUES(?,?,?)').run(row.place_slug,business.id,t);
   }
   db.prepare("UPDATE business_submissions SET status='approved',admin_note=?,reviewed_at=?,updated_at=? WHERE id=? AND status='pending'").run(adminNote,t,t,row.id);
   db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
}
function ownerPlaces(businessId){return db.prepare('SELECT p.* FROM places p JOIN place_owners o ON o.place_slug=p.slug WHERE o.business_id=? ORDER BY p.updated_at DESC').all(businessId).map(x=>rowToPlace(x,true));}
function uploadImage(body){return uploadImageTo(body);}
function slugFor(name){const base=name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,46)||'place';let s=base;while(getRow.get(s))s=base+'-'+crypto.randomBytes(3).toString('hex');return s;}
function saveNew(p){const t=new Date().toISOString(),slug=slugFor(p.name_en);
  db.prepare('INSERT INTO places(slug,name_en,name_th,location_en,location_th,category,region,lat,lon,visit,description_en,description_th,cover,gallery_json,featured,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(slug,p.name_en,p.name_th,p.location_en,p.location_th,p.category,p.region,p.lat,p.lon,p.visit,p.description_en,p.description_th,p.cover,JSON.stringify(p.gallery),p.featured,p.status,t,t);
  db.prepare('UPDATE places SET price_from=?,price_currency=? WHERE slug=?').run(p.price_from,p.price_currency,slug);
  return rowToPlace(getRow.get(slug),true);
}
function saveExisting(slug,p){const result=db.prepare('UPDATE places SET name_en=?,name_th=?,location_en=?,location_th=?,category=?,region=?,lat=?,lon=?,visit=?,description_en=?,description_th=?,cover=?,gallery_json=?,featured=?,status=?,updated_at=? WHERE slug=?')
 .run(p.name_en,p.name_th,p.location_en,p.location_th,p.category,p.region,p.lat,p.lon,p.visit,p.description_en,p.description_th,p.cover,JSON.stringify(p.gallery),p.featured,p.status,new Date().toISOString(),slug);
 if(!result.changes)fail(404,'Place not found');db.prepare('UPDATE places SET price_from=?,price_currency=? WHERE slug=?').run(p.price_from,p.price_currency,slug);return rowToPlace(getRow.get(slug),true);
}
async function api(req,res,u){
  const method=req.method,route=u.pathname;
  if(route==='/api/health'&&method==='GET')return reply(res,200,{ok:true,version:'2.7.0',storage:'SQLite',published:db.prepare("SELECT count(*) AS n FROM places WHERE status='published'").get().n});
  if(route==='/api/places'&&method==='GET')return reply(res,200,{places:getPublic.all().map(p=>rowToPlace(p)),mode:'live'});
  if(route==='/api/places/nearby'&&method==='GET')return reply(res,200,getNearby(u));
  if(/^\/api\/places\/[a-z0-9-]{1,65}$/.test(route)&&method==='GET'){const id=route.slice('/api/places/'.length);const p=getRow.get(id);if(!p||p.status!=='published')fail(404,'Place not found');return reply(res,200,{place:rowToPlace(p)});}
  if(route==='/api/admin/status'&&method==='GET')return reply(res,200,{setupRequired:!db.prepare('SELECT id FROM admins WHERE id=1').get(),authenticated:isAdmin(req)});
  if(route==='/api/admin/setup'&&method==='POST'){
    checkOrigin(req);if(db.prepare('SELECT id FROM admins WHERE id=1').get())fail(409,'Admin already configured');
    const b=await jsonBody(req);if(!b||b.setupToken!==SETUP_TOKEN)fail(403,'Incorrect setup code');
    const pass=validString(b.password,128,'password',{required:true});if(pass.length<12)fail(400,'Password must contain at least 12 characters');
    const salt=crypto.randomBytes(16).toString('hex');db.prepare('INSERT INTO admins(id,salt,password_hash,created_at) VALUES(1,?,?,?)').run(salt,pwHash(pass,salt),new Date().toISOString());
    newSession(res,req);audit('admin','1','admin.setup','admin','1');return reply(res,201,{ok:true});
  }
  if(route==='/api/admin/login'&&method==='POST'){
    checkOrigin(req);if(!attemptAllowed(req.socket.remoteAddress||'local'))fail(429,'Too many attempts. Try again in 15 minutes');
    const b=await jsonBody(req),pass=validString(b?.password,128,'password'),admin=db.prepare('SELECT * FROM admins WHERE id=1').get();
    if(!admin)fail(409,'Set up the admin first');
    const test=pwHash(pass,admin.salt);if(!crypto.timingSafeEqual(Buffer.from(test,'hex'),Buffer.from(admin.password_hash,'hex')))fail(401,'Incorrect password');
    limits.delete(req.socket.remoteAddress||'local');newSession(res,req);audit('admin','1','admin.login','admin','1');return reply(res,200,{ok:true});
  }
  if(route==='/api/admin/logout'&&method==='POST'){
    checkOrigin(req);const token=tokenOf(req);if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token));res.setHeader('Set-Cookie',cookieFor('',req));return reply(res,200,{ok:true});
  }
  // Public, moderated community reviews. Pending/rejected content is not public.
  const publicReview=/^\/api\/places\/([a-z0-9-]{1,65})\/reviews$/.exec(route);
  if(publicReview&&method==='GET'){publishedPlace(publicReview[1]);const list=pickReviews.all(publicReview[1]).map(r=>reviewPublic(r));return reply(res,200,{reviews:list,count:list.length});}
  if(route==='/api/auth/me'&&method==='GET')return reply(res,200,{user:userPublic(userSession(req))});
  if(route==='/api/auth/register'&&method==='POST'){
    checkOrigin(req);allowUserAttempt(req,'register');const b=await jsonBody(req);
    const name=validString(b?.name,60,'Name',{required:true}),email=validateEmail(b?.email);
    const password=validString(b?.password,128,'Password',{required:true});if(name.length<2||password.length<12)fail(400,'Name must be at least 2 letters; password at least 12 characters');
    if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'Email already registered');
    const id=crypto.randomUUID(),salt=crypto.randomBytes(16).toString('hex');
    try{db.prepare('INSERT INTO users(id,name,email,salt,password_hash,created_at,email_verified) VALUES(?,?,?,?,?,?,0)').run(id,name,email,salt,pwHash(password,salt),new Date().toISOString());}catch(err){if(err.code?.includes('CONSTRAINT'))fail(409,'Email already registered');throw err;}
    issueUserSession(req,res,id);
    await sendAccountMail(req,email,'verify',newAccountToken(id,'verify'));
    return reply(res,201,{user:{id,name,email,emailVerified:false},verificationRequired:true});
  }
  if(route==='/api/auth/login'&&method==='POST'){
    checkOrigin(req);allowUserAttempt(req,'login');const b=await jsonBody(req),email=validateEmail(b?.email),pass=validString(b?.password,128,'Password');
    const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const dummySalt='a'.repeat(32),hash=pwHash(pass,user?.salt||dummySalt);
    if(!user||!crypto.timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(user.password_hash,'hex')))fail(401,'Incorrect email or password');
    limits.delete('login:'+(req.socket.remoteAddress||'local'));
    issueUserSession(req,res,user.id);return reply(res,200,{user:userPublic(user)});
  }
  if(route==='/api/auth/logout'&&method==='POST'){
    checkOrigin(req);const token=userToken(req);if(token)db.prepare('DELETE FROM user_sessions WHERE token_hash=?').run(hashToken(token));res.setHeader('Set-Cookie',userCookie('',req));return reply(res,200,{ok:true});
  }
  if(route==='/api/auth/verify/request'&&method==='POST'){
    checkOrigin(req);allowUserAttempt(req,'verify');const user=requireUser(req);
    if(user.email_verified)return reply(res,200,{ok:true,alreadyVerified:true});
    await sendAccountMail(req,user.email,'verify',newAccountToken(user.id,'verify'));
    return reply(res,200,{ok:true});
  }
  if(route==='/api/auth/verify'&&method==='POST'){
    checkOrigin(req);allowUserAttempt(req,'verify-token');const body=await jsonBody(req);
    const userId=consumeToken(body?.token,'verify');
    db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(userId);
    return reply(res,200,{ok:true});
  }
  if(route==='/api/auth/password/forgot'&&method==='POST'){
    checkOrigin(req);allowUserAttempt(req,'forgot');const body=await jsonBody(req),email=validateEmail(body?.email);
    const user=db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if(user)await sendAccountMail(req,email,'reset',newAccountToken(user.id,'reset'));
    return reply(res,200,{ok:true,message:'If this email has an account, a reset link will be provided.'});
  }
  if(route==='/api/auth/password/reset'&&method==='POST'){
    checkOrigin(req);allowUserAttempt(req,'reset');const body=await jsonBody(req),password=validString(body?.password,128,'Password',{required:true});
    if(password.length<12)fail(400,'Password must have at least 12 characters');
    const userId=consumeToken(body?.token,'reset'),salt=crypto.randomBytes(16).toString('hex');
    db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').run(salt,pwHash(password,salt),userId);
    db.prepare('DELETE FROM user_sessions WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM account_tokens WHERE user_id=?').run(userId);
    return reply(res,200,{ok:true});
  }
  if(route==='/api/me/profile'&&method==='PATCH'){
    checkOrigin(req);const user=requireUser(req),body=await jsonBody(req);
    const name=validString(body?.name,60,'Name',{required:true});if(name.length<2)fail(400,'Name must be at least 2 characters');
    db.prepare('UPDATE users SET name=? WHERE id=?').run(name,user.id);
    return reply(res,200,{user:userPublic(db.prepare('SELECT id,name,email,email_verified FROM users WHERE id=?').get(user.id))});
  }
  // Private trip plans are owned by the authenticated traveller, not the business account.
  if(route==='/api/me/itineraries'&&method==='GET'){
    const user=requireUser(req);
    const rows=db.prepare('SELECT * FROM user_itineraries WHERE user_id=? ORDER BY updated_at DESC LIMIT 100').all(user.id);
    return reply(res,200,{itineraries:rows.map(itineraryPublic)});
  }
  if(route==='/api/me/itineraries'&&method==='POST'){
    checkOrigin(req);const user=requireUser(req),p=normalizeItinerary(await jsonBody(req));
    const count=db.prepare('SELECT count(*) AS n FROM user_itineraries WHERE user_id=?').get(user.id).n;
    if(count>=40)fail(429,'Maximum 40 trip plans per account');
    const id=crypto.randomUUID(),now=new Date().toISOString();
    db.prepare('INSERT INTO user_itineraries(id,user_id,title,days,hours_per_day,currency,budget,travel_mode,days_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
     .run(id,user.id,p.title,p.days,p.hoursPerDay,p.currency,p.budget,p.travelMode,JSON.stringify(p.groups),now,now);
    return reply(res,201,{itinerary:itineraryPublic(db.prepare('SELECT * FROM user_itineraries WHERE id=?').get(id))});
  }
  const tripMatch=/^\/api\/me\/itineraries\/([a-f0-9-]{36})$/.exec(route);
  if(tripMatch){
    const user=requireUser(req);
    const row=db.prepare('SELECT * FROM user_itineraries WHERE id=? AND user_id=?').get(tripMatch[1],user.id);
    if(!row)fail(404,'Trip not found');
    if(method==='GET')return reply(res,200,{itinerary:itineraryPublic(row)});
    if(method==='PUT'){
      checkOrigin(req);const p=normalizeItinerary(await jsonBody(req));
      db.prepare('UPDATE user_itineraries SET title=?,days=?,hours_per_day=?,currency=?,budget=?,travel_mode=?,days_json=?,updated_at=? WHERE id=? AND user_id=?')
       .run(p.title,p.days,p.hoursPerDay,p.currency,p.budget,p.travelMode,JSON.stringify(p.groups),new Date().toISOString(),row.id,user.id);
      return reply(res,200,{itinerary:itineraryPublic(db.prepare('SELECT * FROM user_itineraries WHERE id=?').get(row.id))});
    }
    if(method==='DELETE'){
      checkOrigin(req);db.prepare('DELETE FROM user_itineraries WHERE id=? AND user_id=?').run(row.id,user.id);
      return reply(res,200,{ok:true});
    }
  }
  if(route==='/api/me/collections'&&method==='GET'){
    const user=requireUser(req);return reply(res,200,{saved:collectionList(user.id,'saved'),trip:collectionList(user.id,'trip')});
  }
  if(route==='/api/me/collections'&&method==='PUT'){
    checkOrigin(req);const user=requireUser(req),b=await jsonBody(req);
    if(!b||typeof b!=='object'||!Array.isArray(b.saved)||!Array.isArray(b.trip)||b.saved.length>100||b.trip.length>100)fail(400,'Invalid collection (max 100 per list)');
    for(const kind of ['saved','trip']){
      if(b[kind].some(v=>typeof v!=='string'||!/^[-a-z0-9]{1,65}$/.test(v)))fail(400,'Invalid place identifier');
      const ids=new Set(b[kind]);if(ids.size!==b[kind].length)fail(400,'Duplicate place');
      for(const id of ids)publishedPlace(id);
    }
    db.exec('BEGIN');try{
      for(const kind of ['saved','trip']){
        db.prepare('DELETE FROM user_collections WHERE user_id=? AND kind=?').run(user.id,kind);
        const insert=db.prepare('INSERT INTO user_collections(user_id,place_slug,kind,position) VALUES(?,?,?,?)');
        b[kind].forEach((id,index)=>insert.run(user.id,id,kind,index));
      }
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    return reply(res,200,{saved:collectionList(user.id,'saved'),trip:collectionList(user.id,'trip')});
  }
  if(route==='/api/me/reviews'&&method==='GET'){
    const user=requireUser(req);const rows=db.prepare('SELECT r.*,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.user_id=? ORDER BY r.updated_at DESC').all(user.id);return reply(res,200,{reviews:rows.map(r=>reviewPublic(r,true))});
  }
  if(route==='/api/reviews/upload'&&method==='POST'){
    checkOrigin(req);const user=requireUser(req),body=await jsonBody(req);
    const img=uploadImageTo(body,REVIEW_UPLOADS,'/review-media/');
    db.prepare('INSERT INTO review_media(filename,owner_id,created_at) VALUES(?,?,?)').run(path.basename(img.url),user.id,new Date().toISOString());
    return reply(res,201,img);
  }
  const myReview=/^\/api\/places\/([a-z0-9-]{1,65})\/my-review$/.exec(route);
  if(myReview&&method==='PUT'){
    checkOrigin(req);const user=requireUser(req);if(REQUIRE_VERIFICATION&&!user.email_verified)fail(403,'Verify your email before reviewing');publishedPlace(myReview[1]);const b=normalReview(await jsonBody(req),user.id);
    const old=db.prepare('SELECT id,created_at FROM reviews WHERE user_id=? AND place_slug=?').get(user.id,myReview[1]);const now=new Date().toISOString();
    if(old){db.prepare("UPDATE reviews SET stars=?,text=?,photo=?,status='pending',updated_at=?,moderated_at=NULL WHERE id=?").run(b.stars,b.text,b.photo,now,old.id);}
    else{db.prepare('INSERT INTO reviews(id,user_id,place_slug,stars,text,photo,status,created_at,updated_at) VALUES(?,?,?,?,?,?,\'pending\',?,?)').run(crypto.randomUUID(),user.id,myReview[1],b.stars,b.text,b.photo,now,now);}
    const row=db.prepare('SELECT r.*,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.user_id=? AND r.place_slug=?').get(user.id,myReview[1]);return reply(res,200,{review:reviewPublic(row,true)});
  }
  if(myReview&&method==='DELETE'){
    checkOrigin(req);const user=requireUser(req);
    db.prepare('DELETE FROM reviews WHERE user_id=? AND place_slug=?').run(user.id,myReview[1]);return reply(res,200,{ok:true});
  }
  // BUSINESS PORTAL - independent traveler accounts, no admin privileges.
  if(route==='/api/business/me'&&method==='GET'){
    const user=requireUser(req),business=businessOf(user.id);
    return reply(res,200,{user:userPublic(user),business:businessPublic(business),places:business?ownerPlaces(business.id):[],submissions:business?db.prepare('SELECT * FROM business_submissions WHERE business_id=? ORDER BY updated_at DESC LIMIT 100').all(business.id).map(submissionPublic):[]});
  }
  if(route==='/api/business/register'&&method==='POST'){
    checkOrigin(req);const user=requireUser(req);allowUserAttempt(req,'business-register');if(businessOf(user.id))fail(409,'Your account already has a business profile');
    const b=businessInfo(await jsonBody(req)),id=crypto.randomUUID(),now=new Date().toISOString();
    db.prepare("INSERT INTO businesses(id,owner_id,name,type,contact_email,phone,website,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'pending',?,?)")
      .run(id,user.id,b.name,b.type,b.contactEmail,b.phone,b.website,b.description,now,now);
    audit('owner',user.id,'business.register','business',id,{type:b.type});return reply(res,201,{business:businessPublic(businessOf(user.id))});
  }
  if(route==='/api/business/me'&&method==='PATCH'){
    checkOrigin(req);const {business}=requireBusiness(req);if(business.status==='suspended')fail(403,'Contact Admin about this account');
    const b=businessInfo(await jsonBody(req)),now=new Date().toISOString();
    db.prepare('UPDATE businesses SET name=?,type=?,contact_email=?,phone=?,website=?,description=?,status=?,admin_note=?,updated_at=? WHERE id=?')
      .run(b.name,b.type,b.contactEmail,b.phone,b.website,b.description,business.status==='rejected'?'pending':business.status,business.status==='rejected'?'':business.admin_note,now,business.id);
    audit('owner',business.owner_id,'business.update','business',business.id,{status:business.status});return reply(res,200,{business:businessPublic(businessOf(business.owner_id))});
  }
  if(route==='/api/business/uploads'&&method==='POST'){
    checkOrigin(req);const {business}=requireBusiness(req,true);
    const count=db.prepare('SELECT count(*) AS n FROM business_media WHERE business_id=?').get(business.id).n;
    if(count>=60)fail(429,'Maximum 60 business images in this local version');
    const img=uploadImageTo(await jsonBody(req));
    db.prepare('INSERT INTO business_media(filename,business_id,created_at) VALUES(?,?,?)').run(path.basename(img.url),business.id,new Date().toISOString());
    return reply(res,201,img);
  }
  if(route==='/api/business/submissions'&&method==='POST'){
    checkOrigin(req);const {user,business}=requireBusiness(req,true);
    if(!user.email_verified)fail(403,'Verify your email before submitting business places');
    const count=db.prepare("SELECT count(*) AS n FROM business_submissions WHERE business_id=? AND status IN ('pending','draft')").get(business.id).n;
    if(count>=20)fail(429,'Maximum 20 open submissions');
    const body=await jsonBody(req),action=validString(body?.action,10,'action',{required:true}),placeSlug=validString(body?.placeId,65,'Place ID');
    const place=checkSubmissionAccess(business,action,placeSlug);
    let payload={},evidence='';
    if(action==='claim')evidence=validString(body?.evidence,2000,'Ownership evidence');
    else payload=normalizeBusinessPlace(business.id,action==='edit'?placeSlug:null,body?.payload);
    const id=crypto.randomUUID(),t=new Date().toISOString();
    db.prepare("INSERT INTO business_submissions(id,business_id,action,place_slug,payload_json,evidence,base_updated_at,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'draft',?,?)")
      .run(id,business.id,action,placeSlug||null,JSON.stringify(payload),evidence,place?.updated_at||'',t,t);
    const result=db.prepare('SELECT * FROM business_submissions WHERE id=?').get(id);
    audit('owner',user.id,'proposal.create','submission',id,{action,placeId:placeSlug||null});return reply(res,201,{submission:submissionPublic(result)});
  }
  const ownSub=/^\/api\/business\/submissions\/([a-f0-9-]{36})(?:\/(submit))?$/.exec(route);
  if(ownSub){
    checkOrigin(req);const {user,business}=requireBusiness(req,true);
    const current=db.prepare('SELECT * FROM business_submissions WHERE id=? AND business_id=?').get(ownSub[1],business.id);
    if(!current)fail(404,'Submission not found');
    if(ownSub[2]==='submit'&&method==='POST'){
      if(!user.email_verified)fail(403,'Verify email before submitting');
      if(!['draft','rejected'].includes(current.status))fail(409,'Submission already submitted');
      validateSubmission(business,current,true);
      const t=new Date().toISOString();
      db.prepare("UPDATE business_submissions SET status='pending',admin_note='',reviewed_at=NULL,updated_at=? WHERE id=?").run(t,current.id);
      audit('owner',user.id,'proposal.submit','submission',current.id,{action:current.action});return reply(res,200,{submission:submissionPublic(db.prepare('SELECT * FROM business_submissions WHERE id=?').get(current.id))});
    }
    if(!ownSub[2]&&method==='PUT'){
      if(!['draft','rejected'].includes(current.status))fail(409,'Pending or approved proposals cannot be edited');
      const body=await jsonBody(req);let payload={},evidence='';
      const currentPlace=checkSubmissionAccess(business,current.action,current.place_slug);
      if(current.action==='claim')evidence=validString(body?.evidence,2000,'Ownership evidence');
      else payload=normalizeBusinessPlace(business.id,current.action==='edit'?current.place_slug:null,body?.payload);
      const t=new Date().toISOString();
      db.prepare("UPDATE business_submissions SET payload_json=?,evidence=?,base_updated_at=?,status='draft',admin_note='',reviewed_at=NULL,updated_at=? WHERE id=?")
       .run(JSON.stringify(payload),evidence,current.action==='edit'?currentPlace.updated_at:current.base_updated_at,t,current.id);
      return reply(res,200,{submission:submissionPublic(db.prepare('SELECT * FROM business_submissions WHERE id=?').get(current.id))});
    }
    if(!ownSub[2]&&method==='DELETE'){
      if(!['draft','rejected'].includes(current.status))fail(409,'Cannot delete a pending or approved submission');
      db.prepare('DELETE FROM business_submissions WHERE id=?').run(current.id);return reply(res,200,{ok:true});
    }
  }
  requireAdmin(req);
  // ADMIN BUSINESS APPROVAL: decisions are human-reviewed, not auto-published.
  if(route==='/api/admin/businesses'&&method==='GET'){
    const status=u.searchParams.get('status')||'all';if(!['all','pending','approved','rejected','suspended'].includes(status))fail(400,'Invalid business status');
    const query=`SELECT b.*,u.email AS owner_email,u.email_verified AS owner_verified FROM businesses b JOIN users u ON u.id=b.owner_id ${status==='all'?'':'WHERE b.status=?'} ORDER BY b.updated_at DESC LIMIT 300`;
    return reply(res,200,{businesses:db.prepare(query).all(...(status==='all'?[]:[status])).map(r=>({...businessPublic(r),ownerEmail:r.owner_email,ownerVerified:!!r.owner_verified,placeCount:ownerPlaces(r.id).length}))});
  }
  const businessDecision=/^\/api\/admin\/businesses\/([a-f0-9-]{36})\/decision$/.exec(route);
  if(businessDecision&&method==='POST'){
    checkOrigin(req);const body=await jsonBody(req),status=body?.status;
    if(!['approved','rejected','suspended','pending'].includes(status))fail(400,'Invalid business decision');
    const note=validString(body?.note,1000,'Admin note');if(status==='rejected'&&!note)fail(400,'Rejection reason required');
    const business=db.prepare('SELECT b.*,u.email_verified FROM businesses b JOIN users u ON u.id=b.owner_id WHERE b.id=?').get(businessDecision[1]);
    if(!business)fail(404,'Business not found');
    if(status==='approved'&&!business.email_verified)fail(409,'Owner must verify their email first');
    db.prepare('UPDATE businesses SET status=?,admin_note=?,updated_at=? WHERE id=?').run(status,note,new Date().toISOString(),business.id);
    audit('admin','1','business.decision','business',business.id,{before:business.status,after:status});return reply(res,200,{business:businessPublic(db.prepare('SELECT * FROM businesses WHERE id=?').get(business.id))});
  }
  if(route==='/api/admin/business-submissions'&&method==='GET'){
    const status=u.searchParams.get('status')||'pending';if(!['all','draft','pending','approved','rejected'].includes(status))fail(400,'Invalid status');
    const query=`SELECT s.*,b.name AS business_name FROM business_submissions s JOIN businesses b ON b.id=s.business_id ${status==='all'?'':'WHERE s.status=?'} ORDER BY s.updated_at DESC LIMIT 300`;
    return reply(res,200,{submissions:db.prepare(query).all(...(status==='all'?[]:[status])).map(r=>({...submissionPublic(r),businessName:r.business_name}))});
  }
  const submissionDecision=/^\/api\/admin\/business-submissions\/([a-f0-9-]{36})\/decision$/.exec(route);
  if(submissionDecision&&method==='POST'){
    checkOrigin(req);const body=await jsonBody(req),status=body?.status;
    if(!['approved','rejected'].includes(status))fail(400,'Invalid decision');
    const note=validString(body?.note,1000,'Admin note');if(status==='rejected'&&!note)fail(400,'Rejection reason required');
    const record=db.prepare('SELECT * FROM business_submissions WHERE id=?').get(submissionDecision[1]);
    if(!record)fail(404,'Submission not found');if(record.status!=='pending')fail(409,'Only pending proposals can be reviewed');
    if(status==='approved')approveSubmission(record,note);
    else db.prepare("UPDATE business_submissions SET status='rejected',admin_note=?,reviewed_at=?,updated_at=? WHERE id=?").run(note,new Date().toISOString(),new Date().toISOString(),record.id);
    audit('admin','1','proposal.decision','submission',record.id,{action:record.action,after:status,placeId:record.place_slug});return reply(res,200,{submission:submissionPublic(db.prepare('SELECT * FROM business_submissions WHERE id=?').get(record.id))});
  }
  // The admin cookie is scoped to /api/admin. Private merchant images use this authenticated route.
  const adminPlaceImage=/^\/api\/admin\/place-media\/([a-f0-9-]{36}\.(?:png|jpg|webp))$/.exec(route);
  if(adminPlaceImage&&method==='GET')return staticFile(req,res,{pathname:'/uploads/'+adminPlaceImage[1]},true);
  const adminBusinessImage=/^\/api\/admin\/business-media\/([a-f0-9-]{36}\.(?:png|jpg|webp))$/.exec(route);
  if(adminBusinessImage&&method==='GET')return staticFile(req,res,{pathname:'/uploads/'+adminBusinessImage[1]},true);
  // Admin images must be requested under /api/admin so the admin-only cookie is sent.
  const adminReviewImage=/^\/api\/admin\/review-media\/([a-f0-9-]{36}\.(?:png|jpg|webp))$/.exec(route);
  if(adminReviewImage&&method==='GET')return staticFile(req,res,{pathname:'/review-media/'+adminReviewImage[1]});
  if(route==='/api/admin/reviews'&&method==='GET'){
    const status=u.searchParams.get('status')||'pending';if(!['pending','approved','rejected','all'].includes(status))fail(400,'Invalid status');
    const rows=db.prepare(`SELECT r.*,u.name,u.email,p.name_en AS place_name FROM reviews r JOIN users u ON u.id=r.user_id JOIN places p ON p.slug=r.place_slug ${status==='all'?'':'WHERE r.status=?'} ORDER BY r.updated_at DESC LIMIT 300`).all(...(status==='all'?[]:[status]));
    return reply(res,200,{reviews:rows.map(r=>({...reviewPublic(r,true),email:r.email,placeName:r.place_name}))});
  }
  const mod=/^\/api\/admin\/reviews\/([a-f0-9-]{36})$/.exec(route);
  if(mod&&method==='PATCH'){
    checkOrigin(req);const b=await jsonBody(req);if(!['approved','rejected','pending'].includes(b?.status))fail(400,'Choose approved, rejected or pending');
    const before=db.prepare('SELECT status FROM reviews WHERE id=?').get(mod[1]);if(!before)fail(404,'Review not found');
    const result=db.prepare('UPDATE reviews SET status=?,moderated_at=? WHERE id=?').run(b.status,new Date().toISOString(),mod[1]);if(!result.changes)fail(404,'Review not found');
    audit('admin','1','review.moderate','review',mod[1],{before:before.status,after:b.status});return reply(res,200,{ok:true});
  }
  if(route==='/api/admin/audit'&&method==='GET'){
    // Authorization is enforced by requireAdmin() earlier in the request path.
    const rawLimit=u.searchParams.get('limit')||'50', rawBefore=u.searchParams.get('before')||'';
    if(!/^\d{1,3}$/.test(rawLimit)||Number(rawLimit)<1||Number(rawLimit)>100)fail(400,'Audit limit must be 1 to 100');
    if(rawBefore&&!/^\d{1,15}$/.test(rawBefore))fail(400,'Invalid audit cursor');
    const limit=Number(rawLimit),rows=rawBefore?
      db.prepare('SELECT * FROM audit_events WHERE id<? ORDER BY id DESC LIMIT ?').all(Number(rawBefore),limit):
      db.prepare('SELECT * FROM audit_events ORDER BY id DESC LIMIT ?').all(limit);
    return reply(res,200,{events:rows.map(row=>({id:row.id,time:row.occurred_at,actorType:row.actor_type,actorId:row.actor_id,action:row.action,entityType:row.entity_type,entityId:row.entity_id,context:JSON.parse(row.context_json)})),nextCursor:rows.length===limit?rows.at(-1).id:null});
  }
  if(route==='/api/admin/places'&&method==='GET')return reply(res,200,{places:getAdmin.all().map(x=>rowToPlace(x,true))});
  if(route==='/api/admin/uploads'&&method==='POST'){checkOrigin(req);return reply(res,201,uploadImage(await jsonBody(req)));}
  if(route==='/api/admin/places'&&method==='POST'){
    checkOrigin(req);const place=saveNew(normalize(await jsonBody(req)));
    audit('admin','1','place.create','place',place.id,{after:{name:place.en,status:place.status,category:place.category}});
    return reply(res,201,{place});
  }
  const m=/^\/api\/admin\/places\/([a-z0-9-]{1,65})$/.exec(route);
  if(m&&method==='PUT'){
    checkOrigin(req);const prev=getRow.get(m[1]);if(!prev)fail(404,'Place not found');
    const place=saveExisting(m[1],normalize(await jsonBody(req)));
    audit('admin','1','place.update','place',m[1],{before:placeAuditSummary(prev),after:{name:place.en,status:place.status,category:place.category}});
    return reply(res,200,{place});
  }
  if(m&&method==='DELETE'){
    checkOrigin(req);const prev=getRow.get(m[1]);if(!prev)fail(404,'Place not found');
    if(!db.prepare('DELETE FROM places WHERE slug=?').run(m[1]).changes)fail(404,'Place not found');
    audit('admin','1','place.delete','place',m[1],{before:placeAuditSummary(prev)});
    return reply(res,200,{ok:true});
  }
  fail(404,'Unknown API endpoint');
}
function staticFile(req,res,u,adminImageAccess=false){
  if(!['GET','HEAD'].includes(req.method))fail(405,'Method not allowed');
  let filePath,ext;
  if(u.pathname.startsWith('/review-media/')){
    if(!/^\/review-media\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(u.pathname))fail(404,'Not found');
    const fileName=path.basename(u.pathname);if(!reviewFileAccess(req,fileName))fail(404,'Not found');
    filePath=path.join(REVIEW_UPLOADS,fileName);
  } else if(u.pathname.startsWith('/uploads/')){
    if(!/^\/uploads\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(u.pathname))fail(404,'Not found');
    const filename=path.basename(u.pathname);
    // All non-published image files are private (including Admin uploads), not just merchant uploads.
    // The Admin uses a scoped /api/admin/place-media/ route for private preview images.
    if(!adminImageAccess){
      const merchantMedia=db.prepare('SELECT business_id FROM business_media WHERE filename=?').get(filename);
      const published=db.prepare("SELECT 1 FROM places WHERE status='published' AND (cover=? OR instr(gallery_json,?)>0) LIMIT 1").get(u.pathname,JSON.stringify(u.pathname).slice(1,-1));
      if(!published){
        const user=userSession(req),biz=user&&businessOf(user.id);
        if(!merchantMedia||biz?.id!==merchantMedia.business_id)fail(404,'Not found');
      }
    }
    filePath=path.join(UPLOADS,filename);
  } else {
    const route=u.pathname==='/'?'index.html':u.pathname==='/admin'?'admin.html':u.pathname.replace(/^\//,'');
    if(!new Set(['index.html','app.js','styles.css','admin.html','admin.js','admin.css','business.html','business.js','business.css','business-admin.html','business-admin.js','business-admin.css','review-v26.css','planner.html','planner.js','trip-engine.js','planner.css','admin-v26.css','business-v26.css','audit.html','audit.js','audit.css','moderation.html','moderation.js','moderation.css','sw.js','manifest.webmanifest']).has(route)&&!/^assets\/[a-z0-9_.-]+\.(?:webp|png|svg|jpg)$/.test(route))fail(404,'Not found');
    filePath=path.resolve(ROOT,route);
  }
  if(!fs.existsSync(filePath)||!fs.statSync(filePath).isFile())fail(404,'Not found');
  ext=path.extname(filePath).toLowerCase();res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':adminImageAccess?'private, no-store':u.pathname.startsWith('/uploads/')?'no-store':ext==='.html'||ext==='.js'||ext==='.css'||ext==='.webmanifest'?'no-cache':'public, max-age=3600'});
  if(req.method==='HEAD')return res.end();fs.createReadStream(filePath).pipe(res);
}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  try{checkHost(req);const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))await api(req,res,url);else staticFile(req,res,url);}
  catch(error){const status=error.status||500;if(status===500)console.error('[server error]',error);if(!res.headersSent)reply(res,status,{error:status===500?'Server error':error.message});else res.end();}
});
function listen(port,remaining=12){
 server.once('error',err=>{if(err.code==='EADDRINUSE'&&remaining>0)listen(port+1,remaining-1);else{console.error('Cannot start:',err.message);process.exitCode=1;}});
 server.listen(port,'127.0.0.1',()=>{
   console.log('');console.log(`[READY] unfold v2.7  http://127.0.0.1:${server.address().port}/`);
   console.log(`[ADMIN] http://127.0.0.1:${server.address().port}/admin.html`);
   console.log(`[BUSINESS] http://127.0.0.1:${server.address().port}/business.html`);
   console.log(`[DATA]  ${DATA}`);
   if(!db.prepare('SELECT id FROM admins WHERE id=1').get()){
     console.log('');console.log('[FIRST TIME SETUP] Enter this code in the Admin setup page:');console.log(`  ${SETUP_TOKEN}`);
   }
   console.log('Press Ctrl+C to stop.');
   if(process.platform==='win32'&&process.env.UNFOLD_NO_BROWSER!=='1'){
     const {execFile}=require('node:child_process');
     execFile('cmd.exe',['/d','/c',`start "" "http://127.0.0.1:${server.address().port}/"`],{windowsHide:true},(err)=>{if(err)console.log('Open the URL above manually in your browser.');});
   }
 });
}
if(require.main===module){const arg=Number(process.env.PORT||5173);listen(Number.isInteger(arg)&&arg>=0&&arg<65536?arg:5173,process.env.PORT?0:12);}
module.exports={server,db};
