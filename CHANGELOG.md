# CHANGELOG — บันทึกการเปลี่ยนแปลงของทีม Traval

ทีมตกลงกันว่า **แก้โค้ดของคนอื่นได้** แต่ต้องเขียนไว้ที่นี่ทุกครั้งว่า *เปลี่ยนอะไร* และ *เพื่ออะไร*
เพื่อให้ทุกคน (หรือ AI ที่ช่วยอ่าน) เข้าใจตรงกันโดยไม่ต้องไล่อ่าน diff เอง

**วิธีใช้ไฟล์นี้**
- รายการใหม่อยู่ **บนสุด** · 1 รายการ = 1 commit หรือ 1 งาน
- เขียนก่อน commit แล้ว commit ไฟล์นี้ไปพร้อมโค้ด
- ถ้าแก้ไฟล์ของคนอื่น ให้ใส่ชื่อเจ้าของในตาราง และใส่คอมเมนต์ `ชื่อเรา:` ไว้ที่บรรทัดที่แก้ในโค้ดด้วย
- ใช้ชื่อไฟล์/ฟังก์ชัน/ตัวแปรภาษาอังกฤษตามโค้ดจริง (AI ค้นเจอได้ทันที)
- ข้อความ commit: `ประเภท(ส่วน): สรุปสั้น` เช่น `feat(auth): ...`, `fix(planner): ...`, `docs: ...`

**แบบฟอร์ม** (คัดลอกไปใช้)

```markdown
## YYYY-MM-DD — หัวข้อสั้น ๆ  (ผู้แก้: ชื่อ · commit: abc1234 หรือ "ยังไม่ commit")

**ทำไม:** ปัญหาเดิม / สิ่งที่ต้องการ 1–2 บรรทัด
**ผลลัพธ์:** ผู้ใช้/ทีมเห็นอะไรเปลี่ยนไป

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร |
|---|---|---|
| `path/file.js` | ชื่อ | สิ่งที่เพิ่ม/แก้ (ฟังก์ชัน, endpoint, ตัวแปร) |

**ใช้ยังไง / ตั้งค่า:** คำสั่ง, ตัวแปร env, ปุ่มที่กด (ถ้ามี)
**กระทบใคร / ต้องระวัง:** อะไรที่คนอื่นต้องรู้ก่อนแก้ต่อ
**ทดสอบ:** test ที่เพิ่ม + ผล `npm test`
```

---

## 2026-10-29 — เข้าสู่ระบบด้วย Google แบบจริง  (ผู้แก้: Tommy · commit: ยังไม่ commit)

**ทำไม:** ปุ่ม Google เดิมเปิดกล่องให้พิมพ์อีเมลเอง แล้วเซิร์ฟเวอร์เชื่อตามนั้น → ใครก็เข้าบัญชีคนอื่นได้ถ้ารู้อีเมล
**ผลลัพธ์:** หน้า login ใช้ปุ่ม "Continue with Google" ของ Google จริง; เซิร์ฟเวอร์ตรวจลายเซ็นของ Google ก่อนเข้าระบบ และใช้อีเมล/ชื่อ/รูปจาก Google เท่านั้น (ฟรี ไม่มีค่าใช้จ่าย)

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร |
|---|---|---|
| `backend/google-auth.js` | Tommy (ใหม่) | `verifyIdToken()` ตรวจ ID token ของ Google ด้วย `node:crypto` (RS256, กุญแจสาธารณะของ Google + แคช, `iss`, `aud`, `exp`, `email_verified`); `googleLoginFields()` ใช้ใน `/api/auth/social`; `publicConfig()`; ตรวจรูปแบบ Client ID |
| `frontend/shared/google-login.js` | Tommy (ใหม่) | ถาม `/api/auth/google/config` → ถ้ามี Client ID ซ่อน `#btn-google` แล้วใส่ปุ่มของ Google แทน → ส่ง `{provider:'google', credential}` ไป `/api/auth/social` |
| `backend/server.js` | Prom | +`require('./google-auth.js')`; +`GET /api/auth/google/config`; ใน `POST /api/auth/social` ถ้า `provider==='google'` เรียก `googleAuth.googleLoginFields()` แล้วเขียนทับ email/name/providerId/avatarUrl; +`'google-login.js'` ใน `PAGE_FILES` |
| `frontend/auth/login.html` | Phodjanaphon | +`<script src="/google-login.js" defer>` (ไม่แก้ปุ่มหรือกล่องเดิม) |
| `tests/google_auth.test.js` | Tommy (ใหม่) | 6 tests |
| `docs/tommy-2026-10-25.md` | Tommy | ข้อ 12 วิธีสร้าง Client ID |

**ใช้ยังไง / ตั้งค่า:**
- `set TRAVAL_GOOGLE_CLIENT_ID=<Client ID>.apps.googleusercontent.com` ก่อน `run.bat` แล้วเปิด **`http://localhost:5173`** (ไม่ใช่ 127.0.0.1)
- ไม่ต้องใช้ Client Secret · Client ID ไม่ใช่ความลับ
- Google Cloud: Clients → Authorized JavaScript origins ต้องมี `http://localhost:5173` และโดเมนจริงตอนเปิดใช้ (https)

**กระทบใคร / ต้องระวัง:**
- ไม่ตั้ง Client ID = โหมดทดลอง: กล่องพิมพ์อีเมลเดิมใช้ได้ **เฉพาะเปิดจากเครื่องตัวเอง** (เรียกจากเครื่องอื่น → 503) test เดิม `admin_improvements.test.js` จึงยังผ่าน — อย่าตั้ง `TRAVAL_GOOGLE_CLIENT_ID` ไว้ตอนรัน `npm test`
- **Facebook** และ **Phone OTP** ยังเป็นแบบจำลอง (เข้าบัญชีคนอื่นได้ / ส่งรหัส `devOtp` กลับไปที่เบราว์เซอร์) — ต้องแก้ก่อนเปิดใช้จริง
- หน้า `profile.html`: ตัวเลข 4 / 18 / 6, Travel Style และสวิตช์ เป็นค่าตายตัว; ยังไม่แสดงรูปโปรไฟล์ Google (เซิร์ฟเวอร์เก็บ `avatar_url` แล้ว)

**ทดสอบ:** `npm test` 35/35 ผ่าน · ทดสอบจริงกับบัญชี Google แล้ว เข้าระบบได้ ชื่อ/อีเมลตรงกับ Google

---

## 2026-10-28 — แก้ GitHub Actions (CI)  (ผู้แก้: Tommy · commit: 433950e)

**ทำไม:** CI ใช้ template ของ GitHub ที่ไม่เข้ากับโปรเจกต์ (ต้องมี `package-lock.json`, ทดสอบ Node 18/20 ที่ไม่มี `node:sqlite`)
**ผลลัพธ์:** ทดสอบบน Node 22 และ 24 ด้วย `npm test` อย่างเดียว

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร |
|---|---|---|
| `.github/workflows/node.js.yml` | ruttinon | matrix `[22.x, 24.x]`; ลบ `cache: 'npm'`, `npm ci`, `npm run build` |

**กระทบใคร / ต้องระวัง:** CI ยังไม่รันเพราะบัญชี GitHub ของ ruttinon ถูกล็อก ("account is locked due to a billing issue") — ruttinon ต้องแก้ที่ Settings → Billing

---

## 2026-10-27 — แผนที่: ซูมสองนิ้ว, เส้นทางจริง, ค่าเดินทาง, สถานที่ทั่วไทย  (ผู้แก้: Tommy · commit: b5e712f)

**ทำไม:** แผนที่ต้องใช้ได้ทั้งเมาส์และมือถือ, ทริปต้องมีระยะทาง/เวลา/ราคาจริง, ต้องมีสถานที่ทั่วประเทศโดยไม่เสียค่า Google API
**ผลลัพธ์:** ซูมด้วยสองนิ้ว/ล้อเมาส์; การ์ด "Trip route" ใน My trips (ระยะทางตามถนน, เวลา, ค่าแท็กซี่มิเตอร์กรุงเทพฯ, ค่าน้ำมัน, เส้นบนแผนที่, ปุ่ม ↑↓ เรียงลำดับ); สถานที่ OSM ~70,000 แห่ง เป็นจุดสีบนแผนที่; ปุ่ม "นำทางด้วย Google Maps" และ "รีวิวบน Google" (ลิงก์ ไม่ใช้ API ที่เสียเงิน)

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร |
|---|---|---|
| `frontend/shared/travel-cost.js` | Tommy (ใหม่) | `TravalCost`: `taxiFare`, `taxiFareRange`, `fuelCost`, `tripCost` |
| `frontend/shared/maps-links.js` | Tommy (ใหม่) | `TravalLinks`: `directionsUrl`, `placeUrl`, `googleTravelMode` |
| `frontend/shared/map-gestures.js` | Tommy (ใหม่) | `TravalMapGestures.attach()` — ถ่างนิ้ว + ล้อเมาส์ |
| `frontend/shared/road-route.js` | Tommy (ใหม่) | `TravalRoute.route()` เรียก `POST /api/routes`, ถ้าไม่ได้ใช้ `estimate()` เส้นตรง |
| `backend/routing.js` | Tommy (ใหม่) | `POST /api/routes` → OSRM (ตั้งด้วย `TRAVAL_OSRM_CAR` / `TRAVAL_OSRM_FOOT`), แคช 15 นาที, จำกัด 60 ครั้ง/นาที/IP |
| `backend/osm-places.js` | Tommy (ใหม่) | `GET /api/map/places`, `/api/map/search`, `/api/map/osm-status` จากไฟล์ `osm-places.sqlite` |
| `scripts/osm/*`, `IMPORT-OSM-PLACES-WINDOWS.cmd` | Tommy (ใหม่) | สร้าง/นำเข้ารายชื่อสถานที่ (`thailand-places.ndjson.gz` 3 MB) |
| `backend/server.js` | Prom | require 2 ไฟล์ข้างบน, `PAGE_FILES` ของไฟล์ shared, hook `/api/map/*` และ `/api/routes`, `module.exports` เพิ่ม `DATA` |
| `frontend/traveler/app.js` | Moo | บล็อก `Tommy:` — trip route, OSM pins, `move-trip`, ปุ่ม Google, `googlePlaceId`, `MAP_TILE_URL`, ซูม (ใช้การลากของ Moo ตามเดิม) |
| `frontend/traveler/index.html`, `sw.js` | Moo | โหลด/แคชไฟล์ shared |
| `tests/travel_tools.test.js`, `tests/osm_places.test.js` | Tommy (ใหม่) | 13 tests |

**ใช้ยังไง:** ครั้งแรกดับเบิลคลิก `IMPORT-OSM-PLACES-WINDOWS.cmd` แล้วเปิด `run.bat`
**กระทบใคร / ต้องระวัง:** เซิร์ฟเวอร์เส้นทาง/ภาพแผนที่สาธารณะใช้ได้แค่ช่วงทดสอบ — แผนก่อนเปิดจริงอยู่ใน `docs/tommy-2026-10-25.md` ข้อ 11
**ทดสอบ:** `npm test` 29/29 ผ่าน · ทดสอบในเบราว์เซอร์ (มือถือ + คอม)

---

รายละเอียดเต็มของงาน Tommy: `docs/tommy-2026-10-25.md`
