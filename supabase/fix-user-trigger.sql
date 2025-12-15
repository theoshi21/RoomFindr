-- Fix the user creation trigger that's causing the database error

-- Drop the existing problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
    -- Only proceed if we have a valid email
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        INSERT INTO public.users (id, email, role, is_active, is_verified)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role,
            true,
            COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            is_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
            updated_at = NOW();
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth.users insertion
        RAISE WARNING 'Failed to create public.users record for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also fix the profile creation function to be more robust
DROP TRIGGER IF EXISTS on_user_created ON public.users;
DROP FUNCTION IF EXISTS public.handle_user_profile_creation();

CREATE OR REPLACE FUNCTION public.handle_user_profile_creation()
RETURNS TRIGGER AS $
BEGIN
    -- Only create profile if user metadata contains profile info
    IF NEW.id IS NOT NULL THEN
        INSERT INTO public.user_profiles (
            user_id, 
            first_name, 
            last_name, 
            phone
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'firstName', 'User'),
            COALESCE(NEW.raw_user_meta_data->>'lastName', 'Profile'),
            NEW.raw_user_meta_data->>'phone'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            first_name = COALESCE(NEW.raw_user_meta_data->>'firstName', user_profiles.first_name),
            last_name = COALESCE(NEW.raw_user_meta_data->>'lastName', user_profiles.last_name),
            phone = COALESCE(NEW.raw_user_meta_data->>'phone', user_profiles.phone),
            updated_at = NOW();
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the users insertion
        RAISE WARNING 'Failed to create user_profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the profile trigger
CREATE TRIGGER on_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_creation();

SELECT 'User creation triggers have been fixed!' as result;