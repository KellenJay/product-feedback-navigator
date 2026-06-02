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
      analysis_sessions: {
        Row: {
          analysis_output: Json | null
          business_goal: string | null
          created_at: string
          feedback_source: string | null
          folder_id: string | null
          id: string
          market_context_output: Json | null
          model_version: string | null
          product_name: string
          project_id: string | null
          raw_feedback: string | null
          saved: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_output?: Json | null
          business_goal?: string | null
          created_at?: string
          feedback_source?: string | null
          folder_id?: string | null
          id?: string
          market_context_output?: Json | null
          model_version?: string | null
          product_name: string
          project_id?: string | null
          raw_feedback?: string | null
          saved?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_output?: Json | null
          business_goal?: string | null
          created_at?: string
          feedback_source?: string | null
          folder_id?: string | null
          id?: string
          market_context_output?: Json | null
          model_version?: string | null
          product_name?: string
          project_id?: string | null
          raw_feedback?: string | null
          saved?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          is_active: boolean
          name: string
          stage: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          name: string
          stage?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          name?: string
          stage?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          company_id: string
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_runs: {
        Row: {
          actionability_score: number | null
          analysis_session_id: string | null
          categorization_score: number | null
          created_at: string
          grader_output: Json | null
          id: string
          prd_completeness_score: number | null
          prioritization_score: number | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          actionability_score?: number | null
          analysis_session_id?: string | null
          categorization_score?: number | null
          created_at?: string
          grader_output?: Json | null
          id?: string
          prd_completeness_score?: number | null
          prioritization_score?: number | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          actionability_score?: number | null
          analysis_session_id?: string | null
          categorization_score?: number | null
          created_at?: string
          grader_output?: Json | null
          id?: string
          prd_completeness_score?: number | null
          prioritization_score?: number | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_runs_analysis_session_id_fkey"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_idea_documents: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          request_id: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          request_id: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          request_id?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      library_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_checklist: {
        Row: {
          account_created: boolean
          company_added: boolean
          dismissed: boolean
          first_analysis: boolean
          first_library_save: boolean
          first_roadmap: boolean
          id: string
          profile_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_created?: boolean
          company_added?: boolean
          dismissed?: boolean
          first_analysis?: boolean
          first_library_save?: boolean
          first_roadmap?: boolean
          id?: string
          profile_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_created?: boolean
          company_added?: boolean
          dismissed?: boolean
          first_analysis?: boolean
          first_library_save?: boolean
          first_roadmap?: boolean
          id?: string
          profile_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_state: Json
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_state?: Json
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_state?: Json
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          business_goal: string | null
          created_at: string
          id: string
          product_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_goal?: string | null
          created_at?: string
          id?: string
          product_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_goal?: string | null
          created_at?: string
          id?: string
          product_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          analysis_session_id: string | null
          created_at: string
          id: string
          prd_output: Json | null
          product_name: string
          project_id: string | null
          roadmap_output: Json | null
          roadmap_overrides: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_session_id?: string | null
          created_at?: string
          id?: string
          prd_output?: Json | null
          product_name: string
          project_id?: string | null
          roadmap_output?: Json | null
          roadmap_overrides?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_session_id?: string | null
          created_at?: string
          id?: string
          prd_output?: Json | null
          product_name?: string
          project_id?: string | null
          roadmap_output?: Json | null
          roadmap_overrides?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_analysis_session_id_fkey"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
