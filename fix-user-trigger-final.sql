-- Fix the user creation trigger to handle direct inserts
-- This replaces the problematic trigger with a safer version

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_user_created ON public.users;

-- Create a new, safer function for user profile creation
CREATE OR REPLACE FUNCTION public.handle_user_profile_creation_safe()
RETURNS TRIGGER AS $
BEGIN
    -- Only create profile if it doesn't exist and we have basic info
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id) THEN
        -- Try to get info from auth.users if available
        INSERT INTO public.user_profiles (user_id, first_name, last_name, phone)
        SELECT 
            NEW.id,
            COALESCE(
                (SELECT raw_user_meta_data->>'firstName' FROM auth.users WHERE id = NEW.id),
                'User'
            ),
            COALESCE(
                (SELECT raw_user_meta_data->>'lastName' FROM auth.users WHERE id = NEW.id),
                'User'
            ),
            (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger
CREATE TRIGGER on_user_created_safe
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_creation_safe();

-- Now insert the admin user
INSERT INTO public.users (id, email, role, is_active, is_verified) 
VALUES ('d5fd8882-c6b2-4618-a20b-e50bab31ec09', 'admin@roomfindr.com', 'admin', true, true)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_verified = true,
  is_active = true;

-- Update the profile to admin details
INSERT INTO public.user_profiles (user_id, first_name, last_name, phone) 
VALUES ('d5fd8882-c6b2-4618-a20b-e50bab31ec09', 'System', 'Administrator', '+63-900-000-0001')
ON CONFLICT (user_id) DO UPDATE SET
  first_name = 'System',
  last_name = 'Administrator',
  phone = '+63-900-000-0001';

-- Verify the admin user was created
SELECT 
    u.id, 
    u.email, 
    u.role, 
    u.is_active, 
    u.is_verified,
    p.first_name,
    p.last_name
FROM public.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.id = 'd5fd8882-c6b2-4618-a20b-e50bab31ec09';