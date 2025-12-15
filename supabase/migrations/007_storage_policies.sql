-- Storage Policies Migration
-- This migration sets up Row Level Security (RLS) policies for Supabase Storage buckets

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can update their property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can delete their property images" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Landlords can read their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can update their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can delete their verification documents" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for announcements" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage announcement images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update announcement images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete announcement images" ON storage.objects;

-- Property Images Bucket Policies (public bucket)
CREATE POLICY "Public read access for property images" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Landlords can upload property images" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'landlord'
  )
);

CREATE POLICY "Landlords can update their property images" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'landlord'
  ) AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties 
    WHERE landlord_id = auth.uid()
  )
);

CREATE POLICY "Landlords can delete their property images" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'landlord'
  ) AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties 
    WHERE landlord_id = auth.uid()
  )
);

-- Avatars Bucket Policies (public bucket)
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verification Documents Bucket Policies (private bucket)
CREATE POLICY "Landlords can read their own verification documents" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read verification documents" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Landlords can upload verification documents" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'landlord'
  ) AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Landlords can update their verification documents" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'landlord'
  ) AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Landlords can delete their verification documents" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'landlord'
  ) AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Announcements Bucket Policies (public bucket)
CREATE POLICY "Public read access for announcements" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'announcements');

CREATE POLICY "Admins can manage announcement images" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcements' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update announcement images" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'announcements' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete announcement images" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'announcements' AND
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create a function to help with bucket setup (optional)
CREATE OR REPLACE FUNCTION setup_storage_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be called to ensure buckets exist
  -- Note: Bucket creation is typically done via the Supabase client
  RAISE NOTICE 'Storage buckets should be created via the Supabase client or dashboard';
END;
$$;