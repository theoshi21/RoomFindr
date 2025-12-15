-- Fix RLS policies for development to work around SSL/auth issues
-- This creates permissive policies that allow access during development

-- Drop existing restrictive policies and create permissive ones

-- Users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Allow all access for development" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- User profiles table  
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Allow all access for development" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Landlord verifications table
DROP POLICY IF EXISTS "Landlords can view own verifications" ON public.landlord_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.landlord_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON public.landlord_verifications;
CREATE POLICY "Allow all access for development" ON public.landlord_verifications FOR ALL USING (true) WITH CHECK (true);

-- Verification documents table
DROP POLICY IF EXISTS "Users can view own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.verification_documents;
CREATE POLICY "Allow all access for development" ON public.verification_documents FOR ALL USING (true) WITH CHECK (true);

-- Properties table
DROP POLICY IF EXISTS "Landlords can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Everyone can view active properties" ON public.properties;
CREATE POLICY "Allow all access for development" ON public.properties FOR ALL USING (true) WITH CHECK (true);

-- Reservations table
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Landlords can view property reservations" ON public.reservations;
CREATE POLICY "Allow all access for development" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

-- Transactions table
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Allow all access for development" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- Notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Allow all access for development" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Reviews table
DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Allow all access for development" ON public.reviews FOR ALL USING (true) WITH CHECK (true);