# บันทึกการส่งมอบงานและการอัปเดต UX/UI: Traval Platform (Moo — User & Map Scope)
**วันที่:** 26 ตุลาคม 2569 (26 October 2026) | เวลา: 20:00 น.  
**สัปดาห์ตามแผน:** Week 4–5 (UX/UI Design & Frontend Implementation — User / Map / Local SME)  
**เวอร์ชันล่าสุด:** v2.8.4-full-uxui-polish  
**ตำแหน่ง / บทบาท:** Senior UX/UI Engineer & Frontend Developer (Moo)  
**ขอบเขตงาน (Strict Scope):** เฉพาะส่วนงาน User / Map เท่านั้น (ไม่แตะต้องไฟล์ของ Nine, Tommy และ Prom)

---

## 📌 1. สรุปสิ่งที่ทำเสร็จ (แยกตามหน้าและส่วนฟังก์ชันของ Moo)

### 1.1 Home / Landing Screen
- **Editorial Hero & Typography:** ปรับหัวข้อใหญ่ให้อยู่ในสัดส่วน `clamp(36px, 4.2vw, 56px)` ลดทอนขนาดมหึมาเดิมที่ล้นจอ
- **Mobile-First Touch Target:** ปุ่ม Call-to-Action และปุ่ม "เข้าสู่ระบบ/ข้าม" ใช้นิ้วเดียวแตะได้สะดวก (ขนาดอย่างน้อย 44px)
- **Fluid Slider Indicator:** แสดงตัวบอกสไลด์ 01/03 ที่กลมกลืนกับพื้นหลังธรรมชาติ

### 1.2 Discover & Search
- **Standardized Place Card:** 
  - แสดงชื่อสองภาษาอย่างประณีต (ชื่อภาษาหลักตามภาษาที่เลือก + ชื่อรอง)
  - รูปภาพสัดส่วนคงที่ พร้อมการป้องกันภาพแตก (`onerror fallback`) และ `loading="lazy"`
  - ข้อมูลหมวดหมู่, ป้ายสถานะเปิด-ปิด (`open / closed / unknown`) ด้วยโทนสีมาตรฐาน
  - คะแนนรีวิวจริงพร้อมจำนวนรีวิว (เช่น `★ 4.9 (184)`) และระยะทางห่างแบบเรียลไทม์
  - **ครบทั้ง 3 ปุ่มหลัก:** ปุ่ม Favorite (🤍/❤️), ปุ่ม Add to Trip (➕/✔️), และปุ่ม Directions (🧭 นำทาง)
- **Fast Search & Filter Chips:** ค้นหาชื่อสถานที่, ร้านค้า, ตำบล, หรือจังหวัด พร้อมปุ่มล้างคำค้นหา และตัวกรองหมวดหมู่ที่เน้นปุ่ม ★ Local SME

### 1.3 Map & Real-Time Location
- **Interactive OpenStreetMap / CartoDB Voyager Tiles:** โหลดแผ่นแผนที่ลื่นไหล พร้อมระบบสำรองอัตโนมัติ
- **You Are Here Blue Dot:** จุดสีฟ้ากระพริบแสดงพิกัดผู้ใช้แบบสด นุ่มนวล ไม่กระตุก
- **Marker Clustering:** รวมกลุ่มหมุดเมื่อซูมออก และแยกออกเมื่อซูมเข้า พร้อมเน้นหมุด Local SME สีทองอำพัน
- **Follow Me & Auto-Pause:** โหมดติดตามผู้ใช้จะหยุดชั่วคราวอัตโนมัติเมื่อผู้ใช้แตะเลื่อนแผนที่เอง พร้อมแจ้งเตือน Toast
- **Search This Area (ค้นหาบริเวณนี้):** ปุ่มลอยกลางจอเมื่อเลื่อนแผนที่ออกจากจุดศูนย์กลางเดิม เพื่อค้นหาสถานที่ในมุมมองใหม่

### 1.4 Around Me / Nearby Discovery
- **เลือกรัศมีตามสเปก:** 300 ม., 500 ม., 1 กม., 3 กม., และ 5 กม.
- **Local Only Checkbox:** สลับดูเฉพาะร้านค้าชุมชนและวิสาหกิจ SME ได้ทันที
- **Fallback เมื่อไม่อนุญาต GPS / หาตำแหน่งไม่ได้:** มีป้ายแนะนำและปุ่มเลือกย่าน/จังหวัดเองได้ทันที (เชียงใหม่, กรุงเทพฯ, น่าน, สุราษฎร์ฯ) ทำให้ใช้งานได้ต่อเนื่องไม่ติดขัด

### 1.5 Local SME Spotlight & Stories
- **Local SME Spotlight Rail:** แถบเลื่อนแนวนอนแสดงเรื่องราววิถีชุมชน ไฮไลต์สินค้าท้องถิ่น (Specialties) และราคาเริ่มต้น
- **ป้ายกำกับชัดเจนและโปร่งใส:** แยกป้าย `★ Local SME Spotlight`, `Hidden Gem`, `New Local Shop` และ `Sponsored (โฆษณา)` ออกจากกันชัดเจน ไม่ปลอมคะแนนรีวิว

### 1.6 Place Detail & Bottom Sheet
- **3-Tier Draggable Bottom Sheet:** รองรับ Peek (ย่อ), Half (ครึ่งจอ), Full (เต็มจอ) บนมือถือ ลากเลื่อนนุ่มนวล
- **Full Detail Page:** ข้อมูลเวลาเปิด-ปิด, ช่วงราคา, โทรศัพท์ติดต่อร้าน, แกลเลอรีรูปภาพ, เรื่องเล่าชุมชน และปุ่มนำทางเข้า Google Maps

### 1.7 Your Collection & การเชื่อมต่อ Nine's Planner
- **แยกตามจังหวัดและหมวดหมู่:** กรองสถานที่ที่บันทึกตามจังหวัดและประเภท SME
- **Select Mode:** เลือกหลายสถานที่พร้อมกัน แล้วกดปุ่ม `ส่งรายการที่เลือกเข้าทริป ↗` ส่งข้อมูลไปยังหน้า Planner ของ Nine (`/planner.html?places=...`) ได้อย่างแนบเนียน

---

## 🎨 2. Design System ที่ใช้ (สอดคล้องกับ Nine 100%)

| Token / Element | ค่าที่กำหนดในส่วนของ Moo | การสอดคล้องกับ Nine |
| :--- | :--- | :--- |
| **Primary Ink** | `#0D2C1C` / `#10291D` | ตรงกับ `--ink: #152c21` ของ Nine |
| **Forest Green** | `#0B291B` | ตรงกับ `--green: #113525` ของ Nine |
| **Accent Lime** | `#8DE026` / `#B5E575` | ตรงกับ `--lime: #b7e771` ของ Nine |
| **Background Cream** | `#F8F7F3` | ตรงกับ `--cream: #f7f6f0` ของ Nine |
| **Subtle Border** | `#E5E7DE` | ตรงกับ `--line: #e4e6dc` ของ Nine |
| **SME Gold Accent** | `#E5A836` / `#FEF8EC` | ใช้เฉพาะป้ายรับรองร้านค้าชุมชนของ Moo |
| **Font Family (EN)** | `'Inter', sans-serif` | ตรงกับฟอนต์หลักที่ Nine ใช้งานใน planner |
| **Font Family (TH)** | `'Prompt', 'Inter', sans-serif` | ฟอนต์ไทย Loopless อ่านง่าย วรรณยุกต์ไม่ขาด |
| **Line Height (TH)** | `1.36` (Headings) / `1.70` (Body) | ป้องกันสระบน-ล่างและวรรณยุกต์ถูกตัดขอบ |
| **Letter Spacing (TH)** | `0 !important` | ป้องกันพยัญชนะไทยเบียดชิดหรือสระเกยทับกัน |

---

## 📁 3. สรุปไฟล์ที่แก้ไข / ลบ พร้อมเหตุผล

### 3.1 ไฟล์ที่แก้ไข
1. `frontend/traveler/app.js`
   - ปรับปรุงการแสดงผล `placeCard` ให้มีข้อมูลสองภาษา TH/EN, หมวดหมู่, เวลาเปิด-ปิด, คะแนน, ระยะทาง, และปุ่ม Favorite / Add to Trip / Directions ครบถ้วน
   - เพิ่มระบบ Fallback เลือกจังหวัดเองเมื่อ GPS ถูกปฏิเสธหรือไม่พร้อมใช้งาน
   - ผูกระบบภาษา `document.documentElement.lang` เข้ากับ Typography System
2. `frontend/traveler/styles.css`
   - ปรับ Type Scale ทั้งหมด ลดทอนขนาดหัวข้อใหญ่เกินจริง ให้สมดุลทั้ง Desktop และ Mobile
   - วางกฎ Typography Protection สำหรับภาษาไทย
   - เพิ่มสไตล์ปุ่มนำทาง `.btn-dir` ในการ์ดสถานที่
3. `Moo_update.md`
   - จัดทำบันทึกความก้าวหน้าและการส่งมอบงานอย่างเป็นทางการ

### 3.2 ไฟล์ที่ลบ / สิ่งแปลกตาที่ตัดออก (ตามกฎความปลอดภัย)
- ลบสคริปต์ทดสอบชั่วคราวที่ไม่ได้ใช้งาน (`fix_moo_bugs.js`, `fix_region_filter.js`, `scratch_update.js`) ออกจาก Git Working Tree
- ตัดปุ่มทดสอบ GPS ซ้ำซ้อน, แบนเนอร์ฮาร์ดโค้ดที่ไม่มีการแปล, พิกัดตัวเลขละติจูด/ลองจิจูดแบบ Dev Debugger, และหมุดเตือนภัยรูปโล่หมุนเอียง (`🛡️`) ที่ดูเหมือนแอปแจ้งเหตุอาชญากรรม

---

## 🤝 4. จุดเชื่อมโยงกับทีมงาน (Team Interfaces)

1. **เชื่อมโยงกับ Nine (Planner, My Trips & Auth/Profile):**
   - ปุ่ม `ส่งรายการที่เลือกเข้าทริป (Add selected to trip)` ในหน้า Collection ส่งค่าผ่าน URL Query:
     `/planner.html?places=id1,id2` พร้อมทั้งบันทึก `traval-selected-plan-stops` ใน `localStorage` เพื่อให้ Planner ของ Nine ดึงข้อมูลสถานที่จริงไปวางแผนต่อได้ทันที
   - การเข้าสู่หน้า **Profile / Account**: สิทธิ์งานจัดการบัญชีผู้ใช้เป็นของ Nine ทั้งหมด ดังนั้นเมื่อผู้ใช้คลิกเมนู Profile หรือเรียก URL `#profile` ระบบของ Moo จะเปลี่ยนเส้นทาง (Direct Route) ไปเปิดหน้าเต็มของ Nine ทันที:
     - หากเข้าสู่ระบบแล้ว → นำทางไป `/profile.html` (My Profile Dashboard ของ Nine)
     - หากยังไม่ได้เข้าสู่ระบบ → นำทางไป `/login.html` (Authentication Portal ของ Nine)
   - ใช้โทนสี Forest, Lime, Cream, และชุดฟอนต์ Inter สอดคล้องกับหน้าของ Nine 100%
2. **เชื่อมโยงกับ Prom (Backend & API):**
   - หน้าเว็บเรียกใช้ `/api/places` และ `/api/places/spotlight` ข้อมูลสดจาก SQLite อย่างถูกต้อง
   - รองรับ Fallback สถานที่ตัวอย่าง (Sample Places) เมื่อเซิร์ฟเวอร์อยู่ในโหมด Offline
   - รองรับฟิลด์ `isSme`, `hoursStatus`, `openHours`, `priceFrom`, และ `specialtiesTh` จากฐานข้อมูลของ Prom
3. **สิ่งที่ Tommy ต้องทราบ (Maps & Location Integration):**
   - ปัจจุบันหน้าแผนที่ใช้ OpenStreetMap / CartoDB Voyager บน Canvas/DOM
   - เมื่อ Tommy ทำการเชื่อมต่อ Google Maps JavaScript API ใน Phase ถัดไป สามารถนำพิกัด `lat`/`lon` ที่จัดเก็บในโครงสร้างเดิมไปผูกกับ Google Maps Marker ได้ทันที

---

## 🛡️ 5. การตรวจสอบไฟล์ของเพื่อนร่วมทีม (Audit & Restore)
- รัน `git status` และ `git diff` เพื่อตรวจสอบ: **ไม่มีไฟล์ของ Nine, Tommy หรือ Prom ถูกแก้ไขเลยแม้แต่ไฟล์เดียว**
- การแก้ไขทั้งหมดจำกัดอยู่เฉพาะโฟลเดอร์ `frontend/traveler/` และ `Moo_update.md` เท่านั้น
- รัน `npm test` ผลลัพธ์: **ผ่านครบทั้ง 16 เทส (16 pass, 0 fail)**

---

## 📋 6. งานค้าง / แผนสำหรับสัปดาห์ถัดไป (Next Steps)
1. ติดตามการทดสอบ Google Maps API จาก Tommy หากพร้อมนำมาทำ A/B Test เทียบกับ OpenStreetMap
2. ประสานงานกับ Nine เรื่องการรับส่งข้อมูลทริปแบบไป-กลับ (Two-way sync) ระหว่าง Collection ของ Moo และ Planner ของ Nine
3. รองรับการกรองตามป้ายฉลากชุมชนเพิ่มเติมเมื่อ Prom เพิ่มฟิลด์ประเภทสินค้าหัตถกรรม/OTOP ใน Backend
