// Fixed database types for RoomFindr
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'tenant' | 'landlord'
          is_active: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'tenant' | 'landlord'
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'tenant' | 'landlord'
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: 'reservation' | 'payment' | 'announcement' | 'verification'
          title: string
          message: string
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: 'reservation' | 'payment' | 'announcement' | 'verification'
          title: string
          message: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: 'reservation' | 'payment' | 'announcement' | 'verification'
          title?: string
          message?: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          phone: string | null
          avatar: string | null
          bio: string | null
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          phone?: string | null
          avatar?: string | null
          bio?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          avatar?: string | null
          bio?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          landlord_id: string
          title: string
          description: string
          street: string
          city: string
          province: string
          postal_code: string
          coordinates: unknown | null
          room_type: 'single' | 'shared' | 'studio' | 'apartment'
          price: number
          deposit: number
          amenities: string[]
          images: string[]
          max_occupancy: number
          current_occupancy: number
          availability_start_date: string | null
          availability_end_date: string | null
          available_days: string[]
          pet_policy: string
          smoking_policy: string
          guest_policy: string
          cleaning_policy: string
          cancellation_policy: string
          custom_policies: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          title: string
          description: string
          street: string
          city: string
          province: string
          postal_code: string
          coordinates?: unknown | null
          room_type: 'single' | 'shared' | 'studio' | 'apartment'
          price: number
          deposit: number
          amenities?: string[]
          images?: string[]
          max_occupancy?: number
          current_occupancy?: number
          availability_start_date?: string | null
          availability_end_date?: string | null
          available_days?: string[]
          pet_policy?: string
          smoking_policy?: string
          guest_policy?: string
          cleaning_policy?: string
          cancellation_policy?: string
          custom_policies?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string
          title?: string
          description?: string
          street?: string
          city?: string
          province?: string
          postal_code?: string
          coordinates?: unknown | null
          room_type?: 'single' | 'shared' | 'studio' | 'apartment'
          price?: number
          deposit?: number
          amenities?: string[]
          images?: string[]
          max_occupancy?: number
          current_occupancy?: number
          availability_start_date?: string | null
          availability_end_date?: string | null
          available_days?: string[]
          pet_policy?: string
          smoking_policy?: string
          guest_policy?: string
          cleaning_policy?: string
          cancellation_policy?: string
          custom_policies?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          start_date: string
          end_date: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'pending' | 'paid' | 'refunded'
          total_amount: number
          deposit_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          landlord_id: string
          start_date: string
          end_date?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          total_amount: number
          deposit_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          landlord_id?: string
          start_date?: string
          end_date?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          total_amount?: number
          deposit_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          reservation_id: string
          user_id: string
          transaction_type: 'deposit' | 'payment' | 'refund'
          amount: number
          status: 'pending' | 'completed' | 'failed'
          payment_method: string
          payment_reference: string | null
          transaction_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          user_id: string
          transaction_type: 'deposit' | 'payment' | 'refund'
          amount: number
          status?: 'pending' | 'completed' | 'failed'
          payment_method: string
          payment_reference?: string | null
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          user_id?: string
          transaction_type?: 'deposit' | 'payment' | 'refund'
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string
          payment_reference?: string | null
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      landlord_verifications: {
        Row: {
          id: string
          landlord_id: string
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      verification_documents: {
        Row: {
          id: string
          verification_id: string
          document_type: 'id' | 'business_permit' | 'property_deed' | 'other'
          filename: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          document_type: 'id' | 'business_permit' | 'property_deed' | 'other'
          filename: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          document_type?: 'id' | 'business_permit' | 'property_deed' | 'other'
          filename?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          rating: number
          comment: string
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          landlord_id: string
          rating: number
          comment: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          landlord_id?: string
          rating?: number
          comment?: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']