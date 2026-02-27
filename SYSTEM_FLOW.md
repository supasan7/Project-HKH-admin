# 📘 คู่มือการใช้งานระบบ Project HKH (เฮือนคุ้มฮัก)

## สารบัญ
1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [สถาปัตยกรรม](#2-สถาปัตยกรรม)
3. [ผู้ใช้งานและสิทธิ์](#3-ผู้ใช้งานและสิทธิ์)
4. [Flow การทำงาน](#4-flow-การทำงาน)
5. [API Endpoints](#5-api-endpoints)
6. [วิธีรันระบบ](#6-วิธีรันระบบ)

---

## 1. ภาพรวมระบบ

Project HKH เป็นระบบบริหารจัดการโฮมสเตย์ที่เน้น **ความโปร่งใส** และ **ป้องกันการทุจริต (Anti-Fraud)** ประกอบด้วย 3 ส่วนหลัก:

| ส่วน | เทคโนโลยี | หน้าที่ |
|------|-----------|--------|
| Frontend | React + Vite | หน้าจอผู้ใช้งาน |
| Backend | Node.js + Express | API และ Business Logic |
| Database | PostgreSQL 16 | เก็บข้อมูลทั้งหมด |

---

## 2. สถาปัตยกรรม

### Backend Layered Architecture

```
Request → Routes → Controllers → Services → Repositories → PostgreSQL
              ↓          ↓            ↓
          Middleware   Validation   Audit Log
         (JWT Auth)    (Joi)      (ทุก Action)
```

| Layer | หน้าที่ | ตัวอย่างไฟล์ |
|-------|--------|-------------|
| Routes | กำหนด URL + HTTP Method | `routes/bookingRoutes.js` |
| Middleware | ตรวจสอบ JWT, Role, Validation | `middleware/auth.js` |
| Controllers | รับ Request → ส่งต่อ Service | `controllers/bookingController.js` |
| Services | **Business Logic ทั้งหมดอยู่ที่นี่** | `services/bookingService.js` |
| Repositories | SQL Query ติดต่อ Database | `repositories/bookingRepository.js` |

### Frontend Architecture

```
Browser → Pages → Components → API Services → Axios → Backend API
                      ↓
                 AuthContext (JWT Token)
```

---

## 3. ผู้ใช้งานและสิทธิ์

### 👑 Owner (เจ้าของ) — `owner / owner123`

| สิ่งที่ทำได้ | รายละเอียด |
|-------------|-----------|
| ดู Dashboard | สรุปยอดรายวัน อัตราเข้าพัก |
| จัดการห้องพัก | เพิ่ม/แก้ไข/ลบห้อง |
| จัดการการจอง | สร้าง/ยกเลิกการจอง |
| บันทึกการเงิน | รายรับ/รายจ่าย + แนบสลิป |
| **ยืนยันรายการเงิน** | กดยืนยัน (Verify) รายการที่ Admin บันทึก |
| **อนุมัติ/ปฏิเสธคำขอ** | อนุมัติการ Void หรือแก้ไขรายการ |
| ดู Audit Logs | ดูประวัติการใช้งานทุกคน |
| ดูรายงาน | รายวัน + รายเดือน |

### 🛡️ Admin (ผู้ดูแล) — `admin / admin123`

| สิ่งที่ทำได้ | สิ่งที่ทำ **ไม่ได้** |
|-------------|---------------------|
| จองห้องพัก | ❌ ลบรายการเงิน |
| บันทึกรายรับ/รายจ่าย | ❌ ยืนยัน (Verify) รายการเงิน |
| ส่งคำขอยกเลิก (Void Request) | ❌ อนุมัติคำขอด้วยตัวเอง |
| ดู Calendar / ห้องพัก | ❌ ดู Audit Logs |

---

## 4. Flow การทำงาน

### 4.1 🔑 Flow การเข้าสู่ระบบ (Login)

```
1. ผู้ใช้กรอก username + password ที่หน้า Login
2. Frontend ส่ง POST /api/auth/login
3. Backend ตรวจสอบ username ใน DB
4. เปรียบเทียบ password กับ hash (bcrypt)
5. สร้าง JWT Token (มี id, role, displayName)
6. บันทึก Audit Log: LOGIN
7. ส่ง Token กลับ → Frontend เก็บใน localStorage
8. Redirect ไปหน้า Dashboard
```

> **หมายเหตุ:** ทุก Request หลังจาก Login จะส่ง JWT Token ใน Header `Authorization: Bearer <token>` โดยอัตโนมัติ หาก Token หมดอายุ (7 วัน) จะถูก Redirect กลับหน้า Login

---

### 4.2 🏠 Flow การจัดการห้องพัก (Room Management)

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  เพิ่มห้อง    │ →  │ กรอกข้อมูล    │ →  │ บันทึกลง DB │
│  POST /rooms │     │ เลขห้อง, ราคา │     │ + Audit Log│
└─────────────┘     └──────────────┘     └────────────┘
```

**สถานะห้องพัก (Room Status):**

```
available (ว่าง)
    ↓ สร้างการจอง
booked (จองแล้ว)
    ↓ แขกมาถึง
checked_in (เข้าพัก)
    ↓ แขกออก
cleaning (ทำความสะอาด)
    ↓ ทำเสร็จ
available (ว่าง)
```

- การเปลี่ยนสถานะห้องเป็นแบบ **Manual** ผ่านหน้า Rooms (Dropdown)
- เมื่อสร้างการจอง → ห้องจะเปลี่ยนเป็น `booked` **อัตโนมัติ**
- เมื่อยกเลิกการจอง → ห้องจะกลับเป็น `available` **อัตโนมัติ**

---

### 4.3 📝 Flow การจองห้องพัก (Booking)

```
                        ┌──────────────────────┐
                        │   กดปุ่ม "+ จองห้อง"    │
                        └──────────┬───────────┘
                                   ▼
                        ┌──────────────────────┐
                        │ เลือกห้อง (แสดงเฉพาะ  │
                        │ ห้องที่สถานะ = ว่าง)    │
                        └──────────┬───────────┘
                                   ▼
                        ┌──────────────────────┐
                        │ กรอก: ชื่อแขก, เบอร์โทร│
                        │ วันเช็คอิน, วันเช็คเอาท์ │
                        └──────────┬───────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ Backend ตรวจสอบ:              │
                    │ 1. ห้องมีอยู่จริง? Active?      │
                    │ 2. วันที่ซ้อนทับกับจองอื่นไหม?  │
                    │ 3. คำนวณ: จำนวนคืน × ราคา/คืน  │
                    └──────────────┬────────────────┘
                          ✅ ผ่าน  │  ❌ ไม่ผ่าน → แจ้ง Error
                                   ▼
                    ┌──────────────────────────────┐
                    │ 1. บันทึก Booking ลง DB       │
                    │ 2. เปลี่ยนสถานะห้อง → booked  │
                    │ 3. บันทึก Audit Log            │
                    │ 4. Line Notify แจ้งเตือน 📱    │
                    └──────────────────────────────┘
```

**การยกเลิกการจอง:**
- กดปุ่ม "ยกเลิก" → ระบบ **ไม่ได้ลบ** แต่ตั้ง `is_cancelled = true` (Soft Cancel)
- ห้องกลับเป็น `available` อัตโนมัติ
- บันทึก Audit Log

---

### 4.4 💰 Flow การบันทึกรายรับ/รายจ่าย (Transaction) — **สำคัญที่สุด**

```
┌──────────────────────────────────────────────────────────────┐
│                    บันทึกรายการเงิน                            │
│                                                              │
│  1. เลือกประเภท: 💰 รายรับ / 💸 รายจ่าย                       │
│  2. กรอก: หมวดหมู่, จำนวนเงิน, รายละเอียด                     │
│  3. แนบสลิป/ใบเสร็จ 📎 *** บังคับ (Mandatory) ***             │
│                                                              │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
              ┌─────────────────────┐
              │  สถานะ: 🟡 Pending  │ (รอยืนยัน)
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────────────┐
              │ Owner กด ✓ ยืนยัน (Verify)   │
              │ (Admin ทำไม่ได้)              │
              └──────────┬──────────────────┘
                         ▼
              ┌─────────────────────┐
              │  สถานะ: 🟢 Verified │ (ยืนยันแล้ว)
              └─────────────────────┘
```

> **กฎเหล็ก:**
> - ❌ ไม่มีปุ่ม "ลบ" รายการเงิน (No Hard Delete)
> - ❌ Admin ไม่สามารถยืนยันรายการด้วยตัวเอง
> - ✅ `created_at` ใช้เวลา Server เท่านั้น (`NOW()`)
> - ✅ ทุกรายการมี Audit Log

---

### 4.5 📋 Flow การขอยกเลิกรายการ (Void Request) — Anti-Fraud

เมื่อ Admin บันทึกรายการผิด **ไม่สามารถลบได้** ต้องส่งคำขอให้ Owner อนุมัติ:

```
   Admin                           Owner
     │                                │
     │  ส่งคำขอ Void                   │
     │  (ระบุเหตุผล)                    │
     │ ──────────────────────────────▶ │
     │                                │
     │                   สถานะ: 🟡 Pending
     │                                │
     │         ┌─────────────────┐    │
     │         │ Owner ตรวจสอบ    │    │
     │         │ เหตุผล + หลักฐาน │    │
     │         └───────┬─────────┘    │
     │                 │              │
     │          ┌──────┴──────┐       │
     │          ▼             ▼       │
     │    ✅ อนุมัติ      ❌ ปฏิเสธ    │
     │          │             │       │
     │    รายการถูก Void   คำขอถูก    │
     │    (is_voided=true) ปฏิเสธ     │
     │          │             │       │
     │    Audit Log      Audit Log    │
     │                                │
```

> **ทำไมต้องมี Flow นี้?**
> ป้องกันกรณี Admin ลักลอบบันทึกรายจ่ายปลอม แล้วพยายามลบทิ้ง — ระบบนี้ทำให้ **ทุกรายการมีร่องรอยเสมอ** (Immutable Audit Trail)

---

### 4.6 📅 Flow ปฏิทิน (Calendar View)

```
┌──────────────────────────────────────────────┐
│           ปฏิทิน — กุมภาพันธ์ 2026            │
│  ◀ เดือนก่อน              เดือนถัดไป ▶        │
├──────┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬─────┤
│ ห้อง │1 │2 │3 │4 │5 │6 │7 │8 │9 │..│28│     │
├──────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼─────┤
│ 101  │  │  │● │● │● │  │  │  │  │  │  │     │
│ 102  │  │  │  │  │  │  │● │● │  │  │  │     │
│ 201  │  │  │  │  │  │  │  │  │  │  │  │     │
└──────┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴─────┘
         ● = มีการจอง (hover ดูชื่อแขก)
```

- แสดงแบบ **ห้อง × วัน** (Grid)
- ดึงข้อมูลจาก Booking ที่อยู่ในช่วงเดือนนั้น
- Hover เพื่อดูชื่อแขกที่จอง

---

### 4.7 📈 Flow รายงาน (Reports)

#### Daily Close Report (สรุปรายวัน)
```
เลือกวันที่ → แสดง:
├── 💰 รายรับรวม
├── 💸 รายจ่ายรวม
├── 📊 ยอดสุทธิ (รายรับ - รายจ่าย)
└── 🏠 อัตราเข้าพัก (%)
```

#### Monthly Profit/Loss (กำไรขาดทุนเดือน)
```
เลือกปี + เดือน → แสดง:
├── ยอดรวม (รายรับ / รายจ่าย / กำไรสุทธิ)
└── ตารางรายวัน (รายรับ-รายจ่ายแต่ละวัน)
```

---

### 4.8 🔍 Flow Audit Log (ประวัติการใช้งาน)

ทุก Action ในระบบถูกบันทึกเป็น **Immutable Log** (ลบไม่ได้):

| Action | ตัวอย่าง |
|--------|---------|
| `LOGIN` | ผู้ใช้เข้าสู่ระบบ |
| `CREATE_BOOKING` | สร้างการจอง |
| `CANCEL_BOOKING` | ยกเลิกการจอง |
| `CREATE_TRANSACTION` | บันทึกรายการเงิน |
| `VERIFY_TRANSACTION` | Owner ยืนยันรายการ |
| `REQUEST_VOID` | ส่งคำขอยกเลิก |
| `APPROVE_ADJUSTMENT` | Owner อนุมัติคำขอ |
| `REJECT_ADJUSTMENT` | Owner ปฏิเสธคำขอ |
| `CREATE_ROOM` | เพิ่มห้องพัก |
| `UPDATE_ROOM` | แก้ไขห้องพัก |
| `DELETE_ROOM` | ลบห้องพัก (Soft Delete) |

ข้อมูลที่บันทึก: **ผู้ทำ, เวลา, IP Address, ค่าเก่า, ค่าใหม่**

---

### 4.9 📱 Flow Line Notify (การแจ้งเตือน)

```
เหตุการณ์                     ข้อความที่ส่ง
─────────────────────────────────────────────
สร้างการจองใหม่         →    🏠 การจองใหม่!
                              ห้อง: 101 (Standard)
                              ชื่อแขก: สมชาย
                              ยอดรวม: ฿2,400.00

บันทึกรายรับ/รายจ่าย    →    💰 รายรับ / 💸 รายจ่าย
                              หมวดหมู่: ค่าห้องพัก
                              จำนวน: ฿800.00
```

> ตั้งค่า Line Notify Token ในไฟล์ `.env` → `LINE_NOTIFY_TOKEN=your_token`

---

## 5. API Endpoints

### 🔓 Public (ไม่ต้อง Login)
| Method | URL | คำอธิบาย |
|--------|-----|---------|
| `POST` | `/api/auth/login` | เข้าสู่ระบบ |
| `GET` | `/api/health` | Health Check |

### 🔒 Protected (ต้อง Login — JWT)
| Method | URL | สิทธิ์ | คำอธิบาย |
|--------|-----|-------|---------|
| **ห้องพัก** ||||
| `GET` | `/api/rooms` | ทุกคน | ดูห้องทั้งหมด |
| `POST` | `/api/rooms` | Owner, Admin | เพิ่มห้อง |
| `PUT` | `/api/rooms/:id` | Owner, Admin | แก้ไขห้อง |
| `PATCH` | `/api/rooms/:id/status` | Owner, Admin | เปลี่ยนสถานะ |
| `DELETE` | `/api/rooms/:id` | **Owner เท่านั้น** | ลบห้อง (Soft) |
| **การจอง** ||||
| `GET` | `/api/bookings` | ทุกคน | ดูการจอง |
| `GET` | `/api/bookings/calendar` | ทุกคน | ข้อมูลปฏิทิน |
| `POST` | `/api/bookings` | Owner, Admin | สร้างการจอง |
| `PATCH` | `/api/bookings/:id/cancel` | Owner, Admin | ยกเลิกการจอง |
| **การเงิน** ||||
| `GET` | `/api/transactions` | ทุกคน | ดูรายการเงิน |
| `POST` | `/api/transactions` | Owner, Admin | บันทึก + แนบสลิป |
| `PATCH` | `/api/transactions/:id/verify` | **Owner เท่านั้น** | ยืนยันรายการ |
| `POST` | `/api/transactions/:id/void` | Owner, Admin | ส่งคำขอ Void |
| **คำขอแก้ไข** ||||
| `GET` | `/api/transactions/adjustments/list` | ทุกคน | ดูคำขอทั้งหมด |
| `PATCH` | `/api/transactions/adjustments/:id/approve` | **Owner เท่านั้น** | อนุมัติ |
| `PATCH` | `/api/transactions/adjustments/:id/reject` | **Owner เท่านั้น** | ปฏิเสธ |
| **รายงาน** ||||
| `GET` | `/api/reports/daily` | ทุกคน | สรุปรายวัน |
| `GET` | `/api/reports/monthly` | ทุกคน | สรุปรายเดือน |
| `GET` | `/api/reports/audit-logs` | **Owner เท่านั้น** | Audit Logs |

---

## 6. วิธีรันระบบ

### ขั้นตอนแรก (ครั้งเดียว)
```bash
# 1. เปิด Docker Desktop

# 2. เริ่ม Database
cd backend && docker compose up -d

# 3. ติดตั้ง Dependencies
cd backend && npm install
cd frontend && npm install

# 4. สร้างตาราง + ข้อมูลทดสอบ
cd backend && npm run migrate && npm run seed
```

### รันทุกวัน
```bash
# Terminal 1: Backend (port 3000)
cd backend && npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend && npm run dev
```

### เปิดใช้งาน
| URL | รายละเอียด |
|-----|-----------|
| http://localhost:5173 | หน้าเว็บ (Frontend) |
| http://localhost:3000/api/health | Backend Health Check |
| http://localhost:5050 | pgAdmin (DB Management) |

### บัญชีทดสอบ
| ชื่อผู้ใช้ | รหัสผ่าน | สิทธิ์ |
|-----------|---------|-------|
| `owner` | `owner123` | 👑 เจ้าของ (สิทธิ์สูงสุด) |
| `admin` | `admin123` | 🛡️ ผู้ดูแล |

### pgAdmin Login
| Email | Password |
|-------|----------|
| `admin@hkh.com` | `admin1234` |
