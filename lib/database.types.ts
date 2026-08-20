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
      activities: {
        Row: {
          address: string | null
          age_max: number | null
          age_min: number | null
          category_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          image_url: string | null
          location: unknown
          municipality_id: string | null
          organization_id: string | null
          price: string | null
          recurrence_note: string | null
          slug: string
          start_time: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          url: string | null
          weekday: number | null
        }
        Insert: {
          address?: string | null
          age_max?: number | null
          age_min?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          location?: unknown
          municipality_id?: string | null
          organization_id?: string | null
          price?: string | null
          recurrence_note?: string | null
          slug: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          url?: string | null
          weekday?: number | null
        }
        Update: {
          address?: string | null
          age_max?: number | null
          age_min?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          location?: unknown
          municipality_id?: string | null
          organization_id?: string | null
          price?: string | null
          recurrence_note?: string | null
          slug?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          url?: string | null
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          age_max: number | null
          age_min: number | null
          category_id: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          location: unknown
          municipality_id: string | null
          organization_id: string | null
          price: string | null
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          address?: string | null
          age_max?: number | null
          age_min?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          location?: unknown
          municipality_id?: string | null
          organization_id?: string | null
          price?: string | null
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          address?: string | null
          age_max?: number | null
          age_min?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          location?: unknown
          municipality_id?: string | null
          organization_id?: string | null
          price?: string | null
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          center: unknown
          county: string | null
          created_at: string
          id: string
          kommunenummer: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          center?: unknown
          county?: string | null
          created_at?: string
          id?: string
          kommunenummer: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          center?: unknown
          county?: string | null
          created_at?: string
          id?: string
          kommunenummer?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          location: unknown
          logo_url: string | null
          municipality_id: string | null
          name: string
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          location?: unknown
          logo_url?: string | null
          municipality_id?: string | null
          name: string
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          location?: unknown
          logo_url?: string | null
          municipality_id?: string | null
          name?: string
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      municipalities_view: {
        Row: {
          county: string | null
          id: string | null
          kommunenummer: string | null
          lat: number | null
          lng: number | null
          name: string | null
          slug: string | null
        }
        Insert: {
          county?: string | null
          id?: string | null
          kommunenummer?: string | null
          lat?: never
          lng?: never
          name?: string | null
          slug?: string | null
        }
        Update: {
          county?: string | null
          id?: string | null
          kommunenummer?: string | null
          lat?: never
          lng?: never
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      municipality_analytics_30d: {
        Args: { p_municipality: string }
        Returns: {
          activity_views: number
          event_views: number
          organization_views: number
          previous_total_views: number
          total_views: number
        }[]
      }
      org_analytics_30d: {
        Args: { p_org: string }
        Returns: {
          activity_views: number
          event_views: number
          organization_views: number
          previous_total_views: number
          total_views: number
        }[]
      }
      platform_analytics_30d: {
        Args: Record<PropertyKey, never>
        Returns: {
          activity_views: number
          event_views: number
          organization_views: number
          previous_total_views: number
          total_views: number
        }[]
      }
      nearby_activities: {
        Args: {
          p_category?: string
          p_lat: number
          p_lng: number
          p_municipality?: string
          p_radius_m?: number
        }
        Returns: {
          address: string
          age_max: number
          age_min: number
          category_slug: string
          description: string
          distance_m: number
          end_time: string
          id: string
          image_url: string
          lat: number
          lng: number
          municipality_name: string
          organization_name: string
          price: string
          recurrence_note: string
          slug: string
          start_time: string
          title: string
          url: string
          weekday: number
        }[]
      }
      nearby_events: {
        Args: {
          p_category?: string
          p_lat: number
          p_lng: number
          p_municipality?: string
          p_radius_m?: number
        }
        Returns: {
          address: string
          age_max: number
          age_min: number
          category_slug: string
          description: string
          distance_m: number
          ends_at: string
          id: string
          image_url: string
          lat: number
          lng: number
          municipality_name: string
          organization_name: string
          price: string
          slug: string
          starts_at: string
          title: string
          url: string
        }[]
      }
    }
    Enums: {
      listing_status: "draft" | "published" | "archived"
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
      listing_status: ["draft", "published", "archived"],
    },
  },
} as const
