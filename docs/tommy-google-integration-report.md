# รายงานการวิจัยและกลยุทธ์การเชื่อมต่อ Google Services (Google Integration Research Report)
**ผู้จัดทำร่วม / ซัพพอร์ต:** Tommy (Google Integration & Tester) & Prom (Backend / Integration)  
**โปรเจกต์:** Traval (Unfold Travel v2.7)  
**วันที่:** 24 ตุลาคม 2569 (2026-10-24)  
**สถานะ:** เสร็จสมบูรณ์ (พร้อมสำหรับนำเสนอและเป็นพิมพ์เขียวสำหรับ Phase 3)

---

## 1. บทสรุปผู้บริหาร (Executive Summary)

โครงการ **Traval** มีเป้าหมายในการกระจายรายได้สู่ชุมชนและสนับสนุนผู้ประกอบการท้องถิ่น (Local SMEs) โดยระบบแผนที่และการค้นหาพิกัดเป็นหัวใจสำคัญของการทำงาน จากการศึกษาของ Tommy ระบบ Google Services สามารถยกระดับความแม่นยำและความน่าเชื่อถือของแพลตฟอร์มได้อย่างมีนัยสำคัญ อย่างไรก็ดี ค่าบริการของ Google Maps Platform จำเป็นต้องมีกลยุทธ์บริหารจัดการเพื่อควบคุมค่าใช้จ่าย

ทีมงานจึงได้กำหนด **"สถาปัตยกรรมแผนที่แบบคู่ขนาน (Dual-Engine Map Strategy)"**:
1. **Local Development & Free Tier:** ใช้ **Leaflet + OpenStreetMap (OSM)** ซึ่งฟรี 100% ไม่มีข้อจำกัดด้านโควตา สำหรับการพัฒนาและการใช้งานทั่วไป
2. **Production & Commercial Scale:** ผูก **Google Maps Platform** สำหรับฟีเจอร์ขั้นสูง เช่น Street View, Place Autocomplete, และ Turn-by-Turn Road Routing โดยมีระบบ Caching ใน SQLite เพื่อประหยัดค่า API

---

## 2. การวิเคราะห์บริการ Google แต่ละตัว (Service Breakdown)

### 2.1 Google Maps JavaScript API
- **หน้าที่:** เรนเดอร์แผนที่เวกเตอร์/แรสเตอร์แบบโต้ตอบ (Interactive Map) บนเว็บเบราว์เซอร์
- **ฟังก์ชันเด่น:** Custom Vector Styling, Marker Clustering, Street View 360°, Advanced 3D Tilt
- **ความเข้ากันได้กับ Traval:**
  - Traval เก็บพิกัด `lat`, `lon` แบบมาตรฐาน WGS84 ซึ่งสามารถโยนเข้า `new google.maps.Marker()` หรือ `google.maps.marker.AdvancedMarkerElement` ได้ทันที
  - สามารถสลับระหว่าง Leaflet และ Google Maps ได้ผ่าน Map Wrapper Component

### 2.2 Google Places API (New)
- **หน้าที่:** ค้นหาจุดสังเกต, ร้านค้า, Auto-complete ช่องค้นหา และดึงรูปภาพ/เวลาเปิดทำการ
- **การเชื่อมต่อกับฐานข้อมูล SQLite:**
  - ตาราง `places` มีคอลัมน์ `google_place_id TEXT` รองรับเรียบร้อยแล้ว
  - เมื่อผู้ใช้หรือร้านค้า SME ปักหมุด ระบบสามารถบันทึก `google_place_id` เพื่อใช้ยืนยันการมีตัวตนจริงบน Google Maps
- **ข้อกำหนดทางกฎหมาย (ToS Compliance):**
  - **ห้าม** แคชข้อมูลรายละเอียดร้านค้า (Phone, Hours, Reviews) เกินกว่า 30 วัน
  - **อนุญาต** ให้เก็บ `Place ID`, `Latitude`, และ `Longitude` ในฐานข้อมูลได้ถาวร

### 2.3 Google Routes API (Compute Routes & Distance Matrix)
- **หน้าที่:** คำนวณเส้นทางตามโครงข่ายถนนจริง (Driving, Walking, Transit) พร้อมประมาณการเวลาตามสภาพจราจร (Traffic Model)
- **เปรียบเทียบกับระบบ Traval ปัจจุบัน:**
  - *ปัจจุบัน:* Traval ใช้สูตร Haversine Distance + Road Multiplier (1.30 สำหรับรถยนต์, 1.15 สำหรับเดินเท้า) ซึ่งรวดเร็ว ไม่ใช้เน็ต และไม่มีค่าใช้จ่าย
  - *เมื่อต่อ Routes API:* จะได้ระยะทางเลี้ยวต่อเลี้ยวจริง (Polyline Geometry) และเวลาเดินทางที่แม่นยำตามสภาพรถติดในเมือง

### 2.4 Google Authentication (OAuth 2.0 & One-Tap Sign-In)
- **หน้าที่:** การเข้าสู่ระบบด้วยบัญชี Google
- **สถานะการทำงาน:** **เสร็จสมบูรณ์แล้วในระบบหลังบ้าน!**
  - Backend มี Endpoint `POST /api/auth/social` รองรับ `provider: 'google'`
  - เชื่อมโยงบัญชีตามอีเมลอัตโนมัติ พร้อมตั้งค่า `email_verified = 1` ให้ทันที

---

## 3. การวิเคราะห์ค่าใช้จ่ายและโควตา (Pricing & Quotas)

Google Cloud Platform ให้เครดิตฟรี **$200 USD ต่อเดือน (ประมาณ 7,000 บาท)** แก่ทุก Billing Account:

| บริการ Google | อัตราค่าบริการต่อ 1,000 ครั้ง | จำนวนที่ใช้ได้ฟรีต่อเดือนภายใต้ $200 |
|---|---|---|
| **Maps JavaScript API** | $7.00 USD | ~28,500 Map Loads |
| **Places Autocomplete** (Session-based) | $2.83 USD | ~70,000 Search Sessions |
| **Place Details (Basic)** | $17.00 USD | ~11,700 Requests |
| **Routes API (Compute Routes)** | $5.00 – $10.00 USD | ~20,000 – 40,000 Route Requests |

### กลยุทธ์ประหยัดค่าใช้จ่าย (Cost Optimization Strategy):
1. **Debounce Search Input:** หน่วงเวลาการพิมพ์ 300-400ms ก่อนเรียก Autocomplete
2. **Session Tokens:** ใช้ Autocomplete Session Token เพื่อคิดเงินเพียง 1 ครั้งต่อการค้นหาจนถึงการคลิกเลือกสถานที่
3. **Database First Policy:** ตรวจสอบสถานที่ในฐานข้อมูล Traval SQLite ก่อน หากมีอยู่แล้วไม่ต้องเรียก Place Details ซ้ำ
4. **Direct Google Maps Deep Link:** สำหรับการนำทางจริง ใช้ URL Scheme ฟรี:
   `https://www.google.com/maps/dir/?api=1&destination={lat},{lon}&travelmode={mode}`

---

## 4. ขั้นตอนการตั้งค่า Google Cloud Console (Step-by-Step Setup Guide)

สำหรับเปิดใช้งานเมื่อทีมพร้อมขึ้นสู่ Production:
1. เข้าไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่ชื่อ `traval-prod`
3. ผูกบัตรชำระเงินเพื่อรับสิทธิ์เครดิตฟรี $200/เดือน
4. เปิดใช้งาน (Enable) APIs ทั้ง 4 ตัว:
   - *Maps JavaScript API*
   - *Places API (New)*
   - *Routes API*
   - *Geocoding API*
5. ไปที่เมนู **Credentials** -> **Create Credentials** -> **API Key**
6. **ตั้งค่าความปลอดภัย (Security Restrictions):**
   - **Application Restrictions:** ตั้งเป็น `Websites` และระบุ Domain ของ Traval (เช่น `https://traval.in.th/*`, `http://localhost:*` สำหรับเทสต์)
   - **API Restrictions:** ล็อคให้คีย์ใช้งานได้เฉพาะ 4 APIs ข้างต้นเท่านั้น
   - **Budget Alert:** ตั้งค่าแจ้งเตือนทางอีเมลเมื่อค่าใช้จ่ายถึง 50%, 80%, และ 100% ของงบประมาณ
