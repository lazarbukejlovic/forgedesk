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
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          first_name: string
          id: string
          is_default: boolean
          label: string | null
          last_name: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          first_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          last_name: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          last_name?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bundle_products: {
        Row: {
          bundle_id: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          bundle_id: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_products_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string
          discount_pct: number
          id: string
          image: string
          is_active: boolean
          is_featured: boolean
          name: string
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_pct?: number
          id?: string
          image: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_pct?: number
          id?: string
          image?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          bundle_id: string | null
          bundle_name: string | null
          created_at: string
          id: string
          product_id: string
          quantity: number
          unit_price_cents: number
          updated_at: string
          user_id: string
          variant_key: string
          variant_label: string
        }
        Insert: {
          bundle_id?: string | null
          bundle_name?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          unit_price_cents: number
          updated_at?: string
          user_id: string
          variant_key?: string
          variant_label?: string
        }
        Update: {
          bundle_id?: string | null
          bundle_name?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price_cents?: number
          updated_at?: string
          user_id?: string
          variant_key?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          amount_off_cents: number | null
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          min_subtotal_cents: number
          percent_off: number | null
          redemption_count: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          amount_off_cents?: number | null
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_subtotal_cents?: number
          percent_off?: number | null
          redemption_count?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_off_cents?: number | null
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_subtotal_cents?: number
          percent_off?: number | null
          redemption_count?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          bundle_name: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_label: string
        }
        Insert: {
          bundle_name?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_label?: string
        }
        Update: {
          bundle_name?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
          variant_label?: string
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
          created_at: string
          discount_cents: number
          discount_code: string | null
          email: string
          id: string
          placed_at: string | null
          shipping_address: Json | null
          shipping_cents: number
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_cents?: number
          discount_code?: string | null
          email: string
          id?: string
          placed_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_cents?: number
          discount_code?: string | null
          email?: string
          id?: string
          placed_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specs: {
        Row: {
          id: string
          label: string
          product_id: string
          sort_order: number
          value: string
        }
        Insert: {
          id?: string
          label: string
          product_id: string
          sort_order?: number
          value: string
        }
        Update: {
          id?: string
          label?: string
          product_id?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          axis: string
          created_at: string
          id: string
          option_key: string
          option_label: string
          price_delta_cents: number
          product_id: string
          sort_order: number
          stock_count: number
          swatch: string | null
        }
        Insert: {
          axis: string
          created_at?: string
          id?: string
          option_key: string
          option_label: string
          price_delta_cents?: number
          product_id: string
          sort_order?: number
          stock_count?: number
          swatch?: string | null
        }
        Update: {
          axis?: string
          created_at?: string
          id?: string
          option_key?: string
          option_label?: string
          price_delta_cents?: number
          product_id?: string
          sort_order?: number
          stock_count?: number
          swatch?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badges: string[]
          bundle_savings_eligible: boolean
          category_id: string | null
          compare_at_cents: number | null
          compatibility: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_cents: number
          primary_image: string
          rating: number
          review_count: number
          setup_group: Database["public"]["Enums"]["setup_group"]
          short_description: string | null
          slug: string
          stock_count: number
          updated_at: string
        }
        Insert: {
          badges?: string[]
          bundle_savings_eligible?: boolean
          category_id?: string | null
          compare_at_cents?: number | null
          compatibility?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_cents: number
          primary_image: string
          rating?: number
          review_count?: number
          setup_group?: Database["public"]["Enums"]["setup_group"]
          short_description?: string | null
          slug: string
          stock_count?: number
          updated_at?: string
        }
        Update: {
          badges?: string[]
          bundle_savings_eligible?: boolean
          category_id?: string | null
          compare_at_cents?: number | null
          compatibility?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_cents?: number
          primary_image?: string
          rating?: number
          review_count?: number
          setup_group?: Database["public"]["Enums"]["setup_group"]
          short_description?: string | null
          slug?: string
          stock_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          product_id: string
          rating: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_setup_items: {
        Row: {
          id: string
          product_id: string
          setup_id: string
          variant_key: string
          variant_label: string
        }
        Insert: {
          id?: string
          product_id: string
          setup_id: string
          variant_key?: string
          variant_label?: string
        }
        Update: {
          id?: string
          product_id?: string
          setup_id?: string
          variant_key?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_setup_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_setup_items_setup_id_fkey"
            columns: ["setup_id"]
            isOneToOne: false
            referencedRelation: "saved_setups"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_setups: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_stale_pending_orders: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status:
        | "pending"
        | "paid"
        | "fulfilled"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      setup_group:
        | "surface"
        | "stands"
        | "lighting"
        | "organization"
        | "accessories"
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
      app_role: ["admin", "customer"],
      order_status: [
        "pending",
        "paid",
        "fulfilled",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      setup_group: [
        "surface",
        "stands",
        "lighting",
        "organization",
        "accessories",
      ],
    },
  },
} as const
