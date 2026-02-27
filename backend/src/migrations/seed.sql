-- ===========================================
-- 🌱 Seed Data for Supabase
-- Run this in Supabase SQL Editor AFTER running migrations
-- ===========================================

-- Users (bcrypt hashed passwords)
-- owner / liengchaisiri2508
-- admin / admin123
INSERT INTO users (username, password_hash, display_name, role) VALUES
  ('owner', '$2a$10$IcC9WuuQ0mOKJ5uiJ15LsefGTOzsM2FI55HZxR7CvO3qhCGtsYS5.', 'เจ้าของ (Owner)', 'owner'),
  ('admin', '$2a$10$Sv2lMKKPGA8Xsjv6Zp.73eztjl2W8uT4FWHztD7/vjmeW.tHma77i', 'ผู้ดูแล (Admin)', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Rooms
INSERT INTO rooms (room_number, room_type, price_per_night, description, max_guests) VALUES
  ('101', 'Standard', 800.00, 'ห้องมาตรฐาน ชั้น 1', 2),
  ('102', 'Standard', 800.00, 'ห้องมาตรฐาน ชั้น 1', 2),
  ('201', 'Deluxe', 1200.00, 'ห้องดีลักซ์ ชั้น 2 วิวสวน', 3),
  ('202', 'Deluxe', 1200.00, 'ห้องดีลักซ์ ชั้น 2 วิวภูเขา', 3),
  ('301', 'Suite', 2000.00, 'ห้องสวีท ชั้น 3 วิวพาโนรามา', 4)
ON CONFLICT (room_number) DO NOTHING;
