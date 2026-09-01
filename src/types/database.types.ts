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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string
          created_at: string
          details: Json
          id: string
          profile_id: string | null
          task_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json
          id?: string
          profile_id?: string | null
          task_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json
          id?: string
          profile_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          allow_responsible_create_task: boolean
          blocked_alert_hours: number
          business_name: string
          created_at: string
          due_soon_days: number
          id: number
          logo_url: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          allow_responsible_create_task?: boolean
          blocked_alert_hours?: number
          business_name?: string
          created_at?: string
          due_soon_days?: number
          id?: number
          logo_url?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          allow_responsible_create_task?: boolean
          blocked_alert_hours?: number
          business_name?: string
          created_at?: string
          due_soon_days?: number
          id?: number
          logo_url?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_order: number
          icon: string
          id: string
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          profile_id: string
          storage_path: string
          task_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          profile_id: string
          storage_path: string
          task_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          profile_id?: string
          storage_path?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          profile_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          profile_id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          event_key: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json
          profile_id: string
          read_at: string | null
          severity: string
          task_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          event_key?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json
          profile_id: string
          read_at?: string | null
          severity?: string
          task_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          event_key?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json
          profile_id?: string
          read_at?: string | null
          severity?: string
          task_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_task_rules: {
        Row: {
          area_id: string
          create_time: string
          created_at: string
          created_by: string | null
          days_of_week: number[] | null
          end_date: string | null
          frequency: string
          id: string
          interval_days: number | null
          is_active: boolean
          last_run_date: string | null
          main_assignee_id: string | null
          next_run_date: string
          priority: string
          start_date: string
          template_description: string | null
          template_title: string
          timezone: string
          updated_at: string
        }
        Insert: {
          area_id: string
          create_time?: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_days?: number | null
          is_active?: boolean
          last_run_date?: string | null
          main_assignee_id?: string | null
          next_run_date: string
          priority?: string
          start_date?: string
          template_description?: string | null
          template_title: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          create_time?: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_days?: number | null
          is_active?: boolean
          last_run_date?: string | null
          main_assignee_id?: string | null
          next_run_date?: string
          priority?: string
          start_date?: string
          template_description?: string | null
          template_title?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_task_rules_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_task_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_task_rules_main_assignee_id_fkey"
            columns: ["main_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          display_order: number
          id: string
          is_completed: boolean
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_blocks: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          created_at: string
          estimated_resolution_at: string | null
          id: string
          reason: string
          related_party: string | null
          resolution_comment: string | null
          resolved_at: string | null
          resolved_by: string | null
          task_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          estimated_resolution_at?: string | null
          id?: string
          reason: string
          related_party?: string | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          task_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          estimated_resolution_at?: string | null
          id?: string
          reason?: string
          related_party?: string | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_blocks_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_blocks_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_blocks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          blocking_task_id: string
          created_at: string
          dependency_type: string
          id: string
          task_id: string
        }
        Insert: {
          blocking_task_id: string
          created_at?: string
          dependency_type?: string
          id?: string
          task_id: string
        }
        Update: {
          blocking_task_id?: string
          created_at?: string
          dependency_type?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_blocking_task_id_fkey"
            columns: ["blocking_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          tag_id: string
          task_id: string
        }
        Insert: {
          tag_id: string
          task_id: string
        }
        Update: {
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          area_id: string
          blocked_at: string | null
          blocked_reason: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          is_demo: boolean
          is_progress_manual: boolean
          is_recurring: boolean
          main_assignee_id: string | null
          priority: string
          progress_percentage: number
          recurrence_occurrence_date: string | null
          recurring_rule_id: string | null
          status: string
          third_party_contact: string | null
          third_party_name: string | null
          third_party_promised_date: string | null
          third_party_reason: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          area_id: string
          blocked_at?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_demo?: boolean
          is_progress_manual?: boolean
          is_recurring?: boolean
          main_assignee_id?: string | null
          priority?: string
          progress_percentage?: number
          recurrence_occurrence_date?: string | null
          recurring_rule_id?: string | null
          status?: string
          third_party_contact?: string | null
          third_party_name?: string | null
          third_party_promised_date?: string | null
          third_party_reason?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          area_id?: string
          blocked_at?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_demo?: boolean
          is_progress_manual?: boolean
          is_recurring?: boolean
          main_assignee_id?: string | null
          priority?: string
          progress_percentage?: number
          recurrence_occurrence_date?: string | null
          recurring_rule_id?: string | null
          status?: string
          third_party_contact?: string | null
          third_party_name?: string | null
          third_party_promised_date?: string | null
          third_party_reason?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_main_assignee_id_fkey"
            columns: ["main_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurring_rule_id_fkey"
            columns: ["recurring_rule_id"]
            isOneToOne: false
            referencedRelation: "recurring_task_rules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_task: { Args: never; Returns: boolean }
      can_edit_task: { Args: { p_task_id: string }; Returns: boolean }
      check_task_due_alerts: { Args: never; Returns: Json }
      cleanup_demo_data: { Args: never; Returns: Json }
      generate_recurring_tasks: { Args: never; Returns: Json }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_responsable_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
