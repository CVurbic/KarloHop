export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          client_ip: string
          endpoint: string
          id: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          client_ip: string
          endpoint: string
          id?: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          client_ip?: string
          endpoint?: string
          id?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          add_table_set: boolean | null
          additional_notes: string | null
          booking_end_date: string | null
          booking_start_date: string
          created_at: string | null
          delivery_address: string | null
          email: string | null
          google_calendar_event_id: string | null
          id: string
          multiple_days: boolean | null
          name: string
          phone: string | null
          price: number | null
          selected_bounce_house: string | null
          status: string
          surname: string
        }
        Insert: {
          add_table_set?: boolean | null
          additional_notes?: string | null
          booking_end_date?: string | null
          booking_start_date?: string
          created_at?: string | null
          delivery_address?: string | null
          email?: string | null
          google_calendar_event_id?: string | null
          id?: string
          multiple_days?: boolean | null
          name: string
          phone?: string | null
          price?: number | null
          selected_bounce_house?: string | null
          status?: string
          surname: string
        }
        Update: {
          add_table_set?: boolean | null
          additional_notes?: string | null
          booking_end_date?: string | null
          booking_start_date?: string
          created_at?: string | null
          delivery_address?: string | null
          email?: string | null
          google_calendar_event_id?: string | null
          id?: string
          multiple_days?: boolean | null
          name?: string
          phone?: string | null
          price?: number | null
          selected_bounce_house?: string | null
          status?: string
          surname?: string
        }
        Relationships: []
      }
      booking_reports: {
        Row: {
          id: string
          booking_id: string
          klinovi_count: number | null
          delivery_note: string | null
          delivery_photo_paths: string[]
          delivered_at: string | null
          delivered_by: string | null
          pickup_condition: string | null
          pickup_note: string | null
          pickup_photo_paths: string[]
          picked_up_at: string | null
          picked_up_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          klinovi_count?: number | null
          delivery_note?: string | null
          delivery_photo_paths?: string[]
          delivered_at?: string | null
          delivered_by?: string | null
          pickup_condition?: string | null
          pickup_note?: string | null
          pickup_photo_paths?: string[]
          picked_up_at?: string | null
          picked_up_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          klinovi_count?: number | null
          delivery_note?: string | null
          delivery_photo_paths?: string[]
          delivered_at?: string | null
          delivered_by?: string | null
          pickup_condition?: string | null
          pickup_note?: string | null
          pickup_photo_paths?: string[]
          picked_up_at?: string | null
          picked_up_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          category: string
          amount: number
          description: string | null
          expense_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          category: string
          amount: number
          description?: string | null
          expense_date?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          category?: string
          amount?: number
          description?: string | null
          expense_date?: string
          created_at?: string | null
        }
        Relationships: []
      }
      mr_hop_chat_logs: {
        Row: {
          id: string
          conversation_id: string
          transcript: Json
          message_count: number
          booking: Json | null
          booking_created: boolean
          is_test: boolean
          ip: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          transcript?: Json
          message_count?: number
          booking?: Json | null
          booking_created?: boolean
          is_test?: boolean
          ip?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          transcript?: Json
          message_count?: number
          booking?: Json | null
          booking_created?: boolean
          is_test?: boolean
          ip?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          id: string
          key: string
          label: string
          body: string
          placeholders: string[]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          label: string
          body: string
          placeholders?: string[]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          label?: string
          body?: string
          placeholders?: string[]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
          updated_at: string | null
        }
        Insert: {
          key: string
          value: string
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_availability_safe: {
        Args: {
          bounce_house_name: string
          check_end_date: string
          check_start_date: string
        }
        Returns: {
          unavailable_date: string
        }[]
      }
      check_bounce_house_availability: {
        Args: {
          bounce_house_name: string
          check_end_date: string
          check_start_date: string
        }
        Returns: {
          booking_id: string
          unavailable_date: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_client_ip: string
          p_endpoint: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "radnik"
    }
    CompositeTypes: {
      [_ in never]: never
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
      app_role: ["admin", "moderator", "user", "radnik"],
    },
  },
} as const
