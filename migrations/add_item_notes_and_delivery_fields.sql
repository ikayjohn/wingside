-- Migration: Add notes, delivery_date, and delivery_time to order_items table
-- Date: 2026-02-14
-- Description: Add item-level notes and delivery scheduling fields for special orders (e.g., Valentine's Day)

-- Add columns to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN order_items.notes IS 'Item-specific notes (e.g., handwritten card message for Valentine orders)';
COMMENT ON COLUMN order_items.delivery_date IS 'Item-specific delivery date (e.g., Valentine''s Day: 2026-02-14)';
COMMENT ON COLUMN order_items.delivery_time IS 'Item-specific delivery time slot (e.g., "2PM - 4PM")';
