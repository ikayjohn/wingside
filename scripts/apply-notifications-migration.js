# Manual Migration Instructions

If the automated migration failed, you can manually apply the notification system migration:

## Option 1: Via Supabase Dashboard (Recommended)

1. The SQL editor should now be open in your browser
2. Copy and paste the contents of: `supabase/migrations/20250105_notifications_system.sql`
3. Click "Run" to execute the migration

## Option 2: Via Supabase CLI

```bash
# Reset and apply all migrations
npx supabase db reset

# Or apply specific migration
npx supabase migration up --file 20250105_notifications_system.sql
```

## Verification

After applying the migration, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'notification_preferences',
  'email_templates',
  'notification_logs',
  'push_subscriptions'
);

-- Should return 4 tables
```

## If Tables Already Exist

If you get errors about tables already existing, that's fine! The migration may have been partially applied.
You can verify everything is working by checking if the tables have the correct structure.

```sql
-- Check notification_preferences structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;
```

## Next Steps

Once the migration is applied:
1. Restart your dev server
2. Test the notification system
3. Verify email templates were inserted
