import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser(email, password, role, firstName, lastName, isVerified = true) {
  try {
    // Create user with admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: role,
        firstName: firstName,
        lastName: lastName
      }
    });

    if (authError) {
      console.error(`Error creating user ${email}:`, authError);
      return null;
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        role: role,
        email: email,
        is_verified: isVerified,
        phone: role === 'tenant' ? '+639171234567' : '+639187654321',
        bio: role === 'tenant' 
          ? 'Looking for a comfortable and affordable room in a safe neighborhood.'
          : 'Experienced landlord with multiple properties in Metro Manila.'
      })
      .select()
      .single();

    if (profileError) {
      console.error(`Error creating profile for ${email}:`, profileError);
      return authData.user;
    }

    return {
      user: authData.user,
      profile: profileData
    };

  } catch (error) {
    console.error(`Failed to create user ${email}:`, error);
    return null;
  }
}

async function createSampleProperty(landlordId) {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        landlord_id: landlordId,
        title: 'Cozy Studio Apartment in Makati',
        description: 'A fully furnished studio apartment perfect for young professionals. Located in the heart of Makati with easy access to BGC and Ortigas.',
        address: JSON.stringify({
          street: '123 Ayala Avenue',
          city: 'Makati',
          province: 'Metro Manila',
          postal_code: '1200',
          coordinates: {
            lat: 14.5547,
            lng: 121.0244
          }
        }),
        room_type: 'studio',
        price: 25000,
        deposit: 50000,
        amenities: JSON.stringify([
          'WiFi',
          'Air Conditioning',
          'Kitchen',
          'Laundry',
          'Security',
          'Parking'
        ]),
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
        ]),
        is_active: true,
        is_available: true,
        max_occupants: 2,
        policies: JSON.stringify({
          'No Smoking': 'Strictly no smoking inside the unit',
          'No Pets': 'Pets are not allowed',
          'Quiet Hours': 'Maintain quiet hours from 10 PM to 6 AM'
        })
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sample property:', error);
      return null;
    }

    console.log('✅ Created sample property:', property.title);
    return property;

  } catch (error) {
    console.error('Failed to create sample property:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating comprehensive demo data...\n');

  // Create test accounts
  console.log('👥 Creating user accounts...');
  
  const tenant = await createTestUser(
    'tenant@test.com',
    'password123',
    'tenant',
    'John',
    'Doe'
  );

  const landlord = await createTestUser(
    'landlord@test.com',
    'password123',
    'landlord',
    'Jane',
    'Smith',
    true // Verified landlord
  );

  const unverifiedLandlord = await createTestUser(
    'newlandlord@test.com',
    'password123',
    'landlord',
    'Mike',
    'Johnson',
    false // Unverified landlord
  );

  // Create additional tenant for testing
  const tenant2 = await createTestUser(
    'tenant2@test.com',
    'password123',
    'tenant',
    'Sarah',
    'Wilson'
  );

  // Create sample property for verified landlord
  if (landlord) {
    console.log('\n🏠 Creating sample properties...');
    await createSampleProperty(landlord.user.id);
    
    // Create another property
    await supabase
      .from('properties')
      .insert({
        landlord_id: landlord.user.id,
        title: 'Shared Room in BGC Condo',
        description: 'Modern shared room in a luxury condominium. Perfect for professionals working in BGC.',
        address: JSON.stringify({
          street: '456 26th Street',
          city: 'Taguig',
          province: 'Metro Manila',
          postal_code: '1634'
        }),
        room_type: 'shared',
        price: 15000,
        deposit: 30000,
        amenities: JSON.stringify([
          'WiFi',
          'Air Conditioning',
          'Gym',
          'Pool',
          'Security',
          'Shuttle Service'
        ]),
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
        ]),
        is_active: true,
        is_available: true,
        max_occupants: 4
      });
  }

  console.log('\n📋 Demo Account Summary:');
  console.log('========================');
  
  console.log('🏠 TENANT ACCOUNTS:');
  console.log('   Email: tenant@test.com | Password: password123');
  console.log('   Email: tenant2@test.com | Password: password123');
  console.log('   Status: Ready to search and book rooms');
  console.log('');
  
  console.log('🏢 LANDLORD ACCOUNTS:');
  console.log('   Email: landlord@test.com | Password: password123');
  console.log('   Status: Verified - Can list properties (has sample listings)');
  console.log('');
  console.log('   Email: newlandlord@test.com | Password: password123');
  console.log('   Status: Unverified - Needs document upload');
  console.log('');

  console.log('💡 What you can test:');
  console.log('   ✓ Login as tenant and browse available properties');
  console.log('   ✓ Login as verified landlord and manage listings');
  console.log('   ✓ Login as unverified landlord and go through verification');
  console.log('   ✓ Test the complete booking flow');
  console.log('   ✓ Test admin functions (if admin account exists)');
  console.log('');
  console.log('🌐 Access your app at: http://localhost:3000');
}

main().catch(console.error);