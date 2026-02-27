Project Name: Project HKH (เฮือนคุ้มฮัก)
Objective: บัญชีโฮมสเตย์ที่เน้นความโปร่งใส ป้องกันการลักลอบนำเงินออก (Anti-Fraud) และจัดการการจองห้องพัก
Stack: React (Frontend), Node.js/Express (Backend), PostgreSQL (Database)

1. Database Schema (Core Requirements)
Agent ต้องออกแบบตารางอย่างน้อยดังนี้:

users: เก็บสิทธิ์ owner และ admin.

rooms: เก็บเลขห้อง, ประเภท, และสถานะ.

bookings: เชื่อมโยงลูกค้ากับห้องพัก, วันที่พัก, และยอดเงินรวม.

transactions: (สำคัญที่สุด) เก็บรายรับ/รายจ่าย, ลิงก์รูปภาพสลิป/ใบเสร็จ (S3 URL หรือ Path), ประเภท (income/expense), และสถานะ (verified/pending).

audit_logs: เก็บประวัติการ Action ทุกอย่าง (Action, UserID, Timestamp, OldValue, NewValue).

2. Business Logic & Constraints
No Hard Delete: ห้ามให้สิทธิ์ Admin ลบ Transaction หรือ Booking เด็ดขาด ให้ใช้วิธี is_cancelled หรือ is_void เท่านั้น

Audit Trail: ทุกครั้งที่มีการคีย์เงินเข้าหรือออก ต้องบันทึก created_at โดยใช้ Server Time เท่านั้น (ห้ามใช้เวลาจาก Client)

Attachment Mandatory: ใน API บันทึกการเงิน ต้องตรวจสอบ (Validation) ว่ามีไฟล์รูปภาพแนบมาด้วยเสมอ

Approval Workflow: รายการที่สถานะเป็น void หรือแก้ไขข้อมูล ต้องรอให้ owner_id เป็นคนกดยืนยัน (Approved) เท่านั้น

3. Feature Set (MVP)
Frontend (React):

หน้าปฏิทิน (Calendar View) แสดงห้องว่าง/ไม่ว่าง

ฟอร์มบันทึกการจอง พร้อมปุ่มอัปโหลดสลิป

Dashboard สรุปยอดเงินรายวันสำหรับ Owner

Backend (Node.js):

ระบบ Auth (JWT) แยก Role

API สำหรับ CRUD ข้อมูลห้องและการจอง

ระบบ Integration กับ Line Notify เพื่อแจ้งเตือนทุกครั้งที่มีรายการเงินเข้า/ออก

Database (PostgreSQL):

เน้นทำ Constraints (Check/Foreign Key) เพื่อให้ข้อมูลไม่ผิดเพี้ยน

Software Requirement Specification

1. ข้อมูลทั่วไป (Project Overview)
ชื่อโปรเจค: Project HKH (เฮือนคุ้มฮัก)

ประเภทระบบ: ระบบบริหารจัดการโฮมสเตย์และควบคุมการเงิน (Property Management System & Financial Audit)

วัตถุประสงค์หลัก: เพื่อสร้างความโปร่งใสในการบริหารจัดการรายรับ-รายจ่าย ป้องกันการทุจริต และติดตามสถานะห้องพักแบบ Real-time

2. สิทธิ์การใช้งาน (User Roles)
Owner (เจ้าของ): สิทธิ์สูงสุด ดูรายงานการเงินทั้งหมด, อนุมัติการแก้ไขข้อมูล, จัดการโครงสร้างห้องพัก

Admin (ผู้ดูแล - น้อง A): บันทึกการจอง, ยืนยันสลิปเงินโอน, บันทึกค่าใช้จ่าย, ดูตารางห้องพัก (ไม่มีสิทธิ์ลบข้อมูลการเงิน)

3. รายละเอียดฟังก์ชัน (Functional Requirements)
3.1 ระบบจัดการการจองและห้องพัก (Booking & Room Management)
Calendar View: หน้าจอแสดงสถานะห้องพักรายวัน/รายเดือน

Booking Engine: บันทึกข้อมูลลูกค้า (ชื่อ, เบอร์โทร, วันที่พัก) และคำนวณยอดเงินที่ต้องชำระอัตโนมัติ

Room Status Control: ระบบสถานะห้อง (ว่าง / จองแล้ว / เช็คอิน / รอทำความสะอาด)

3.2 ระบบควบคุมการเงินและหลักฐาน (Financial & Audit Trail)
Income Tracking: ระบบบันทึกรายรับจากการจอง (บังคับแนบรูปสลิปโอนเงิน)

Expense Tracking: ระบบบันทึกรายจ่ายจุกจิก (บังคับแนบรูปใบเสร็จ/หลักฐานการจ่าย)

Immutable Logs: บันทึกประวัติการทำรายการ (Timestamp) ว่าใครเป็นคนบันทึก และห้ามลบ (No Delete) รายการที่บันทึกไปแล้วเด็ดขาด

Adjustment Request: หากบันทึกผิดAdmin ต้องส่งคำขอแก้ไข (Request) ให้เจ้าของกดยืนยันเท่านั้น

3.3 ระบบรายงานและการแจ้งเตือน (Reports & Notifications)
Line Notify: แจ้งเตือนเข้ากลุ่ม Line ทันทีเมื่อมีการจองใหม่หรือบันทึกค่าใช้จ่าย

Daily Close Report: สรุปยอดเงินรายวันเพื่อตรวจสอบกับ Statement ธนาคาร

Monthly Profit/Loss: รายงานกำไร-ขาดทุนเบื้องต้นประจำเดือน

4. ระบบเพิ่มเติมเพื่อความโปร่งใส (Proposed Add-ons)
Digital Check-in: ระบบให้ลูกค้าอัปโหลดรูปบัตรประชาชนเอง (เพื่อยืนยันว่ามีแขกเข้าพักจริง)

Petty Cash Management: ระบบจัดการเงินสดย่อยสำหรับผู้ดูแล (ตัดยอดจากเงินสำรองที่เจ้าของให้ไว้)