-- Add promo code and referral discount columns to orders table
-- These columns are needed to track promotional discounts and referral rewards on orders

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS referral_discount DECIMAL(10, 2) DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON orders(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON orders(referral_code);

-- Add comments
COMMENT ON COLUMN orders.promo_code_id IS 'Reference to promo code used for this order';
COMMENT ON COLUMN orders.discount_amount IS 'Discount amount from promo code';
COMMENT ON COLUMN orders.referral_code IS 'Referral code used by customer';
COMMENT ON COLUMN orders.referral_discount IS 'Discount amount from referral program';
