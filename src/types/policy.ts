// Policy Types
export interface CustomPolicy {
  id: string;
  title: string;
  description: string;
  category: PolicyCategory;
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyPolicy {
  id: string;
  propertyId: string;
  policyId: string;
  customValue?: string; // For policies that allow custom values
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  policy?: CustomPolicy; // Populated when fetching
}

export interface PolicyTemplate {
  id: string;
  title: string;
  description: string;
  category: PolicyCategory;
  defaultValue: string;
  isSystemTemplate: boolean;
  landlordId?: string; // null for system templates
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyUpdate {
  id: string;
  propertyId: string;
  policyId: string;
  oldValue: string;
  newValue: string;
  updatedBy: string;
  updatedAt: Date;
  notificationSent: boolean;
}

export type PolicyCategory = 
  | 'rental_terms'
  | 'house_rules'
  | 'maintenance'
  | 'security'
  | 'utilities'
  | 'guest_policy'
  | 'pet_policy'
  | 'smoking_policy'
  | 'cleaning_policy'
  | 'cancellation_policy'
  | 'custom';

export interface PolicyFormData {
  title: string;
  description: string;
  category: PolicyCategory;
  isRequired: boolean;
  defaultValue?: string;
}

export interface PropertyPolicyFormData {
  policyId: string;
  customValue?: string;
  isActive: boolean;
}

// Policy display and management interfaces
export interface PolicyDisplayProps {
  policies: PropertyPolicy[];
  showCategory?: boolean;
  showActions?: boolean;
  onEdit?: (policy: PropertyPolicy) => void;
  onDelete?: (policyId: string) => void;
}

export interface PolicyManagerProps {
  propertyId?: string;
  landlordId: string;
  mode: 'create' | 'edit' | 'view';
  onSave?: (policies: PropertyPolicy[]) => void;
  onCancel?: () => void;
}

// Notification types for policy updates
export interface PolicyNotification {
  id: string;
  propertyId: string;
  tenantId: string;
  policyUpdateId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Integration with rental agreements
export interface RentalAgreementPolicy {
  policyId: string;
  title: string;
  description: string;
  category: PolicyCategory;
  value: string;
  isRequired: boolean;
  acceptedAt?: Date;
  acceptedBy?: string;
}

export interface RentalAgreement {
  id: string;
  reservationId: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  policies: RentalAgreementPolicy[];
  termsAccepted: boolean;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}