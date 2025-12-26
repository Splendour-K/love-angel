-- Add preferences column to profiles for notification & privacy settings
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB;

-- Seed default preferences for existing users
UPDATE public.profiles
SET preferences = jsonb_build_object(
  'email_notifications', true,
  'push_notifications', true,
  'show_in_discover', true,
  'verified_only_messages', false
)
WHERE preferences IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN preferences
SET DEFAULT jsonb_build_object(
  'email_notifications', true,
  'push_notifications', true,
  'show_in_discover', true,
  'verified_only_messages', false
);
