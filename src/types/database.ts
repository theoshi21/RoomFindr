export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      landlord_verifications: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          landlord_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          landlord_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          landlord_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_verifications_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          amenities: string[]
          availability_end_date: string | null
          availability_start_date: string | null
          available_days: string[]
          cancellation_policy: string
          city: string
          cleaning_policy: string
          coordinates: unknown | null
          created_at: string
          current_occupancy: number
          custom_policies: string[]
          deposit: number
          description: string
          guest_policy: string
          id: string
          images: string[]
          is_active: boolean
          landlord_id: string
          max_occupancy: number
          pet_policy: string
          postal_code: string
          price: number
          province: string
          room_type: Database["public"]["Enums"]["room_type"]
          smoking_policy: string
          street: string
          title: string
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          availability_end_date?: string | null
          availability_start_date?: string | null
          available_days?: string[]
          cancellation_policy?: string
          city: string
          cleaning_policy?: string
          coordinates?: unknown | null
          created_at?: string
          current_occupancy?: number
          custom_policies?: string[]
          deposit: number
          description: string
          guest_policy?: string
          id?: string
          images?: string[]
          is_active?: boolean
          landlord_id: string
          max_occupancy?: number
          pet_policy?: string
          postal_code: string
          price: number
          province: string
          room_type: Database["public"]["Enums"]["room_type"]
          smoking_policy?: string
          street: string
          title: string
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          availability_end_date?: string | null
          availability_start_date?: string | null
          available_days?: string[]
          cancellation_policy?: string
          city?: string
          cleaning_policy?: string
          coordinates?: unknown | null
          created_at?: string
          current_occupancy?: number
          custom_policies?: string[]
          deposit?: number
          description?: string
          guest_policy?: string
          id?: string
          images?: string[]
          is_active?: boolean
          landlord_id?: string
          max_occupancy?: number
          pet_policy?: string
          postal_code?: string
          price?: number
          province?: string
          room_type?: Database["public"]["Enums"]["room_type"]
          smoking_policy?: string
          street?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          deposit_amount: number
          end_date: string | null
          id: string
          landlord_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          property_id: string
          start_date: string
          status: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount: number
          end_date?: string | null
          id?: string
          landlord_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id: string
          start_date: string
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number
          end_date?: string | null
          id?: string
          landlord_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_verified: boolean
          landlord_id: string
          property_id: string
          rating: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_verified?: boolean
          landlord_id: string
          property_id: string
          rating: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          landlord_id?: string
          property_id?: string
          rating?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_profiles: {
        Row: {
          age: number | null
          avatar: string | null
          bio: string | null
          compatibility: Json
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          lifestyle: Json
          move_in_date: string
          move_out_date: string | null
          occupation: string | null
          privacy_settings: Json
          property_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar?: string | null
          bio?: string | null
          compatibility?: Json
          created_at?: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          lifestyle?: Json
          move_in_date?: string
          move_out_date?: string | null
          occupation?: string | null
          privacy_settings?: Json
          property_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar?: string | null
          bio?: string | null
          compatibility?: Json
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          lifestyle?: Json
          move_in_date?: string
          move_out_date?: string | null
          occupation?: string | null
          privacy_settings?: Json
          property_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roommate_profiles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roommate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string
          payment_reference: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method: string
          payment_reference?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          payment_reference?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_verified: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          is_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          uploaded_at: string
          verification_id: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string
          verification_id: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "landlord_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_templates: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          default_value: string
          is_system_template: boolean
          landlord_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          default_value?: string
          is_system_template?: boolean
          landlord_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          default_value?: string
          is_system_template?: boolean
          landlord_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_templates_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      property_policies: {
        Row: {
          id: string
          property_id: string
          policy_id: string
          custom_value: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          policy_id: string
          custom_value?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          policy_id?: string
          custom_value?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_policies_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      policy_updates: {
        Row: {
          id: string
          property_id: string
          policy_id: string
          old_value: string
          new_value: string
          updated_by: string
          updated_at: string
          notification_sent: boolean
        }
        Insert: {
          id?: string
          property_id: string
          policy_id: string
          old_value: string
          new_value: string
          updated_by: string
          updated_at?: string
          notification_sent?: boolean
        }
        Update: {
          id?: string
          property_id?: string
          policy_id?: string
          old_value?: string
          new_value?: string
          updated_by?: string
          updated_at?: string
          notification_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "policy_updates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_updates_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policy_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      rental_agreements: {
        Row: {
          id: string
          reservation_id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          policies: Json
          terms_accepted: boolean
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          policies?: Json
          terms_accepted?: boolean
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          property_id?: string
          tenant_id?: string
          landlord_id?: string
          policies?: Json
          terms_accepted?: boolean
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_agreements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_agreements_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_agreements_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_property_rating: {
        Args: { p_property_id: string }
        Returns: Json
      }
      can_user_review_property: {
        Args: { p_property_id: string; p_user_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      search_properties: {
        Args: {
          p_amenities?: string[]
          p_city?: string
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_offset?: number
          p_price_max?: number
          p_price_min?: number
          p_province?: string
          p_radius_km?: number
          p_room_types?: Database["public"]["Enums"]["room_type"][]
        }
        Returns: {
          amenities: string[]
          city: string
          current_occupancy: number
          deposit: number
          description: string
          distance_km: number
          id: string
          images: string[]
          max_occupancy: number
          price: number
          province: string
          room_type: Database["public"]["Enums"]["room_type"]
          street: string
          title: string
        }[]
      }
      get_user_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      document_type: "id" | "business_permit" | "property_deed" | "other"
      notification_type:
        | "reservation"
        | "payment"
        | "announcement"
        | "verification"
      payment_status: "pending" | "paid" | "refunded"
      reservation_status: "pending" | "confirmed" | "cancelled" | "completed"
      room_type: "single" | "shared" | "studio" | "apartment"
      transaction_status: "pending" | "completed" | "failed"
      transaction_type: "deposit" | "payment" | "refund"
      user_role: "admin" | "tenant" | "landlord"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_type: ["id", "business_permit", "property_deed", "other"],
      notification_type: [
        "reservation",
        "payment",
        "announcement",
        "verification",
      ],
      payment_status: ["pending", "paid", "refunded"],
      reservation_status: ["pending", "confirmed", "cancelled", "completed"],
      room_type: ["single", "shared", "studio", "apartment"],
      transaction_status: ["pending", "completed", "failed"],
      transaction_type: ["deposit", "payment", "refund"],
      user_role: ["admin", "tenant", "landlord"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const