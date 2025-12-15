// User Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'tenant' | 'landlord';
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVerified: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  theme: 'light' | 'dark';
}

// Authentication Types
export interface UserRegistration {
  email: string;
  password: string;
  role: 'tenant' | 'landlord';
  profile: Omit<UserProfile, 'avatar' | 'bio' | 'preferences'>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: unknown;
  error?: string;
}

// Landlord Verification Types
export interface LandlordVerification {
  id: string;
  landlordId: string;
  documents: VerificationDocument[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  feedback?: string;
}

export interface VerificationDocument {
  id: string;
  type: 'id' | 'business_permit' | 'property_deed' | 'other';
  filename: string;
  url: string;
  uploadedAt: Date;
}

export interface VerificationDocuments {
  documents: File[];
  documentTypes: string[];
}

export interface VerificationStatus {
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
}

// Re-export all types from other modules
export * from './auth'
export * from './profile'
export * from './property'
export * from './reservation'
export * from './admin'
export * from './roommate'
export * from './review'

// Notification types - avoid conflicts with existing types
export type {
  Notification as NotificationData,
  NotificationPreferences,
  CreateNotificationData,
  NotificationFilters,
  AnnouncementData as NotificationAnnouncementData
} from './notification'