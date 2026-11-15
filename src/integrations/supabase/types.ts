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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      connections: {
        Row: {
          created_at: string
          description: string
          from_id: string
          genre: string
          id: string
          note: string
          project_title: string
          skills: string[]
          status: string
          to_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          from_id: string
          genre?: string
          id?: string
          note?: string
          project_title?: string
          skills?: string[]
          status?: string
          to_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          from_id?: string
          genre?: string
          id?: string
          note?: string
          project_title?: string
          skills?: string[]
          status?: string
          to_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          message_id: string
          project_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
          project_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
          project_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string
          avatar_url: string
          bio: string
          collab_prefs: string[]
          created_at: string
          creator_type: string
          experience: string
          full_name: string
          genres: string[]
          id: string
          interests: string[]
          location: string
          looking_for: string[]
          onboarded: boolean
          skill_category: string
          skills: string[]
          studio_role: string
          tagline: string
          updated_at: string
          username: string | null
          years: number
        }
        Insert: {
          availability?: string
          avatar_url?: string
          bio?: string
          collab_prefs?: string[]
          created_at?: string
          creator_type?: string
          experience?: string
          full_name?: string
          genres?: string[]
          id: string
          interests?: string[]
          location?: string
          looking_for?: string[]
          onboarded?: boolean
          skill_category?: string
          skills?: string[]
          studio_role?: string
          tagline?: string
          updated_at?: string
          username?: string | null
          years?: number
        }
        Update: {
          availability?: string
          avatar_url?: string
          bio?: string
          collab_prefs?: string[]
          created_at?: string
          creator_type?: string
          experience?: string
          full_name?: string
          genres?: string[]
          id?: string
          interests?: string[]
          location?: string
          looking_for?: string[]
          onboarded?: boolean
          skill_category?: string
          skills?: string[]
          studio_role?: string
          tagline?: string
          updated_at?: string
          username?: string | null
          years?: number
        }
        Relationships: []
      }
      project_invites: {
        Row: {
          accepted_by: string | null
          code: string
          created_at: string
          created_by: string
          project_id: string
          role_offered: string | null
          status: string
          target_name: string | null
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_by?: string | null
          code: string
          created_at?: string
          created_by: string
          project_id: string
          role_offered?: string | null
          status?: string
          target_name?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_by?: string | null
          code?: string
          created_at?: string
          created_by?: string
          project_id?: string
          role_offered?: string | null
          status?: string
          target_name?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          media_category: string
          mime_type: string
          project_id: string
          uploaded_by: string
          uploaded_by_name: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          media_category?: string
          mime_type?: string
          project_id: string
          uploaded_by: string
          uploaded_by_name?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          media_category?: string
          mime_type?: string
          project_id?: string
          uploaded_by?: string
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          creative_role: string
          joined_at: string
          project_id: string
          role_in_project: string
          user_id: string
        }
        Insert: {
          creative_role?: string
          joined_at?: string
          project_id: string
          role_in_project?: string
          user_id: string
        }
        Update: {
          creative_role?: string
          joined_at?: string
          project_id?: string
          role_in_project?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          attachment: Json | null
          channel: string
          content: string
          created_at: string
          id: string
          project_id: string
          sender_avatar: string
          sender_id: string
          sender_name: string
          sender_role: string
          topic_title: string | null
        }
        Insert: {
          attachment?: Json | null
          channel?: string
          content?: string
          created_at?: string
          id?: string
          project_id: string
          sender_avatar?: string
          sender_id: string
          sender_name?: string
          sender_role?: string
          topic_title?: string | null
        }
        Update: {
          attachment?: Json | null
          channel?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_avatar?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string
          topic_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scripts: {
        Row: {
          access_level: string
          file_name: string
          file_path: string | null
          file_size: number | null
          format: string
          html_preview: string | null
          project_id: string
          text_content: string
          updated_at: string
          uploaded_by: string
          uploaded_by_name: string
        }
        Insert: {
          access_level?: string
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          format?: string
          html_preview?: string | null
          project_id: string
          text_content?: string
          updated_at?: string
          uploaded_by: string
          uploaded_by_name?: string
        }
        Update: {
          access_level?: string
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          format?: string
          html_preview?: string | null
          project_id?: string
          text_content?: string
          updated_at?: string
          uploaded_by?: string
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string
          feedback: Json
          genres: string[]
          id: string
          is_draft: boolean
          milestones: Json
          owner_id: string
          owner_name: string
          portfolio: Json
          primary_genre: string
          required_roles: string[]
          status: string
          tasks: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          feedback?: Json
          genres?: string[]
          id?: string
          is_draft?: boolean
          milestones?: Json
          owner_id: string
          owner_name?: string
          portfolio?: Json
          primary_genre?: string
          required_roles?: string[]
          status?: string
          tasks?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          feedback?: Json
          genres?: string[]
          id?: string
          is_draft?: boolean
          milestones?: Json
          owner_id?: string
          owner_name?: string
          portfolio?: Json
          primary_genre?: string
          required_roles?: string[]
          status?: string
          tasks?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_project_file: {
        Args: { _name: string; _user: string }
        Returns: boolean
      }
      can_write_project_file: {
        Args: { _name: string; _user: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project: string; _user: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { _project: string; _user: string }
        Returns: boolean
      }
      is_project_public: { Args: { _project: string }; Returns: boolean }
      lookup_invite: { Args: { _code: string }; Returns: Json }
      redeem_invite: { Args: { _code: string; _role: string }; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
