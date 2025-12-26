-- Fix profiles table - add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_data JSONB,
ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS id_rejection_reason TEXT;

-- Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_verifications table for ID verification tracking
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('student_id', 'government_id', 'passport', 'drivers_license')),
  document_url TEXT NOT NULL,
  document_back_url TEXT,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES public.admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_logs table for admin message monitoring
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_audit_log for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin users policies (only admins can access)
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
  );

-- User verifications policies
CREATE POLICY "Users can view their own verifications" ON public.user_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit verifications" ON public.user_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications" ON public.user_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can update verifications" ON public.user_verifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Message logs policies (admin only)
CREATE POLICY "Admins can view message_logs" ON public.message_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "System can insert message_logs" ON public.message_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update message_logs" ON public.message_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Audit log policies (admin only)
CREATE POLICY "Admins can view audit_log" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can insert audit_log" ON public.admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verifications bucket
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'verifications' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own verification docs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'verifications' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all verification docs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'verifications'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Function to log messages automatically
CREATE OR REPLACE FUNCTION log_message()
RETURNS TRIGGER AS $$
DECLARE
    other_user_id UUID;
BEGIN
    -- Get the other user in the conversation
    SELECT CASE 
        WHEN c.user1_id = NEW.sender_id THEN c.user2_id 
        ELSE c.user1_id 
    END INTO other_user_id
    FROM public.conversations c
    WHERE c.id = NEW.conversation_id;

    -- Insert into message_logs
    INSERT INTO public.message_logs (
        message_id,
        conversation_id,
        sender_id,
        receiver_id,
        content,
        created_at
    ) VALUES (
        NEW.id,
        NEW.conversation_id,
        NEW.sender_id,
        other_user_id,
        NEW.content,
        NEW.created_at
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message logging
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION log_message();

-- Function to update profile verification status when ID is approved
CREATE OR REPLACE FUNCTION update_profile_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE public.profiles
        SET 
            id_verified = true,
            id_verified_at = NOW(),
            verification_level = 'verified',
            is_verified = true
        WHERE user_id = NEW.user_id;
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE public.profiles
        SET 
            id_rejection_reason = NEW.rejection_reason
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for verification status updates
DROP TRIGGER IF EXISTS on_verification_status_change ON public.user_verifications;
CREATE TRIGGER on_verification_status_change
    AFTER UPDATE ON public.user_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_verification();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON public.message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_sender_id ON public.message_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_flagged ON public.message_logs(flagged) WHERE flagged = true;
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
