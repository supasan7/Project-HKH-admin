# 🚀 Deployment Guide — Vercel + Supabase

## สถาปัตยกรรม

```
Frontend (Vercel)  →  Backend (Vercel Serverless)  →  Supabase (PostgreSQL)
```

---

## 1. Supabase (Database)

### ขั้นตอน
1. สร้าง account ที่ [supabase.com](https://supabase.com)
2. สร้าง Project ใหม่ → เลือก region ใกล้ที่สุด (Singapore)
3. ไปที่ **Settings > Database > Connection string > URI**
4. คัดลอก connection string (จะเป็นรูปแบบ):
   ```
   postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

### สร้าง Tables
1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. Run ไฟล์ migration ตามลำดับ:
   - `backend/src/migrations/001_initial_schema.sql`
   - `backend/src/migrations/002_add_checkin_checkout.sql`
3. Run seed data: `backend/src/migrations/seed.js` (หรือ run SQL จาก seed file)

---

## 2. Backend → Vercel

### ขั้นตอน
1. Push code ขึ้น GitHub (ถ้ายังไม่ได้ push)
2. ไปที่ [vercel.com](https://vercel.com) → **Add New Project**
3. Import repository → เลือก **Root Directory** เป็น `backend`
4. ตั้ง **Framework Preset** เป็น `Other`
5. ไม่ต้องเปลี่ยน Build Command (Vercel จะใช้ `vercel.json`)

### Environment Variables (Backend)
ตั้งค่าใน Vercel Dashboard → **Settings > Environment Variables**:

| Variable | ค่า | หมายเหตุ |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres...` | จาก Supabase |
| `JWT_SECRET` | สร้างเอง (ยาวๆ) | เช่น ใช้ `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` | |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | สำหรับ CORS |
| `NODE_ENV` | `production` | |
| `LINE_CHANNEL_ACCESS_TOKEN` | (ถ้าใช้) | Optional |
| `LINE_TARGET_ID` | (ถ้าใช้) | Optional |

### ⚠️ ข้อจำกัดของ Vercel Serverless
- **ไม่มี persistent filesystem** → ไฟล์ที่ upload จะหายหลัง deploy ใหม่
- **แนะนำ**: ใช้ Supabase Storage สำหรับเก็บไฟล์ slip/รูปภาพในอนาคต
- ขณะนี้ไฟล์ uploads จะทำงานได้ชั่วคราวเท่านั้น

---

## 3. Frontend → Vercel

### ขั้นตอน
1. ไปที่ Vercel → **Add New Project** (project ใหม่)
2. Import repository เดียวกัน → เลือก **Root Directory** เป็น `frontend`
3. ตั้ง **Framework Preset** เป็น `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Environment Variables (Frontend)
| Variable | ค่า | หมายเหตุ |
|---|---|---|
| `VITE_API_URL` | `https://your-backend.vercel.app/api` | URL ของ backend ที่ deploy แล้ว |

---

## 4. ตรวจสอบหลัง Deploy

1. เปิด Frontend URL → ควรเห็นหน้า Login
2. ล็อกอินด้วย user ที่ seed ไว้
3. ทดสอบทุกฟีเจอร์: ห้องพัก, การจอง, การเงิน, ปฏิทิน, รายงาน

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|---|---|
| `backend/vercel.json` | Serverless routing สำหรับ Express |
| `backend/src/config/database.js` | รองรับ DATABASE_URL (Supabase) |
| `backend/.env.example` | ตัวอย่าง env สำหรับ backend |
| `frontend/vercel.json` | SPA routing (rewrite ไป index.html) |
| `frontend/src/config/api.js` | ใช้ VITE_API_URL สำหรับ production |
| `frontend/.env.example` | ตัวอย่าง env สำหรับ frontend |
