# บันทึกการส่งมอบงานและการอัปเดต UX/UI: Traval Platform (Nine — Planner, My Trips & Auth/Profile Scope)
**วันที่:** 27 ตุลาคม 2569 (27 October 2026) | เวลา: 09:00 น.  
**สัปดาห์ตามแผน:** Week 5 (AI Route Optimization, My Trips Engine & Universal Auth Suite)  
**เวอร์ชันล่าสุด:** v2.8.5-planner-auth-integration  
**ตำแหน่ง / บทบาท:** Senior UX/UI Engineer & Frontend Lead (Nine)  
**ขอบเขตงาน (Strict Scope):** Planner, My Trips, Trip Engine, AI Advisor, Authentication Suite & User Profile (สอดประสานกับ Moo, Prom และ Tommy)

---

## 📌 1. สรุปสิ่งที่ทำเสร็จและพัฒนาเพิ่มเติม (Key Accomplishments)

### 1.1 การยกระดับ Showcase สู่ไฟล์หลัก (Production Promotion)
- **ยกระดับ `planner-showcase.html` → `planner.html`:** นำหน้าจอวางแผนการเดินทางอัจฉริยะ (Smart Route Planner) ที่ผ่านการทดสอบ UX/UI ขึ้นเป็นหน้าหลักประจำแพลตฟอร์มแทนที่โครงร่างเดิม (โดยสำรองไฟล์เดิมไว้ที่ `planner-legacy.html`)
- **อัปเดตระบบเส้นทางภายใน (Internal Navigation):**
  - แก้ไขแถบเมนูด้านบนใน `planner.html` ให้ชี้ลิงก์ "My Trips" มาที่ `planner.html` อย่างสมบูรณ์
  - เชื่อมโยงปุ่มกลับสู่หน้าหลักและแผนที่ (`../../index.html` และ `#map`) ของ Moo
  - ผูกปุ่มโปรไฟล์ผู้ใช้มุมขวาบนเข้าสู่หน้า `../auth/profile.html`
- **รองรับ Backward Compatibility:** ประสานงานกับ Backend (`server.js`) ให้รองรับทั้ง `/planner.html` และ Alias เดิม `/planner-showcase.html` เพื่อไม่ให้เกิดข้อผิดพลาด 404 สำหรับผู้ใช้หรือการ Bookmark เดิม

---

### 1.2 แก้ไขปัญหา CSS ไม่โหลดในระบบ Authentication (Auth Style Routing Fix)
- **ตรวจพบและแก้ไข Bug การแสดงผล:**
  - อาการ: เมื่อเปิดหน้า `/register.html` (Create Account) หรือ `/forgot-password.html` (Reset Password) รวมถึง `/profile.html` จากรากของเว็บ Browser จะเรียกหา `/register-style.css` ที่ Root URL แต่เซิร์ฟเวอร์ยังไม่มีแมปปิ้ง ส่งผลให้หน้าเว็บกลายเป็นข้อความล้วนไม่มีสไตล์
  - วิธีแก้ไข: เพิ่ม Route สาธารณะ `'register-style.css': 'frontend/auth/register-style.css'` ใน `PAGE_FILES` ของ `backend/server.js` และ `backend/config.js`
  - ผลลัพธ์: การแสดงผลของชุดหน้าต่างระบบ Auth ทั้งหมดแสดงผลฟอร์ม การจัดวาง กราฟิก และ Responsive ได้อย่างสมบูรณ์ 100% ทั้งบน URL ตรงและ Flat URL

---

### 1.3 ระบบวางแผนการเดินทางอัจฉริยะ (AI Trip Planner & Smart Route Optimizer)
- **Smart Itinerary Engine:**
  - รองรับการแบ่งวันเดินทาง (Day 1, Day 2, Day 3) พร้อมระบุเวลาเริ่มต้นและสิ้นสุด
  - ระบบจัดลำดับสถานที่แวะชม (Timeline Drag & Drop / Sequence Reorder)
  - แถบแสดงสถานะเส้นทาง: ระยะทางรวม (กม.), เวลาเดินทางโดยประมาณ (ชม./นาที) และค่าใช้จ่ายประมาณการแยกตามหมวดหมู่ (เดินทาง, อาหาร, ที่พัก, กิจกรรม)
- **AI Advisor Integration:**
  - ปุ่ม **"✨ คำนวณเส้นทางด้วย AI"** เชื่อมต่อกับ `POST /api/ai/advisor` ของ Prom เพื่อจัดกลุ่มสถานที่ท่องเที่ยว (Clustering) ตามสไตล์การท่องเที่ยว (Slow Life, Cafe Hopping, Culture & History, Nature Adventure)
  - รองรับการกระจายสถานที่อย่างสมดุล ไม่บีบอัดสถานที่ข้ามจังหวัดหรือไกลเกินจริงในวันเดียวกัน
- **เชื่อมต่อข้อมูลสดกับ Collection ของ Moo:**
  - รองรับการรับค่าข้ามหน้าผ่าน URL Parameter: `/planner.html?places=id1,id2,id3`
  - ดึงข้อมูลสถานที่จาก `localStorage` (`traval-selected-plan-stops`) ที่ส่งมาจากหน้า Collection ของ Moo และแปลงเป็นการ์ดสถานที่ในทริปได้ทันที
- **Trip Persistence & Synchronization:**
  - ปุ่ม **"บันทึกทริปนี้" (Save Trip)** บันทึกข้อมูลลงฐานข้อมูล SQLite ผ่าน Endpoint `POST /api/itineraries`
  - รองรับการแก้ไขทริปเดิมและการทำซ้ำทริป (Duplicate Itinerary)

---

### 1.4 ระบบยืนยันตัวตนและจัดการสมาชิกแบบครบวงจร (Universal Auth Suite)
1. **Login Portal (`frontend/auth/login.html`):**
   - รองรับการเข้าสู่ระบบด้วย Email / Password มาตรฐาน
   - รองรับ Social Login (Google Sign-In, Facebook Login) และ Phone OTP Login ตามสเปกความพร้อม
   - ระบบจดจำการเข้าสู่ระบบ (Remember Me) และลิงก์เชื่อมโยงไปยังหน้าลงทะเบียนและกู้รหัสผ่าน
2. **Create Account (`frontend/auth/register.html`):**
   - ฟอร์มสมัครสมาชิกพร้อมการตรวจสอบความปลอดภัยของรหัสผ่านขั้นต่ำ 8 ตัวอักษร
   - ระบบตรวจสอบการยืนยันรหัสผ่านแบบ Real-time
   - ข้อกำหนดการยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว (PDPA Compliance)
3. **Forgot / Reset Password (`frontend/auth/forgot-password.html`):**
   - แบบฟอร์มกรอกอีเมลเพื่อขอรับลิงก์กู้คืนรหัสผ่าน
   - UI สถานะสำเร็จ (Success State Box) แจ้งเตือนการส่งอีเมลตรวจสอบ
4. **My Profile Dashboard (`frontend/auth/profile.html`):**
   - แสดงข้อมูลผู้ใช้จริงจากการยืนยันตัวตน (`/api/auth/me`)
   - แสดงสถิติการใช้งาน: จำนวนทริปที่สร้าง (My Trips) และจำนวนสถานที่ที่บันทึกไว้ (Saved Places)
   - ปุ่มจัดการความปลอดภัย: ออกจากระบบทั้งหมดทุกอุปกรณ์ (`/api/auth/logout-all`) และระบบขอลบบัญชีถาวรตามสิทธิ PDPA (`DELETE /api/me/account`)

---

## 🎨 2. Design System Tokens & Typography (Nine Standard)

สอดคล้องกับแนวทางการออกแบบที่ตกลงร่วมกันกับ Moo และทั้งทีม:

| Token / Variable | ค่าสี / รหัส Hex | วัตถุประสงค์ในการใช้งาน |
| :--- | :--- | :--- |
| `--forest` | `#172B23` | สีเขียวเข้มพรีเมียม หัวข้อหลัก, แถบสถานะ, ปุ่ม Primary |
| `--forest-light` | `#244437` | พื้นหลังการ์ดส่วนหัว, แถบเน้นข้อมูล |
| `--lime` | `#8DE026` | สีเขียวมะนาวสดใส ใช้เป็นจุดเด่น (Accent), ปุ่ม CTA, Focus Ring |
| `--lime-light` | `#DCF1D7` | สีพื้นหลังป้ายกำกับสถานะ (Badge Background) |
| `--cream` | `#F8F7F3` | สีพื้นหลังหลักของหน้าเว็บ นุ่มนวล สบายตา |
| `--paper` | `#FFFFFF` | พื้นหลังการ์ด คอนเทนเนอร์ และโมดัล |
| `--ink` | `#131B17` | สีตัวอักษรหลัก เนื้อหา คอนทราสต์อ่านง่าย |
| `--muted` | `#627267` | สีข้อความรอง รายละเอียด คำอธิบายประกอบ |
| `--line` | `#E5E9E2` | เส้นขอบ เส้นแบ่งส่วน และโครงสร้างตาราง |
| `--sme-gold` | `#E5A836` | สีทองสำหรับป้ายรับรองร้านค้าชุมชนและไฮไลต์ SME |
| `--font` | `'Inter', 'Prompt', sans-serif` | ชุดฟอนต์หลัก รองรับทั้งภาษาไทยและอังกฤษอย่างลงตัว |

---

## 📁 3. สรุปรายการไฟล์ที่เกี่ยวข้องและแก้ไข

### 3.1 ไฟล์ที่รับผิดชอบโดยตรง (Nine Scope)
1. `frontend/planner/planner.html` (ยกระดับจาก `planner-showcase.html` เป็นไฟล์หลัก พร้อมอัปเดตลิงก์ภายใน)
2. `frontend/planner/planner-legacy.html` (สำรองไฟล์ต้นฉบับเดิมเพื่อความปลอดภัย)
3. `frontend/planner/planner.css` & `planner.js` (สไตล์และกลไกเสริมระบบวางแผนทริป)
4. `frontend/planner/trip-engine.js` (ตรรกะคำนวณระยะทาง เวลา และการป้องกันเส้นทางที่เกินจริง)
5. `frontend/auth/login.html` (หน้าจอเข้าสู่ระบบตัวเต็ม)
6. `frontend/auth/register.html` (หน้าจอลงทะเบียนสมาชิกใหม่)
7. `frontend/auth/forgot-password.html` (หน้าจอกู้คืนรหัสผ่าน)
8. `frontend/auth/profile.html` (แดชบอร์ดข้อมูลส่วนตัว สถิติ และการจัดการบัญชี)
9. `frontend/auth/register-style.css` (ชุดสไตล์ชีตหลักสำหรับระบบยืนยันตัวตน)

### 3.2 ไฟล์ระบบส่วนกลางที่ประสานงานอัปเดต
1. `backend/server.js` (เพิ่ม Route `register-style.css` และเส้นทาง Alias สำหรับ Showcase / Legacy)
2. `backend/config.js` (อัปเดต `PAGE_FILES` ให้ตรงกับ server.js)
3. `run.bat` (อัปเดตเมนูรันเซิร์ฟเวอร์ให้ชี้ไปยัง `http://127.0.0.1:5173/planner.html`)

---

## 🤝 4. การเชื่อมโยงกับเพื่อนร่วมทีม (Team Interfaces)

1. **การเชื่อมโยงกับ Moo (User Discovery & Map):**
   - **Trip Integration:** ระบบ Planner สามารถรับ ID สถานที่จากฟังก์ชัน `send-to-planner` ในหน้า Collection ของ Moo ได้อย่างราบรื่น
   - **Theme & Navigation:** ใช้โทนสีเขียวป่า (Forest), ครีม (Cream) และฟอนต์ชุดเดียวกัน ทำให้ผู้ใช้รู้สึกเป็นแอปเดียวกันอย่างไร้รอยต่อ
2. **การเชื่อมโยงกับ Prom (Backend & API):**
   - เชื่อมต่อการคำนวณทริปผ่าน `POST /api/ai/advisor`
   - เชื่อมต่อการบันทึกทริปผู้ใช้ผ่าน `POST /api/itineraries` และ `GET /api/itineraries`
   - เชื่อมต่อระบบสมาชิกผ่าน `/api/auth/*` และ `/api/me/*`
3. **การส่งต่องานให้ Tommy (Maps Integration):**
   - โครงสร้างพิกัดละติจูด/ลองจิจูดใน Planner ถูกเตรียมไว้ในฟอร์แมตมาตรฐาน พร้อมผูกเข้ากับ Google Maps Waypoints และ Directions Renderer ได้ทันทีเมื่อเปิดใช้งานเฟสถัดไป

---

## 🧪 5. การทดสอบและการรับประกันคุณภาพ (Quality Assurance)

- **Trip Engine Unit Tests:** ผ่านการทดสอบชุด `tests/trip_engine.test.js` ครบทั้ง 4 เทส:
  - `planner keeps nearby places together but prevents implausibly distant day routes` (PASS)
  - `planner never mixes different countries on the same day and explains transfers` (PASS)
  - `walking mode rejects distant stops and plans time allowances` (PASS)
  - `hours/day and per-day cap do not silently overflow a saved itinerary` (PASS)
- **Syntax Check:** ตรวจสอบไวยากรณ์ Node.js บน `backend/server.js` และ `backend/config.js` ผ่านฉลุย ไร้ข้อผิดพลาด
- **CSS Delivery:** ทดสอบเรียกใช้งานไฟล์ `register-style.css` ผ่าน Flat URL สำเร็จ สามารถเรนเดอร์หน้าจอ Auth ได้ถูกต้องทุกหน้า

---

## 📋 6. แผนงานในระยะถัดไป (Next Steps)
1. พัฒนาระบบ Drag & Drop จัดเรียงสถานที่ใน Planner ให้รองรับการสัมผัส (Touch Gesture) บนมือถือได้ลื่นไหลยิ่งขึ้น
2. เพิ่มตัวเลือก Export แผนการเดินทางเป็น PDF หรือแชร์ลิงก์ทริปให้เพื่อนร่วมทาง
3. ประสานงานกับ Tommy ในการดึงระยะทางและเวลาเดินทางแบบเรียลไทม์จาก Google Distance Matrix API

