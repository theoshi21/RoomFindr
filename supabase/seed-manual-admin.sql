-- Seed Data for RoomFindr (Manual Admin Creation)
-- 
-- STEP 1: Create admin user in Supabase Dashboard first:
-- 1. Go to Authentication → Users → Add user
-- 2. Email: admin@roomfindr.com, Password: admin123
-- 3. Check "Auto Confirm User"
-- 4. Copy the generated UUID
--
-- STEP 2: Replace 'YOUR-ADMIN-UUID-HERE' below with the actual UUID
-- STEP 3: Run this SQL

-- First, let's check what users exist in auth.users
-- Uncomment this line to see existing users:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Insert the admin user into public.users
-- Replace 'YOUR-ADMIN-UUID-HERE' with the actual UUID from Supabase Dashboard
INSERT INTO public.users (id, email, role, is_active, is_verified) VALUES
    ('YOUR-ADMIN-UUID-HERE', 'admin@roomfindr.com', 'admin', true, true)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_verified = true;

-- Create admin profile
INSERT INTO public.user_profiles (user_id, first_name, last_name, phone) VALUES
    ('YOUR-ADMIN-UUID-HERE', 'System', 'Administrator', '+63-900-000-0001')
ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'System',
    last_name = 'Administrator';

-- Now you can create regular users through your app and add them here
-- For now, let's create some sample properties without landlords

-- Sample properties (you can assign landlords later)
INSERT INTO public.properties (
    id, landlord_id, title, description, street, city, province, postal_code,
    room_type, price, deposit, amenities, max_occupancy, availability_start_date,
    pet_policy, smoking_policy, guest_policy, is_active
) VALUES
    (
        gen_random_uuid(),
        'YOUR-ADMIN-UUID-HERE', -- Temporarily assign to admin, change later
        'Cozy Studio Apartment in Makati',
        'A modern studio apartment perfect for young professionals. Located in the heart of Makati CBD with easy access to public transportation.',
        '123 Ayala Avenue',
        'Makati',
        'Metro Manila',
        '1200',
        'studio',
        25000.00,
        50000.00,
        ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Laundry', 'Security'],
        1,
        CURRENT_DATE,
        'No pets allowed',
        'No smoking',
        'Guests allowed with prior notice',
        true
    ),
    (
        gen_random_uuid(),
        'YOUR-ADMIN-UUID-HERE', -- Temporarily assign to admin, change later
        'Shared Room in BGC',
        'Spacious shared room in a modern condominium in Bonifacio Global City. Perfect for students and young professionals.',
        '456 32nd Street',
        'Taguig',
        'Metro Manila',
        '1634',
        'shared',
        15000.00,
        30000.00,
        ARRAY['WiFi', 'Air Conditioning', 'Gym', 'Pool', 'Security', 'Parking'],
        2,
        CURRENT_DATE,
        'Small pets allowed',
        'No smoking',
        'Guests allowed on weekends',
        true
    ),
    (
        gen_random_uuid(),
        'YOUR-ADMIN-UUID-HERE', -- Temporarily assign to admin, change later
        'Single Room near UP Diliman',
        'Affordable single room perfect for students. Walking distance to UP Diliman campus.',
        '789 Katipunan Avenue',
        'Quezon City',
        'Metro Manila',
        '1101',
        'single',
        12000.00,
        24000.00,
        ARRAY['WiFi', 'Study Area', 'Kitchen Access', 'Laundry'],
        1,
        CURRENT_DATE,
        'No pets allowed',
        'No smoking',
        'No overnight guests',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Create a sample notification for the admin
INSERT INTO public.notifications (user_id, notification_type, title, message, metadata) VALUES
    (
        'YOUR-ADMIN-UUID-HERE',
        'announcement',
        'Welcome to RoomFindr Admin',
        'Your admin account has been set up successfully. You can now manage the platform.',
        '{"setup": "complete"}'
    )
ON CONFLICT DO NOTHING;

SELECT 'Seed data created successfully! Admin user and sample properties added.' as result;