-- Temporary fix for timeout issues by disabling RLS on key tables
-- Run this in Supabase Dashboard SQL Editor

-- Disable RLS temporarily for development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Check which tables still have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- If you want to re-enable RLS later, use:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- (repeat for other tables)