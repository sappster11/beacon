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
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          description: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          resource_id: string
          resource_type: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          resource_id: string
          resource_type: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string
          resource_type?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_comments: {
        Row: {
          author_id: string
          author_role: string
          competency_name: string
          content: string
          created_at: string | null
          id: string
          review_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_role: string
          competency_name: string
          content: string
          created_at?: string | null
          id?: string
          review_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_role?: string
          competency_name?: string
          content?: string
          created_at?: string | null
          id?: string
          review_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
          parent_department_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      development_plans: {
        Row: {
          career_goals: string
          created_at: string | null
          id: string
          milestones: Json | null
          progress: number | null
          skills_to_add: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_goals: string
          created_at?: string | null
          id?: string
          milestones?: Json | null
          progress?: number | null
          skills_to_add?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_goals?: string
          created_at?: string | null
          id?: string
          milestones?: Json | null
          progress?: number | null
          skills_to_add?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_comments: {
        Row: {
          author_id: string
          author_role: string
          content: string
          created_at: string | null
          goal_id: string
          id: string
          review_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_role: string
          content: string
          created_at?: string | null
          goal_id: string
          id?: string
          review_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_role?: string
          content?: string
          created_at?: string | null
          goal_id?: string
          id?: string
          review_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          suggested_duration: number | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          suggested_duration?: number | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          suggested_duration?: number | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string
          due_date: string | null
          id: string
          organization_id: string | null
          owner_id: string
          parent_goal_id: string | null
          status: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description: string
          due_date?: string | null
          id?: string
          organization_id?: string | null
          owner_id: string
          parent_goal_id?: string | null
          status?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string
          due_date?: string | null
          id?: string
          organization_id?: string | null
          owner_id?: string
          parent_goal_id?: string | null
          status?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          organization_id: string | null
          sync_error: string | null
          sync_status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          organization_id?: string | null
          sync_error?: string | null
          sync_status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          organization_id?: string | null
          sync_error?: string | null
          sync_status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          department_id: string | null
          email: string
          expires_at: string
          id: string
          invited_by_id: string
          manager_id: string | null
          name: string
          organization_id: string
          role: string | null
          status: string | null
          title: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by_id: string
          manager_id?: string | null
          name: string
          organization_id: string
          role?: string | null
          status?: string | null
          title?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by_id?: string
          manager_id?: string | null
          name?: string
          organization_id?: string
          role?: string | null
          status?: string | null
          title?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_id_fkey"
            columns: ["invited_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_documents: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          is_recurring: boolean | null
          manager_id: string
          one_on_one_id: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          is_recurring?: boolean | null
          manager_id: string
          one_on_one_id: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          is_recurring?: boolean | null
          manager_id?: string
          one_on_one_id?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_documents_one_on_one_id_fkey"
            columns: ["one_on_one_id"]
            isOneToOne: false
            referencedRelation: "one_on_ones"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_ones: {
        Row: {
          action_items: Json | null
          agenda: string | null
          created_at: string | null
          document_url: string | null
          employee_id: string
          google_calendar_synced: boolean | null
          google_event_id: string | null
          google_event_url: string | null
          id: string
          last_synced_at: string | null
          manager_id: string
          manager_notes: string | null
          outlook_event_id: string | null
          scheduled_at: string
          shared_notes: string | null
          status: string | null
          transcript: string | null
          transcript_file_url: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          agenda?: string | null
          created_at?: string | null
          document_url?: string | null
          employee_id: string
          google_calendar_synced?: boolean | null
          google_event_id?: string | null
          google_event_url?: string | null
          id?: string
          last_synced_at?: string | null
          manager_id: string
          manager_notes?: string | null
          outlook_event_id?: string | null
          scheduled_at: string
          shared_notes?: string | null
          status?: string | null
          transcript?: string | null
          transcript_file_url?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          agenda?: string | null
          created_at?: string | null
          document_url?: string | null
          employee_id?: string
          google_calendar_synced?: boolean | null
          google_event_id?: string | null
          google_event_url?: string | null
          id?: string
          last_synced_at?: string | null
          manager_id?: string
          manager_notes?: string | null
          outlook_event_id?: string | null
          scheduled_at?: string
          shared_notes?: string | null
          status?: string | null
          transcript?: string | null
          transcript_file_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_ones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      peer_feedback: {
        Row: {
          created_at: string | null
          feedback: string
          giver_id: string
          id: string
          rating: number | null
          receiver_id: string
          review_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feedback: string
          giver_id: string
          id?: string
          rating?: number | null
          receiver_id: string
          review_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string
          giver_id?: string
          id?: string
          rating?: number | null
          receiver_id?: string
          review_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peer_feedback_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_feedback_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cycles: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          name: string
          organization_id: string | null
          start_date: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          organization_id?: string | null
          start_date: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          organization_id?: string | null
          start_date?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_cycles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          assigned_goals: Json | null
          competencies: Json | null
          created_at: string | null
          cycle_id: string
          id: string
          manager_assessment: string | null
          overall_manager_rating: number | null
          overall_self_rating: number | null
          reviewee_id: string
          reviewer_id: string
          self_assessment: string | null
          self_reflections: Json | null
          status: string | null
          summary_comments: Json | null
          updated_at: string | null
        }
        Insert: {
          assigned_goals?: Json | null
          competencies?: Json | null
          created_at?: string | null
          cycle_id: string
          id?: string
          manager_assessment?: string | null
          overall_manager_rating?: number | null
          overall_self_rating?: number | null
          reviewee_id: string
          reviewer_id: string
          self_assessment?: string | null
          self_reflections?: Json | null
          status?: string | null
          summary_comments?: Json | null
          updated_at?: string | null
        }
        Update: {
          assigned_goals?: Json | null
          competencies?: Json | null
          created_at?: string | null
          cycle_id?: string
          id?: string
          manager_assessment?: string | null
          overall_manager_rating?: number | null
          overall_self_rating?: number | null
          reviewee_id?: string
          reviewer_id?: string
          self_assessment?: string | null
          self_reflections?: Json | null
          status?: string | null
          summary_comments?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "review_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          organization_id: string | null
          settings: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          settings: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          settings?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          created_at: string | null
          department_id: string | null
          email: string
          gusto_id: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          location: string | null
          manager_id: string | null
          name: string
          organization_id: string | null
          phone_number: string | null
          profile_picture: string | null
          role: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          gusto_id?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          location?: string | null
          manager_id?: string | null
          name: string
          organization_id?: string | null
          phone_number?: string | null
          profile_picture?: string | null
          role?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          gusto_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          location?: string | null
          manager_id?: string | null
          name?: string
          organization_id?: string | null
          phone_number?: string | null
          profile_picture?: string | null
          role?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_org_admin: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
