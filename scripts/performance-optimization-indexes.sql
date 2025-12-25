-- Performance Optimization: Database Indexes for Wingside
-- This script adds strategic indexes to improve query performance

-- =====================================================
-- ORDERS TABLE INDEXES
-- =====================================================

-- Index for order tracking by user
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Index for order status filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Index for order number lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Composite index for user order history with sorting
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Composite index for admin dashboard filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Index for payment status queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Composite index for date range queries (analytics)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =====================================================
-- ORDER ITEMS TABLE INDEXES
-- =====================================================

-- Index for joining orders with items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Index for product analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- PRODUCTS TABLE INDEXES
-- =====================================================

-- Index for category filtering (common query)
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);

-- Index for active products listing
CREATE INDEX IF NOT EXISTS idx_products_is_active_created ON products(is_active, created_at DESC);

-- Index for subcategory filtering
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);

-- =====================================================
-- FLAVORS TABLE INDEXES
-- =====================================================

-- Index for category filtering (homepage uses this)
CREATE INDEX IF NOT EXISTS idx_flavors_category_active ON flavors(category, is_active);

-- Index for homepage visibility
CREATE INDEX IF NOT EXISTS idx_flavors_show_homepage ON flavors(show_on_homepage) WHERE show_on_homepage = true;

-- Index for product availability
CREATE INDEX IF NOT EXISTS idx_flavors_available_products ON flavors(available_for_products) WHERE available_for_products = true;

-- Composite index for display order
CREATE INDEX IF NOT EXISTS idx_flavors_category_order ON flavors(category, display_order);

-- =====================================================
-- PRODUCT FLAVORS (JUNCTION TABLE) INDEXES
-- =====================================================

-- Index for product -> flavors lookup
CREATE INDEX IF NOT EXISTS idx_product_flavors_product_id ON product_flavors(product_id);

-- Index for flavor -> products lookup (analytics)
CREATE INDEX IF NOT EXISTS idx_product_flavors_flavor_id ON product_flavors(flavor_id);

-- =====================================================
-- PROFILES (USERS) TABLE INDEXES
-- =====================================================

-- Index for referral code lookups (used during signup)
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Index for role-based queries (admin/staff)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role IN ('admin', 'staff');

-- Index for referral tracking
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by) WHERE referred_by IS NOT NULL;

-- =====================================================
-- REWARDS TABLE INDEXES
-- =====================================================

-- Index for user reward lookups
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);

-- Index for reward type filtering
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);

-- Composite index for user rewards with sorting
CREATE INDEX IF NOT EXISTS idx_rewards_user_created ON rewards(user_id, created_at DESC);

-- =====================================================
-- REFERRALS TABLE INDEXES
-- =====================================================

-- Index for referrer lookup
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- Index for referred user lookup
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);

-- Index for status tracking (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Composite index for referrer with status
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_id, status);

-- =====================================================
-- PROMO CODES TABLE INDEXES
-- =====================================================

-- Index for code validation (used during checkout)
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;

-- Index for active promo codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = true;

-- Index for expiry date cleanup
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until);

-- =====================================================
-- DELIVERY AREAS TABLE INDEXES
-- =====================================================

-- Index for active delivery areas
CREATE INDEX IF NOT EXISTS idx_delivery_areas_active ON delivery_areas(is_active) WHERE is_active = true;

-- =====================================================
-- ADDRESSES TABLE INDEXES
-- =====================================================

-- Index for user address lookups
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Index for default address queries
CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON addresses(user_id, is_default) WHERE is_default = true;

-- =====================================================
-- EMBEDLY INTEGRATION TABLE INDEXES
-- =====================================================

-- Wallet transactions (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallet_transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
  END IF;
END $$;

-- Transfers (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transfers') THEN
    CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_created ON transfers(created_at DESC);
  END IF;
END $$;

-- =====================================================
-- SOCIAL VERIFICATIONS INDEXES
-- =====================================================

-- Only create if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_verifications') THEN
    CREATE INDEX IF NOT EXISTS idx_social_verifications_status ON social_verifications(status);
    CREATE INDEX IF NOT EXISTS idx_social_verifications_user_id ON social_verifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_social_verifications_platform_status ON social_verifications(platform, status);
  END IF;
END $$;

-- =====================================================
-- ANALYTICS OPTIMIZATION
-- =====================================================

-- Create a materialized view for daily sales analytics (optional)
-- This can significantly speed up dashboard queries

-- Commented out - uncomment if needed for high-traffic sites
/*
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  COUNT(DISTINCT customer_id) as unique_customers
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE(created_at);

-- Create unique index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_stats_date ON daily_sales_stats(date);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_daily_sales_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (run via cron job or pg_cron extension)
-- SELECT refresh_daily_sales_stats();
*/

-- =====================================================
-- ANALYZE TABLES FOR QUERY OPTIMIZER
-- =====================================================

-- Update statistics for better query planning
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
ANALYZE flavors;
ANALYZE profiles;
ANALYZE rewards;
ANALYZE referrals;
ANALYZE promo_codes;
ANALYZE addresses;
ANALYZE delivery_areas;
ANALYZE social_verifications;

-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Check index usage (run periodically to identify unused indexes)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan ASC;

-- Check table sizes (identify large tables needing optimization)
-- SELECT
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries (requires pg_stat_statements extension)
-- SELECT query, mean_exec_time, calls
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Performance optimization indexes created successfully!';
  RAISE NOTICE 'Database statistics have been updated.';
  RAISE NOTICE 'Run: ANALYZE; periodically to maintain optimal query performance.';
END $$;
