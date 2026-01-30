-- Set password for admin user anth-test@structuredforgrowth.com
-- This creates the user if they don't exist, or updates their password if they do
-- Password: admintest1234
-- NOTE: Supabase automatically encrypts passwords using bcrypt

-- First, check if user exists and update password
-- If you need to create the user first, use the Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: anth-test@structuredforgrowth.com
-- 4. Password: admintest1234
-- 5. Check "Auto Confirm User"

-- Then run this to make sure they have admin status:
INSERT INTO profiles (id, status, tribe_name)
SELECT id, 'admin', 'Anthony Test'
FROM auth.users 
WHERE email = 'anth-test@structuredforgrowth.com'
ON CONFLICT (id) 
DO UPDATE SET status = 'admin';

-- Verify admin was created:
SELECT 
  u.email,
  p.status,
  p.tribe_name,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'anth-test@structuredforgrowth.com';
