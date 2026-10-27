-- ========================================================
-- SUBSHARE SUPABASE DATABASE SCHEMA MIGRATION
-- Copy and run this script in the Supabase SQL Editor
-- ========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'organization')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  gender TEXT,
  city TEXT,
  profile_photo_url TEXT,
  terms_accepted_at TIMESTAMPTZ DEFAULT NOW(),
  trust_score INT DEFAULT 20,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  profile_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('NGO', 'Orphanage', 'Old Age Home', 'Charitable Trust', 'Community Organization', 'Other')),
  registration_number TEXT NOT NULL,
  registration_date DATE,
  contact_person TEXT NOT NULL,
  official_email TEXT NOT NULL,
  official_phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  certificate_url TEXT,
  government_doc_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations viewable by everyone" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own organization" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization" ON public.organizations
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. STORAGE BUCKETS FOR DOCUMENTS & PROFILE PHOTOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-docs', 'organization-docs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Organization Docs
CREATE POLICY "Public read access for org docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'organization-docs');

CREATE POLICY "Authenticated upload for org docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'organization-docs' AND auth.role() = 'authenticated');

-- Storage Policies for Profile Photos
CREATE POLICY "Public read access for profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated upload for profile photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');
