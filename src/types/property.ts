// Property Types
export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  address: Address;
  roomType: 'single' | 'shared' | 'studio' | 'apartment';
  price: number;
  deposit: number;
  amenities: string[];
  images: string[];
  availability: AvailabilitySchedule;
  policies: RentalPolicies;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AvailabilitySchedule {
  startDate: Date;
  endDate?: Date;
  availableDays: string[];
  maxOccupancy: number;
  currentOccupancy: number;
}

export interface RentalPolicies {
  petPolicy: string;
  smokingPolicy: string;
  guestPolicy: string;
  cleaningPolicy: string;
  cancellationPolicy: string;
  customPolicies: string[];
}

// Property Management Types
export interface PropertyListing {
  title: string;
  description: string;
  address: Address;
  roomType: Property['roomType'];
  price: number;
  deposit: number;
  amenities: string[];
  policies: RentalPolicies;
  availability: AvailabilitySchedule;
}

export interface PropertyUpdate {
  title?: string;
  description?: string;
  price?: number;
  deposit?: number;
  amenities?: string[];
  policies?: RentalPolicies;
  availability?: AvailabilitySchedule;
  isActive?: boolean;
}

// Search Types
export interface SearchFilters {
  priceRange?: {
    min: number;
    max: number;
  };
  location?: {
    city?: string;
    province?: string;
    radius?: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  roomType?: Property['roomType'][];
  amenities?: string[];
  availability?: {
    startDate: Date;
    endDate?: Date;
  };
}