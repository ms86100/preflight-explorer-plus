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
          author_id: string
          classification:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          issue_id: string
          mime_type: string | null
        }
        Insert: {
          author_id: string
          classification?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          issue_id: string
          mime_type?: string | null
        }
        Update: {
          author_id?: string
          classification?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          issue_id?: string
          mime_type?: string | null
        }
        Relationships: [
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
          classification_context:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          classification_context?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          classification_context?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      board_column_statuses: {
        Row: {
          column_id: string
          id: string
          status_id: string
        }
        Insert: {
          column_id: string
          id?: string
          status_id: string
        }
        Update: {
          column_id?: string
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
          created_at: string | null
          id: string
          max_issues: number | null
          min_issues: number | null
          name: string
          position: number | null
        }
        Insert: {
          board_id: string
          created_at?: string | null
          id?: string
          max_issues?: number | null
          min_issues?: number | null
          name: string
          position?: number | null
        }
        Update: {
          board_id?: string
          created_at?: string | null
          id?: string
          max_issues?: number | null
          min_issues?: number | null
          name?: string
          position?: number | null
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
      boards: {
        Row: {
          board_type: Database["public"]["Enums"]["board_type"] | null
          created_at: string | null
          filter_jql: string | null
          id: string
          is_private: boolean | null
          name: string
          owner_id: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          board_type?: Database["public"]["Enums"]["board_type"] | null
          created_at?: string | null
          filter_jql?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          owner_id?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          board_type?: Database["public"]["Enums"]["board_type"] | null
          created_at?: string | null
          filter_jql?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          owner_id?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
          author_id: string
          body: string
          created_at: string | null
          id: string
          issue_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          issue_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          issue_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
          created_at: string | null
          description: string | null
          id: string
          lead_id: string | null
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          name: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      issue_labels: {
        Row: {
          id: string
          issue_id: string
          label_id: string
        }
        Insert: {
          id?: string
          issue_id: string
          label_id: string
        }
        Update: {
          id?: string
          issue_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_labels_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_statuses: {
        Row: {
          category: Database["public"]["Enums"]["status_category"] | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          position: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["status_category"] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["status_category"] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number | null
        }
        Relationships: []
      }
      issue_types: {
        Row: {
          category: Database["public"]["Enums"]["issue_type_category"] | null
          color: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_subtask: boolean | null
          name: string
          position: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["issue_type_category"] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_subtask?: boolean | null
          name: string
          position?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["issue_type_category"] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_subtask?: boolean | null
          name?: string
          position?: number | null
        }
        Relationships: []
      }
      issues: {
        Row: {
          assignee_id: string | null
          classification:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at: string | null
          description: string | null
          due_date: string | null
          environment: string | null
          epic_id: string | null
          id: string
          issue_key: string
          issue_number: number
          issue_type_id: string
          lexorank: string | null
          original_estimate: number | null
          parent_id: string | null
          priority_id: string | null
          project_id: string
          remaining_estimate: number | null
          reporter_id: string
          resolution_id: string | null
          resolved_at: string | null
          status_id: string
          story_points: number | null
          summary: string
          time_spent: number | null
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          classification?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          environment?: string | null
          epic_id?: string | null
          id?: string
          issue_key: string
          issue_number: number
          issue_type_id: string
          lexorank?: string | null
          original_estimate?: number | null
          parent_id?: string | null
          priority_id?: string | null
          project_id: string
          remaining_estimate?: number | null
          reporter_id: string
          resolution_id?: string | null
          resolved_at?: string | null
          status_id: string
          story_points?: number | null
          summary: string
          time_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          classification?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          environment?: string | null
          epic_id?: string | null
          id?: string
          issue_key?: string
          issue_number?: number
          issue_type_id?: string
          lexorank?: string | null
          original_estimate?: number | null
          parent_id?: string | null
          priority_id?: string | null
          project_id?: string
          remaining_estimate?: number | null
          reporter_id?: string
          resolution_id?: string | null
          resolved_at?: string | null
          status_id?: string
          story_points?: number | null
          summary?: string
          time_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
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
      labels: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      priorities: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          position: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          position?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          position?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clearance_level:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at: string | null
          department: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          location: string | null
          nationality: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          clearance_level?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          job_title?: string | null
          location?: string | null
          nationality?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          clearance_level?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          location?: string | null
          nationality?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_role_actors: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          project_id: string
          role_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          project_id: string
          role_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          project_id?: string
          role_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_role_actors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_role_actors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_role_actors_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          avatar_url: string | null
          category_id: string | null
          classification:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at: string | null
          default_assignee_id: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          issue_counter: number | null
          lead_id: string | null
          name: string
          pkey: string
          program_id: string | null
          project_type: Database["public"]["Enums"]["project_type"] | null
          template: Database["public"]["Enums"]["project_template"] | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          avatar_url?: string | null
          category_id?: string | null
          classification?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          default_assignee_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          issue_counter?: number | null
          lead_id?: string | null
          name: string
          pkey: string
          program_id?: string | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          template?: Database["public"]["Enums"]["project_template"] | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          avatar_url?: string | null
          category_id?: string | null
          classification?:
            | Database["public"]["Enums"]["classification_level"]
            | null
          created_at?: string | null
          default_assignee_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          issue_counter?: number | null
          lead_id?: string | null
          name?: string
          pkey?: string
          program_id?: string | null
          project_type?: Database["public"]["Enums"]["project_type"] | null
          template?: Database["public"]["Enums"]["project_template"] | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resolutions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          position: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number | null
        }
        Relationships: []
      }
      sprint_issues: {
        Row: {
          added_at: string | null
          id: string
          issue_id: string
          sprint_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          issue_id: string
          sprint_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          issue_id?: string
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
          completed_date: string | null
          created_at: string | null
          end_date: string | null
          goal: string | null
          id: string
          name: string
          start_date: string | null
          state: Database["public"]["Enums"]["sprint_state"] | null
          updated_at: string | null
        }
        Insert: {
          board_id: string
          completed_date?: string | null
          created_at?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          start_date?: string | null
          state?: Database["public"]["Enums"]["sprint_state"] | null
          updated_at?: string | null
        }
        Update: {
          board_id?: string
          completed_date?: string | null
          created_at?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          start_date?: string | null
          state?: Database["public"]["Enums"]["sprint_state"] | null
          updated_at?: string | null
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
      versions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          is_released: boolean | null
          name: string
          position: number | null
          project_id: string
          release_date: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_released?: boolean | null
          name: string
          position?: number | null
          project_id: string
          release_date?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_released?: boolean | null
          name?: string
          position?: number | null
          project_id?: string
          release_date?: string | null
          start_date?: string | null
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
      workflow_steps: {
        Row: {
          created_at: string | null
          id: string
          is_initial: boolean | null
          position_x: number | null
          position_y: number | null
          status_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_initial?: boolean | null
          position_x?: number | null
          position_y?: number | null
          status_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_initial?: boolean | null
          position_x?: number | null
          position_y?: number | null
          status_id?: string
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
          created_at: string | null
          description: string | null
          from_step_id: string
          id: string
          name: string
          to_step_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          from_step_id: string
          id?: string
          name: string
          to_step_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          from_step_id?: string
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
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      worklogs: {
        Row: {
          author_id: string
          created_at: string | null
          description: string | null
          id: string
          issue_id: string
          started_at: string
          time_spent: number
          updated_at: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          issue_id: string
          started_at: string
          time_spent: number
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          issue_id?: string
          started_at?: string
          time_spent?: number
          updated_at?: string | null
        }
        Relationships: [
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "project_admin" | "developer" | "viewer"
      board_type: "scrum" | "kanban"
      classification_level:
        | "public"
        | "restricted"
        | "confidential"
        | "export_controlled"
      issue_type_category: "standard" | "subtask" | "epic"
      project_template:
        | "scrum"
        | "kanban"
        | "basic"
        | "project_management"
        | "task_management"
        | "process_management"
      project_type: "software" | "business"
      sprint_state: "future" | "active" | "closed"
      status_category: "todo" | "in_progress" | "done"
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
      app_role: ["admin", "project_admin", "developer", "viewer"],
      board_type: ["scrum", "kanban"],
      classification_level: [
        "public",
        "restricted",
        "confidential",
        "export_controlled",
      ],
      issue_type_category: ["standard", "subtask", "epic"],
      project_template: [
        "scrum",
        "kanban",
        "basic",
        "project_management",
        "task_management",
        "process_management",
      ],
      project_type: ["software", "business"],
      sprint_state: ["future", "active", "closed"],
      status_category: ["todo", "in_progress", "done"],
    },
  },
} as const
