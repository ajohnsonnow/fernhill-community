-- =====================================================
-- PENDING USER AUTO-PURGE (30 days)
-- =====================================================
-- This creates a function and pg_cron job to automatically
-- delete pending users who haven't confirmed within 30 days

-- 1. Create the purge function
CREATE OR REPLACE FUNCTION purge_old_pending_users()
RETURNS void AS $$
DECLARE
  purged_count INTEGER;
BEGIN
  -- Delete from profiles (cascades to delete auth.users via trigger)
  -- Only delete pending users with no tribe_name (unconfirmed invites)
  WITH deleted AS (
    DELETE FROM profiles
    WHERE status = 'pending'
      AND tribe_name IS NULL
      AND created_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO purged_count FROM deleted;
  
  -- Log the purge action
  IF purged_count > 0 THEN
    INSERT INTO audit_logs (action, details, admin_id)
    VALUES (
      'auto_purge_pending',
      jsonb_build_object(
        'purged_count', purged_count,
        'timestamp', NOW()
      ),
      NULL
    );
  END IF;
  
  RAISE NOTICE 'Purged % old pending users', purged_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Schedule the cron job to run daily at 3 AM UTC
-- Note: Requires pg_cron extension (available on Supabase Pro plans)
-- On free tier, you can call this function manually or via Edge Function

-- For Supabase Pro with pg_cron:
-- SELECT cron.schedule(
--   'purge-old-pending-users',
--   '0 3 * * *',  -- Daily at 3 AM UTC
--   'SELECT purge_old_pending_users()'
-- );

-- 3. For free tier: Create an Edge Function or call manually
-- You can call: SELECT purge_old_pending_users();

-- =====================================================
-- ALTERNATIVE: Supabase Edge Function (works on free tier)
-- =====================================================
-- Create a file at supabase/functions/purge-pending/index.ts
-- Then set up a cron job via external service (e.g., cron-job.org)
-- to call: POST https://<project>.supabase.co/functions/v1/purge-pending

-- Manual test:
-- SELECT purge_old_pending_users();

-- View pending users older than 30 days (preview before purge):
-- SELECT id, full_name, created_at, NOW() - created_at as age
-- FROM profiles
-- WHERE status = 'pending'
--   AND tribe_name IS NULL
--   AND created_at < NOW() - INTERVAL '30 days';
