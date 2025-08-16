# TB Medication Reminder

เว็บแอปเตือนกินยา TB / ยาฆ่าเชื้อ  
สามารถ:
- เพิ่ม / แก้ไข / ลบยา
- บันทึกกินยา
- ดูประวัติรายวัน
- แจ้งเตือนผ่าน Push Notification

## วิธีใช้งาน
1. เปิดไฟล์ `index.html` ในเบราว์เซอร์
2. ใส่ชื่อยาและเวลา → กดเพิ่ม
3. กด ✅ / ❌ เพื่อบันทึกกินยา
4. ประวัติแสดงผลตามวัน
5. รับแจ้งเตือนผ่าน Notification

## Firebase Setup
1. สร้างโปรเจกต์ Firebase
2. เปิด Firestore และ Cloud Messaging
3. แก้ `firebaseConfig` ใน `app.js` และ `firebase-messaging-sw.js`
