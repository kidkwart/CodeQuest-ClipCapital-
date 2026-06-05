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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      expense_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          entry_date: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          entry_date?: string
          id?: string
          note?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          entry_date?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          amount: number
          created_at: string
          entry_date: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          entry_date?: string
          id?: string
          note?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          entry_date?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          amount: number
          balance: number
          created_at: string
          decision_note: string
          disbursed_at: string | null
          id: string
          interest_rate: number | null
          purpose: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          term_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          balance?: number
          created_at?: string
          decision_note?: string
          disbursed_at?: string | null
          id?: string
          interest_rate?: number | null
          purpose?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          term_months: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance?: number
          created_at?: string
          decision_note?: string
          disbursed_at?: string | null
          id?: string
          interest_rate?: number | null
          purpose?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          term_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_repayments: {
        Row: {
          amount: number
          created_at: string
          id: string
          loan_id: string
          momo_provider: string
          momo_reference: string
          paid_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loan_id: string
          momo_provider?: string
          momo_reference?: string
          paid_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loan_id?: string
          momo_provider?: string
          momo_reference?: string
          paid_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          qty: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          qty: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          qty?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          loan_id: string | null
          momo_provider: string
          momo_reference: string
          payment_method: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          loan_id?: string | null
          momo_provider?: string
          momo_reference?: string
          payment_method?: string | null
          status?: string
          total: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          loan_id?: string | null
          momo_provider?: string
          momo_reference?: string
          payment_method?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      product_requests: {
        Row: {
          created_at: string | null
          estimated_price: number | null
          id: string
          note: string | null
          product_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          note?: string | null
          product_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          note?: string | null
          product_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
          stock: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name: string
          price: number
          stock?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          price?: number
          stock?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string
          business_type: string | null
          clip_score: number
          created_at: string
          display_name: string
          id: string
          location: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string
          business_type?: string | null
          clip_score?: number
          created_at?: string
          display_name?: string
          id: string
          location?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string
          business_type?: string | null
          clip_score?: number
          created_at?: string
          display_name?: string
          id?: string
          location?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      susu_contributions: {
        Row: {
          amount: number
          created_at: string
          cycle_index: number
          group_id: string
          id: string
          momo_provider: string
          momo_reference: string
          paid_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          cycle_index?: number
          group_id: string
          id?: string
          momo_provider?: string
          momo_reference?: string
          paid_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          cycle_index?: number
          group_id?: string
          id?: string
          momo_provider?: string
          momo_reference?: string
          paid_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "susu_contributions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "susu_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      susu_groups: {
        Row: {
          contribution: number
          created_at: string
          cycle_index: number
          frequency: string
          id: string
          invite_code: string
          members_count: number
          name: string
          next_payout_date: string | null
          owner_id: string
          pot: number
          start_date: string
          status: string
        }
        Insert: {
          contribution: number
          created_at?: string
          cycle_index?: number
          frequency: string
          id?: string
          invite_code?: string
          members_count?: number
          name: string
          next_payout_date?: string | null
          owner_id: string
          pot?: number
          start_date?: string
          status?: string
        }
        Update: {
          contribution?: number
          created_at?: string
          cycle_index?: number
          frequency?: string
          id?: string
          invite_code?: string
          members_count?: number
          name?: string
          next_payout_date?: string | null
          owner_id?: string
          pot?: number
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      susu_memberships: {
        Row: {
          group_id: string
          has_received: boolean
          id: string
          joined_at: string
          payout_order: number
          user_id: string
        }
        Insert: {
          group_id: string
          has_received?: boolean
          id?: string
          joined_at?: string
          payout_order?: number
          user_id: string
        }
        Update: {
          group_id?: string
          has_received?: boolean
          id?: string
          joined_at?: string
          payout_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "susu_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "susu_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      susu_payouts: {
        Row: {
          amount: number
          created_at: string
          cycle_index: number
          group_id: string
          id: string
          momo_reference: string
          paid_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          cycle_index?: number
          group_id: string
          id?: string
          momo_reference?: string
          paid_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          cycle_index?: number
          group_id?: string
          id?: string
          momo_reference?: string
          paid_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "susu_payouts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "susu_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendor" | "user"
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
      app_role: ["admin", "vendor", "user"],
    },
  },
} as const
