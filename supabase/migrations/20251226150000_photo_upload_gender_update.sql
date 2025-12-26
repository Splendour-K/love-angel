-- Update gender enum to only include male and female
-- Also enable storage for photo uploads

-- 1) Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 2) Create storage policy to allow users to upload their own photos
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3) Create storage policy to allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4) Create storage policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5) Create storage policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6) Update gender enum to only include male and female
-- First, update any existing values that aren't male or female
UPDATE public.profiles 
SET gender = 'male' 
WHERE gender IN ('non_binary', 'other', 'prefer_not_to_say');

-- Then alter the enum type
ALTER TYPE public.gender RENAME TO gender_old;
CREATE TYPE public.gender AS ENUM ('male', 'female');

-- Update the table to use the new enum
ALTER TABLE public.profiles ALTER COLUMN gender TYPE public.gender USING gender::text::public.gender;
ALTER TABLE public.profiles ALTER COLUMN looking_for_gender TYPE public.gender[] USING looking_for_gender::text[]::public.gender[];

-- Drop the old enum
DROP TYPE public.gender_old;

-- 7) Create function to generate avatar URL
CREATE OR REPLACE FUNCTION public.get_avatar_url(user_id UUID, file_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'https://dnowukmsglhesudqxtol.supabase.co/storage/v1/object/public/avatars/' || user_id || '/' || file_name;
END;
$$;