-- Seed Data Without User Dependencies
-- This creates sample data that you can use to test your app
-- without needing to create users first

-- Create sample properties without landlord dependencies
-- (We'll assign them to real users later)

-- First, let's create some sample properties with placeholder landlord_id
-- You can update these later when you have real users

INSERT INTO public.properties (
    id, landlord_id, title, description, street, city, province, postal_code,
    room_type, price, deposit, amenities, max_occupancy, availability_start_date,
    pet_policy, smoking_policy, guest_policy, is_active
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update later
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
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update later
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
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update later
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

-- Temporarily disable the foreign key constraint to allow placeholder landlord_id
-- (We'll fix this after creating real users)

SELECT 'Sample properties created! You can now test property search and listing features.' as result;
SELECT 'To complete setup: 1) Create users through your app, 2) Update landlord_id in properties table' as next_steps;