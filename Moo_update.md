# 🧭 GoAround (เดิม Traval / Unfold) — สรุปงานอัปเดตและคู่มือส่งต่องานฝั่ง Moo

> **ผู้รับผิดชอบ:** **Moo** (Senior UX/UI Engineer & Frontend Developer)  
> **สาขา (Branch):** `moo-frontend`  
> **วันที่อัปเดตล่าสุด:** **8 พฤศจิกายน 2026 (v3.1.0)**  
> **ผลการทดสอบอัตโนมัติ (`npm test`):** ผ่านครบ **35 / 35 Tests (100% Pass, 0 Fail)**

---

## 📅 1. ไทม์ไลน์การอัปเดตของ Moo (Update History & Dates)

| วันที่อัปเดต | เวอร์ชัน | รายละเอียดงานที่ทำสำเร็จ |
| :--- | :---: | :--- |
| **1–2 พ.ย. 2026** | **v2.8 – v2.9** | ออกแบบระบบสองภาษา (TH/EN Typography: Prompt + Inter), ปรับปรุงดีไซน์การ์ดสถานที่, สร้างระบบรีวิวของสถานที่, โมดอลแจ้งเตือนภัยนักท่องเที่ยว (Safety Alerts), โมดอลแนะนำการใช้งาน (Onboarding), แถบเรื่องราวชุมชน (Local Stories Rail) และระบบเลือกหลายสถานที่ใน Collection เพื่อส่งเข้าทริป |
| **7–8 พ.ย. 2026 (เช้า)** | **v2.9.2** | เชื่อมต่อระบบแผนที่และการซูม/ลาก (`TravalMapGestures`), เส้นทางถนนจริง (`TravalRoute`), คำนวณค่าแท็กซี่มิเตอร์และค่าน้ำมัน (`TravalCost`), ลิงก์นำทาง Google Maps (`TravalLinks`) ของ **Tommy** และระบบนำเข้าพิกัด OpenStreetMap (`osm_places`) เข้ากับหน้า Traveler App |
| **8 พ.ย. 2026 (บ่าย)** | **v3.0.0** | เชื่อม API หลังบ้านของ **Prom** ครบทุกจุด (`GET/POST /api/safety/reports`, `PUT /api/places/:id/my-review`), เพิ่มชุดแอนิเมชัน **GSAP 3.15.0 Suite** (`ScrollSmoother`, `ScrollTrigger`, `ScrollToPlugin`, `SplitText`, `Flip` Grid-to-Detail) และขยายฐานข้อมูลสถานที่ท่องเที่ยวไทยครบ **6 ภูมิภาค (27 แห่ง / 24 จังหวัด)** |
| **8 พ.ย. 2026 (ล่าสุด)** | **v3.1.0** | **Rebrand ทั้งเว็บไซต์เป็น `GoAround`** (ครบทั้ง 18 หน้า HTML), อัปเกรดระบบรองรับ **App Mode (PWA Standalone)** ตาม `Traval_Requirements_Business_Updated.txt`, สร้างโมดอล **🤖 GoAround AI Travel Advisor**, เพิ่มโหมดเดินทางครบ 3 รูปแบบ (`Drive` / `Walk` / `Transit`) และสร้างศูนย์รวมบริการ **GoAround App & Ecosystem Hub** |

---

## 🛠️ 2. สรุปสิ่งที่ Moo ทำไปทั้งหมด (Complete Work Breakdown)

1. **การเปลี่ยนชื่อแบรนด์เป็น `GoAround` ทั้งเว็บไซต์และระบบ App:**
   - เปลี่ยนโลโก้หลักเป็น **`G. GoAround`** และอัปเดตชื่อแบรนด์บนทุกหน้าเว็บ (Traveler App, Auth, Trip Planner, Business SME Portal, Admin Studio, Maps POC รวม 18 ไฟล์ HTML) และใน `Traval_Requirements_Business_Updated.txt`
   - คงชื่อตัวแปร Global API (`window.TravalRoute`, `window.TravalCost`, `window.TravalLinks`, `window.TravalMapGestures`, `UnfoldTripEngine`) และฐานข้อมูล/Cookie เดิมไว้ 100% เพื่อไม่ให้กระทบโค้ดและชุดทดสอบของเพื่อนในทีม
2. **รองรับรูปแบบ App (PWA Standalone Mode):**
   - อัปเกรด `manifest.webmanifest`, `sw.js` (`goaround-v3.0-app`), และ `index.html` ให้ติดตั้งเป็นแอปมือถือแบบเต็มจอ (`display: standalone`) พร้อม App Shortcuts 4 หน้าหลัก, รองรับ `safe-area-inset` และมีปุ่ม **`📲 ติดตั้งแอป GoAround`**
3. **🤖 GoAround AI Travel Advisor (Requirement 1.9):**
   - โมดอลผู้ช่วยแนะนำสถานที่ท่องเที่ยวและร้านค้าชุมชนตามงบประมาณ จังหวัด และสไตล์ ทั้งภาษาไทยและอังกฤษ
   - แยกรายการแนะนำที่ตรงกับความต้องการจริง (**Organic Matches**) ออกจากพื้นที่โฆษณา (**Sponsored Placements**) อย่างชัดเจน พร้อมปุ่มกดเพิ่มเข้าทริปทันที
4. **🚗🚶🚆 คำนวณเส้นทางครบ 3 โหมด (Requirement 1.8):**
   - รองรับการสลับโหมดเดินทางครบทั้ง **รถยนต์ (`Drive`)**, **เดิน (`Walk`)**, และ **ขนส่งสาธารณะ (`Transit`)** พร้อมส่งค่า `travelmode` ไปยังลิงก์นำทาง Google Maps
5. **🏪 ศูนย์รวมบริการแอป & ปุ่มลงทะเบียนร้านค้า SME (Requirement 3.1):**
   - เพิ่มโซน **GoAround App & Ecosystem Hub** ในหน้าโปรไฟล์และเมนูหลัก มีปุ่ม **`🏪 ลงทะเบียนร้านค้า / SME Portal (Register as a Business)`** แยกจากการใช้งานของผู้ใช้ทั่วไปอย่างชัดเจน
6. **🗺️ ฐานข้อมูลสถานที่ท่องเที่ยวครบ 6 ภูมิภาคของไทย (27 แห่ง / 24 จังหวัด):**
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
