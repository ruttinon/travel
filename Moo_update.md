# บันทึกการส่งมอบงานและการอัปเดต UX/UI: Traval Platform (Moo — User & Map Scope)
**วันที่:** 2 พฤศจิกายน 2569 (2 November 2026) | เวลา: 20:45 น.  
**สัปดาห์ตามแผน:** Week 5–6 (Bilingual Optimization, Map Enhancements, Explore Layout Re-Architecture & Visual Alignment)  
**เวอร์ชันล่าสุด:** v2.8.8-moo-explore-visual-balance  
**ตำแหน่ง / บทบาท:** Senior UX/UI Engineer & Frontend Developer (Moo)  
**ขอบเขตงาน (Strict Scope):** เฉพาะส่วนงาน User Discovery / Map / Local SME (frontend/traveler/) พร้อมประสานงานระบบเส้นทางและไฟล์ร่วมของทีม

---

## 📌 1. สรุปสิ่งที่ทำเสร็จ (แยกตามหน้าและส่วนฟังก์ชันของ Moo)

### 1.1 จัดสมดุลและสัดส่วนหน้า Explore ให้เท่ากันทุก Bar (Equalized Layout & Grid Alignment)
- **แถบค้นหาหลัก (Hero Search Bar):**
  - ปรับความกว้างให้เต็มขอบ Container (100% full-width box-sizing) กึ่งกลางสายตาอย่างสมดุล
  - ขอบมนมาตรฐาน `border-radius: 9999px` สีพื้นผิวขาวละมุน พร้อม Focus Ring สีเขียวป่าเมื่อคลิกพิมพ์
  - ปุ่มค้นหา `search-go` และปุ่มล้างคำค้นหา `clear-query` (✕) มีสัดส่วนสัมผัสที่สบายตา (Touch Target 44px)
- **แถบหมวดหมู่ (Category Filter Pills Bar):**
  - ปรับระดับความสูงและระยะห่าง (Pill Padding: `9px 18px`) ให้ได้แนวระดับเท่ากับแถบค้นหา
  - ขอบชิปสีเส้นขอบบางประณีต พร้อมเน้นหมวด `★ ร้านค้าชุมชน SME` ด้วยโทนสีทองอำพัน (`#FEF8EC` / `#F59E0B`) สวยงามเด่นชัด
- **กล่องรอบตัวฉัน (Around Me / Nearby Panel Alignment):**
  - ดีไซน์ใหม่แบบ Equalized Panel: ขอบมน `20px` เข้าชุดกับโครงสร้างการ์ดของหน้าเว็บ
  - จัดเรียงแถวควบคุมบนเป็นแนวเดียวกัน: `ปุ่มเปิด/ปิดรอบตัวฉัน` + `ปุ่มฟิลเตอร์ย่อย` + `ปุ่มติ๊กเฉพาะร้านชุมชน` + `ข้อความสถานะทางขวาสุด`
  - ส่วนขยายตัวเลือก (Radius, Budget, Rating) ซ่อน/เปิดอย่างเป็นระเบียบ ไม่เบียดบังรายการหลัก

### 1.2 ระบบ 2 ภาษา (Bilingual Support: TH / EN) ทั่วทั้งระบบ
- **Region Dropdown (ตัวเลือกภูมิภาคบนแผนที่):** ปรับแก้ให้รองรับ 2 ภาษาอย่างสมบูรณ์แบบ (ภาคเหนือ, กรุงเทพฯ และภาคกลาง, ภาคใต้, ภาคอีสาน, ภาคตะวันออก, ภาคตะวันตก) ผ่านคีย์ภาษา `regionNorth`, `regionCentral`, `regionSouth`, `regionNortheast`, `regionEast`, `regionWest`
- **ป้ายหมวดหมู่และสถานะร้านค้า:** แสดงผลตรงตามภาษาที่เลือก เช่น `★ ร้านค้าชุมชน SME` / `★ Local SME`, `เปิดอยู่` / `Open`, `ปิดแล้ว` / `Closed`
- **ระบบสลับภาษา (Language Switcher):** กดปุ่มสลับภาษา `TH / EN` ที่ Header แล้วหน้าเว็บทั้งหมดจะสลับการแสดงผลทันที พร้อมปรับความสูงบรรทัด (Line-height) ป้องกันสระและวรรณยุกต์ภาษาไทยซ้อนทับหรือขาดขอบ

### 1.3 การจัดระเบียบปุ่มและการนำทาง (Button Workflows & Navigation Consistency)
- **Profile / เข้าสู่ระบบ:**
  - สอดรับกับสิทธิ์ระบบสมาชิกของ Nine โดยตรง:
    - ผู้ใช้ที่เข้าสู่ระบบแล้ว ➔ เปิดหน้า `/profile.html` (Nine's Profile Dashboard)
    - ผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบ ➔ เปิดหน้า `/login.html` (Nine's Auth Suite)
- **ส่งสถานที่เข้าสู่ Planner:**
  - ปุ่ม `ส่งรายการที่เลือกเข้าทริป ↗` ในหน้า Collection ส่ง ID สถานที่เข้า `/planner.html?places=...` ของ Nine พร้อมเขียน `traval-selected-plan-stops` ลงใน `localStorage`
- **ตัวกรองสถานที่ตามจังหวัด (By Province):**
  - เชื่อมโยงการกดชิปจังหวัดในหน้า Discover เข้ากับ `case 'province-filter'` ดึงรายการสถานที่ในจังหวัดนั้นมาแสดงทันที
- **ปุ่มนำทาง (Directions):**
  - ใช้ `TravalLinks.directionsUrl()` ส่งต่อไปยัง Google Maps ได้อย่างถูกต้องทั้งโหมดเดินและรถยนต์

---

## 🧹 2. สิ่งที่ลบและทำความสะอาด (Clean-up & Dead Code Removal)

1. **ลบปุ่มที่ชี้ไปยังหน้าที่ไม่มีจริง:**
   - ตัดปุ่ม `<button data-page="local">${t('localDirectory')}</button>` ออกจากหน้า Discover เนื่องจากไม่มีหน้ารองรับในสเปก
2. **ลบ Dead Modals ที่ไม่ได้ใช้งาน:**
   - ลบฟังก์ชันตกค้าง `_unusedAiModal` และ `_unusedSafetyModal` (รวมกว่า 226 บรรทัด) ออกจาก `frontend/traveler/app.js` เพื่อความสะอาด ปลอดภัย และลดขนาด bundle ของ JavaScript
3. **ตัดสคริปต์แก้บั๊กชั่วคราว:**
   - ทำความสะอาดไฟล์สคริปต์ชั่วคราวในโฟลเดอร์ scripts ให้คงเหลือเฉพาะไฟล์ระบบหลัก

---

## 🤝 3. การประสานงานและการยุ่งเกี่ยวกับไฟล์ของเพื่อนร่วมทีม (Team Interfaces)

### 3.1 งานที่เกี่ยวข้องกับ Tommy (Maps & Travel Tools)
- **ไฟล์ที่นำเข้าใช้งานร่วมกัน (Shared Files):**
  - `frontend/shared/maps-links.js` ➔ สร้างลิงก์นำทาง Google Maps
  - `frontend/shared/road-route.js` ➔ คำนวณเส้นทางและระยะทางถนนจริงผ่าน OSRM
  - `frontend/shared/travel-cost.js` ➔ คำนวณค่าเดินทาง/มิเตอร์แท็กซี่
  - `frontend/shared/map-gestures.js` ➔ ระบบ Touch / Pinch-to-zoom บนแผนที่
- **การปรับแต่งใน `frontend/traveler/index.html`:**
  - เพิ่มการโหลดสคริปต์ Shared Tools ทั้ง 5 ตัวก่อน `app.js`
- **การประสานงาน Backend เพื่อ Serve ไฟล์:**
  - อัปเดต `backend/config.js` และ `backend/server.js` ให้รองรับเส้นทางสาธารณะของไฟล์กลุ่มนี้ และเปิด Route `/api/routes` และ `/api/map/places` เพื่อไม่ให้เกิดข้อผิดพลาด HTTP 404

### 3.2 งานที่ประสานกับ Nine (Planner & Auth Suite)
- **การส่งต่อข้อมูลสถานที่:** รองรับการส่งพารามิเตอร์ `places` ไปยัง `/planner.html`
- **การเชื่อมโยงระบบสมาชิก:** เคารพความเป็นเจ้าของโค้ดของ Nine โดยไม่สร้างหน้าจอโปรไฟล์ซ้ำซ้อน แต่ทำทางเชื่อมส่งผู้ใช้ไปยังหน้าของ Nine 100%

### 3.3 งานที่ประสานกับ Prom (Backend & Database)
- ใช้งาน API สถานที่จริง `/api/places` และข้อมูล Local SME จาก SQLite ราบรื่น
- ไม่มีการแก้ไขโครงสร้าง Schema ของฐานข้อมูลหรือโมเดลความปลอดภัยของระบบ

---

## 📁 4. สรุปไฟล์ที่แก้ไข / เพิ่ม / ลบ

| รายการไฟล์ | การดำเนินการ | รายละเอียดการเปลี่ยนแปลง |
| :--- | :---: | :--- |
| `frontend/traveler/app.js` | **แก้ไข** | จัดโครงสร้างแถบควบคุมของ Nearby ให้ได้แนวเท่ากัน, ชู Local SME Spotlight, เพิ่มปุ่มล้างค้นหา, แปล Region dropdown 2 ภาษา, เชื่อมปุ่มจังหวัด, ลบ Dead Modals (226 บรรทัด), บูรณาการเครื่องมือ Tommy |
| `frontend/traveler/styles.css` | **แก้ไข** | เพิ่มชุดสไตล์ Equalized Layout ให้ Search bar, Category pills, และ Around Me Panel กว้างและอยู่ในระนาบเดียวกันอย่างประณีต |
| `frontend/traveler/index.html` | **แก้ไข** | เพิ่ม Script tags โหลดเครื่องมือ Shared Tools 5 ตัว |
| `frontend/shared/*` | **เพิ่ม** | เพิ่มไฟล์เครื่องมือแผนที่ 4 ไฟล์ตามที่ Tommy พัฒนา |
| `backend/config.js` & `backend/server.js` | **แก้ไขร่วม** | เพิ่มเส้นทาง Flat Route สำหรับ Shared Files และ API เส้นทางเพื่อแก้ปัญหา 404 |
| `Moo_update.md` | **แก้ไข** | บันทึกรายงานการส่งมอบงานและการปรับปรุงระบบล่าสุด |

---

## 🧪 5. การทดสอบและการรับประกันคุณภาพ (QA & Verification)

- **Syntax & Compilation Check:** ตรวจสอบไวยากรณ์ `node --check` ทุกไฟล์ JavaScript ผ่าน 100%
- **HTTP Status Check:** สคริปต์หน้าเว็บทุกไฟล์ตอบกลับ **HTTP 200 OK** ไม่มี 404 ตกค้าง
- **API Functional Test:**
  - `GET /api/map/places` ➔ **HTTP 200 OK**
  - `POST /api/routes` ➔ คำนวณระยะทางถนนจริงและเวลาเดินทางสำเร็จ (**HTTP 200 OK**)
- **Unit & Integration Tests:** รันคำสั่ง `npm test` ผลลัพธ์: **ผ่านครบทั้ง 16 เทส (16 pass, 0 fail)**

### 7. การนำภาพสไลด์หน้า Home (Landing Slideshow) กลับมาใช้งาน (assets 1.png, 2.png, 3.png)
1. **การจัดเตรียมไฟล์รูปภาพ:**
   - คัดลอกจาก `assets/1.png`, `assets/2.png`, `assets/3.png` เข้าสู่ `frontend/traveler/assets/` ให้ Web Server ให้บริการ HTTP 200 ได้อย่างถูกต้อง
2. **การทำงานของ Slideshow ใน `frontend/traveler/app.js`:**
   - กำหนดชุดข้อมูลภาพ `LANDING_SLIDES` ครบทั้ง 3 ภาพ
   - สไลด์อัตโนมัติทุก 4 วินาที ด้วย CSS Smooth Transition (`0.85s`)
   - จุดนำทาง (Dots Indicator) ด้านขวาล่างสำหรับเลือกสลับภาพได้ทันที พร้อม Event Dispatch `landing-slide`
   - ตัวนับ `01 / 03`, `02 / 03`, `03 / 03` และแถบความคืบหน้าสีเขียว Lime (`#8DE026`) ซิงค์ตามรูปภาพปัจจุบัน
