# 🧭 GoAround (เดิม Traval / Unfold) — แพลตฟอร์มท่องเที่ยว ค้นหาร้านค้าชุมชน (Local SME) และวางแผนทริปอัจฉริยะ

> **สถานะล่าสุดบนกิ่ง `moo-frontend`:** อัปเดตเป็นรุ่น **GoAround v3.1.0 (Full Web & PWA Standalone App)**  
> **ผู้รับผิดชอบหลักฝั่ง UX/UI & Traveler App:** **Moo** (Senior UX/UI Engineer & Frontend Developer)  
> **วันที่อัปเดตล่าสุด:** **8 พฤศจิกายน 2026 (2026-11-08)**  
> **ผลการทดสอบอัตโนมัติ (`npm test`):** ผ่านครบ **35 / 35 Tests (100% Pass, 0 Fail)**

---

## 📅 1. ไทม์ไลน์การอัปเดตของ Moo (Update History & Dates)

| วันที่อัปเดต | เวอร์ชัน | รายละเอียดงานที่ทำสำเร็จ |
| :--- | :---: | :--- |
| **1–2 พ.ย. 2026** | **v2.8 – v2.9** | ออกแบบระบบสองภาษา (TH/EN Typography: Prompt + Inter), ปรับปรุงดีไซน์การ์ดสถานที่, สร้างระบบรีวิวของสถานที่, โมดอลแจ้งเตือนภัยนักท่องเที่ยว (Safety Alerts), โมดอลแนะนำการใช้งาน (Onboarding), แถบเรื่องราวชุมชน (Local Stories Rail) และระบบเลือกหลายสถานที่ใน Collection เพื่อส่งเข้าทริป |
| **7–8 พ.ย. 2026 (ช่วงเช้า)** | **v2.9.2** | เชื่อมต่อระบบแผนที่และการซูม/ลาก (`TravalMapGestures`), เส้นทางถนนจริง (`TravalRoute`), คำนวณค่าแท็กซี่มิเตอร์และค่าน้ำมัน (`TravalCost`), ลิงก์นำทาง Google Maps (`TravalLinks`) ของ **Tommy** และระบบนำเข้าพิกัด OpenStreetMap (`osm_places`) เข้ากับหน้า Traveler App |
| **8 พ.ย. 2026 (ช่วงบ่าย)** | **v3.0.0** | เชื่อม API หลังบ้านของ **Prom** ครบทุกจุด (`GET/POST /api/safety/reports`, `PUT /api/places/:id/my-review`), เพิ่มชุดแอนิเมชัน **GSAP 3.15.0 Suite** (`ScrollSmoother`, `ScrollTrigger`, `ScrollToPlugin`, `SplitText`, `Flip` Grid-to-Detail) และขยายฐานข้อมูลสถานที่ท่องเที่ยวไทยครบ **6 ภูมิภาค (27 แห่ง / 24 จังหวัด)** |
| **8 พ.ย. 2026 (ล่าสุด)** | **v3.1.0** | **Rebrand ทั้งเว็บไซต์เป็น `GoAround`** (ครบทั้ง 18 หน้า HTML), อัปเกรดระบบรองรับ **App Mode (PWA Standalone)** ตาม `Traval_Requirements_Business_Updated.txt`, สร้างโมดอล **🤖 GoAround AI Travel Advisor**, เพิ่มโหมดเดินทางครบ 3 รูปแบบ (`Drive` / `Walk` / `Transit`) และสร้างศูนย์รวมบริการ **GoAround App & Ecosystem Hub** |

---

## 🛠️ 2. สรุปสิ่งที่ Moo ทำไปทั้งหมดในโปรเจกต์นี้ (Complete Feature Inventory)

### 2.1 การเปลี่ยนชื่อแบรนด์เป็น `GoAround` ทั้งเว็บไซต์และระบบ App (Platform Rebranding)
- เปลี่ยนชื่อแบรนด์ที่แสดงผลต่อผู้ใช้จากเดิม `Traval` / `Unfold` เป็น **`GoAround`** (โลโก้ **`G. GoAround`**) ครบทุกหน้าจอ:
  - **ฝั่งผู้เดินทาง (`frontend/traveler/`):** `index.html`, `app.js`, `manifest.webmanifest`, `sw.js`, `styles.css`
  - **ฝั่งระบบสมาชิกและจัดทริปของ Nine (`frontend/auth/`, `frontend/planner/`):** `login.html`, `register.html`, `profile.html`, `forgot-password.html`, `planner.html`, `planner-showcase.html`
  - **ฝั่งผู้ดูแลระบบและร้านค้า SME ของ Prom (`frontend/admin/`, `frontend/business/`):** `admin.html`, `admin-showcase.html`, `moderation.html`, `audit.html`, `business.html`, `business-showcase.html`, `business-admin.html`
  - **ฝั่งต้นแบบแผนที่ของ Tommy (`frontend/poc/`):** `google-maps-poc.html`
  - **เอกสาร Requirement:** อัปเดต `Traval_Requirements_Business_Updated.txt` ให้เป็นแบรนด์ **GoAround**
- **ความเข้ากันได้ของโค้ด (100% Backward-Compatible):** คงชื่อตัวแปร Global API ภายในโค้ด (`window.TravalRoute`, `window.TravalCost`, `window.TravalLinks`, `window.TravalMapGestures`, `UnfoldTripEngine`), ชื่อฐานข้อมูล `unfold.sqlite`, และชื่อ Cookie เดิมไว้ทั้งหมด ทำให้โค้ดและชุดทดสอบ 35 ข้อของเพื่อนในทีมไม่พังแม้แต่ข้อเดียว

### 2.2 รองรับรูปแบบ App เต็มรูปแบบ (PWA Standalone App Mode)
- **ไฟล์ `frontend/traveler/manifest.webmanifest` และ `sw.js`:**
  - ตั้งค่า `display: "standalone"`, `orientation: "portrait-primary"`, `theme_color: "#0D2C1C"`, `background_color: "#F8F7F3"`
  - เพิ่ม **App Shortcuts** สำหรับกดค้างที่ไอคอนแอปบนมือถือเพื่อเข้าหน้า **Explore**, **Map (Around Me)**, **Saved Collection**, และ **My Trips** ได้ทันที
  - ลงทะเบียน Service Worker (`./sw.js` รุ่น `goaround-v3.0-app`) อัตโนมัติ พร้อมดักจับ `beforeinstallprompt` เพื่อให้ผู้ใช้กดปุ่ม **`📲 ติดตั้งแอป GoAround`** ลงหน้าจอหลักของมือถือได้ทันที
- **Mobile-First UX & Safe Area:**
  - รองรับ `env(safe-area-inset-top)` และ `env(safe-area-inset-bottom)` สำหรับหน้าจอมือถือไร้ขอบ (iOS / Android)
  - มีแถบเมนูด้านล่าง (`bottom-nav`) สำหรับใช้งานมือเดียว และ **Interactive 3-State Bottom Sheet** (`peek` / `half` / `full`) บนหน้าแผนที่

### 2.3 ฟีเจอร์ฝั่งผู้ใช้งาน (USER) ครบตาม `Traval_Requirements_Business_Updated.txt`
1. **หน้าแรก & สำรวจสถานที่ (`Landing & Explore / Discover`):**
   - สไลด์โชว์ภาพปก (`1.png`, `2.png`, `3.png`), สวิตช์สลับภาษา **TH / EN** และโหมด **Light / Dark Theme**
   - ค้นหาสถานที่ด้วยคำค้น หมวดหมู่ (`ทั้งหมด`, `★ ร้านค้าชุมชน SME`, `ธรรมชาติ`, `ของกิน`, `ที่พัก`, `วัฒนธรรม`) และกรองตามภูมิภาค/จังหวัด
   - โซน **📖 เรื่องราวชุมชน & โปรโมชั่นพิเศษ (Local Stories Rail)**, **✨ แนะนำสำหรับคุณ (Recommended for You)**, และ **★ ร้านค้าท้องถิ่นแนะนำ (Local SME Spotlight)** พร้อมแยกรายการ **Sponsored** ออกจากรายการปกติอย่างชัดเจน
2. **สำรวจรอบตัวฉัน (`Explore Around Me` & `Live Location Map`):**
   - ปุ่มเปิด/ปิด **Around Me** เลือกรัศมีได้ครบ **300 m / 500 m / 1 km / 3 km / 5 km**
   - ตัวกรอง **เฉพาะร้านชุมชน (`Local Only`)**, **เปิดอยู่ตอนนี้ (`Open Now`)**, **มีโปรโมชั่น (`Special Offers`)**, **งบประมาณ (`≤ ฿300 / ≤ ฿1,000 / ≤ ฿3,000`)**, และ **คะแนนรีวิวขั้นต่ำ (`★ 4+ / ★ 4.5+`)**
   - แผนที่พิกัดจริงพร้อมจุด **Live GPS Blue Dot**, วงรัศมีควาแม่นยำ, โหมด **ติดตามฉัน (`Follow Me`)**, ปุ่ม **ค้นหาบริเวณนี้ (`Search This Area`)** เมื่อเลื่อนแผนที่ และการจัดกลุ่มหมุดอัตโนมัติ (**Marker Clustering**)
3. **🤖 ที่ปรึกษาการท่องเที่ยวอัจฉริยะ (`GoAround AI Travel Advisor` — Requirement 1.9):**
   - เปิดได้จากปุ่ม **🤖 AI แนะนำทริป** บน Header, แถบเครื่องมือหน้า Explore, เมนูหลัก และหน้าโปรไฟล์
   - เลือกโจทย์ด่วน (ร้านชุมชน SME งบประหยัด ≤300฿, ของกินท้องถิ่น & คาเฟ่, ธรรมชาติ 6 ภาค, Hidden Gems คะแนน 4.8+) หรือพิมพ์ค้นหาจังหวัด/งบประมาณ/สไตล์ได้ทั้งไทยและอังกฤษ
   - **แยกรายการแนะนำที่ตรงกับความต้องการจริง (Organic Matches) ออกจากพื้นที่โฆษณา (`Sponsored Placements`) อย่างชัดเจน** พร้อมปุ่ม **⚡ เพิ่มทั้งหมดเข้าทริปของฉัน**
4. **🚗🚶🚆 คำนวณเส้นทาง เวลา และค่าเดินทางครบ 3 รูปแบบ (Requirement 1.8):**
   - ในหน้า **My Trips** รองรับการสลับโหมดเดินทางครบทั้ง **รถยนต์ (`Drive`)**, **เดิน (`Walk`)**, และ **ขนส่งสาธารณะ (`Transit`)**
   - แสดงระยะทางตามถนนจริง เวลาเดินทาง ประมาณการค่าแท็กซี่มิเตอร์/ค่าน้ำมันรถส่วนตัว และส่งค่า `travelmode` ไปยังลิงก์นำทาง Google Maps อัตโนมัติ
5. **⭐ ระบบรีวิวสถานที่ & 🛡️ ระบบแจ้งเตือนจุดเสี่ยงนักท่องเที่ยว (`Reviews & Safety Reports`):**
   - เขียนรีวิว ให้คะแนน 1–5 ดาว กรองรีวิว และกดโหวต `มีประโยชน์ (Helpful)` โดยเชื่อมต่อกับ `PUT /api/places/:id/my-review`
   - ดูรายการแจ้งเตือนจุดเสี่ยงและส่งรายงานจุดเสี่ยงใหม่ (`Overcharging`, `Transport`, `Scam`, `Danger`, `Other`) พร้อมพิกัด GPS เชื่อมต่อกับ `GET / POST /api/safety/reports`
6. **❤️ สถานที่ที่บันทึกไว้ (`Your Collection` & Multi-Select to Trip):**
   - ค้นหาและกรองสถานที่ใน Collection, โหมด **เลือกหลายรายการ (`Select`)** เพื่อลบพร้อมกัน หรือกดส่งสถานที่ที่เลือกทั้งหมดไปยังหน้า **Smart Trip Planner (`/planner.html`)**
7. **🏪 ศูนย์บริการแอป & ปุ่มลงทะเบียนร้านค้า SME (`GoAround App & Ecosystem Hub` — Requirement 3.1):**
   - ในหน้าโปรไฟล์และเมนูหลักมีโซน **GoAround App & Ecosystem Hub** พร้อมปุ่ม **🏪 ลงทะเบียนร้านค้า / SME Portal (`Register as a Business` → `/business.html`)** แยกจากการใช้งานของผู้ใช้ทั่วไปอย่างชัดเจน

### 2.4 แอนิเมชันระดับพรีเมียมด้วย GSAP 3.15.0 Interactive Suite
- ติดตั้งปลั๊กอินครบ 5 ตัว (`ScrollSmoother`, `ScrollTrigger`, `ScrollToPlugin`, `SplitText`, `Flip`) พร้อมรองรับ `prefers-reduced-motion` และป้องกันสระลอยภาษาไทยฉีกขาด
- มีปุ่มทางลัด **📌 ไปยังจุดตรึง (Pin)** และ **🖼️ ไปยังตาราง Flip Grid** พร้อมเอฟเฟกต์ขยายการ์ดสถานที่ขึ้นมากลางจอแบบ `Flip.fit()` + Radial Stagger

### 2.5 ฐานข้อมูลการท่องเที่ยวไทยครบทั้ง 6 ภูมิภาค (27 สถานที่ / 24 จังหวัด)
- ขยาย `SAMPLE_PLACES` ใน `frontend/traveler/app.js` ให้ครอบคลุมทั้ง **ภาคเหนือ (7 แห่ง)**, **ภาคกลางและกรุงเทพฯ (4 แห่ง)**, **ภาคใต้ (4 แห่ง)**, **ภาคอีสาน (4 แห่ง)**, **ภาคตะวันออก (4 แห่ง)**, และ **ภาคตะวันตก (4 แห่ง)** โดยเป็นร้านค้าชุมชน **Local SME ถึง 16 แห่ง** พร้อมพิกัด `lat`/`lon` จริงและตั้งค่า `googlePlaceId: ''` ตามมาตรฐานของ Tommy

---

## 🤝 3. การส่งต่องานและแนวทางต่อยอดร่วมกับเพื่อนในทีม (Handoff & Team Integration Guide)

โค้ดทั้งหมดในกิ่ง `moo-frontend` ถูกออกแบบให้เชื่อมต่อกับงานของทุกคนในทีมได้ทันที โดยมีจุดส่งต่อและต่อยอดดังนี้ครับ:

### 👤 1) สำหรับ **Tommy** (Maps, Routing, Cost Engine, OSM Places & Google Auth)
- **สิ่งที่เชื่อมต่อกันแล้ว 100%:**
  - หน้า Traveler App (`frontend/traveler/app.js`) เรียกใช้ `window.TravalRoute.route()`, `window.TravalCost.tripCost()`, `window.TravalLinks.directionsUrl()`, `window.TravalLinks.placeUrl()`, และ `window.TravalMapGestures.attach()` ของ Tommy ครบทุกจุด
  - ข้อมูลสถานที่ทั้ง 27 แห่งใน 6 ภูมิภาคของไทยตั้งค่า `googlePlaceId: ''` และใช้พิกัด `lat`, `lon`, `priceFrom`, `currency: 'THB'` ตรงตามกฎของ `maps-links.js` และ `travel-cost.js` ทุกประการ
  - รองรับการคลิกเลือกสถานที่จาก OpenStreetMap (`/api/osm/places`) บนแผนที่แล้วเปิดขึ้นใน Bottom Sheet ได้ทันที
- **สิ่งที่ Tommy สามารถต่อยอดได้ทันที:**
  - หากมี Google Place ID จริงของสถานที่ใด สามารถเติมลงในฟิลด์ `googlePlaceId` ของสถานที่นั้นได้เลย ลิงก์นำทางและลิงก์ดูรีวิวบน Google Maps จะสลับไปใช้ Place ID อัตโนมัติ
  - ในโหมดการเดินทาง `transit` (ขนส่งสาธารณะ) ที่ Moo เพิ่มปุ่มสลับไว้ให้ใน `tripRouteCard()` หากในอนาคต Tommy ต้องการเพิ่มสูตรคำนวณค่าโดยสารรถไฟฟ้า BTS/MRT เบื้องต้นใน `travel-cost.js` (แทนค่า `null` ปัจจุบัน) หน้าเว็บของ Moo จะแสดงตัวเลขให้อัตโนมัติทันที

### 👤 2) สำหรับ **Prom** (Backend Server, Admin CMS, Moderation, Safety Reports & Business SME Portal)
- **สิ่งที่เชื่อมต่อกันแล้ว 100%:**
  - หน้า Traveler App ดึงข้อมูลจริงจาก `GET /api/places`, `GET /api/places/spotlight`, `GET /api/places/nearby`, `GET /api/safety/reports`
  - ฟอร์มแจ้งจุดเสี่ยง (`#safety-report-form`) ยิง `POST /api/safety/reports` เข้าฐานข้อมูลจริงของ Prom (สถานะเริ่มต้น `pending` รอ Admin อนุมัติ)
  - ฟอร์มเขียนรีวิวสถานที่ยิง `PUT /api/places/:id/my-review` เข้าระบบ Moderation ของ Prom พร้อมแปลงฟิลด์ `stars`/`rating` และ `userName`/`author` ให้แสดงผลตรงกันทั้งสองฝั่ง
  - เพิ่มปุ่ม **🏪 ลงทะเบียนร้านค้า / SME Portal (`/business.html`)** ในหน้าโปรไฟล์และเมนูหลักของ Traveler App เพื่อส่งผู้ประกอบการเข้าสู่หน้า Business Portal ของ Prom โดยตรง
- **สิ่งที่ Prom สามารถต่อยอดได้ทันที:**
  - เมื่อ Admin กดอนุมัติรีวิวใน `/moderation.html` หรืออนุมัติรายงานจุดเสี่ยงใน `/admin.html` หรือเพิ่มร้าน SME ใหม่/ตั้งค่า `sponsored: true` ข้อมูลจะปรากฏบนหน้า Explore, โมดอล AI Advisor, และหน้าแจ้งเตือนภัยของ Moo โดยอัตโนมัติ
  - สามารถนำชุดข้อมูล 27 สถานที่ 6 ภูมิภาคใน `SAMPLE_PLACES` ไปใช้เป็น Seed Data เริ่มต้นของฐานข้อมูลฝั่ง Server ได้เลย

### 👤 3) สำหรับ **Nine** (Authentication Portal, User Profile & Smart Trip Planner)
- **สิ่งที่เชื่อมต่อกันแล้ว 100%:**
  - เชื่อมต่อ Session ผู้ใช้ผ่าน `/api/auth/me`, `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/logout-all` และซิงก์รายการ `saved` / `trip` ผ่าน `GET / PUT /api/me/collections`
  - ในหน้า **Your Collection (`#saved`)** เมื่อผู้ใช้กดโหมด **Select (เลือกหลายรายการ)** แล้วกดส่งเข้าทริป ระบบจะบันทึกข้อมูลลง `localStorage.setItem('traval-selected-plan-stops', ...)` และพารามิเตอร์ URL `/planner.html?places=...` ส่งต่อไปยังหน้า **Smart Trip Planner (`/planner.html`)** ของ Nine ทันที
  - มีลิงก์เชื่อมไปหน้า `/login.html`, `/profile.html`, และ `/planner.html` ของ Nine ทั้งในหน้าโปรไฟล์และใน GoAround App Hub
- **สิ่งที่ Nine สามารถต่อยอดได้ทันที:**
  - หน้า `/planner.html` ของ Nine สามารถอ่านค่าจาก `localStorage.getItem('traval-selected-plan-stops')` หรือ `?places=` ที่ส่งมาจากทั้งหน้า Collection และโมดอล **🤖 GoAround AI Travel Advisor** เพื่อนำไปจัดตารางทริปรายวันต่อได้ทันที

---

## 🚀 4. วิธีรันระบบและทดสอบ (Quick Start & Verification)

```bash
# 1. รันเซิร์ฟเวอร์พัฒนา (เปิดที่ http://127.0.0.1:5173/)
npm start

# 2. รันชุดทดสอบอัตโนมัติทั้งหมด (35 Tests)
npm test

# 3. ตรวจสอบความสมบูรณ์ของฐานข้อมูล SQLite
npm run doctor
```

### 🌐 รายการ URL ทั้งหมดในระบบ GoAround
- **หน้าหลักผู้เดินทาง (GoAround Traveler App & PWA):** `http://127.0.0.1:5173/`
- **ระบบวางแผนทริปอัจฉริยะ (Smart Trip Planner — Nine):** `http://127.0.0.1:5173/planner.html`
- **หน้าเข้าสู่ระบบ / สมัครสมาชิก / โปรไฟล์ (Auth Portal — Nine):** `http://127.0.0.1:5173/login.html` / `/register.html` / `/profile.html`
- **พอร์ทัลสำหรับร้านค้าและ SME (Business Portal — Prom):** `http://127.0.0.1:5173/business.html`
- **ระบบจัดการผู้ดูแลและตรวจสอบเนื้อหา (Admin & Moderation Studio — Prom):** `http://127.0.0.1:5173/admin.html` / `/moderation.html` / `/audit.html`
- **หน้าต้นแบบแผนที่และพิกัด (Maps POC — Tommy):** `http://127.0.0.1:5173/google-maps-poc.html`
