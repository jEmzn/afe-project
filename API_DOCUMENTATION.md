# API Documentation

เอกสารนี้อธิบายการทำงานของ API Endpoints หลักในระบบ โดยเน้นที่ Logic การทำงานและเหตุผลเบื้องหลัง (Context) เพื่อให้ทีมพัฒนาเข้าใจภาพรวมและสามารถแก้ไขหรือต่อยอดได้ง่าย

---

## 1. Location Tracking & Safezone (`/api/sentlocation`)

### คำอธิบาย
รับค่าพิกัด GPS จากอุปกรณ์และตรวจสอบว่าผู้ใช้อยู่ในเขตปลอดภัย (Safezone) หรือไม่ เพื่อแจ้งเตือนผู้ดูแลหากมีความเสี่ยง

### Logic Flow (ทำไมถึงทำแบบนี้?)
เราแบ่ง Safezone ออกเป็น 2 ชั้น (Radius 1 และ Radius 2) เพื่อให้มีการแจ้งเตือนแบบ "เตือนล่วงหน้า" (Warning) ก่อนที่จะเกิดเหตุร้ายจริง (Danger)
1. **Input Validation**: ตรวจสอบค่า `latitude`, `longitude`, `distance` เพื่อป้องกันข้อมูลขยะ
2. **Threshold Calculation**: คำนวณระยะแจ้งเตือนที่ 80% ของ Radius 2 (`safezoneThreshold`) เพื่อให้ผู้ดูแลมีเวลาเตรียมตัวก่อนผู้สูงอายุจะออกนอกเขตจริง
3. **Status Determination**:
   - **Status 0 (Normal)**: อยู่ใน Radius 1 (ปลอดภัย)
   - **Status 1 (Warning)**: ออกจาก Radius 1 แต่อยู่ในเขตเฝ้าระวัง -> *แจ้งเตือน: "ออกนอกเขตปลอดภัย ชั้นที่ 1 แล้ว"*
   - **Status 3 (Near Boundary)**: เกิน 80% ของ Radius 2 (ใกล้หลุด) -> *แจ้งเตือน: "เข้าใกล้เขตปลอดภัย ชั้นที่ 2 แล้ว"*
   - **Status 2 (Danger)**: หลุด Radius 2 -> *แจ้งเตือน: "ออกนอกเขตปลอดภัย ชั้นที่ 2 แล้ว"*
4. **Notification**: ส่ง LINE Message ตามสถานะที่คำนวณได้

### ตัวอย่าง Request
```json
POST /api/sentlocation
{
  "uId": 1,
  "takecare_id": 1,
  "latitude": 13.7563,
  "longitude": 100.5018,
  "distance": 500,
  "battery": 80
}
```

---

## 2. Heart Rate Monitoring (`/api/sentHeartRate`)

### คำอธิบาย
ตรวจสอบอัตราการเต้นของหัวใจ (BPM) และแจ้งเตือนเมื่อค่าสูงผิดปกติ

### Logic Flow
1. **Threshold Check**: เปรียบเทียบค่า BPM กับ `max_bpm` ที่ตั้งไว้เฉพาะบุคคล
2. **Debouncing (สำคัญ)**: เพื่อไม่ให้แจ้งเตือนรัวเกินไปจนผู้ดูแลรำคาญ (Spamming) ระบบจะเช็คว่า:
   - ต้องเป็นค่าผิดปกติ (Status 1) **และ**
   - ไม่มีการแจ้งเตือนในช่วง 5 นาทีที่ผ่านมา
   จึงจะส่งข้อความ LINE: *"ชีพจรเกินค่าที่กำหนด: [bpm] bpm"*

---

## 3. Fall Detection (`/api/sentFall`)

### คำอธิบาย
รับสัญญาณแจ้งเหตุการล้มจากอุปกรณ์ ซึ่งอาจเกิดจาก Sensor ตรวจจับได้เอง หรือผู้ใช้กดปุ่ม SOS

### Logic Flow
- **Status 2 (Manual SOS)**: ผู้ใช้กดปุ่ม "ไม่โอเค" -> แจ้งเตือนทันทีว่าขอความช่วยเหลือ
- **Status 3 (Auto Detect)**: Sensor จับการล้มได้และไม่มีการตอบสนอง 30 วินาที -> แจ้งเตือนว่า "ไม่มีการตอบสนอง"
- **Location Map**: เมื่อแจ้งเตือนการล้ม ระบบจะส่ง **Flex Message แผนที่** ตามไปทันทีเพื่อให้ผู้ดูแลทราบจุดเกิดเหตุแม่นยำที่สุด

### ตัวอย่าง Request
```json
POST /api/sentFall
{
  "users_id": 1,
  "takecare_id": 1,
  "fall_status": 3,
  "latitude": 13.7563,
  "longitude": 100.5018,
  "x_axis": 0.1,
  "y_axis": 9.8,
  "z_axis": 0.5
}
```
