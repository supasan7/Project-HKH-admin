-- ============================================
-- Add check-in/check-out tracking to bookings
-- Add cleaning tracking to rooms
-- ============================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS cleaned_by VARCHAR(100);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS cleaned_at TIMESTAMP WITH TIME ZONE;
