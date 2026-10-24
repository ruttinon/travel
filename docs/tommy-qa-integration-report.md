# รายงานการทดสอบระบบและการประกันคุณภาพ (QA & Integration Test Report)
**ผู้จัดทำ:** Tommy (Tester / QA Lead / Support)  
**ผู้ประสานงานร่วม:** Prom (Backend / System Architecture)  
**โปรเจกต์:** Traval (Unfold Travel v2.7)  
**วันที่:** 24 ตุลาคม 2569 (2026-10-24)  
**สถานะ:** ผ่านการทดสอบระดับระบบ 100% (All 16 Test Suites PASS / Zero Regression)

---

## 1. วัตถุประสงค์ (Objectives)

เอกสารฉบับนี้จัดทำขึ้นโดย Tommy เพื่อสรุปผลการทดสอบเชิงบูรณาการ (Integration Testing), การทดสอบการทำงานตั้งแต่ต้นจนจบ (End-to-End User Flow), การตรวจรับระบบ (Acceptance Testing) และการบันทึกประวัติการแก้ไขข้อบกพร่อง (Bug Tracking) เพื่อให้ทีมงานมั่นใจในเสถียรภาพของ Traval ก่อนส่งมอบงาน

---

## 2. สรุปผลการรันชุดทดสอบอัตโนมัติ (Automated Test Execution)

ระบบทำการรันชุดทดสอบด้วยคำสั่งมาตรฐาน `npm test` (`node --test --test-concurrency=1 tests/*.test.js`) ภายใต้ Node.js v22.14 LTS:

| ลำดับ | Test Suite | ผลลัพธ์ | ระยะเวลา (ms) | ขอบเขตการทดสอบ |
|---|---|---|---|---|
| 1 | `admin_improvements.test.js` | **PASS** | ~495ms | รีเซ็ตรหัสผ่านแอดมิน, Archive/Restore, และ Duplicate Detection |
| 2 | `discovery_auth.test.js` | **PASS** | ~442ms | รหัสผ่าน 8 ตัวอักษร, Revocation ทุกอุปกรณ์ (Logout-all) |
| 3 | `traval_prom_backend.test.js` (Auth) | **PASS** | ~451ms | Social Login (Google & Facebook) และ Phone OTP 6 หลัก |
| 4 | `backup.test.js` | **PASS** | ~168ms | สำรองและกู้คืนไฟล์ SQLite + รูปภาพอัปโหลด |
| 5 | `business.test.js` | **PASS** | ~2706ms | การอนุมัติร้าน, กรรมสิทธิ์รูปภาพ, ยื่นคำขอ และ Claim Shop |
| 6 | `community.test.js` | **PASS** | ~2151ms | การแยกสิทธิ์บัญชี, คอลเลกชัน, และการคัดกรองรีวิว |
| 7 | `readiness_e2e.test.js` | **PASS** | ~2023ms | การค้นหา Around Me, ฟิลเตอร์ราคา, และพิกัด GPS |
| 8 | `integration.test.js` | **PASS** | ~2406ms | วงจรชีวิตระบบ HTTP, Draft/Publish, และ Persistence |
| 9 | `itinerary.test.js` | **PASS** | ~1720ms | ตรวจสอบทริป, ความเป็นส่วนตัว, และตารางงบประมาณ |
| 10 | `migration.test.js` | **PASS** | ~1700ms | อัปเกรด Schema แบบ Additive โดยข้อมูลเดิมไม่สูญหาย |
| 11 | `real HTTP lifecycle & audit` | **PASS** | ~2388ms | Audit Trail ของแอดมิน และการตรวจสอบความปลอดภัย |
| 12 | `traval_prom_backend.test.js` (Core) | **PASS** | ~1890ms | SME First, Spotlight, Safety Reports, Folders, & Itinerary Alias |
| 13 | `trip_engine.test.js` (Clustering) | **PASS** | ~2.1ms | จัดกลุ่มสถานที่ใกล้เคียง ป้องกันกระโดดข้ามโซน |
| 14 | `trip_engine.test.js` (Transfers) | **PASS** | ~0.4ms | ตรวจสอบการข้ามภูมิภาค |
| 15 | `trip_engine.test.js` (Walking Mode) | **PASS** | ~0.4ms | คำนวณเวลาและระยะทางโหมดเดินเท้า |
| 16 | `trip_engine.test.js` (Capacity Cap) | **PASS** | ~1.5ms | ป้องกันสถานที่ล้นเกินโควตาต่อวัน |

**ผลสรุปรวม:** `16 passed, 0 failed, 0 skipped` (ความสำเร็จ **100%**)

---

## 3. รายการตรวจสอบการทำงานแบบ End-to-End (User Journey Checklist)

### 3.1 ฝั่งนักท่องเที่ยว (Traveler Discovery Flow)
- [x] **หน้าแรก & การค้นหา:** ค้นหาสถานที่ผ่าน Search bar แบบตอบสนองทันที
- [x] **หมวดหมู่ & ชิป SME:** กรองเฉพาะร้านค้าชุมชน SME (`isSme: 1`) และสถานที่แนะนำได้ถูกต้อง
- [x] **หมุดความปลอดภัยบนแผนที่:** แสดงหมุดเตือนภัยสีแดง 🛡️ บนแผนที่ Leaflet และคลิกดูคำแนะนำได้
- [x] **การแจ้งเหตุความปลอดภัย:** สามารถกดปุ่ม "ดึงพิกัดปัจจุบัน (GPS)" เพื่อบันทึกพิกัดอัตโนมัติลงในรายงาน

### 3.2 ฝั่งวางแผนทริป (Trip Planner Flow)
- [x] **AI Itinerary Generator:** ปรับแต่งจำนวนวัน งบประมาณ และความเร็วการเดินทาง แล้วกดคำนวณเส้นทาง
- [x] **SME Stopovers:** กดปุ่ม *"★ แนะนำร้านชุมชน SME ระหว่างทาง"* ดึงร้านค้าชุมชนระหว่างทางมาแสดงพร้อมคำนวณ Detour Km ได้จริง
- [x] **คำนวณงบประมาณ 4 หมวด:** ค่าน้ำมัน, ค่าที่พัก, ค่าอาหาร, และค่ากิจกรรม พร้อมแสดงเงินคงเหลือ
- [x] **Save Itinerary:** บันทึกแผนทริปลง SQLite ฐานข้อมูลจริง

### 3.3 ฝั่งร้านค้าชุมชน (Business Onboarding Flow)
- [x] **3-Step Wizard:** กรอกข้อมูลร้านค้า, พิกัด GPS (พร้อมปุ่มปักหมุดบนแผนที่), และแนบเอกสารยืนยันสิทธิ์
- [x] **Claim a Shop:** ค้นหาร้านค้าเดิมบนระบบและยื่นคำขออ้างสิทธิ์ความเป็นเจ้าของ
- [x] **Local Story Management:** แก้ไขเรื่องเล่าวิถีชุมชนภาษาไทย/อังกฤษ และบันทึกได้จริง

### 3.4 ฝั่งผู้ดูแลระบบ (Admin Moderation Flow)
- [x] **User Management:** ตรวจสอบรายชื่อผู้ใช้ ค้นหา และกดระงับ/ปลดล็อกบัญชีได้ทันที
- [x] **SME & Review Moderation:** อนุมัติหรือปฏิเสธคำขอเปิดร้านค้าและรีวิวสถานที่
- [x] **Campaigns CMS:** เพิ่ม ลบ และตั้งค่าแบนเนอร์กิจกรรมโปรโมต
- [x] **CSV Data Export:** คลิกดาวน์โหลดไฟล์ `.csv` สถานที่ท่องเที่ยวทั้งหมดออกมาได้ทันที

---

## 4. ตารางบันทึกการติดตามและแก้ไขข้อบกพร่อง (Bug Tracking Matrix)

| รหัสบั๊ก | ปัญหาที่ตรวจพบ (Issue) | สาเหตุรากเหง้า (Root Cause) | แนวทางแก้ไข (Resolution) | สถานะ |
|---|---|---|---|---|
| **BUG-001** | รหัสผ่านผู้ใช้ใหม่ต้องยาวถึง 12 ตัวอักษร ทำให้ผู้ใช้งานทั่วไปสมัครสมาชิกลำบาก | นโยบายเดิมบังคับ 12 ตัวอักษรเท่ากับแอดมิน | ปรับนโยบายให้ผู้ใช้ทั่วไปใช้ 8 ตัวอักษรขึ้นไป ส่วนแอดมินยังคง 12 ตัวอักษร | **RESOLVED** |
| **BUG-002** | ปุ่มบันทึกทริปใน `planner-showcase.html` ยิงไปที่ `/api/itineraries` แล้วเจอ 404 | เซิร์ฟเวอร์รองรับเฉพาะ `/api/me/itineraries` | ทำ Route Alias ใน `backend/server.js` ให้รองรับทั้ง 2 เส้นทาง | **RESOLVED** |
| **BUG-003** | ปุ่มแนะนำร้าน SME ใน Planner ไม่แสดงผลร้านค้า | ฝั่งหน้าบ้านส่ง `{ stops: [...] }` แต่หลังบ้านรอรับ `{ places: [...] }` | อัปเกรด `POST /api/trips/recommend-sme` ให้รองรับทั้ง 2 รูปแบบ และคืนค่าทั้ง `recommendations` และ `stopovers` | **RESOLVED** |
| **BUG-004** | รายงานความปลอดภัยขาดพิกัดละติจูด/ลองจิจูดสำหรับปักหมุดบนแผนที่ | ฟอร์มเดิมไม่มีฟิลด์กรอกพิกัด GPS | เพิ่มช่อง Lat/Lon และปุ่มดึง GPS อัตโนมัติใน Modal พร้อมปักหมุดโล่แดงบนแผนที่ | **RESOLVED** |
| **BUG-005** | การสมัครร้านค้า Step 2 ผู้ใช้ต้องพิมพ์พิกัดตัวเลขเอง เสี่ยงต่อความผิดพลาด | ขาดตัวช่วยเลือกตำแหน่งบนแผนที่ | เพิ่ม Interactive Mini Map Pin Picker และปุ่มดึง GPS ในแบบฟอร์ม | **RESOLVED** |

---

## 5. สรุปความพร้อมในการส่งมอบงาน (Sign-Off & Readiness)

จากการทดสอบเชิงบูรณาการและ End-to-End ครบทุกมิติ ระบบ **Traval v2.7** มีความพร้อมในการนำไปจัดแสดง (Demo) และพร้อมให้ผู้ใช้งานจริงทดสอบความพึงพอใจ โดยไม่มีข้อบกพร่องระดับวิกฤต (Critical/Blocker) คงค้างอยู่ในระบบครับ
