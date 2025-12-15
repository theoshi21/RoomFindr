// Roommate Profile Management Library
import { createClientComponentClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type {
  RoommateProfile,
  RoommateProfileFormData,
  RoommateProfileUpdateData,
  RoommateProfileResponse,
  SharedRoomInfo,
  SharedRoomResponse,
  RoommateSlot,
  CompatibilityScore,
  CompatibilityResponse,
  RoommateSearchFilters,
  LifestylePreferences,
  CompatibilityPreferences,
  PrivacySettings
} from '@/types/roommate'

// Helper function to map database response to application format
function mapDatabaseToRoommateProfile(dbProfile: any): RoommateProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    propertyId: dbProfile.property_id,
    firstName: dbProfile.first_name,
    lastName: dbProfile.last_name,
    avatar: dbProfile.avatar || undefined,
    bio: dbProfile.bio || undefined,
    age: dbProfile.age || undefined,
    occupation: dbProfile.occupation || undefined,
    lifestyle: dbProfile.lifestyle as any,
    compatibility: dbProfile.compatibility as any,
    privacySettings: dbProfile.privacy_settings as any,
    moveInDate: new Date(dbProfile.move_in_date),
    moveOutDate: dbProfile.move_out_date ? new Date(dbProfile.move_out_date) : undefined,
    isActive: dbProfile.is_active,
    createdAt: new Date(dbProfile.created_at),
    updatedAt: new Date(dbProfile.updated_at)
  }
}

const supabase = createClientComponentClient()

// Create roommate profile
export async function createRoommateProfile(
  propertyId: string,
  profileData: RoommateProfileFormData
): Promise<RoommateProfileResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { profile: null, error: 'User not authenticated' }
    }

    // Get user profile for basic info
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, avatar')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return { profile: null, error: 'User profile not found' }
    }

    // Check if property exists and is shared
    const { data: property } = await supabase
      .from('properties')
      .select('room_type, max_occupancy, current_occupancy')
      .eq('id', propertyId)
      .single()

    if (!property) {
      return { profile: null, error: 'Property not found' }
    }

    if (property.room_type !== 'shared') {
      return { profile: null, error: 'Property is not a shared room' }
    }

    if (property.current_occupancy >= property.max_occupancy) {
      return { profile: null, error: 'Room is at full capacity' }
    }

    // Check if user already has a profile for this property
    const { data: existingProfile } = await supabase
      .from('roommate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .single()

    if (existingProfile) {
      return { profile: null, error: 'Roommate profile already exists for this property' }
    }

    // Create roommate profile
    const insertData: Database['public']['Tables']['roommate_profiles']['Insert'] = {
      user_id: user.id,
      property_id: propertyId,
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      avatar: userProfile.avatar,
      bio: profileData.bio,
      age: profileData.age,
      occupation: profileData.occupation,
      lifestyle: profileData.lifestyle as any,
      compatibility: profileData.compatibility as any,
      privacy_settings: profileData.privacySettings as any,
      move_in_date: new Date().toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      is_active: true
    }
    
    const { data: roommateProfile, error } = await supabase
      .from('roommate_profiles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return { profile: null, error: error.message }
    }

    return { profile: mapDatabaseToRoommateProfile(roommateProfile), error: null }
  } catch (error) {
    return { profile: null, error: 'Failed to create roommate profile' }
  }
}

// Update roommate profile
export async function updateRoommateProfile(
  profileId: string,
  updates: RoommateProfileUpdateData
): Promise<RoommateProfileResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { profile: null, error: 'User not authenticated' }
    }

    const { data: profile, error } = await supabase
      .from('roommate_profiles')
      .update(updates)
      .eq('id', profileId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { profile: null, error: error.message }
    }

    return { profile: mapDatabaseToRoommateProfile(profile), error: null }
  } catch (error) {
    return { profile: null, error: 'Failed to update roommate profile' }
  }
}

// Get roommate profile
export async function getRoommateProfile(profileId: string): Promise<RoommateProfileResponse> {
  try {
    const { data: profile, error } = await supabase
      .from('roommate_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('is_active', true)
      .single()

    if (error) {
      return { profile: null, error: error.message }
    }

    return { profile: mapDatabaseToRoommateProfile(profile), error: null }
  } catch (error) {
    return { profile: null, error: 'Failed to get roommate profile' }
  }
}

// Get shared room information
export async function getSharedRoomInfo(propertyId: string): Promise<SharedRoomResponse> {
  try {
    // Get property info
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('room_type', 'shared')
      .single()

    if (propertyError || !property) {
      return { roomInfo: null, error: 'Shared room not found' }
    }

    // Get active roommate profiles for this property
    const { data: roommateProfiles, error: profilesError } = await supabase
      .from('roommate_profiles')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)

    if (profilesError) {
      return { roomInfo: null, error: profilesError.message }
    }

    // Create roommate slots
    const roommateSlots: RoommateSlot[] = []
    for (let i = 1; i <= property.max_occupancy; i++) {
      const roommateProfile = roommateProfiles?.find((profile, index) => index === i - 1)
      roommateSlots.push({
        id: `${propertyId}-slot-${i}`,
        propertyId,
        slotNumber: i,
        isOccupied: !!roommateProfile,
        roommateProfile: roommateProfile ? mapDatabaseToRoommateProfile(roommateProfile) : undefined,
        availableFrom: roommateProfile ? undefined : new Date(),
        availableUntil: roommateProfile?.move_out_date ? new Date(roommateProfile.move_out_date) : undefined
      })
    }

    const roomInfo: SharedRoomInfo = {
      propertyId,
      totalSlots: property.max_occupancy,
      occupiedSlots: roommateProfiles?.length || 0,
      availableSlots: property.max_occupancy - (roommateProfiles?.length || 0),
      roommateSlots,
      roomRules: property.custom_policies || [],
      sharedAmenities: property.amenities || []
    }

    return { roomInfo, error: null }
  } catch (error) {
    return { roomInfo: null, error: 'Failed to get shared room information' }
  }
}

// Calculate compatibility score
export function calculateCompatibilityScore(
  userProfile: RoommateProfile,
  targetProfile: RoommateProfile
): CompatibilityScore {
  let score = 0
  const matchingFactors: string[] = []
  const conflictingFactors: string[] = []

  // Age compatibility
  const ageRange = userProfile.compatibility.preferredAgeRange
  if (targetProfile.age && targetProfile.age >= ageRange.min && targetProfile.age <= ageRange.max) {
    score += 20
    matchingFactors.push('Age range match')
  } else if (targetProfile.age) {
    conflictingFactors.push('Age outside preferred range')
  }

  // Lifestyle compatibility
  const userLifestyle = userProfile.lifestyle
  const targetLifestyle = targetProfile.lifestyle

  // Sleep schedule compatibility
  if (userLifestyle.sleepSchedule === targetLifestyle.sleepSchedule) {
    score += 15
    matchingFactors.push('Similar sleep schedule')
  } else {
    conflictingFactors.push('Different sleep schedules')
  }

  // Cleanliness compatibility
  if (userLifestyle.cleanliness === targetLifestyle.cleanliness) {
    score += 15
    matchingFactors.push('Similar cleanliness standards')
  } else {
    conflictingFactors.push('Different cleanliness standards')
  }

  // Social level compatibility
  if (userLifestyle.socialLevel === targetLifestyle.socialLevel) {
    score += 10
    matchingFactors.push('Similar social preferences')
  }

  // Noise level compatibility
  if (userLifestyle.noiseLevel === targetLifestyle.noiseLevel) {
    score += 10
    matchingFactors.push('Similar noise preferences')
  }

  // Guest policy compatibility
  if (userLifestyle.guestPolicy === targetLifestyle.guestPolicy) {
    score += 10
    matchingFactors.push('Similar guest policies')
  }

  // Smoking compatibility
  if (userLifestyle.smokingPreference === targetLifestyle.smokingPreference) {
    score += 10
    matchingFactors.push('Compatible smoking preferences')
  } else if (
    (userLifestyle.smokingPreference === 'non_smoker' && targetLifestyle.smokingPreference === 'smoker') ||
    (userLifestyle.smokingPreference === 'smoker' && targetLifestyle.smokingPreference === 'non_smoker')
  ) {
    score -= 20
    conflictingFactors.push('Incompatible smoking preferences')
  }

  // Pet compatibility
  if (userLifestyle.petPreference === targetLifestyle.petPreference) {
    score += 10
    matchingFactors.push('Compatible pet preferences')
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score))

  return {
    userId: targetProfile.userId,
    score,
    matchingFactors,
    conflictingFactors
  }
}

// Get compatibility scores for potential roommates
export async function getCompatibilityScores(
  propertyId: string,
  userProfileId: string
): Promise<CompatibilityResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { scores: [], error: 'User not authenticated' }
    }

    // Get user's roommate profile
    const { data: userProfile, error: userError } = await supabase
      .from('roommate_profiles')
      .select('*')
      .eq('id', userProfileId)
      .eq('user_id', user.id)
      .single()

    if (userError || !userProfile) {
      return { scores: [], error: 'User profile not found' }
    }

    // Get other roommate profiles for the same property
    const { data: otherProfiles, error: profilesError } = await supabase
      .from('roommate_profiles')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .neq('user_id', user.id)

    if (profilesError) {
      return { scores: [], error: profilesError.message }
    }

    // Calculate compatibility scores
    const scores = (otherProfiles || []).map(profile => 
      calculateCompatibilityScore(
        mapDatabaseToRoommateProfile(userProfile), 
        mapDatabaseToRoommateProfile(profile)
      )
    )

    return { scores, error: null }
  } catch (error) {
    return { scores: [], error: 'Failed to calculate compatibility scores' }
  }
}

// Deactivate roommate profile (when moving out)
export async function deactivateRoommateProfile(profileId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('roommate_profiles')
      .update({
        is_active: false,
        move_out_date: new Date().toISOString().split('T')[0] // Convert to YYYY-MM-DD format
        // Remove updated_at since the database trigger handles this automatically
      })
      .eq('id', profileId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: 'Failed to deactivate roommate profile' }
  }
}

// Search roommate profiles
export async function searchRoommateProfiles(
  propertyId: string,
  filters: RoommateSearchFilters
): Promise<{ profiles: RoommateProfile[]; error: string | null }> {
  try {
    let query = supabase
      .from('roommate_profiles')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)

    // Apply filters
    if (filters.ageRange) {
      query = query
        .gte('age', filters.ageRange.min)
        .lte('age', filters.ageRange.max)
    }

    if (filters.occupation && filters.occupation.length > 0) {
      query = query.in('occupation', filters.occupation)
    }

    if (filters.moveInDateRange) {
      query = query
        .gte('move_in_date', filters.moveInDateRange.start.toISOString())
        .lte('move_in_date', filters.moveInDateRange.end.toISOString())
    }

    const { data: profiles, error } = await query

    if (error) {
      return { profiles: [], error: error.message }
    }

    return { 
      profiles: (profiles || []).map(profile => mapDatabaseToRoommateProfile(profile)), 
      error: null 
    }
  } catch (error) {
    return { profiles: [], error: 'Failed to search roommate profiles' }
  }
}