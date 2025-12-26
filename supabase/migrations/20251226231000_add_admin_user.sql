-- Upsert admin user for communitycodeday1@gmail.com
INSERT INTO public.admin_users (email, display_name, role, is_active, user_id)
VALUES (
  'communitycodeday1@gmail.com',
  'Community Admin',
  'admin',
  true,
  (SELECT id FROM auth.users WHERE email = 'communitycodeday1@gmail.com' LIMIT 1)
)
ON CONFLICT (email) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  is_active = true,
  user_id = COALESCE(EXCLUDED.user_id, admin_users.user_id),
  updated_at = now();

-- Note: user_id will be set automatically if the Supabase auth user exists.
-- If the user signs up after this migration, rerun this statement to attach user_id.
