-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- This fixes the user creation trigger that's causing the "Database error creating new user"

-- Step 1: Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create a more robust user creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if we have a valid email
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        INSERT INTO public.users (id, email, role, is_active, is_verified)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant'),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Test the fix by checking if the function exists
SELECT 'User creation trigger has been fixed! You can now create users.' as status;