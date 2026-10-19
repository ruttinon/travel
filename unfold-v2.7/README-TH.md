# unfold v2.7 — Functional Readiness / ระบบหลังบ้านให้ใช้งานได้จริงก่อนเปิดทดสอบ

คนที่รับงานต่อให้อ่าน `docs/00-อ่านก่อน.md` ก่อน ไฟล์นั้นบอกว่าโค้ดอยู่โฟลเดอร์ไหน และข้อไหนใน `Traval_Requirements_Business_Updated.txt` ทำแล้วหรือยัง

หน้าเว็บยังเปิดที่ URL เดิม (`/`, `/admin.html`, `/business.html`) แม้ไฟล์จะย้ายไปอยู่ใต้ `apps/` แล้ว

**สถานะ:** โปรแกรมเว็บแบบ Local ใช้ Node.js + SQLite จริง แต่ **ยังไม่ใช่ Production** และยังไม่ใช่แอป APK/IPA. รอบนี้เน้นการตรวจและทำระบบที่มีอยู่ให้ใช้จริงขึ้น ไม่เพิ่มภาพจำลองหรือยอดธุรกิจปลอม

## ของที่ใช้งานได้ใน Local

- นักท่องเที่ยว: Explore/Search/Map, สมัครบัญชี, Saved/My Trip, รีวิว (ผ่านการตรวจ) และ Trip Planner เก็บในฐานข้อมูล
- Admin: เพิ่ม แก้ไข ลบสถานที่ อัปโหลดภาพ รีวิว และอนุมัติธุรกิจ/คำขอของร้าน
- Owner ใน Business Portal: ลงทะเบียนธุรกิจ ขอรับสิทธิ์สถานที่ ส่งข้อมูลหรือขอแก้ไขโดยผ่าน Admin
- v2.7: **Activity Log** ใน Admin (`/audit.html`), ภาพ Draft จำกัดสิทธิ์, ตรวจฐานข้อมูลด้วย `doctor.js`, สำรองพร้อม SHA-256, **Restore แบบตรวจสอบก่อนและถามยืนยัน**, ป้องกันเปิดเซิร์ฟเวอร์ซ้ำกับฐานข้อมูลเดียวกัน
- เชื่อมขั้นตอนจริง **Admin → Published Place → Traveler Review → Admin Moderation → Saved/Trip → Owner Claim → Admin Approval** ผ่าน HTTP จริงในชุดทดสอบอัตโนมัติ

## เริ่มใช้งานบน Windows

1. ติดตั้ง Node.js 24 LTS จาก https://nodejs.org (ขั้นต่ำ 22.16)
2. **หยุดเซิร์ฟเวอร์ unfold รุ่นเดิมก่อน** แล้วสำรองข้อมูลด้วย `BACKUP-WINDOWS.cmd` ของรุ่นเก่า
3. แตก ZIP รุ่นใหม่ในโฟลเดอร์ใหม่ ไม่แตกทับรุ่นเก่า
4. ดับเบิลคลิก `START-WINDOWS.cmd` (รัน Node.js Local Server) ห้ามเปิด `index.html` ตรง ๆ ผ่าน `file://`
5. เปิด `http://127.0.0.1:5173/` หรือพอร์ตที่แสดงในหน้าต่างคำสั่ง

URL หลัก:

| ระบบ | URL |
|---|---|
| Traveler | `/` |
| Admin Dashboard / Place Studio | `/admin.html` |
| Business Portal / Owner | `/business.html` |
| Business approvals | `/business-admin.html` |
| Review moderation | `/moderation.html` |
| Admin Activity log (ใหม่) | `/audit.html` |
| Trip Planner | `/planner.html` |

**ครั้งแรก**: Admin ต้องใช้ Setup Code ที่แสดงบนเซิร์ฟเวอร์เพื่อกำหนดรหัสผ่านใหม่เอง (ไม่มีรหัสผ่านเริ่มต้นใน ZIP)

## ฐานข้อมูลและความปลอดภัย

- Windows ใช้ `%LOCALAPPDATA%\unfold-travel\data\unfold.sqlite` และโฟลเดอร์รูป ไม่รวมอยู่ใน ZIP
- Migration v2.7 เป็นการ **เพิ่มตาราง `audit_events`**; ไม่มีคำสั่งลบข้อมูลเดิมในขั้นตอนเริ่มเซิร์ฟเวอร์
- Audit Log แสดงเหตุการณ์ใหม่หลังอัปเกรด ไม่สามารถย้อนสร้างประวัติก่อน v2.7 ได้
- รูป Draft ไม่แสดงกับผู้ใช้ทั่วไป; Admin ดูผ่าน `/api/admin/place-media/...`; เจ้าของธุรกิจดูรูปที่ตนอัปโหลดได้ตามสิทธิ์
- PWA ไม่แคชรูปรีวิว `/review-media/` ซึ่งอาจเป็นรูปส่วนตัว
- เซิร์ฟเวอร์ผูก `127.0.0.1` เท่านั้น ห้ามเปิด Port ไปยังอินเทอร์เน็ตโดยตรง
- ระบบเจ้าของปัจจุบันยัง **หนึ่งบัญชีต่อหนึ่งธุรกิจ** และยังไม่มี Owner/Manager/Staff แบบหลายคน

## การทดสอบก่อนใช้ข้อมูลจริง

เปิด CMD ภายในโปรเจกต์แล้วรัน

```bat
npm test
npm run doctor
```

หรือดับเบิลคลิก `CHECK-WINDOWS.cmd` เพื่อตรวจฐานข้อมูลและรูปที่อ้างอิงว่ามีอยู่จริง ไม่แก้ไขข้อมูล

### การสำรอง

ดับเบิลคลิก `BACKUP-WINDOWS.cmd` หรือ `node backup.js` — ได้โฟลเดอร์ Backup รวมฐานข้อมูล ภาพ และ `manifest.json` พร้อม SHA-256 รายไฟล์ ตรวจสอบ hash ซ้ำเมื่อสำรองเสร็จ

### การกู้คืน

1. **ปิด `START-WINDOWS.cmd` ให้หมดก่อน** ห้าม Restore ขณะเซิร์ฟเวอร์กำลังทำงาน
2. ดับเบิลคลิก `RESTORE-WINDOWS.cmd`, ใส่ที่อยู่โฟลเดอร์ Backup รุ่น v2.7, ตรวจผล **DRY RUN**
3. พิมพ์ `RESTORE` เพื่อยืนยันจริง; ระบบสร้าง Safety Backup ของข้อมูลก่อนกู้คืนไว้ใน `backups/` อีกชุด
4. กู้คืนจะตรวจ hash / ไฟล์ / SQLite integrity / Foreign Keys อีกครั้ง และใช้การย้ายโฟลเดอร์แบบมี Rollback เมื่อเกิดข้อผิดพลาด
5. หลัง Restore เปิดเซิร์ฟเวอร์แล้วรัน `CHECK-WINDOWS.cmd` ยืนยันอีกครั้ง

ใช้ CLI ได้:

```bat
node restore.js "C:\path\to\backup-folder"
node restore.js "C:\path\to\backup-folder" --apply
```

**สำคัญ:** Restore นี้รับ Backup รูปแบบใหม่ที่มี `manifest.json` เท่านั้น หากเป็น Backup ของ v2.6 หรือก่อนหน้า ต้องใช้กระบวนการตรวจและนำเข้าข้อมูลแบบ Legacy แยกต่างหาก ห้ามตั้งชื่อไฟล์ Manifest เองเพื่อข้ามการตรวจ

## งานที่ยังไม่ถือว่าเสร็จสำหรับใช้งานภายนอกจริง

- ระบบจดหมายจริง: ต้องตั้งค่า Resend API / ผู้ส่ง / `UNFOLD_PUBLIC_URL` และทดสอบการส่งถึง Inbox; หากยังไม่ตั้งค่า ระบบพัฒนาจะแสดงลิงก์ครั้งเดียวบนเซิร์ฟเวอร์
- Multi-business, Owner/Manager/Staff RBAC, การลบบัญชีและส่งออกข้อมูลส่วนบุคคล, MFA, Monitoring Production
- GPS จริงบนโทรศัพท์, ETA ตามถนน/สภาพจราจรจริง, เวลาเปิดของสถานที่, เปิดใช้งานข้ามเครือข่ายและ HTTPS
- ระบบจอง, จ่ายเงิน, สถิติรายได้, Google/Apple Login และแอป native
- UI ผ่าน Chromium ด้วยข้อมูลทดสอบในรุ่นก่อน แต่ **Chromium → localhost ตรงถูกบล็อกโดยนโยบายเครื่องพัฒนา**; ไม่อ้างว่า Windows E2E ผ่านแล้ว

อ่าน `TEST-RESULTS.md` และ `FUNCTIONAL-READINESS.md` สำหรับผลทดสอบและลำดับงานที่เหลือ
