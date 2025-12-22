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
      admin_requests: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          invitation_code: string
          ip_address: string | null
          location: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          invitation_code: string
          ip_address?: string | null
          location?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          invitation_code?: string
          ip_address?: string | null
          location?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cj_token_cache: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          position: number
          shopify_product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          position?: number
          shopify_product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          position?: number
          shopify_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          cj_product_id: string | null
          created_at: string
          id: string
          notes: string | null
          product_cost: number
          shipping_cost: number
          shopify_product_id: string
          updated_at: string
        }
        Insert: {
          cj_product_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_cost?: number
          shipping_cost?: number
          shopify_product_id: string
          updated_at?: string
        }
        Update: {
          cj_product_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_cost?: number
          shipping_cost?: number
          shopify_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_edit_status: {
        Row: {
          about_done: boolean
          all_done: boolean
          color_done: boolean
          created_at: string
          description_done: boolean
          id: string
          images_done: boolean
          model_done: boolean
          offers_done: boolean
          price_done: boolean
          shopify_product_id: string
          tags_done: boolean
          title_done: boolean
          updated_at: string
        }
        Insert: {
          about_done?: boolean
          all_done?: boolean
          color_done?: boolean
          created_at?: string
          description_done?: boolean
          id?: string
          images_done?: boolean
          model_done?: boolean
          offers_done?: boolean
          price_done?: boolean
          shopify_product_id: string
          tags_done?: boolean
          title_done?: boolean
          updated_at?: string
        }
        Update: {
          about_done?: boolean
          all_done?: boolean
          color_done?: boolean
          created_at?: string
          description_done?: boolean
          id?: string
          images_done?: boolean
          model_done?: boolean
          offers_done?: boolean
          price_done?: boolean
          shopify_product_id?: string
          tags_done?: boolean
          title_done?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      product_offers: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          low_stock_active: boolean | null
          low_stock_threshold: number | null
          offer_active: boolean | null
          offer_end_date: string | null
          offer_text: string | null
          original_price: number | null
          promo_active: boolean | null
          promo_subtext: string | null
          promo_text: string | null
          shopify_product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          low_stock_active?: boolean | null
          low_stock_threshold?: number | null
          offer_active?: boolean | null
          offer_end_date?: string | null
          offer_text?: string | null
          original_price?: number | null
          promo_active?: boolean | null
          promo_subtext?: string | null
          promo_text?: string | null
          shopify_product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          low_stock_active?: boolean | null
          low_stock_threshold?: number | null
          offer_active?: boolean | null
          offer_end_date?: string | null
          offer_text?: string | null
          original_price?: number | null
          promo_active?: boolean | null
          promo_subtext?: string | null
          promo_text?: string | null
          shopify_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_option_aliases: {
        Row: {
          created_at: string
          display_name: string
          id: string
          original_name: string
          shopify_product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          original_name: string
          shopify_product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          original_name?: string
          shopify_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_overrides: {
        Row: {
          created_at: string
          description: string | null
          id: string
          price: number | null
          price_enabled: boolean
          shopify_product_id: string
          subtitle: string | null
          title: string | null
          title_separator: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          price_enabled?: boolean
          shopify_product_id: string
          subtitle?: string | null
          title?: string | null
          title_separator?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          price_enabled?: boolean
          shopify_product_id?: string
          subtitle?: string | null
          title?: string | null
          title_separator?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          shopify_product_id: string
          title: string | null
          updated_at: string
          user_id: string | null
          user_name: string
          verified_purchase: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          shopify_product_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          user_name: string
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          shopify_product_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
      product_size_conversions: {
        Row: {
          asian_size: string
          created_at: string
          id: string
          local_size: string
          notes: string | null
          shopify_product_id: string
          size_type: string
          updated_at: string
        }
        Insert: {
          asian_size: string
          created_at?: string
          id?: string
          local_size: string
          notes?: string | null
          shopify_product_id: string
          size_type?: string
          updated_at?: string
        }
        Update: {
          asian_size?: string
          created_at?: string
          id?: string
          local_size?: string
          notes?: string | null
          shopify_product_id?: string
          size_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_tag_assignments: {
        Row: {
          created_at: string
          id: string
          shopify_product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shopify_product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shopify_product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string
          group_name: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          group_name?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_test_ratings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          rating: string
          shopify_product_id: string
          tester_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          rating: string
          shopify_product_id: string
          tester_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          rating?: string
          shopify_product_id?: string
          tester_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tester_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_admin_request_status: {
        Row: {
          created_at: string | null
          id: string | null
          reviewed_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
