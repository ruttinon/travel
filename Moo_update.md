# 🧭 GoAround (เดิม Traval) — สรุปงานอัปเดตฝั่ง Moo (UX/UI, Traveler App, PWA & Rebranding)

**ผู้รับผิดชอบ:** Moo (Senior UX/UI Engineer & Frontend Developer)  
**สาขา (Branch):** `moo-frontend`  
**อัปเดตล่าสุด:** 8 พฤศจิกายน 2026 (v3.1.0 — Rebrand to **GoAround** + Full App/PWA Support + Complete `Traval_Requirements_Business_Updated.txt` Compliance)  
**สถานะการทดสอบ:** ผ่านครบ **35 / 35 Tests (100% Pass, 0 Fail)**

---

## 📢 1. การเปลี่ยนชื่อแบรนด์เป็น `GoAround` ทั้งเว็บไซต์และระบบ App (Platform Rebranding)

ตามข้อตกลงของ **Moo** ได้ทำการเปลี่ยนชื่อแพลตฟอร์มจากเดิม `Traval` / `Unfold` เป็น **`GoAround`** ครบทุกหน้าจอในระบบ โดย**คงชื่อตัวแปร Global API ภายในโค้ด (`window.TravalRoute`, `window.TravalCost`, `window.TravalLinks`, `window.TravalMapGestures`, `UnfoldTripEngine`) และฐานข้อมูล/Cookie เดิมไว้ 100%** เพื่อให้โค้ดและ Automated Tests ของเพื่อนร่วมทีมทุกคนทำงานร่วมกันได้โดยไม่พัง:

1. **หน้าหลักผู้เดินทาง (`frontend/traveler/index.html`, `frontend/traveler/app.js`, `frontend/traveler/manifest.webmanifest`):**
   - เปลี่ยนโลโก้หลักเป็น **`G. GoAround`** พร้อมชื่อเรื่อง `<title>GoAround — Travel & Local Discovery</title>`
   - เปลี่ยนข้อความต้อนรับ (`Welcome to GoAround` / `ยินดีต้อนรับสู่ GoAround`), ป้ายกำกับหมวด (`GOAROUND / EXPLORE MAP`, `GOAROUND / YOUR SPACE`, `GOAROUND / ACCOUNT`), ลิขสิทธิ์แผนที่ (`© OpenStreetMap contributors · GoAround`) และข้อความเวลากดแชร์สถานที่ (`| GoAround`)
2. **หน้าจอของสมาชิกในทีมทั้งหมด (17 ไฟล์ HTML ทั่วทั้งระบบ):**
   - **ฝั่ง Nine (`frontend/auth/*.html`, `frontend/planner/*.html`):** เปลี่ยนชื่อแบรนด์บนหน้า Login, Register, Profile, Forgot Password และ Smart Trip Planner เป็น **`GoAround`**
   - **ฝั่ง Prom (`frontend/admin/*.html`, `frontend/business/*.html`):** เปลี่ยนชื่อแบรนด์บนหน้า Admin Control Studio, Moderation, Audit Log และ Business / SME Merchant Portal เป็น **`GoAround`**
   - **ฝั่ง Tommy (`frontend/poc/google-maps-poc.html`):** อัปเดตหัวข้อหน้า POC เป็น **`GoAround`**
3. **เอกสาร Requirement (`Traval_Requirements_Business_Updated.txt`):**
   - อัปเดตชื่อแพลตฟอร์มทั่วทั้งเอกสารเป็น **`GoAround`** เรียบร้อยแล้ว

---

## 📲 2. การรองรับรูปแบบ App / PWA เต็มรูปแบบ ตาม `Traval_Requirements_Business_Updated.txt`

1. **Progressive Web App (PWA Standalone Mode) (`frontend/traveler/manifest.webmanifest`, `frontend/traveler/sw.js`, `frontend/traveler/index.html`):**
   - ตั้งค่า `name: "GoAround — Travel & Local Discovery"`, `short_name: "GoAround"`, `display: "standalone"`, `orientation: "portrait-primary"`, `theme_color: "#0D2C1C"`, `background_color: "#F8F7F3"`
   - เพิ่ม **App Shortcuts** สำหรับกดค้างที่ไอคอนแอปบนมือถือเพื่อเข้าหน้า **Explore**, **Around Me Map**, **Saved Collection** และ **My Trips** ได้ทันที
   - ลงทะเบียน Service Worker (`./sw.js` รุ่น `goaround-v3.0-app`) อัตโนมัติเมื่อเปิดผ่าน HTTP/HTTPS พร้อมดักจับ `beforeinstallprompt` เพื่อติดตั้งลงหน้าจอมือถือได้ในปุ่มเดียว (`📲 ติดตั้งแอป GoAround`)
   - รองรับ `env(safe-area-inset-top)` และ `env(safe-area-inset-bottom)` สำหรับหน้าจอมือถือไร้ขอบ (Notch / Dynamic Island) และแถบเมนูด้านล่าง (`bottom-nav`) สำหรับใช้งานมือเดียว (One-handed Mobile Navigation)
2. **🤖 ระบบที่ปรึกษาการท่องเที่ยวอัจฉริยะ (`GoAround AI Travel Advisor` — Requirement 1.9):**
   - เพิ่มปุ่ม **🤖 AI แนะนำทริป (`AI Advisor`)** บนแถบ Header ด้านบน, แถบเครื่องมือด่วนหน้าสำรวจ (`.explore-quick-toolbar`), หน้าเมนูหลัก และหน้าโปรไฟล์
   - รองรับการเลือกโจทย์ด่วน (ร้านชุมชน SME งบประหยัด ≤300฿, ของกินท้องถิ่น & คาเฟ่, ธรรมชาติ & จุดชมวิว 6 ภาค, Hidden Gems คะแนน 4.8+) และการพิมพ์ค้นหาจังหวัด/งบประมาณ/สไตล์เป็นภาษาไทยและอังกฤษ
   - **แยกการแนะนำตามความตรงกับความต้องการจริง (Organic Matches) ออกจากพื้นที่โฆษณา (`Sponsored Placements`) อย่างชัดเจน** ตามข้อกำหนดใน `Traval_Requirements_Business_Updated.txt`
   - มีปุ่ม **⚡ เพิ่มทั้งหมดเข้าทริปของฉัน (`Add All to My Trip`)** และปุ่มกดเพิ่มทีละสถานที่เข้าทริปได้ทันที
3. **🚗🚶🚆 รองรับการคำนวณเส้นทางครบ 3 รูปแบบ (`Driving` / `Walking` / `Transit` — Requirement 1.8):**
   - อัปเกรดการ์ดคำนวณเส้นทางในหน้า My Trips ให้สลับได้ครบทั้ง **รถยนต์ (`Drive`)**, **เดิน (`Walk`)**, และ **ขนส่งสาธารณะ (`Transit`)** พร้อมส่งโหมดการเดินทางไปยังลิงก์นำทาง Google Maps (`travelmode=driving|walking|transit`)
4. **🏪 ศูนย์รวมบริการแอป & ปุ่มลงทะเบียนร้านค้าแยกชัดเจน (`GoAround App & Ecosystem Hub` — Requirement 3.1):**
   - เพิ่มโซน **GoAround App & Ecosystem Hub** ในหน้าโปรไฟล์และเมนูหลัก โดยมีปุ่ม:
     - **📲 ติดตั้งแอป GoAround (Install GoAround App)**
     - **🤖 AI Travel Advisor**
     - **🗺️ Smart Trip Planner (`/planner.html`)**
     - **🏪 ลงทะเบียนร้านค้า / SME Portal (`Register as a Business` → `/business.html`)** แยกจากการใช้งานของผู้ใช้ทั่วไปอย่างชัดเจนตาม Requirement 3.1

---

## 🗺️ 3. ฐานข้อมูลสถานที่ท่องเที่ยวและร้านค้าชุมชนครบทั้ง 6 ภูมิภาคของไทย (27 แห่ง / 24 จังหวัด)

อัปเกรด `SAMPLE_PLACES` ใน `frontend/traveler/app.js` ให้ครอบคลุมทั้ง 6 ภูมิภาคของประเทศไทย พร้อมพิกัด `lat`/`lon` จริงตามมาตรฐานของ Tommy (`googlePlaceId: ''`):
- **ภาคเหนือ (`north` — 7 แห่ง):** เชียงใหม่, เชียงราย, น่าน, แม่ฮ่องสอน, ลำปาง, สุโขทัย
- **กรุงเทพฯ และภาคกลาง (`central` — 4 แห่ง):** กรุงเทพฯ, พระนครศรีอยุธยา, สมุทรสงคราม
- **ภาคใต้ (`south` — 4 แห่ง):** ภูเก็ต, สุราษฎร์ธานี, กระบี่, สงขลา
- **ภาคอีสาน (`northeast` — 4 แห่ง):** ขอนแก่น, เลย, อุบลราชธานี, นครราชสีมา
- **ภาคตะวันออก (`east` — 4 แห่ง):** ชลบุรี, จันทบุรี, ตราด, ระยอง
- **ภาคตะวันตก (`west` — 4 แห่ง):** กาญจนบุรี, เพชรบุรี, ราชบุรี, ประจวบคีรีขันธ์

---

## ✅ 4. ผลการตรวจสอบคุณภาพ (Verification & Test Suite)

- **Syntax & Runtime Check:** `node --check frontend/traveler/app.js` และทดสอบเรนเดอร์ DOM จริงผ่าน JSDOM (ทุกหน้าและทุก Modal ทำงานสมบูรณ์ 0 Error)
- **Automated Test Suite (`npm test`):** ผ่านครบ **35 / 35 Tests (100% Pass, 0 Fail)**
- **Backup ล่าสุด:** ซิงก์ลง `_backup/moo-backup-latest/` และ `_backup/moo-backup-latest.zip` เรียบร้อยแล้ว
