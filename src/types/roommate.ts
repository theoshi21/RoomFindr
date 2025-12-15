// Roommate Profile Types
export interface RoommateProfile {
  id: string;
  userId: string;
  propertyId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  age?: number;
  occupation?: string;
  lifestyle: LifestylePreferences;
  compatibility: CompatibilityPreferences;
  privacySettings: PrivacySettings;
  moveInDate: Date;
  moveOutDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LifestylePreferences {
  sleepSchedule: 'early' | 'normal' | 'late';
  cleanliness: 'very_clean' | 'clean' | 'moderate' | 'relaxed';
  socialLevel: 'very_social' | 'social' | 'moderate' | 'private';
  noiseLevel: 'quiet' | 'moderate' | 'lively';
  guestPolicy: 'no_guests' | 'occasional' | 'frequent' | 'anytime';
  smokingPreference: 'non_smoker' | 'outdoor_only' | 'smoker';
  petPreference: 'no_pets' | 'cats_only' | 'dogs_only' | 'any_pets';
}

export interface CompatibilityPreferences {
  preferredAgeRange: {
    min: number;
    max: number;
  };
  preferredGender: 'any' | 'male' | 'female' | 'non_binary';
  preferredOccupation: string[];
  dealBreakers: string[];
  importantQualities: string[];
}

export interface PrivacySettings {
  showFullName: boolean;
  showAge: boolean;
  showOccupation: boolean;
  showBio: boolean;
  showLifestyle: boolean;
  showCompatibility: boolean;
  showContactInfo: boolean;
}

export interface RoommateSlot {
  id: string;
  propertyId: string;
  slotNumber: number;
  isOccupied: boolean;
  roommateProfile?: RoommateProfile;
  availableFrom?: Date;
  availableUntil?: Date;
}

export interface SharedRoomInfo {
  propertyId: string;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  roommateSlots: RoommateSlot[];
  roomRules: string[];
  sharedAmenities: string[];
}

export interface CompatibilityScore {
  userId: string;
  score: number;
  matchingFactors: string[];
  conflictingFactors: string[];
}

export interface RoommateSearchFilters {
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: 'any' | 'male' | 'female' | 'non_binary';
  lifestyle?: Partial<LifestylePreferences>;
  occupation?: string[];
  moveInDateRange?: {
    start: Date;
    end: Date;
  };
}

// Form types
export interface RoommateProfileFormData {
  bio: string;
  age: number;
  occupation: string;
  lifestyle: LifestylePreferences;
  compatibility: CompatibilityPreferences;
  privacySettings: PrivacySettings;
}

export interface RoommateProfileUpdateData {
  bio?: string;
  age?: number;
  occupation?: string;
  lifestyle?: Partial<LifestylePreferences>;
  compatibility?: Partial<CompatibilityPreferences>;
  privacySettings?: Partial<PrivacySettings>;
}

// API response types
export interface RoommateProfileResponse {
  profile: RoommateProfile | null;
  error: string | null;
}

export interface SharedRoomResponse {
  roomInfo: SharedRoomInfo | null;
  error: string | null;
}

export interface CompatibilityResponse {
  scores: CompatibilityScore[];
  error: string | null;
}