-- Simple Admin Account Creation
-- Replace the UUID below with your actual admin user ID from Supabase Auth

-- First, let's see what users exist in auth.users (run this first to get the UUID)
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Insert the admin user into public.users (replace the UUID)
INSERT INTO public.users (id, email, role, is_active, is_verified) VALUES
    ('d5fd8882-c6b2-4618-a20b-e50bab31ec09', 'admin@roomfindr.com', 'admin', true, true)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_verified = true,
    is_active = true;

-- Create admin profile
INSERT INTO public.user_profiles (user_id, first_name, last_name, phone) VALUES
    ('d5fd8882-c6b2-4618-a20b-e50bab31ec09', 'System', 'Administrator', '+63-900-000-0001')
ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'System',
    last_name = 'Administrator';

-- Create a welcome notification
INSERT INTO public.notifications (user_id, notification_type, title, message, metadata) VALUES
    (
        'd5fd8882-c6b2-4618-a20b-e50bab31ec09',
        'announcement',
        'Welcome to RoomFindr Admin',
        'Your admin account has been set up successfully. You can now manage the platform.',
        '{"setup": "complete"}'
    )
ON CONFLICT DO NOTHING;

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
WHERE u.role = 'admin';