-- Final Seed Data for RoomFindr
-- 
-- INSTRUCTIONS:
-- 1. Create admin user through Supabase Dashboard (Authentication → Users → Add user)
-- 2. Copy the admin user's UUID from the dashboard
-- 3. Replace 'REPLACE-WITH-ADMIN-UUID' below with the actual UUID
-- 4. Run this SQL in Supabase SQL Editor

-- Check existing users first (uncomment to see current users)
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Update the admin user role (replace the UUID with the real one)
UPDATE public.users 
SET role = 'admin', is_verified = true 
WHERE id = 'REPLACE-WITH-ADMIN-UUID';

-- Create sample properties with the admin as temporary landlord
INSERT INTO public.properties (
    id, landlord_id, title, description, street, city, province, postal_code,
    room_type, price, deposit, amenities, max_occupancy, availability_start_date,
    pet_policy, smoking_policy, guest_policy, is_active
) VALUES
    (
        gen_random_uuid(),
        'REPLACE-WITH-ADMIN-UUID', -- Temporary - will change when real landlords sign up
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
        'REPLACE-WITH-ADMIN-UUID', -- Temporary - will change when real landlords sign up
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
        'REPLACE-WITH-ADMIN-UUID', -- Temporary - will change when real landlords sign up
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

-- Create a welcome notification for the admin
INSERT INTO public.notifications (user_id, notification_type, title, message, metadata) VALUES
    (
        'REPLACE-WITH-ADMIN-UUID',
        'announcement',
        'Welcome to RoomFindr Admin',
        'Your admin account has been set up successfully. You can now manage the platform and approve landlord verifications.',
        '{"setup": "complete", "role": "admin"}'
    )
ON CONFLICT DO NOTHING;

SELECT 'Seed data created successfully! Admin user configured and sample properties added.' as result;
SELECT 'Next: Create landlord and tenant accounts through your app, then update property landlord_id values.' as next_steps;