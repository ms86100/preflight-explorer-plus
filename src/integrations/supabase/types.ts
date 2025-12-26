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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      content_labels: {
        Row: {
          color: Database["public"]["Enums"]["label_color"]
          created_at: string
          description: string | null
          hub_id: string | null
          id: string
          name: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["label_color"]
          created_at?: string
          description?: string | null
          hub_id?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: Database["public"]["Enums"]["label_color"]
          created_at?: string
          description?: string | null
          hub_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_labels_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "knowledge_hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          hub_id: string
          id: string
          parent_id: string | null
          position: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by: string
          hub_id: string
          id?: string
          parent_id?: string | null
          position?: number
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          hub_id?: string
          id?: string
          parent_id?: string | null
          position?: number
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "knowledge_hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string | null
          content: Json
          created_at: string
          created_by: string
          description: string | null
          hub_id: string | null
          id: string
          is_global: boolean
          name: string
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string
          created_by: string
          description?: string | null
          hub_id?: string | null
          id?: string
          is_global?: boolean
          name: string
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          hub_id?: string | null
          id?: string
          is_global?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "knowledge_hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_members: {
        Row: {
          granted_at: string
          granted_by: string
          hub_id: string
          id: string
          permission_level: Database["public"]["Enums"]["hub_permission_level"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          hub_id: string
          id?: string
          permission_level?: Database["public"]["Enums"]["hub_permission_level"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          hub_id?: string
          id?: string
          permission_level?: Database["public"]["Enums"]["hub_permission_level"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_members_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "knowledge_hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_hubs: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          homepage_id: string | null
          icon: string | null
          id: string
          key: string
          name: string
          status: Database["public"]["Enums"]["knowledge_hub_status"]
          type: Database["public"]["Enums"]["knowledge_hub_type"]
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          homepage_id?: string | null
          icon?: string | null
          id?: string
          key: string
          name: string
          status?: Database["public"]["Enums"]["knowledge_hub_status"]
          type?: Database["public"]["Enums"]["knowledge_hub_type"]
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          homepage_id?: string | null
          icon?: string | null
          id?: string
          key?: string
          name?: string
          status?: Database["public"]["Enums"]["knowledge_hub_status"]
          type?: Database["public"]["Enums"]["knowledge_hub_type"]
          updated_at?: string
        }
        Relationships: []
      }
      page_comments: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          inline_marker: Json | null
          is_resolved: boolean
          page_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          inline_marker?: Json | null
          is_resolved?: boolean
          page_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          inline_marker?: Json | null
          is_resolved?: boolean
          page_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_comments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "page_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      page_labels: {
        Row: {
          added_at: string
          added_by: string
          label_id: string
          page_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          label_id: string
          page_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          label_id?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "content_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_labels_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_versions: {
        Row: {
          change_message: string | null
          content: Json
          created_at: string
          created_by: string
          id: string
          page_id: string
          title: string
          version: number
        }
        Insert: {
          change_message?: string | null
          content: Json
          created_at?: string
          created_by: string
          id?: string
          page_id: string
          title: string
          version: number
        }
        Update: {
          change_message?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          page_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_pages: {
        Row: {
          id: string
          page_id: string
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          page_id: string
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_pages_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_hub_access: {
        Args: {
          hub_uuid: string
          required_level?: Database["public"]["Enums"]["hub_permission_level"]
        }
        Returns: boolean
      }
    }
    Enums: {
      content_status: "draft" | "published" | "archived"
      hub_permission_level: "view" | "edit" | "admin"
      knowledge_hub_status: "active" | "archived" | "deleted"
      knowledge_hub_type: "team" | "project" | "personal" | "documentation"
      label_color: "blue" | "green" | "yellow" | "red" | "purple" | "gray"
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
      content_status: ["draft", "published", "archived"],
      hub_permission_level: ["view", "edit", "admin"],
      knowledge_hub_status: ["active", "archived", "deleted"],
      knowledge_hub_type: ["team", "project", "personal", "documentation"],
      label_color: ["blue", "green", "yellow", "red", "purple", "gray"],
    },
  },
} as const
