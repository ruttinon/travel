# 🧭 GoAround (เดิม Traval / Unfold) — สรุปงานอัปเดตและคู่มือส่งต่องานฝั่ง Moo

> **ผู้รับผิดชอบหลัก:** **Moo** (Senior UX/UI Engineer & Frontend Developer)  
> **สาขา (Branch):** `moo-frontend`  
> **วันที่อัปเดตล่าสุด:** **10 พฤศจิกายน 2026 (v3.2.0)**  
> **ผลการทดสอบอัตโนมัติ (`npm test`):** ผ่านครบ **35 / 35 Tests (100% Pass, 0 Fail)**

---

## 📅 1. ไทม์ไลน์การอัปเดตของ Moo (Update History & Dates)

| วันที่อัปเดต | เวอร์ชัน | รายละเอียดงานที่ทำสำเร็จ |
| :--- | :---: | :--- |
| **1–2 พ.ย. 2026** | **v2.8 – v2.9** | ออกแบบระบบสองภาษา (TH/EN Typography: Prompt + Inter), ปรับปรุงดีไซน์การ์ดสถานที่, สร้างระบบรีวิวของสถานที่, โมดอลแจ้งเตือนภัยนักท่องเที่ยว (Safety Alerts), โมดอลแนะนำการใช้งาน (Onboarding), แถบเรื่องราวชุมชน (Local Stories Rail) และระบบเลือกหลายสถานที่ใน Collection เพื่อส่งเข้าทริป |
| **7–8 พ.ย. 2026 (เช้า)** | **v2.9.2** | เชื่อมต่อระบบแผนที่และการซูม/ลาก (`TravalMapGestures`), เส้นทางถนนจริง (`TravalRoute`), คำนวณค่าแท็กซี่มิเตอร์และค่าน้ำมัน (`TravalCost`), ลิงก์นำทาง Google Maps (`TravalLinks`) ของ **Tommy** และระบบนำเข้าพิกัด OpenStreetMap (`osm_places`) เข้ากับหน้า Traveler App |
| **8 พ.ย. 2026 (บ่าย)** | **v3.0.0** | เชื่อม API หลังบ้านของ **Prom** ครบทุกจุด (`GET/POST /api/safety/reports`, `PUT /api/places/:id/my-review`), เพิ่มชุดแอนิเมชัน **GSAP 3.15.0 Suite** (`ScrollSmoother`, `ScrollTrigger`, `ScrollToPlugin`, `SplitText`, `Flip` Grid-to-Detail) และขยายฐานข้อมูลสถานที่ท่องเที่ยวไทยครบ **6 ภูมิภาค (27 แห่ง / 24 จังหวัด)** |
| **8 พ.ย. 2026 (ค่ำ)** | **v3.1.0** | **Rebrand ทั้งเว็บไซต์เป็น `GoAround`** (ครบทั้ง 18 หน้า HTML), อัปเกรดระบบรองรับ **App Mode (PWA Standalone)** ตาม `Traval_Requirements_Business_Updated.txt`, สร้างโมดอล **🤖 GoAround AI Travel Advisor**, เพิ่มโหมดเดินทางครบ 3 รูปแบบ (`Drive` / `Walk` / `Transit`) และสร้างศูนย์รวมบริการ **GoAround App & Ecosystem Hub** |
| **10 พ.ย. 2026 (ล่าสุด)** | **v3.2.0** | **ปรับโฉมธีมตามภาพหน้าจอต้นแบบ `docs/screenshots` (v2.6 Editorial Theme)**, ลบกล่องสรุป 4 ตัวเลข (KPI cards) และ Hero badge, ลบไอคอนหน้าหัวข้อ `Local Stories & Promotions`, `Recommended for You`, `Local SME Spotlight`, แก้ข้อความปุ่มทางลัดเป็น **`สถานที่น่าสนใจ`** และ **`สถานที่ลับน่าไป`**, ลบไอคอนหน้าปุ่มหมวดหมู่ **`ทั้งหมด`**, ปรับแถบสีบาร์ `GOAROUND / LOCAL SME & GEMS` ให้ตรงกันทุกหน้า, เพิ่มระบบ Dropdown แนะนำสถานที่ในช่องค้นหาพร้อมปุ่ม `ดู →` เพื่อเข้าดูสถานที่ได้ทันที และแก้ไขปัญหากากบาทซ้ำ 2 อันในช่องค้นหา |

---

## 🛠️ 2. สรุปสิ่งที่ Moo ทำไปทั้งหมด (Complete Work Breakdown)

### 2.1 ปรับโฉมธีมตามภาพหน้าจอจริง (`docs/screenshots`) — v2.6 Editorial Screenshots Theme
- **วิเคราะห์โครงสร้างสีและฟอนต์จากภาพหน้าจอใน `docs/screenshots/`** (`owner-dashboard.png`, `owner-places.png`, `trip-planner.png`, `admin-dashboard.png`):
  - โทนสีหลัก: พื้นหลังสีครีมงาช้างอบอุ่น (`#F7F6F0` / Warm Ivory), แถบสีเขียวป่าเข้มลึก (`#143B2A` / Deep Forest Green) และสีเขียวมิ้นต์เน้นสายตา (`#22C55E` / `#16A34A`)
  - รูปแบบตัวอักษรระดับพรีเมียม (Editorial Typography): หัวข้อใช้ `Playfair Display` ผสม `Prompt` และเนื้อหาใช้ `DM Sans` / `Inter` ให้ความรู้สึกนิตยสารท่องเที่ยวระดับพรีเมียม
  - การ์ดสถานที่ (Place Cards): การ์ดสีขาวสว่าง ขอบนวลมนเงียบสงบ (`border: 1px solid #E8E6DF`, `box-shadow: 0 4px 16px rgba(20,59,42,0.06)`) ตัวหนังสือสีเขียวเข้มอ่านง่าย ชัดเจนสบายตา
- **ทำความสะอาดหน้าจอตามความต้องการของผู้ใช้ (Declutter UI):**
  - **ลบกล่องสรุปตัวเลข 4 ช่อง (KPI Summary Cards):** นำกล่อง 27 Total Places, 16 SME, 6 Regions, 0 Saved ออกเพื่อให้หน้าจอโล่งโปร่ง โฟกัสกับสถานที่ท่องเที่ยวโดยตรง
  - **ลบป้าย Hero Badge:** ถอดป้าย `+ 27 Verified Local Gems · All 6 Regions of Thailand` บนภาพปกออก
  - **ลบปุ่ม `🤖 AI Advisor` บน Toolbar:** ย้ายการเข้าถึง AI Advisor ให้เป็นระเบียบผ่าน Header, Navigation Menu และ App Hub
  - **ลบไอคอนหน้าหัวข้อหลัก:** นำอีโมจิหน้าหัวข้อ `Local Stories & Promotions`, `Recommended for You`, และ `Local SME Spotlight` ออก ให้เป็นข้อความสไตล์ Editorial ที่สะอาดตา
  - **ปรับแต่งปุ่มหมวดหมู่:** ลบไอคอนหน้าปุ่มหมวดหมู่ `ทั้งหมด` เพื่อเน้นข้อความล้วน ส่วนหมวดหมู่อื่นคงไอคอนไว้ตามปกติ
  - **เปลี่ยนข้อความปุ่มทางลัด (Quick Jump Buttons):**
    - `ไปยังตาราง Flip Grid` ➔ เปลี่ยนเป็น **`สถานที่น่าสนใจ`** (EN: `Popular places`)
    - `ไปยังจุดตรึง (Pin)` ➔ เปลี่ยนเป็น **`สถานที่ลับน่าไป`** (EN: `Hidden gems`)
    - พร้อมลบไอคอนนำหน้าปุ่ม ให้เป็นปุ่มข้อความสไตล์โมเดิร์น
  - **ปรับแถบสีบาร์ `GOAROUND / LOCAL SME & GEMS`:** ปรับแต่งให้สีโทน Forest Green & Cream สม่ำเสมอตรงกันทุกหน้าที่มีข้อความประเภทนี้

### 2.2 ปรับปรุง Search Bar พร้อมระบบ Dropdown แนะนำสถานที่แบบโต้ตอบ
- **Live Search Suggestion Dropdown (`#home-suggest`):**
  - เมื่อคลิก/โฟกัสในช่องค้นหา (`#home-query`) จะแสดงกล่องรายการแนะนำสถานที่เด่น (สถานที่เรตติ้งสูง ≥ 4.7 หรือร้านค้าชุมชน Local SME ที่ไม่ใช่สปอนเซอร์)
  - เมื่อพิมพ์คำค้นหา จะกรองและแสดงผลลัพธ์แบบเรียลไทม์ พร้อมแสดงชื่อสถานที่, หมวดหมู่, จังหวัด, คะแนนรีวิว และป้ายกำกับ SME
  - มีปุ่ม **`ดู →`** (View) ให้ผู้ใช้สามารถคลิกเพื่อเปิดดูรายละเอียดสถานที่นั้นใน Bottom Sheet หรือ Modal ได้ทันที
  - รองรับการปิด Dropdown อัตโนมัติเมื่อกดปุ่ม Escape, เมื่อคลิกพื้นที่ด้านนอก หรือเมื่อกดค้นหา
- **แก้ไขปัญหากากบาทซ้ำ 2 อัน (Duplicate Clear Button Fix):**
  - ซ่อนปุ่มล้างคำค้นหาของเว็บบราวเซอร์เดิม (`::-webkit-search-cancel-button`, `::-webkit-search-decoration`, `::-ms-clear`)
  - คงไว้เฉพาะปุ่มกากบาท `✕` (`.clear-query`) ของเว็บเพียงอันเดียว ทำให้ช่องค้นหาสะอาด เรียบร้อย ไม่ซ้ำซ้อน

### 2.3 การเปลี่ยนชื่อแบรนด์เป็น `GoAround` ทั้งเว็บไซต์และระบบ App
- เปลี่ยนโลโก้หลักเป็น **`G. GoAround`** และอัปเดตชื่อแบรนด์บนทุกหน้าเว็บ (Traveler App, Auth, Trip Planner, Business SME Portal, Admin Studio, Maps POC รวม 18 ไฟล์ HTML) และใน `Traval_Requirements_Business_Updated.txt`
- คงชื่อตัวแปร Global API (`window.TravalRoute`, `window.TravalCost`, `window.TravalLinks`, `window.TravalMapGestures`, `UnfoldTripEngine`) และฐานข้อมูล/Cookie เดิมไว้ 100% เพื่อไม่ให้กระทบโค้ดและชุดทดสอบของเพื่อนในทีม

### 2.4 รองรับรูปแบบ App (PWA Standalone Mode)
- อัปเกรด `manifest.webmanifest`, `sw.js` (`goaround-v3.0-app`), และ `index.html` ให้ติดตั้งเป็นแอปมือถือแบบเต็มจอ (`display: standalone`) พร้อม App Shortcuts 4 หน้าหลัก, รองรับ `safe-area-inset` และมีปุ่ม **`📲 ติดตั้งแอป GoAround`**

### 2.5 🤖 GoAround AI Travel Advisor (Requirement 1.9)
- โมดอลผู้ช่วยแนะนำสถานที่ท่องเที่ยวและร้านค้าชุมชนตามงบประมาณ จังหวัด และสไตล์ ทั้งภาษาไทยและอังกฤษ
- แยกรายการแนะนำที่ตรงกับความต้องการจริง (**Organic Matches**) ออกจากพื้นที่โฆษณา (**Sponsored Placements**) อย่างชัดเจน พร้อมปุ่มกดเพิ่มเข้าทริปทันที

### 2.6 🚗🚶🚆 คำนวณเส้นทางครบ 3 โหมด (Requirement 1.8)
- รองรับการสลับโหมดเดินทางครบทั้ง **รถยนต์ (`Drive`)**, **เดิน (`Walk`)**, และ **ขนส่งสาธารณะ (`Transit`)** พร้อมส่งค่า `travelmode` ไปยังลิงก์นำทาง Google Maps

### 2.7 🏪 ศูนย์รวมบริการแอป & ปุ่มลงทะเบียนร้านค้า SME (Requirement 3.1)
- เพิ่มโซน **GoAround App & Ecosystem Hub** ในหน้าโปรไฟล์และเมนูหลัก มีปุ่ม **`🏪 ลงทะเบียนร้านค้า / SME Portal (Register as a Business)`** แยกจากการใช้งานของผู้ใช้ทั่วไปอย่างชัดเจน

### 2.8 🗺️ ฐานข้อมูลสถานที่ท่องเที่ยวครบ 6 ภูมิภาคของไทย (27 แห่ง / 24 จังหวัด)
- ครอบคลุมภาคเหนือ (7), ภาคกลางและกรุงเทพฯ (4), ภาคใต้ (4), ภาคอีสาน (4), ภาคตะวันออก (4), และภาคตะวันตก (4) พร้อมร้าน Local SME 16 แห่ง

---

## 🤝 3. สิ่งที่ส่งต่อและแนวทางต่อยอดกับเพื่อนในทีม (Handoff & Integration Guide)

- **ส่งต่อให้ Tommy (Maps, Routing, Cost & OSM):**
  - เชื่อม `TravalRoute`, `TravalCost`, `TravalLinks`, `TravalMapGestures` และ `/api/osm/places` ครบ 100% แล้ว
  - สถานที่ทั้ง 27 แห่งตั้งค่า `googlePlaceId: ''` และมีพิกัด `lat`/`lon` จริงพร้อมใช้งาน หาก Tommy มี Place ID จริงสามารถใส่เพิ่มได้ทันที และสามารถต่อยอดสูตรคำนวณค่าโดยสารโหมด `transit` ใน `travel-cost.js` ได้เลย
- **ส่งต่อให้ Prom (Backend, Admin CMS, Moderation & Business Portal):**
  - เชื่อม `GET/POST /api/safety/reports` และ `PUT /api/places/:id/my-review` เข้ากับ Backend ของ Prom ครบแล้ว เมื่อ Admin อนุมัติรีวิวหรือรายงานจุดเสี่ยงใน `/admin.html` / `/moderation.html` ข้อมูลจะแสดงบนหน้าแอปของ Moo ทันที
  - เชื่อมปุ่ม **Register as a Business / SME Portal** จากหน้าโปรไฟล์และเมนูหลักไปยัง `/business.html` ของ Prom เรียบร้อยแล้ว
- **ส่งต่อให้ Nine (Auth, Profile & Smart Trip Planner):**
  - เชื่อมระบบ Login/Register/Logout-All และซิงก์ Collection/Trip ผ่าน `/api/me/collections` เรียบร้อยแล้ว
  - เชื่อมการส่งรายการสถานที่ที่เลือกจากหน้า Collection (`traval-selected-plan-stops` และ `/planner.html?places=...`) ไปยังหน้า `/planner.html` ของ Nine พร้อมใช้งานต่อยอดจัดตารางทริปรายวันได้ทันที


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
