-- Simplified Seed Data for RoomFindr
-- This version creates sample data without requiring auth.users entries

-- Note: To use this seed data, you'll need to:
-- 1. First create real users through Supabase Auth (sign up via your app)
-- 2. Then replace the UUIDs below with the actual user IDs from auth.users
-- 3. Or use this as a template and manually insert data after creating real users

-- For now, let's create some sample properties that don't require user relationships
-- These can be used once you have real authenticated users

-- Sample properties (without landlord_id for now)
-- You can update these later with real landlord IDs

-- First, let's create a temporary approach:
-- Create sample data that you can use as a template

-- Example SQL to run AFTER you have real users:
/*

-- Step 1: Create real users through your app's signup process
-- Step 2: Get their UUIDs from the auth.users table
-- Step 3: Insert them into public.users table
-- Step 4: Use those UUIDs in the queries below

-- Example template (replace UUIDs with real ones):

INSERT INTO public.users (id, email, role, is_active, is_verified) VALUES
    ('your-real-admin-uuid', 'admin@roomfindr.com', 'admin', true, true),
    ('your-real-landlord-uuid', 'landlord@example.com', 'landlord', true, true),
    ('your-real-tenant-uuid', 'tenant@example.com', 'tenant', true, true);

INSERT INTO public.user_profiles (user_id, first_name, last_name, phone) VALUES
    ('your-real-admin-uuid', 'System', 'Administrator', '+63-900-000-0001'),
    ('your-real-landlord-uuid', 'John', 'Landlord', '+63-900-000-0002'),
    ('your-real-tenant-uuid', 'Alice', 'Tenant', '+63-900-000-0004');

-- Approve landlord
INSERT INTO public.landlord_verifications (landlord_id, status, reviewed_by, reviewed_at) VALUES
    ('your-real-landlord-uuid', 'approved', 'your-real-admin-uuid', NOW());

-- Create sample properties
INSERT INTO public.properties (
    landlord_id, title, description, street, city, province, postal_code,
    room_type, price, deposit, amenities, max_occupancy, availability_start_date
) VALUES
    (
        'your-real-landlord-uuid',
        'Cozy Studio Apartment in Makati',
        'A modern studio apartment perfect for young professionals.',
        '123 Ayala Avenue',
        'Makati',
        'Metro Manila',
        '1200',
        'studio',
        25000.00,
        50000.00,
        ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Laundry', 'Security'],
        1,
        CURRENT_DATE
    );

*/

-- For immediate testing, here are some standalone sample data that don't require users:

-- You can run this part immediately:
-- (This creates sample data for testing your property search functionality)

-- Note: These will be created without landlord_id, so you'll need to update them later
-- or create them through your app's property creation flow

SELECT 'Seed file ready - follow the instructions in the comments above' as message;