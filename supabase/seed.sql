-- Seed data for RoomFindr development and testing

-- Insert admin user (this would typically be done through the Supabase dashboard)
-- Note: In production, admin users should be created through proper authentication flow

-- Insert sample cities and provinces for testing
INSERT INTO public.users (id, email, role, is_active, is_verified) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@roomfindr.com', 'admin', true, true),
    ('00000000-0000-0000-0000-000000000002', 'landlord1@example.com', 'landlord', true, true),
    ('00000000-0000-0000-0000-000000000003', 'landlord2@example.com', 'landlord', true, true),
    ('00000000-0000-0000-0000-000000000004', 'tenant1@example.com', 'tenant', true, true),
    ('00000000-0000-0000-0000-000000000005', 'tenant2@example.com', 'tenant', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO public.user_profiles (user_id, first_name, last_name, phone) VALUES
    ('00000000-0000-0000-0000-000000000001', 'System', 'Administrator', '+63-900-000-0001'),
    ('00000000-0000-0000-0000-000000000002', 'John', 'Landlord', '+63-900-000-0002'),
    ('00000000-0000-0000-0000-000000000003', 'Jane', 'Property', '+63-900-000-0003'),
    ('00000000-0000-0000-0000-000000000004', 'Alice', 'Tenant', '+63-900-000-0004'),
    ('00000000-0000-0000-0000-000000000005', 'Bob', 'Renter', '+63-900-000-0005')
ON CONFLICT (user_id) DO NOTHING;

-- Insert landlord verifications
INSERT INTO public.landlord_verifications (landlord_id, status, reviewed_by, reviewed_at) VALUES
    ('00000000-0000-0000-0000-000000000002', 'approved', '00000000-0000-0000-0000-000000000001', NOW()),
    ('00000000-0000-0000-0000-000000000003', 'approved', '00000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT DO NOTHING;

-- Insert sample properties
INSERT INTO public.properties (
    id, landlord_id, title, description, street, city, province, postal_code,
    coordinates, room_type, price, deposit, amenities, max_occupancy,
    availability_start_date, pet_policy, smoking_policy, guest_policy
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'Cozy Studio Apartment in Makati',
        'A modern studio apartment perfect for young professionals. Located in the heart of Makati CBD with easy access to public transportation.',
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
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000002',
        'Shared Room in BGC',
        'Spacious shared room in a modern condominium in Bonifacio Global City. Perfect for students and young professionals.',
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
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000003',
        'Single Room near UP Diliman',
        'Affordable single room perfect for students. Walking distance to UP Diliman campus.',
        '789 Katipunan Avenue',
        'Quezon City',
        'Metro Manila',
        '1101',
        ST_SetSRID(ST_MakePoint(121.0644, 14.6537), 4326),
        'single',
        12000.00,
        24000.00,
        ARRAY['WiFi', 'Study Area', 'Kitchen Access', 'Laundry'],
        1,
        CURRENT_DATE,
        'No pets allowed',
        'No smoking',
        'No overnight guests'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample reservations
INSERT INTO public.reservations (
    property_id, tenant_id, landlord_id, start_date, end_date,
    status, payment_status, total_amount, deposit_amount
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000002',
        CURRENT_DATE + INTERVAL '1 month',
        CURRENT_DATE + INTERVAL '13 months',
        'confirmed',
        'paid',
        300000.00,
        50000.00
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000002',
        CURRENT_DATE + INTERVAL '2 weeks',
        NULL,
        'pending',
        'pending',
        180000.00,
        30000.00
    )
ON CONFLICT DO NOTHING;

-- Insert sample transactions
INSERT INTO public.transactions (
    reservation_id, user_id, transaction_type, amount, status,
    payment_method, payment_reference
) VALUES
    (
        (SELECT id FROM public.reservations WHERE tenant_id = '00000000-0000-0000-0000-000000000004' LIMIT 1),
        '00000000-0000-0000-0000-000000000004',
        'deposit',
        50000.00,
        'completed',
        'GCash',
        'GC-2024-001'
    )
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO public.notifications (user_id, notification_type, title, message, metadata) VALUES
    (
        '00000000-0000-0000-0000-000000000004',
        'reservation',
        'Reservation Confirmed',
        'Your reservation for the studio apartment in Makati has been confirmed.',
        '{"reservation_id": "' || (SELECT id FROM public.reservations WHERE tenant_id = '00000000-0000-0000-0000-000000000004' LIMIT 1) || '"}'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'reservation',
        'New Reservation Request',
        'You have a new reservation request for your property in BGC.',
        '{"property_id": "10000000-0000-0000-0000-000000000002"}'
    )
ON CONFLICT DO NOTHING;

-- Insert sample reviews
INSERT INTO public.reviews (
    property_id, tenant_id, landlord_id, rating, comment, is_verified
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000002',
        5,
        'Excellent location and very clean. The landlord is very responsive and helpful.',
        true
    )
ON CONFLICT DO NOTHING;