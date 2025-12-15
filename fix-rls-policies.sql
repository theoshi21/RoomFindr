-- Fix RLS policies to prevent infinite recursion
-- Run this in Supabase SQL Editor

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Drop problematic policies on user_profiles
DROP POLICY IF EXISTS "Users can view own user profile" ON public.user_profiles;

-- Create simpler, non-recursive policies for users table
-- Users can read their own record
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own record  
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own record
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a simple policy for user_profiles
CREATE POLICY "profiles_select_own" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Test the fix
SELECT 'RLS policies fixed successfully!' as result;