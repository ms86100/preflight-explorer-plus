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
      attachments: {
        Row: {
          author_id: string | null
          created_at: string
          file_path: string
          file_size: number | null
          filename: string
          id: string
          issue_id: string
          mime_type: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          issue_id: string
          mime_type?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          issue_id?: string
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          project_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      board_column_statuses: {
        Row: {
          column_id: string
          created_at: string
          id: string
          status_id: string
        }
        Insert: {
          column_id: string
          created_at?: string
          id?: string
          status_id: string
        }
        Update: {
          column_id?: string
          created_at?: string
          id?: string
          status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_column_statuses_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_column_statuses_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "issue_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      board_columns: {
        Row: {
          board_id: string
          created_at: string
          id: string
          max_issues: number | null
          min_issues: number | null
          name: string
          position: number | null
          updated_at: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          max_issues?: number | null
          min_issues?: number | null
          name: string
          position?: number | null
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          max_issues?: number | null
          min_issues?: number | null
          name?: string
          position?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_quick_filters: {
        Row: {
          board_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          position: number | null
          query: string
        }
        Insert: {
          board_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number | null
          query: string
        }
        Update: {
          board_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_quick_filters_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_swimlanes: {
        Row: {
          board_id: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          position: number | null
          query: string | null
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          position?: number | null
          query?: string | null
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          position?: number | null
          query?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_swimlanes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          board_type: string
          config: Json | null
          created_at: string
          filter_jql: string | null
          id: string
          is_private: boolean | null
          name: string
          owner_id: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          board_type?: string
          config?: Json | null
          created_at?: string
          filter_jql?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          owner_id?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          board_type?: string
          config?: Json | null
          created_at?: string
          filter_jql?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          owner_id?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          issue_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          issue_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          issue_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      components: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_id: string | null
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
      custom_field_contexts: {
        Row: {
          created_at: string
          default_value: string | null
          field_id: string
          id: string
          is_required: boolean | null
          issue_type_id: string | null
          project_id: string | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          field_id: string
          id?: string
          is_required?: boolean | null
          issue_type_id?: string | null
          project_id?: string | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          field_id?: string
          id?: string
          is_required?: boolean | null
          issue_type_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_contexts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_contexts_issue_type_id_fkey"
            columns: ["issue_type_id"]
            isOneToOne: false
            referencedRelation: "issue_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_contexts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          default_value: string | null
          description: string | null
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          options: Json | null
          position: number | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          options?: Json | null
          position?: number | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          options?: Json | null
          position?: number | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          created_at: string
          date_value: string | null
          field_id: string
          id: string
          issue_id: string
          json_value: Json | null
          number_value: number | null
          string_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_value?: string | null
          field_id: string
          id?: string
          issue_id: string
          json_value?: Json | null
          number_value?: number | null
          string_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_value?: string | null
          field_id?: string
          id?: string
          issue_id?: string
          json_value?: Json | null
          number_value?: number | null
          string_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      document_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          file_path: string | null
          file_size: number | null
          format: string | null
          id: string
          name: string
          status: string | null
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          file_size?: number | null
          format?: string | null
          id?: string
          name: string
          status?: string | null
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          file_size?: number | null
          format?: string | null
          id?: string
          name?: string
          status?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_exports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_exports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_type: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_audit_logs: {
        Row: {
          created_at: string
          entity_type: string | null
          export_type: string
          file_size: number | null
          id: string
          record_count: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_type?: string | null
          export_type: string
          file_size?: number | null
          id?: string
          record_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_type?: string | null
          export_type?: string
          file_size?: number | null
          id?: string
          record_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      git_branches: {
        Row: {
          created_at: string
          id: string
          issue_id: string | null
          name: string
          repository_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id?: string | null
          name: string
          repository_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string | null
          name?: string
          repository_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "git_branches_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "git_branches_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "git_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      git_commits: {
        Row: {
          author_email: string | null
          author_name: string | null
          commit_hash: string
          committed_at: string | null
          created_at: string
          id: string
          issue_id: string | null
          message: string | null
          repository_id: string | null
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          commit_hash: string
          committed_at?: string | null
          created_at?: string
          id?: string
          issue_id?: string | null
          message?: string | null
          repository_id?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          commit_hash?: string
          committed_at?: string | null
          created_at?: string
          id?: string
          issue_id?: string | null
          message?: string | null
          repository_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "git_commits_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "git_commits_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "git_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      git_organizations: {
        Row: {
          access_token: string | null
          created_at: string
          created_by: string | null
          host_url: string
          id: string
          is_active: boolean | null
          name: string
          provider: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          created_by?: string | null
          host_url: string
          id?: string
          is_active?: boolean | null
          name: string
          provider: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          created_by?: string | null
          host_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "git_organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      git_pull_requests: {
        Row: {
          author_name: string | null
          created_at: string
          id: string
          issue_id: string | null
          repository_id: string | null
          source_branch: string | null
          status: string | null
          target_branch: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          id?: string
          issue_id?: string | null
          repository_id?: string | null
          source_branch?: string | null
          status?: string | null
          target_branch?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          author_name?: string | null
          created_at?: string
          id?: string
          issue_id?: string | null
          repository_id?: string | null
          source_branch?: string | null
          status?: string | null
          target_branch?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "git_pull_requests_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "git_pull_requests_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "git_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      git_repositories: {
        Row: {
          created_at: string
          default_branch: string | null
          id: string
          is_linked: boolean | null
          name: string
          organization_id: string | null
          project_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          default_branch?: string | null
          id?: string
          is_linked?: boolean | null
          name: string
          organization_id?: string | null
          project_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          default_branch?: string | null
          id?: string
          is_linked?: boolean | null
          name?: string
          organization_id?: string | null
          project_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "git_repositories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "git_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "git_repositories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      issue_components: {
        Row: {
          component_id: string
          created_at: string
          id: string
          issue_id: string
        }
        Insert: {
          component_id: string
          created_at?: string
          id?: string
          issue_id: string
        }
        Update: {
          component_id?: string
          created_at?: string
          id?: string
          issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_components_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_components_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_history: {
        Row: {
          author_id: string | null
          created_at: string
          field_name: string
          field_type: string | null
          id: string
          issue_id: string
          new_string: string | null
          new_value: string | null
          old_string: string | null
          old_value: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          field_name: string
          field_type?: string | null
          id?: string
          issue_id: string
          new_string?: string | null
          new_value?: string | null
          old_string?: string | null
          old_value?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string
          field_name?: string
          field_type?: string | null
          id?: string
          issue_id?: string
          new_string?: string | null
          new_value?: string | null
          old_string?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_history_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_link_types: {
        Row: {
          created_at: string
          id: string
          inward_description: string
          name: string
          outward_description: string
        }
        Insert: {
          created_at?: string
          id?: string
          inward_description: string
          name: string
          outward_description: string
        }
        Update: {
          created_at?: string
          id?: string
          inward_description?: string
          name?: string
          outward_description?: string
        }
        Relationships: []
      }
      issue_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link_type_id: string
          source_issue_id: string
          target_issue_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_type_id: string
          source_issue_id: string
          target_issue_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_type_id?: string
          source_issue_id?: string
          target_issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_links_link_type_id_fkey"
            columns: ["link_type_id"]
            isOneToOne: false
            referencedRelation: "issue_link_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_links_source_issue_id_fkey"
            columns: ["source_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_links_target_issue_id_fkey"
            columns: ["target_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_statuses: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sequence: number | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sequence?: number | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sequence?: number | null
        }
        Relationships: []
      }
      issue_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_subtask: boolean | null
          name: string
          sequence: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_subtask?: boolean | null
          name: string
          sequence?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_subtask?: boolean | null
          name?: string
          sequence?: number | null
        }
        Relationships: []
      }
      issue_versions: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          version_id: string
          version_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          version_id: string
          version_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          version_id?: string
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_versions_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_versions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_votes: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_votes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_watchers: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_watchers_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_watchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          environment: string | null
          epic_id: string | null
          id: string
          issue_key: string
          issue_number: number
          issue_type_id: string | null
          labels: string[] | null
          original_estimate: number | null
          parent_id: string | null
          priority_id: string | null
          project_id: string
          remaining_estimate: number | null
          reporter_id: string | null
          resolution_date: string | null
          resolution_id: string | null
          status_id: string | null
          story_points: number | null
          summary: string
          time_spent: number | null
          updated_at: string
          votes: number | null
          watchers: number | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          environment?: string | null
          epic_id?: string | null
          id?: string
          issue_key: string
          issue_number: number
          issue_type_id?: string | null
          labels?: string[] | null
          original_estimate?: number | null
          parent_id?: string | null
          priority_id?: string | null
          project_id: string
          remaining_estimate?: number | null
          reporter_id?: string | null
          resolution_date?: string | null
          resolution_id?: string | null
          status_id?: string | null
          story_points?: number | null
          summary: string
          time_spent?: number | null
          updated_at?: string
          votes?: number | null
          watchers?: number | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          environment?: string | null
          epic_id?: string | null
          id?: string
          issue_key?: string
          issue_number?: number
          issue_type_id?: string | null
          labels?: string[] | null
          original_estimate?: number | null
          parent_id?: string | null
          priority_id?: string | null
          project_id?: string
          remaining_estimate?: number | null
          reporter_id?: string | null
          resolution_date?: string | null
          resolution_id?: string | null
          status_id?: string | null
          story_points?: number | null
          summary?: string
          time_spent?: number | null
          updated_at?: string
          votes?: number | null
          watchers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_issue_type_id_fkey"
            columns: ["issue_type_id"]
            isOneToOne: false
            referencedRelation: "issue_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_resolution_id_fkey"
            columns: ["resolution_id"]
            isOneToOne: false
            referencedRelation: "resolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "issue_statuses"
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
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      priorities: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          sequence: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          sequence?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          sequence?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_workflow_schemes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          scheme_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          scheme_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_workflow_schemes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workflow_schemes_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "workflow_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          avatar_url: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          key: string
          lead_id: string | null
          name: string
          project_type: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          key: string
          lead_id?: string | null
          name: string
          project_type?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          key?: string
          lead_id?: string | null
          name?: string
          project_type?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      resolutions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sequence: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sequence?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sequence?: number | null
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_favorite: boolean | null
          jql: string
          name: string
          owner_id: string | null
          share_permissions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          jql: string
          name: string
          owner_id?: string | null
          share_permissions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          jql?: string
          name?: string
          owner_id?: string | null
          share_permissions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_filters_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_issues: {
        Row: {
          added_at: string
          id: string
          issue_id: string
          rank: string | null
          sprint_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          issue_id: string
          rank?: string | null
          sprint_id: string
        }
        Update: {
          added_at?: string
          id?: string
          issue_id?: string
          rank?: string | null
          sprint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_issues_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          board_id: string
          complete_date: string | null
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          name: string
          sequence: number | null
          start_date: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          board_id: string
          complete_date?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          sequence?: number | null
          start_date?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          board_id?: string
          complete_date?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          sequence?: number | null
          start_date?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_directory: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_directory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      versions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_archived: boolean | null
          is_released: boolean | null
          name: string
          project_id: string
          release_date: string | null
          sequence: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_released?: boolean | null
          name: string
          project_id: string
          release_date?: string | null
          sequence?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_released?: boolean | null
          name?: string
          project_id?: string
          release_date?: string | null
          sequence?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_scheme_mappings: {
        Row: {
          created_at: string
          id: string
          issue_type_id: string | null
          scheme_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_type_id?: string | null
          scheme_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_type_id?: string | null
          scheme_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_scheme_mappings_issue_type_id_fkey"
            columns: ["issue_type_id"]
            isOneToOne: false
            referencedRelation: "issue_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_scheme_mappings_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "workflow_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_scheme_mappings_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_schemes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_schemes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          created_at: string
          id: string
          is_final: boolean | null
          is_initial: boolean | null
          name: string
          status_id: string | null
          step_order: number | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_final?: boolean | null
          is_initial?: boolean | null
          name: string
          status_id?: string | null
          step_order?: number | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_final?: boolean | null
          is_initial?: boolean | null
          name?: string
          status_id?: string | null
          step_order?: number | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "issue_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_transitions: {
        Row: {
          condition_config: Json | null
          created_at: string
          from_step_id: string | null
          id: string
          name: string
          to_step_id: string
          workflow_id: string
        }
        Insert: {
          condition_config?: Json | null
          created_at?: string
          from_step_id?: string | null
          id?: string
          name: string
          to_step_id: string
          workflow_id: string
        }
        Update: {
          condition_config?: Json | null
          created_at?: string
          from_step_id?: string | null
          id?: string
          name?: string
          to_step_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_from_step_id_fkey"
            columns: ["from_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_to_step_id_fkey"
            columns: ["to_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worklogs: {
        Row: {
          author_id: string | null
          created_at: string
          description: string | null
          id: string
          issue_id: string
          started_at: string
          time_spent: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_id: string
          started_at: string
          time_spent: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_id?: string
          started_at?: string
          time_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worklogs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worklogs_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profiles: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          email: string
          id: string
        }[]
      }
      has_hub_access: {
        Args: {
          hub_uuid: string
          required_level?: Database["public"]["Enums"]["hub_permission_level"]
        }
        Returns: boolean
      }
      search_public_profiles: {
        Args: { search_term: string }
        Returns: {
          avatar_url: string
          display_name: string
          email: string
          id: string
        }[]
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
