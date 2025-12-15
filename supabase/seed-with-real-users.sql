-- Seed Data for RoomFindr (with real authenticated users)
-- 
-- IMPORTANT: Before running this, you need to:
-- 1. Sign up users through your RoomFindr app
-- 2. Get their actual UUIDs from auth.users table
-- 3. Replace the placeholder UUIDs below with real ones

-- Step 1: Check what users exist in auth.users
-- Run this query first to see existing users:
-- SELECT id, email FROM auth.users;

-- Step 2: Replace these placeholder UUIDs with real ones from auth.users
-- Example: If you signed up admin@roomfindr.com and got UUID 'abc123...', 
-- replace 'REPLACE-WITH-REAL-ADMIN-UUID' with 'abc123...'

INSERT INTO public.users (id, email, role, is_active, is_verified) VALUES
    ('REPLACE-WITH-REAL-ADMIN-UUID', 'admin@roomfindr.com', 'admin', true, true),
    ('REPLACE-WITH-REAL-LANDLORD-UUID', 'landlord@example.com', 'landlord', true, true),
    ('REPLACE-WITH-REAL-TENANT-UUID', 'tenant@example.com', 'tenant', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO public.user_profiles (user_id, first_name, last_name, phone) VALUES
    ('REPLACE-WITH-REAL-ADMIN-UUID', 'System', 'Administrator', '+63-900-000-0001'),
    ('REPLACE-WITH-REAL-LANDLORD-UUID', 'John', 'Landlord', '+63-900-000-0002'),
    ('REPLACE-WITH-REAL-TENANT-UUID', 'Alice', 'Tenant', '+63-900-000-0004')
ON CONFLICT (user_id) DO NOTHING;

-- Approve landlord
INSERT INTO public.landlord_verifications (landlord_id, status, reviewed_by, reviewed_at) VALUES
    ('REPLACE-WITH-REAL-LANDLORD-UUID', 'approved', 'REPLACE-WITH-REAL-ADMIN-UUID', NOW())
ON CONFLICT DO NOTHING;

-- Create sample properties
INSERT INTO public.properties (
    landlord_id, title, description, street, city, province, postal_code,
    coordinates, room_type, price, deposit, amenities, max_occupancy,
    availability_start_date, pet_policy, smoking_policy, guest_policy
) VALUES
    (
        'REPLACE-WITH-REAL-LANDLORD-UUID',
        'Cozy Studio Apartment in Makati',
        'A modern studio apartment perfect for young professionals. Located in the heart of Makati CBD.',
        '123 Ayala Avenue',
        'Makati',
        'Metro Manila',
        '1200',
        ST_SetSRID(ST_MakePoint(121.0244, 14.5547), 4326),
        'studio',
        25000.00,
        50000.00,
        ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Laundry', 'Security'],
        1,
        CURRENT_DATE,
        'No pets allowed',
        'No smoking',
        'Guests allowed with prior notice'
    ),
    (
        'REPLACE-WITH-REAL-LANDLORD-UUID',
        'Shared Room in BGC',
        'Spacious shared room in a modern condominium in Bonifacio Global City.',
        '456 32nd Street',
        'Taguig',
        'Metro Manila',
        '1634',
        ST_SetSRID(ST_MakePoint(121.0564, 14.5176), 4326),
        'shared',
        15000.00,
        30000.00,
        ARRAY['WiFi', 'Air Conditioning', 'Gym', 'Pool', 'Security', 'Parking'],
        2,
        CURRENT_DATE,
        'Small pets allowed',
        'No smoking',
        'Guests allowed on weekends'
    )
ON CONFLICT (id) DO NOTHING;