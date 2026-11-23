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

## 2026-11-06 — ตรวจ UX ทุกหน้า: ใช้เป็นเองได้โดยไม่ต้องสอน  (ผู้แก้: Tommy · commit: ยังไม่ commit)

**ทำไม:** เปิดทุกหน้าแบบผู้ใช้ครั้งแรก ทั้งบนมือถือและคอม แล้วพบว่าบนมือถือไปหน้าอื่นไม่ได้เลย หน้าเข้าสู่ระบบบนมือถือไม่มีช่องกรอก Business portal แสดงร้านตัวอย่างให้เจ้าของร้านใหม่ ชื่อแอปมีทั้ง "Traval" และ "unfold" และ Planner กับ Business portal ไม่มีทางเข้าจากแอป
**รายละเอียดเต็ม (สิ่งที่พบ, สิ่งที่แก้, สิ่งที่ยังไม่แก้): `docs/ux-2026-11-06.md`**

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร |
|---|---|---|
| `frontend/traveler/app.js`, `styles.css` | Moo | `bottomNav()` แถบเมนูมือถือมีคำกำกับ (`.tabbar`) · การ์ดวิธีใช้ 4 ข้อในการ์ดต้อนรับ · การ์ด "วางแผนทริป" / "เจ้าของร้าน" ในหน้าสำรวจ + ลิงก์ในเมนู ☰ (`.overlay-extra`) · หน้าบันทึก/ทริปว่างบอกวิธีใช้ · ภาษาเริ่มตามเครื่อง · ปุ่มภาษา "ไทย/EN" + รูปโลก · เงาหลังหัวข้อหน้าแรก · `:focus-visible` · ลบข้อความ "(Nine)" |
| `frontend/traveler/manifest.webmanifest` | Moo | ชื่อแอปบนมือถือ "Traval" |
| `frontend/shared/site-ux.css` (ใหม่) | Tommy | หน้า login/register/forgot/profile ใช้บนมือถือ/จอเล็กได้ (เดิมล็อก 1440 px) · รูปจากเครื่องเราแทน Unsplash · focus outline |
| `frontend/auth/login.html`, `register.html`, `forgot-password.html`, `profile.html` | Nine / Phodjanaphon | ชื่อ "Traval" · เมนูชี้หน้าจริง (`/`, `/#map`, `/#saved`, `/planner.html`) · โหลด `site-ux.css` · หลังล็อกอินไป `?next=` · profile: สถิติเป็นลิงก์จริง, การ์ด "เป็นเจ้าของร้าน?", ปุ่ม "Sign out all devices" |
| `frontend/shared/google-login.js` | Tommy | `window.travalNext()` — ไปหน้า `?next=` อย่างปลอดภัย (เฉพาะ path ในเว็บเรา) |
| `frontend/planner/planner.html` | Nine | ชื่อ/เมนู · "เข้าสู่ระบบ" แทน "Nine (UX/UI)" · ป้าย "แผนตัวอย่าง" (`#samplePlanNote`, หายใน `showPlan()`) · คำอธิบายโหมด · `<label for>` 7 ช่อง · การ์ดจุดแวะบนมือถือ |
| `frontend/business/business.html` | Nine / ruttinon | `renderOwnerSteps()` ขั้นตอนต่อไป 5 ขั้นจากสถานะจริง · ลบร้าน/ตัวเลขตัวอย่าง · เมนูเรียงตามลำดับงาน, เอาลิงก์แอดมินออก · `switchView(tab)` หาปุ่มเอง · ชื่อ/ปุ่มเข้าสู่ระบบจริงในแถบซ้าย |
| `frontend/admin/admin.html` | ruttinon | ชื่อแอป "Traval", ชื่อผู้ดูแล "admin" (เดิม "Nine (Lead Designer)") |
| `backend/server.js` | Prom | `PAGE_FILES` + `site-ux.css` |

**กระทบใคร / ต้องระวัง:** ถ้าแก้ CSS ของหน้า auth ให้ดู `site-ux.css` ด้วย (โหลดท้ายสุด จึงชนะ) · เมนู Business ห้ามเรียกปุ่มด้วยลำดับ `querySelectorAll('.nav-btn')[n]` อีก ให้ใช้ `switchView('ชื่อแท็บ')` · `bottomNav()` ถูกใช้ทุกหน้าในแอป ถ้าจะซ่อนแถบนี้ต้องมีเมนูอื่นแทนบนมือถือ
**ทดสอบ:** `npm test` 39/39 · QA API 99/100 · QA เบราว์เซอร์ 43/45 — ข้อที่ไม่ผ่านเป็นข้อเดิมที่อธิบายไว้แล้วด้านล่าง ไม่มีข้อใหม่ · ทดสอบเพิ่ม: กดแถบเมนูมือถือครบ 5 ปุ่ม, ล็อกอินแล้วกลับ Business portal ผ่าน `?next=`, ปุ่มในขั้นตอนเปิดแท็บถูก · สแกนทุกหน้า: ไม่มีปุ่มที่ไม่มีชื่อ และไม่มีช่องกรอกที่ไม่มีป้ายกำกับ

---

## 2026-11-06 — หน้าร้าน SME (Shop page): เจ้าของร้านออกแบบหน้าร้านเองจากแม่แบบ, แอดมินอนุมัติครั้งแรก  (ผู้แก้: Tommy · commit: ยังไม่ commit)

**ทำไม:** ฟีเจอร์ที่แอปตัวจริงต้องมี — ร้าน SME มีหน้าเว็บของตัวเองที่นักท่องเที่ยวเปิดจากแผนที่ได้เหมือนเปิดสถานที่ เจ้าของแก้เองได้ ใช้แม่แบบของเรา
**กฎที่ทีมตัดสินใจ:** หน้าร้าน **ครั้งแรก** ต้องให้แอดมินอนุมัติ · หลังอนุมัติแล้ว เจ้าของ **แก้และเผยแพร่เองได้ทันที** · แอดมิน "ซ่อน" ได้ทุกเมื่อ (เจ้าของแก้แล้วส่งใหม่ → รออนุมัติอีกครั้ง) · รีวิวของเราแสดงเสมอ + ปุ่ม "รีวิวบน Google" **เฉพาะร้านที่เจ้าของใส่ลิงก์ Google Maps ไว้** (ร้าน SME ที่สร้างใน Traval ส่วนใหญ่ไม่มีหน้า Google)
**ผลลัพธ์:** ในแอป รายละเอียดสถานที่ + แผ่นบนแผนที่มีปุ่ม "🏪 ดูหน้าร้าน" → `/shop/<place id>` · Business portal มีแท็บ "หน้าร้านของฉัน" (แก้ซ้าย, ดูตัวอย่างมือถือขวา) · Admin แท็บ "ตรวจสอบร้านค้า SME" มีส่วน "หน้าร้าน SME"
**รายละเอียดเต็ม (API, ข้อมูล, ความปลอดภัย): `docs/shop-pages.md`**

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร |
|---|---|---|
| `backend/shop-pages.js` (ใหม่) | Tommy | ตาราง `shop_pages`, ตรวจข้อมูลเข้มงวด (ไม่มี HTML, รูปต้องเป็นของร้านเอง, ลิงก์ https เท่านั้น, ลิงก์ Google ต้องเป็นของ Google), API เจ้าของ / สาธารณะ / แอดมิน |
| `backend/server.js` | Prom | `require('./shop-pages.js')` + `makeShopPages(...)` · ส่งเส้นทาง `/api/shop-pages*`, `/api/business/shop-pages*`, `/api/admin/shop-pages*` ไปที่โมดูล · หน้า `/shop/<id>` · รูปใน `/uploads/` ที่อยู่บนหน้าร้านที่เผยแพร่แล้วเปิดดูได้สาธารณะ · `PAGE_FILES` +6 ไฟล์ |
| `frontend/shared/shop-render.js`, `shop-render.css` (ใหม่) | Tommy | วาดหน้าร้าน (แม่แบบ classic / modern / market, 5 สี, ส่วน hero / story / menu / gallery / hours / promo / contact) ใช้ร่วมกันทั้งหน้าจริงและตัวอย่างใน editor |
| `frontend/shop/shop.html`, `shop.js` (ใหม่) | Tommy | หน้าร้านสาธารณะ: นำทาง, รีวิว Traval + ปุ่มเขียนรีวิวในแอป, รีวิวบน Google (ถ้ามี), แชร์ |
| `frontend/business/shop-editor.js`, `shop-editor.css` (ใหม่) | Tommy | editor หน้าร้าน: เลือกแม่แบบ/สี, ลิงก์ Google, เพิ่ม/ลบ/เลื่อน/ซ่อนส่วน, อัปโหลดรูป (ย่อเป็น WebP ≤1600px ก่อนส่ง), บันทึกร่าง, ส่งตรวจ/เผยแพร่ |
| `frontend/business/business.html` | Nine / ruttinon | +ปุ่มเมนู "หน้าร้านของฉัน", +`<section id="view-shoppage">`, โหลด css/js ข้างบน, `switchView('shoppage')` เรียก `TravalShopEditor.load()` |
| `frontend/admin/admin-shop-pages.js` (ใหม่) + `frontend/admin/admin.html` | Tommy / ruttinon | ส่วน "หน้าร้าน SME" ในแท็บ businesses: รายการรออนุมัติ / เผยแพร่อยู่ / ซ่อน, ดูตัวอย่างแบบมือถือ, อนุมัติ, ส่งกลับ (ต้องใส่เหตุผล), ซ่อน |
| `frontend/traveler/app.js` | Moo | `SHOP_PAGES` (โหลด `/api/shop-pages` พร้อมสถานที่), `shopPageUrl()`, `googleReviewsUrl()` · ปุ่ม "ดูหน้าร้าน" ในหน้าสถานที่ + แผ่นบนแผนที่ · ปุ่ม "รีวิวบน Google" ซ่อนสำหรับร้าน SME ที่ไม่มีลิงก์ Google · **แก้บั๊ก:** ลิงก์ `/#place=<id>` (ปุ่มแชร์) เปิดหน้า welcome แทนสถานที่ → ตอนนี้เปิดสถานที่ (`startPlace`) · **แก้บั๊ก:** เวลาเปิด-ปิดขึ้น `[object Object]` (`hoursText()`), และเลิกแสดงเวลาปลอม "เปิดทุกวัน 08:30-18:00" เมื่อไม่รู้เวลา |
| `tests/shop_pages.test.js` (ใหม่) | Tommy | ทดสอบกฎอนุมัติ, ความปลอดภัย, รูป, ลิงก์ Google ครบทั้งวงจร |

**ใช้ยังไง / ตั้งค่า:** เจ้าของร้านต้องมีธุรกิจที่อนุมัติแล้ว และเป็นเจ้าของสถานที่บนแผนที่ (ส่งร้านใหม่หรืออ้างสิทธิ์แล้วแอดมินอนุมัติ) · อนาคตถ้าจะไม่ต้องอนุมัติครั้งแรกด้วย: ตั้ง `TRAVAL_SHOP_PAGES_AUTO_APPROVE=1`
**กระทบใคร / ต้องระวัง:** ห้ามเปลี่ยน `shop-render.js` ให้รับ HTML จากเจ้าของร้าน (ความปลอดภัยทั้งระบบพึ่งข้อนี้) · ถ้าเพิ่มส่วนใหม่ ต้องเพิ่มทั้ง `SECTION_TYPES` ใน `backend/shop-pages.js` และ `shop-render.js` · การแก้หลังอนุมัติไม่ผ่านแอดมิน → audit log มี `shop_page.publish` (+`googleChanged`) ให้ตรวจย้อนหลัง
**ทดสอบ:** `npm test` 39/39 (+1 `shop_pages.test.js`) · เบราว์เซอร์: editor (คอม + มือถือ), หน้าร้าน 3 แม่แบบ, แอดมินดูตัวอย่าง + อนุมัติ, ปุ่มจากแอป → หน้าร้าน → กลับ

---

## 2026-11-06 — แก้ปัญหาจากการทดสอบทั้งระบบ รวมส่วนของเพื่อนในทีม  (ผู้แก้: Tommy · commit: fix: QA fixes across the team)

**ทำไม:** ผลทดสอบ `docs/qa-2026-11-05.md` พบปัญหา 12 ข้อ ส่วนใหญ่อยู่ในไฟล์ของคนอื่น — ทีมตกลงให้แก้ได้ถ้าเขียนบอกชัดเจน
**รายละเอียดเต็มแยกตามคน (อ่านก่อนแก้ไฟล์เหล่านี้ต่อ): `docs/handoff-2026-11-06.md`**

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร (สั้น) |
|---|---|---|
| `frontend/business/business.html` | Nine / ruttinon | ฟอร์มลงทะเบียนร้าน / โปรไฟล์ร้าน / อ้างสิทธิ์ ส่งถึงแอดมินจริงตามกฎเซิร์ฟเวอร์ + บอกสถานะจริง + อัปโหลดรูปจริง + เก็บร่างในเครื่อง · แท็บอ้างสิทธิ์แสดงได้ · escape ข้อความ · ใช้บนมือถือได้ |
| `frontend/planner/planner.html` | Nine | ทริปที่บันทึกไว้: แสดง / เปิด / แก้ / ลบ · รายการสถานที่ในแผนจริง · แสดง `note` · ใช้บนมือถือได้ |
| `backend/server.js` | Prom | Facebook demo + OTP (`devOtp`) ใช้ได้เฉพาะเครื่องตัวเอง (เครื่องอื่น 503) · Planner: ปลายทางมีสถานที่น้อย → เพิ่มที่ใกล้ ≤150 กม. แทนทั้งประเทศ, จับชื่อทั้งคำ, `note` |
| `frontend/auth/profile.html` | Phodjanaphon | ตัวเลข ทริป / สถานที่ / รีวิว จากเซิร์ฟเวอร์ (`loadProfileCounts()`) |
| `frontend/traveler/app.js` | Moo | รวมรายการผู้เยี่ยมชมเข้าบัญชีตอนล็อกอิน (`placesReady`) · ไม่กรองรายการตอนเริ่ม · ไม่รวม `SAMPLE_PLACES` กับข้อมูลจริง · ลงทะเบียน service worker · ปุ่ม "+ ทริป" + หัวใจในแผ่นแผนที่ · จุด OSM ไม่ซ้อน |
| `frontend/traveler/sw.js` | Moo | cache ใหม่ `unfold-v2.7-offline-1`, ออฟไลน์เปิดหน้าแอปได้ทุก URL, +`google-login.js` |
| `assets/1–3.png` → `.jpg` (+ `frontend/traveler/assets/`) | Moo | ไฟล์เป็น JPEG จริง ตั้งชื่อให้ตรง |
| `frontend/admin/admin.html` | ruttinon | CSS มือถือเท่านั้น |
| `frontend/shared/map-gestures.js` | Tommy | ถ่างนิ้วซูมได้แม้เริ่มบนหมุด |
| `tests/demo_logins.test.js` (ใหม่) | Tommy | Facebook / OTP เฉพาะเครื่องตัวเอง |
| `docs/handoff-2026-11-06.md` (ใหม่), `docs/qa-2026-11-05.md` | Tommy | บันทึกส่งต่อ + อัปเดตสถานะในรายงานทดสอบ |

**กระทบใคร / ต้องระวัง:** ทดสอบ Facebook / เบอร์โทร ต้องเปิดจากเครื่องที่รันเซิร์ฟเวอร์ (`localhost` / `127.0.0.1`) · เจ้าของร้านต้องรอแอดมินอนุมัติธุรกิจก่อนส่งร้าน (กฎเซิร์ฟเวอร์เดิม — ตอนนี้หน้าเว็บบอกตรง ๆ) · ถ้าเพิ่มไฟล์ใน `sw.js` `ASSETS` ให้เปลี่ยนชื่อ `CACHE`
**ทดสอบ:** `npm test` 38/38 · API 100/100 · เบราว์เซอร์ (มือถือ + คอม) 45/45 · ฟอร์มร้านค้าตั้งแต่สมัครจนร้านขึ้นในแอป ผ่าน

---

## 2026-11-05 — เก็บงานแผนที่/Google ให้ครบ: Planner, รูป Google, ปุ่มสมัครด้วย Google, หมุดร้านค้า, รายการ OSM บนเซิร์ฟเวอร์, ลบไฟล์เก่า  (ผู้แก้: Tommy · commit: feat(map): finish map & Google work)

**ทำไม:** ตรวจทุกส่วนที่เกี่ยวกับแผนที่/Google ก่อนรวมเข้า main แล้วพบ:
1. หน้า Planner กด "Generate AI Trip" แล้ว **ไม่แสดงอะไรเลย** — เซิร์ฟเวอร์ส่ง `dailyItinerary`/`places` แต่หน้าเว็บอ่าน `itinerary`/`schedule` จึงหยุดทำงานเงียบ ๆ (ที่เห็นคือแผนตัวอย่างที่เขียนตายตัวไว้)
2. ระยะทาง/เวลาแต่ละช่วงเป็นค่าตายตัว "20 นาที (12 กม.)" · 3. ค่าเดินทางบนเซิร์ฟเวอร์ใช้สูตรแท็กซี่อีกชุด (ขาดช่วงระยะไกล, ค่าน้ำมันคนละค่า)
4. ปุ่ม "เปิดนำทางใน Google Maps" เปิด Google Maps เปล่า · 5. "แวะร้านชุมชน" ค้นใกล้เชียงใหม่เสมอ (พิกัดเขียนตายตัว)
6. หน้าโปรไฟล์ไม่แสดงรูป Google · 7. ปุ่ม "Google / Facebook" ในหน้าสมัครแค่พาไปหน้า login
8. หมุดร้านค้าในหน้า Business เป็นของปลอม (สุ่มตำแหน่งรอบแม่กำปอง + รูปแผนที่ตายตัว) · 9. สถานที่ OSM ในรายการของผู้ใช้ที่ล็อกอิน เก็บแค่ในเครื่อง
10. ไฟล์เก่าที่ไม่ใช้แล้ว + ไฟล์ `พบ` ที่ถูกสร้างใหม่ทุกครั้งที่เปิด run.bat

**ผลลัพธ์:**
- **Planner:** แสดงแผนจริงจากเซิร์ฟเวอร์ · ระยะทาง/เวลาตามถนนจริงทีละช่วง (ถ้าเซิร์ฟเวอร์เส้นทางไม่ตอบ ใช้ค่าประมาณและเขียนว่า "ประมาณ") · ค่าเดินทางสูตรเดียวกับหน้า My trips · ลิงก์ "นำทางวันนี้ใน Google Maps" ทุกวัน + ปุ่มหลักเปิดทั้งทริป · ปุ่ม "รีวิว ↗" ทุกจุด · ร้านชุมชนแนะนำจากจุดแวะจริงของแต่ละวัน กดแล้วแทรกหลังจุดที่ใกล้ที่สุดและคำนวณเส้นทางใหม่ · ปลายทาง "เชียงใหม่" หาเจอจริง (เดิมได้สถานที่ทั้งประเทศ) · สถานที่ที่เลือกจากแอป (send to planner) อยู่ในแผนเสมอ · บันทึกทริปบันทึกแผนที่เห็นบนจอ (เดิมถ้ายังไม่ generate จะบันทึกสถานที่สุ่ม) · ชื่อสถานที่ถูก escape (กันโค้ดแปลกปลอมจากข้อมูลร้าน)
- **Google:** รูปโปรไฟล์ Google ในหน้าโปรไฟล์ · ปุ่ม "Sign up with Google" จริงในหน้าสมัคร · ถ้าตั้ง Client ID แล้ว เซิร์ฟเวอร์เปิดเบราว์เซอร์ที่ `http://localhost:5173` ให้เอง (Google ไม่รับ 127.0.0.1)
- **Business:** แผนที่เลือกตำแหน่งจริง — ลากแผนที่ให้หมุดตรงร้าน / แตะจุด / ค้นหาชื่อสถานที่ / ปุ่ม GPS / พิมพ์ตัวเลข ทั้งหมดซิงก์กัน · ต้องปักหมุดก่อนส่ง (เดิมใส่แม่กำปองให้เอง)
- **รายการ OSM:** บันทึกบนเซิร์ฟเวอร์ ล็อกอินเครื่องไหนก็เห็น ลำดับเหมือนเดิม · ครั้งแรกหลังอัปเดต รายการที่เคยเก็บในเครื่องจะถูกอัปโหลดให้อัตโนมัติ

| ไฟล์ | เจ้าของ | เปลี่ยนอะไร |
|---|---|---|
| `frontend/planner/planner.html` | Nine | โหลด `trip-engine.js`, `travel-cost.js`, `maps-links.js`, `road-route.js` · เขียน `renderGeneratedPlan()` ใหม่ให้อ่าน `dailyItinerary` · ใหม่: `showPlan()`, `routePlan()`, `updatePlanBudget()`, `updateGoogleNavButton()`/`openGoogleNav()`, `addSmeStop()`, `esc()`, `destinationLabel()`, `importedPlaceIds()` · `insertStopover()` ใช้แผนจริงเมื่อมี (แผนตัวอย่างยังใช้พิกัดของแผนตัวอย่าง) · `savePlan()` ใช้ `groups` ของแผน + `budgetBreakdown` · `checkImportedPlaces()` ส่ง `mustVisit` · ปุ่มหลักมี `id="btnGoogleNav"` |
| `backend/server.js` | Prom | `require` `travel-cost.js` + `road-route.js` · `generateAiTripPlan()`: แปลง `chiang-mai`→`chiang mai`, เก็บ `mustVisit` ครบแม้อยู่นอกปลายทาง, ระยะ/เวลาแต่ละช่วงจาก `TravalRoute.estimate` (ส่ง `legs` ต่อวัน), ค่าเดินทางจาก `TravalCost.tripCost`, รับ `destinationName` สำหรับชื่อทริป · `/api/trips/estimate-cost` ใช้ `TravalCost` (รับ `travelMinutes` เพิ่มได้) · ตารางใหม่ `user_osm_collections` + `collectionWithOsm()` · `GET /api/me/collections` ส่ง `osmPlaces` · `PUT` รับ id `osm-n/w/r…` (ตรวจกับไฟล์ OSM) · `PAGE_FILES`: +`map-picker.js`, −`planner.js`, −`planner.css`, −`planner-legacy.html`, −`google-maps-poc.html` · เปิดเบราว์เซอร์ที่ `localhost` เมื่อเปิด Google sign-in |
| `backend/osm-places.js` | Tommy | +`getByIds()`, +`ID_PATTERN` |
| `frontend/traveler/app.js` | Moo | `loadAccountCollections()` รับ `osmPlaces` จากเซิร์ฟเวอร์ + อัปโหลดรายการในเครื่องครั้งแรก · `persistCollections()` ส่ง OSM ด้วย · `mergeOsmLists()` ให้เซิร์ฟเวอร์เป็นหลักเมื่อมี OSM แล้ว |
| `frontend/shared/map-picker.js` | Tommy (ใหม่) | `TravalMapPicker.attach(el, {lat, lon, zoom, onChange})` → `{set, get}` · ภาพแผนที่ OSM, ลาก/แตะ/ล้อเมาส์/สองนิ้ว/ปุ่ม +−, ค้นหาผ่าน `/api/map/search`, เครดิต OSM |
| `frontend/business/business.html` | Nine / ruttinon | `#bizMiniMap` ใช้ `TravalMapPicker` · ใหม่: `initBizPicker()`, `setBizCoords()`, `onBizCoordTyped()` · `useCurrentGpsForBiz()` ย้ายหมุดด้วย · ลบ `onBizMapClick()` (หมุดปลอม) · ช่องพิกัดเริ่มว่าง · `submitWizard()` บังคับปักหมุด · `goToStep(2)` สร้างแผนที่ |
| `frontend/auth/profile.html` | Phodjanaphon | `showAvatar()` แสดงรูปจาก `avatarUrl` (https เท่านั้น, ถ้าโหลดไม่ได้กลับเป็นตัวอักษร) |
| `frontend/auth/register.html` | Phodjanaphon | ปุ่ม `id="btn-google"` + `data-google-text="signup_with"` + โหลด `/google-login.js` · ปุ่มที่สองเป็น "Facebook / Phone OTP" |
| `frontend/shared/google-login.js` | Tommy | ใช้ได้ทั้งหน้า login และ register (ข้อความปุ่ม/context จาก `data-google-text`, ช่องแสดง error ของหน้า register) |
| `run.bat` | Nine / ruttinon | `->` เป็น `-^>` — cmd อ่าน `>` เป็นคำสั่งเขียนไฟล์ จึงสร้างไฟล์ชื่อ `พบ` ทุกครั้ง · ลบบรรทัด POC |
| ลบ: `frontend/poc/google-maps-poc.html`, `frontend/planner/planner-legacy.html`, `planner.js`, `planner.css`, `พบ` | ruttinon / Nine | หน้า Leaflet ทดลองเก่า, หน้า planner เดิมที่ถูกแทนแล้ว (มีบั๊กคิดราคาซ้ำ), ไฟล์ขยะ — ถ้าต้องการดูของเดิม ดูได้ใน git history |
| `docs/prom-2026-10-24.md` | Prom | เขียนส่วนที่ 2 (Google & แผนที่) ใหม่ตามแผนปัจจุบัน, ลบลิงก์ POC |
| `tests/planner_plan.test.js` (ใหม่), `tests/osm_places.test.js` | Tommy | +2 tests: แผน AI ใช้เครื่องมือกลาง / รายการ OSM บนเซิร์ฟเวอร์ |

**กระทบใคร / ต้องระวัง:**
- **Nine:** ข้อมูลตัวอย่างใน planner (แผนตัวอย่าง, "สถานที่ที่เลือกไว้ 4 ที่", งบ 7,400) ยังเป็นค่าตายตัวจนกว่าจะกด Generate — ไม่ได้แก้ส่วนนั้น
- **หน้า Business บนมือถือ:** ทั้งหน้ายังไม่รองรับจอแคบ (เนื้อหากว้างแค่ ~130px) — แผนที่เลือกตำแหน่งใช้ได้บนคอม/แท็บเล็ต ต้องแก้ layout หน้านี้ก่อนจึงใช้บนมือถือได้
- `backend/config.js` ไม่ได้ถูกใช้ (server.js มี `PAGE_FILES` ของตัวเอง) และยังมีชื่อไฟล์ที่ลบแล้ว — ลบได้ถ้าทีมไม่ใช้
- ถ้าตั้ง `TRAVAL_GOOGLE_CLIENT_ID` เซิร์ฟเวอร์จะเปิด `http://localhost:5173` แทน `127.0.0.1`

**แก้เพิ่มหลังทดสอบทั้งระบบ (ดู `docs/qa-2026-11-05.md`):** `app.js` — รวมรายการ OSM ในเครื่องแค่ครั้งแรก (`osmSynced()`, `markOsmSynced()`) กันสถานที่ที่ลบจากเครื่องอื่นกลับมา · `planner.html` — บันทึกแผนแท็กซี่เป็น `driving` (เซิร์ฟเวอร์ไม่รับ `taxi`) · เพิ่ม `docs/qa-2026-11-05.md` รายงานทดสอบ

**ทดสอบ:** `npm test` 37/37 ผ่าน · เบราว์เซอร์: Planner (คอม+มือถือ) แสดงแผน/เส้นทาง/ราคา/ลิงก์ Google, ข้อความอันตรายในชื่อสถานที่ไม่ทำงาน · สมัครด้วย Google ในหน้า register → โปรไฟล์แสดงรูป Google · เพิ่มสถานที่ OSM ในเครื่อง A → ล็อกอินเครื่อง B เห็นในทริป · แผนที่เลือกตำแหน่ง: ค้นหา, ลาก (เมาส์+นิ้ว), แตะ, พิมพ์ตัวเลข, ส่งโดยไม่ปักหมุดถูกเตือน · หน้าแอปหลักไม่มี error

---

## 2026-11-05 — รวม branch `moo-frontend` (Moo) เข้ากับงานของ Tommy  (ผู้แก้: Tommy · commit: Merge branch 'moo-frontend')

**ทำไม:** Moo ปรับหน้า Explore ใน branch `moo-frontend` และ **คัดลอก** ไฟล์ของ Tommy มาเอง (ไม่ได้ merge) ทำให้:
1. งานของ Tommy ใน `app.js` หายเกือบหมด (เหลือแค่ซูม) — การ์ด Trip route, จุดสถานที่ OSM, ปุ่ม Google Maps/รีวิว, รายการ OSM ต่อบัญชี
2. ตัวอักษรพิเศษเพี้ยนตอนคัดลอก (เช่น `—` → `ΓÇö`) และมี BOM ต้นไฟล์ — กระทบโค้ดจริงใน `build_thailand_places.py` (regex ตรวจอักษรไทยพัง) และข้อความเครดิตใน `osm-places.js`
3. ไฟล์หาย: `thailand-places.ndjson.gz`, tests 13 ตัว, `IMPORT-OSM-PLACES-WINDOWS.cmd`, `docs/tommy-2026-10-25.md`, รายการแคชใน `sw.js`

**ผลลัพธ์:** ได้ทั้งงานหน้า Explore ของ Moo และงานแผนที่/เส้นทาง/Google ของ Tommy ครบในที่เดียว

| ไฟล์ | เจ้าของ | ใช้ของใคร / ทำอะไร |
|---|---|---|
| `frontend/traveler/app.js` | Moo | งานของ Moo ทั้งหมด (Nearby, SME Spotlight, ปุ่มล้างค้นหา, Region 2 ภาษา, ลบ modal ที่ไม่ใช้) **+** บล็อก `Tommy:` ทั้งหมดกลับมา · 2 จุดที่ชนกัน: ใช้ `MAP_TILE_URL` (ตั้ง URL ภาพแผนที่ที่เดียว) และคอมเมนต์ซูมฉบับเต็ม |
| `frontend/traveler/styles.css`, `assets/1-3.png`, `frontend/traveler/assets/1-3.png`, `*-showcase.html`, `planner.html`, `Moo_update.md` | Moo | ใช้ของ Moo ทั้งหมด (ไม่ชนกัน) |
| `frontend/shared/*.js`, `backend/routing.js`, `backend/osm-places.js`, `scripts/osm/*` | Tommy | ใช้ฉบับต้นฉบับของ Tommy (ฉบับคัดลอกตัวอักษรเพี้ยน) |
| `backend/server.js`, `frontend/traveler/index.html` | Prom / Moo | ใช้ฉบับ Tommy-Map (เนื้อหาเหมือนกัน ต่างแค่ BOM/คอมเมนต์) + Google Login |
| `backend/config.js` | — | เก็บรายการที่ Moo เพิ่ม, ลบ BOM ต้นไฟล์ (หมายเหตุ: ไฟล์นี้ server.js ไม่ได้ใช้) |

**กระทบใคร / ต้องระวัง:**
- **Moo:** ก่อนทำงานต่อ ให้ pull `main` แล้วทำงานบนนั้น · ครั้งหน้าใช้ **Branch → Merge into current branch** แทนการคัดลอกไฟล์ และบันทึกไฟล์เป็น **UTF-8 (ไม่มี BOM)**
- `moo-frontend` ไม่ต้องใช้แล้วหลังรวมเสร็จ (ลบได้)

**ทดสอบ:** `npm test` 35/35 ผ่าน · เบราว์เซอร์มือถือ: หน้าแรก (สไลด์ 1–3), การ์ด Trip route (ระยะทาง/เวลา/ค่าแท็กซี่/ลิงก์ Google), เรียงลำดับ ↑↓, เส้นทางบนแผนที่, ลาก/ถ่างนิ้ว/ล้อเมาส์, จุด OSM — ไม่มี error

---

## 2026-10-29 — เข้าสู่ระบบด้วย Google แบบจริง  (ผู้แก้: Tommy · commit: feat(auth): real Sign in with Google)

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
