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
      automation_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          result: Json | null
          rule_id: string
          started_at: string
          status: string
          trigger_event: Json | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          rule_id: string
          started_at?: string
          status?: string
          trigger_event?: Json | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          rule_id?: string
          started_at?: string
          status?: string
          trigger_event?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          project_id: string | null
          run_as_user: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          project_id?: string | null
          run_as_user?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          project_id?: string | null
          run_as_user?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
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
      custom_field_contexts: {
        Row: {
          created_at: string | null
          default_value: string | null
          field_id: string
          id: string
          is_required: boolean | null
          issue_type_id: string | null
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          field_id: string
          id?: string
          is_required?: boolean | null
          issue_type_id?: string | null
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          default_value: string | null
          description: string | null
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          options: Json | null
          position: number | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          options?: Json | null
          position?: number | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          options?: Json | null
          position?: number | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          issue_id: string
          updated_at: string | null
          value_date: string | null
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          issue_id: string
          updated_at?: string | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          issue_id?: string
          updated_at?: string | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
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
      data_block_instances: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          issue_id: string | null
          name: string | null
          project_id: string | null
          rows: Json
          schema_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          issue_id?: string | null
          name?: string | null
          project_id?: string | null
          rows?: Json
          schema_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          issue_id?: string | null
          name?: string | null
          project_id?: string | null
          rows?: Json
          schema_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_block_instances_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_block_instances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_block_instances_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "data_block_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      data_block_schemas: {
        Row: {
          columns: Json
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          validation_rules: Json | null
          version: number | null
        }
        Insert: {
          columns?: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Update: {
          columns?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      document_exports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          error_message: string | null
          file_path: string | null
          file_size: number | null
          format: string
          id: string
          issue_ids: Json | null
          name: string
          options: Json | null
          status: string
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          format: string
          id?: string
          issue_ids?: Json | null
          name: string
          options?: Json | null
          status?: string
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          format?: string
          id?: string
          issue_ids?: Json | null
          name?: string
          options?: Json | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
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
          created_at: string | null
          created_by: string
          description: string | null
          footer_config: Json | null
          format: string
          header_config: Json | null
          id: string
          is_default: boolean | null
          name: string
          sections: Json | null
          styling: Json | null
          updated_at: string | null
          watermark_config: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          footer_config?: Json | null
          format?: string
          header_config?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          sections?: Json | null
          styling?: Json | null
          updated_at?: string | null
          watermark_config?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          footer_config?: Json | null
          format?: string
          header_config?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          sections?: Json | null
          styling?: Json | null
          updated_at?: string | null
          watermark_config?: Json | null
        }
        Relationships: []
      }
      export_audit_logs: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          classification_level: string
          completed_at: string | null
          created_at: string | null
          export_type: string
          file_format: string | null
          id: string
          record_count: number | null
          rejection_reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          classification_level: string
          completed_at?: string | null
          created_at?: string | null
          export_type: string
          file_format?: string | null
          id?: string
          record_count?: number | null
          rejection_reason?: string | null
          status: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          classification_level?: string
          completed_at?: string | null
          created_at?: string | null
          export_type?: string
          file_format?: string | null
          id?: string
          record_count?: number | null
          rejection_reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
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
      guided_operation_executions: {
        Row: {
          completed_at: string | null
          current_step: number | null
          id: string
          operation_id: string
          result: Json | null
          started_at: string | null
          started_by: string
          status: string
          step_data: Json | null
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          id?: string
          operation_id: string
          result?: Json | null
          started_at?: string | null
          started_by: string
          status?: string
          step_data?: Json | null
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          id?: string
          operation_id?: string
          result?: Json | null
          started_at?: string | null
          started_by?: string
          status?: string
          step_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "guided_operation_executions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "guided_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      guided_operations: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_approval: boolean | null
          steps: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_approval?: boolean | null
          steps?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_approval?: boolean | null
          steps?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      import_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          field_name: string | null
          id: string
          job_id: string
          original_value: string | null
          row_number: number
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          field_name?: string | null
          id?: string
          job_id: string
          original_value?: string | null
          row_number: number
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          field_name?: string | null
          id?: string
          job_id?: string
          original_value?: string | null
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_records: number | null
          field_mappings: Json | null
          file_name: string | null
          id: string
          import_type: string
          processed_records: number | null
          source_format: string
          started_at: string | null
          status: string
          successful_records: number | null
          total_records: number | null
          updated_at: string
          user_id: string
          validation_errors: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_records?: number | null
          field_mappings?: Json | null
          file_name?: string | null
          id?: string
          import_type: string
          processed_records?: number | null
          source_format?: string
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string
          user_id: string
          validation_errors?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_records?: number | null
          field_mappings?: Json | null
          file_name?: string | null
          id?: string
          import_type?: string
          processed_records?: number | null
          source_format?: string
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string
          user_id?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      import_mappings: {
        Row: {
          created_at: string
          id: string
          import_type: string
          is_default: boolean | null
          mappings: Json
          name: string
          source_format: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_type: string
          is_default?: boolean | null
          mappings?: Json
          name: string
          source_format?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          import_type?: string
          is_default?: boolean | null
          mappings?: Json
          name?: string
          source_format?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      issue_history: {
        Row: {
          changed_at: string
          changed_by: string
          field_name: string
          id: string
          issue_id: string
          new_value: string | null
          new_value_id: string | null
          old_value: string | null
          old_value_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          field_name: string
          id?: string
          issue_id: string
          new_value?: string | null
          new_value_id?: string | null
          old_value?: string | null
          old_value_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          field_name?: string
          id?: string
          issue_id?: string
          new_value?: string | null
          new_value_id?: string | null
          old_value?: string | null
          old_value_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
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
      issue_links: {
        Row: {
          created_at: string
          created_by: string
          id: string
          link_type: string
          source_issue_id: string
          target_issue_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          link_type: string
          source_issue_id: string
          target_issue_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          link_type?: string
          source_issue_id?: string
          target_issue_id?: string
        }
        Relationships: [
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
      ldap_configurations: {
        Row: {
          base_dn: string
          bind_dn: string | null
          created_at: string | null
          created_by: string | null
          department_attribute: string | null
          display_name_attribute: string | null
          email_attribute: string | null
          group_base_dn: string | null
          group_member_attribute: string | null
          group_name_attribute: string | null
          group_search_filter: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          name: string
          port: number | null
          search_filter: string | null
          server_url: string
          sync_interval_minutes: number | null
          updated_at: string | null
          use_ssl: boolean | null
          user_id_attribute: string | null
        }
        Insert: {
          base_dn: string
          bind_dn?: string | null
          created_at?: string | null
          created_by?: string | null
          department_attribute?: string | null
          display_name_attribute?: string | null
          email_attribute?: string | null
          group_base_dn?: string | null
          group_member_attribute?: string | null
          group_name_attribute?: string | null
          group_search_filter?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name: string
          port?: number | null
          search_filter?: string | null
          server_url: string
          sync_interval_minutes?: number | null
          updated_at?: string | null
          use_ssl?: boolean | null
          user_id_attribute?: string | null
        }
        Update: {
          base_dn?: string
          bind_dn?: string | null
          created_at?: string | null
          created_by?: string | null
          department_attribute?: string | null
          display_name_attribute?: string | null
          email_attribute?: string | null
          group_base_dn?: string | null
          group_member_attribute?: string | null
          group_name_attribute?: string | null
          group_search_filter?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name?: string
          port?: number | null
          search_filter?: string | null
          server_url?: string
          sync_interval_minutes?: number | null
          updated_at?: string | null
          use_ssl?: boolean | null
          user_id_attribute?: string | null
        }
        Relationships: []
      }
      ldap_group_mappings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          ldap_config_id: string
          ldap_group_dn: string
          ldap_group_name: string
          target_group_id: string | null
          target_project_role_id: string | null
          target_role: Database["public"]["Enums"]["app_role"] | null
          target_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          ldap_config_id: string
          ldap_group_dn: string
          ldap_group_name: string
          target_group_id?: string | null
          target_project_role_id?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          target_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          ldap_config_id?: string
          ldap_group_dn?: string
          ldap_group_name?: string
          target_group_id?: string | null
          target_project_role_id?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ldap_group_mappings_ldap_config_id_fkey"
            columns: ["ldap_config_id"]
            isOneToOne: false
            referencedRelation: "ldap_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ldap_group_mappings_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ldap_group_mappings_target_project_role_id_fkey"
            columns: ["target_project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ldap_sync_logs: {
        Row: {
          completed_at: string | null
          errors: Json | null
          groups_synced: number | null
          id: string
          ldap_config_id: string
          roles_assigned: number | null
          roles_revoked: number | null
          started_at: string | null
          status: string
          sync_type: string
          triggered_by: string | null
          users_synced: number | null
        }
        Insert: {
          completed_at?: string | null
          errors?: Json | null
          groups_synced?: number | null
          id?: string
          ldap_config_id: string
          roles_assigned?: number | null
          roles_revoked?: number | null
          started_at?: string | null
          status: string
          sync_type: string
          triggered_by?: string | null
          users_synced?: number | null
        }
        Update: {
          completed_at?: string | null
          errors?: Json | null
          groups_synced?: number | null
          id?: string
          ldap_config_id?: string
          roles_assigned?: number | null
          roles_revoked?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          triggered_by?: string | null
          users_synced?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ldap_sync_logs_ldap_config_id_fkey"
            columns: ["ldap_config_id"]
            isOneToOne: false
            referencedRelation: "ldap_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      ldap_user_cache: {
        Row: {
          created_at: string | null
          department: string | null
          display_name: string | null
          email: string | null
          id: string
          last_synced_at: string | null
          ldap_config_id: string
          ldap_dn: string
          ldap_groups: Json | null
          ldap_username: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_synced_at?: string | null
          ldap_config_id: string
          ldap_dn: string
          ldap_groups?: Json | null
          ldap_username: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_synced_at?: string | null
          ldap_config_id?: string
          ldap_dn?: string
          ldap_groups?: Json | null
          ldap_username?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ldap_user_cache_ldap_config_id_fkey"
            columns: ["ldap_config_id"]
            isOneToOne: false
            referencedRelation: "ldap_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      permission_scheme_grants: {
        Row: {
          created_at: string | null
          grant_type: string
          group_id: string | null
          id: string
          permission_key: string
          role_id: string | null
          scheme_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          grant_type: string
          group_id?: string | null
          id?: string
          permission_key: string
          role_id?: string | null
          scheme_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          grant_type?: string
          group_id?: string | null
          id?: string
          permission_key?: string
          role_id?: string | null
          scheme_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_scheme_grants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_scheme_grants_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_scheme_grants_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "permission_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_schemes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plugin_installations: {
        Row: {
          config: Json | null
          id: string
          installed_at: string
          installed_by: string
          is_enabled: boolean
          plugin_id: string
          project_id: string | null
        }
        Insert: {
          config?: Json | null
          id?: string
          installed_at?: string
          installed_by: string
          is_enabled?: boolean
          plugin_id: string
          project_id?: string | null
        }
        Update: {
          config?: Json | null
          id?: string
          installed_at?: string
          installed_by?: string
          is_enabled?: boolean
          plugin_id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_installations_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_installations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          category: string
          config: Json | null
          created_at: string
          description: string | null
          documentation_url: string | null
          hooks: Json | null
          icon_url: string | null
          id: string
          is_enabled: boolean
          is_system: boolean
          key: string
          name: string
          permissions: Json | null
          updated_at: string
          vendor: string | null
          vendor_url: string | null
          version: string
        }
        Insert: {
          category?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          documentation_url?: string | null
          hooks?: Json | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean
          is_system?: boolean
          key: string
          name: string
          permissions?: Json | null
          updated_at?: string
          vendor?: string | null
          vendor_url?: string | null
          version?: string
        }
        Update: {
          category?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          documentation_url?: string | null
          hooks?: Json | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean
          is_system?: boolean
          key?: string
          name?: string
          permissions?: Json | null
          updated_at?: string
          vendor?: string | null
          vendor_url?: string | null
          version?: string
        }
        Relationships: []
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
      project_permission_schemes: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          scheme_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          scheme_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_permission_schemes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_permission_schemes_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "permission_schemes"
            referencedColumns: ["id"]
          },
        ]
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
      project_workflow_schemes: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          scheme_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          scheme_id: string
        }
        Update: {
          created_at?: string | null
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
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_key: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_key: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_key?: string
          window_start?: string
        }
        Relationships: []
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
      workflow_scheme_mappings: {
        Row: {
          created_at: string | null
          id: string
          issue_type_id: string | null
          scheme_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_type_id?: string | null
          scheme_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      cleanup_rate_limits: { Args: never; Returns: number }
      get_available_transitions: {
        Args: { p_issue_id: string }
        Returns: {
          to_status_category: string
          to_status_color: string
          to_status_id: string
          to_status_name: string
          transition_id: string
          transition_name: string
        }[]
      }
      get_workflow_for_issue: {
        Args: { p_issue_type_id: string; p_project_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_audit_log: {
        Args: {
          p_action: string
          p_classification_context?: Database["public"]["Enums"]["classification_level"]
          p_entity_id?: string
          p_entity_type: string
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: string
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_member_fast: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      validate_status_transition: {
        Args: {
          p_from_status_id: string
          p_issue_id: string
          p_to_status_id: string
        }
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
