export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bill_items: {
        Row: {
          created_at: string
          gst_amount: number
          gst_rate: number
          id: string
          product_name: string
          quantity: number
          scanned_bill_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          gst_amount?: number
          gst_rate?: number
          id?: string
          product_name: string
          quantity?: number
          scanned_bill_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          gst_amount?: number
          gst_rate?: number
          id?: string
          product_name?: string
          quantity?: number
          scanned_bill_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_scanned_bill_id_fkey"
            columns: ["scanned_bill_id"]
            isOneToOne: false
            referencedRelation: "scanned_bills"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_logs: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          lead_id: string
          lead_order_item_id: string | null
          note: string | null
          to_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id: string
          lead_order_item_id?: string | null
          note?: string | null
          to_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id?: string
          lead_order_item_id?: string | null
          note?: string | null
          to_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_logs_lead_order_item_id_fkey"
            columns: ["lead_order_item_id"]
            isOneToOne: false
            referencedRelation: "lead_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_order_items: {
        Row: {
          bill_price: number | null
          created_at: string
          id: string
          lead_order_id: string
          procurement_price: number | null
          product_name: string
          product_sku: string
          quantity: number
          status: Database["public"]["Enums"]["order_item_status"]
          total_gst: number
          total_value: number
          updated_at: string
        }
        Insert: {
          bill_price?: number | null
          created_at?: string
          id?: string
          lead_order_id: string
          procurement_price?: number | null
          product_name: string
          product_sku: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_item_status"]
          total_gst?: number
          total_value?: number
          updated_at?: string
        }
        Update: {
          bill_price?: number | null
          created_at?: string
          id?: string
          lead_order_id?: string
          procurement_price?: number | null
          product_name?: string
          product_sku?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_item_status"]
          total_gst?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_order_items_lead_order_id_fkey"
            columns: ["lead_order_id"]
            isOneToOne: false
            referencedRelation: "lead_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_orders: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          order_no: string
          total_gst: number
          total_items: number
          total_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          order_no: string
          total_gst?: number
          total_items?: number
          total_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          order_no?: string
          total_gst?: number
          total_items?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          created_at: string
          date_closed: string | null
          date_open: string
          email: string | null
          from_source: Database["public"]["Enums"]["lead_source"]
          gstin: string | null
          id: string
          lead_id: string
          name: string
          notes: string | null
          organisation_id: string
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_closed?: string | null
          date_open?: string
          email?: string | null
          from_source?: Database["public"]["Enums"]["lead_source"]
          gstin?: string | null
          id?: string
          lead_id: string
          name: string
          notes?: string | null
          organisation_id: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_closed?: string | null
          date_open?: string
          email?: string | null
          from_source?: Database["public"]["Enums"]["lead_source"]
          gstin?: string | null
          id?: string
          lead_id?: string
          name?: string
          notes?: string | null
          organisation_id?: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_subscriptions: {
        Row: {
          created_at: string
          current_leads_count: number
          expiry_date: string
          id: string
          no_of_leads: number
          organisation_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          razorpay_payment_id: string | null
          razorpay_payment_link: string | null
          start_date: string
          subscription_type_id: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_leads_count?: number
          expiry_date: string
          id?: string
          no_of_leads?: number
          organisation_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          razorpay_payment_id?: string | null
          razorpay_payment_link?: string | null
          start_date?: string
          subscription_type_id: string
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_leads_count?: number
          expiry_date?: string
          id?: string
          no_of_leads?: number
          organisation_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          razorpay_payment_id?: string | null
          razorpay_payment_link?: string | null
          start_date?: string
          subscription_type_id?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_subscriptions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_subscriptions_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          dob: string | null
          id: string
          is_active: boolean
          name: string
          organisation_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          dob?: string | null
          id: string
          is_active?: boolean
          name: string
          organisation_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organisation_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      scanned_bills: {
        Row: {
          bill_date: string
          bill_number: string
          created_at: string
          gst_amount: number
          id: string
          items: Json | null
          lead_id: string
          scanned_image_url: string | null
          total_amount: number
        }
        Insert: {
          bill_date: string
          bill_number: string
          created_at?: string
          gst_amount?: number
          id?: string
          items?: Json | null
          lead_id: string
          scanned_image_url?: string | null
          total_amount?: number
        }
        Update: {
          bill_date?: string
          bill_number?: string
          created_at?: string
          gst_amount?: number
          id?: string
          items?: Json | null
          lead_id?: string
          scanned_image_url?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "scanned_bills_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      subscription_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          no_of_leads: number
          price: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          no_of_leads?: number
          price?: number
          updated_at?: string
          validity_days?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          no_of_leads?: number
          price?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_lead_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organisation_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_organisation_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "organisation_admin" | "manager" | "sales_person"
      lead_source:
        | "email"
        | "whatsapp"
        | "phone"
        | "website"
        | "referral"
        | "social_media"
        | "other"
      lead_status:
        | "new"
        | "order_placed"
        | "procurement_sent"
        | "procurement_waiting"
        | "procurement_approved"
        | "bill_generated"
        | "closed"
        | "partial_procurement_sent"
        | "partial_procurement_waiting"
        | "partial_procurement_approved"
      order_item_status:
        | "procurement_sent"
        | "procurement_waiting"
        | "procurement_approved"
        | "bill_generated"
        | "closed"
      payment_status: "pending" | "paid" | "failed" | "expired"
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
      app_role: ["admin", "organisation_admin", "manager", "sales_person"],
      lead_source: [
        "email",
        "whatsapp",
        "phone",
        "website",
        "referral",
        "social_media",
        "other",
      ],
      lead_status: [
        "new",
        "order_placed",
        "procurement_sent",
        "procurement_waiting",
        "procurement_approved",
        "bill_generated",
        "closed",
        "partial_procurement_sent",
        "partial_procurement_waiting",
        "partial_procurement_approved",
      ],
      order_item_status: [
        "procurement_sent",
        "procurement_waiting",
        "procurement_approved",
        "bill_generated",
        "closed",
      ],
      payment_status: ["pending", "paid", "failed", "expired"],
    },
  },
} as const
