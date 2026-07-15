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
      comment_media: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          moderator_id: string | null
          moderator_note: string | null
          status: Database["public"]["Enums"]["media_status"]
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          moderator_id?: string | null
          moderator_note?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          moderator_id?: string | null
          moderator_note?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_media_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          entry_id: string
          id: string
          is_target_response: boolean
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entry_id: string
          id?: string
          is_target_response?: boolean
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entry_id?: string
          id?: string
          is_target_response?: boolean
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          category: Database["public"]["Enums"]["entry_category"]
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          id: string
          rating: number
          status: Database["public"]["Enums"]["entry_status"] | null
          target: string
          target_normalized: string
          updated_at: string
          user_id: string
          verified_target: boolean
        }
        Insert: {
          category: Database["public"]["Enums"]["entry_category"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          id?: string
          rating: number
          status?: Database["public"]["Enums"]["entry_status"] | null
          target: string
          target_normalized: string
          updated_at?: string
          user_id: string
          verified_target?: boolean
        }
        Update: {
          category?: Database["public"]["Enums"]["entry_category"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          id?: string
          rating?: number
          status?: Database["public"]["Enums"]["entry_status"] | null
          target?: string
          target_normalized?: string
          updated_at?: string
          user_id?: string
          verified_target?: boolean
        }
        Relationships: []
      }
      linked_accounts: {
        Row: {
          attempt_count: number
          created_at: string
          handle: string
          handle_normalized: string
          id: string
          last_attempt_at: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          updated_at: string
          user_id: string
          verification_code: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          handle: string
          handle_normalized: string
          id?: string
          last_attempt_at?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          updated_at?: string
          user_id: string
          verification_code: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          handle?: string
          handle_normalized?: string
          id?: string
          last_attempt_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          updated_at?: string
          user_id?: string
          verification_code?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          conversation_id: string | null
          created_at: string
          entry_id: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          message_id: string | null
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          conversation_id?: string | null
          created_at?: string
          entry_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          message_id?: string | null
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          conversation_id?: string | null
          created_at?: string
          entry_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          message_id?: string | null
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email_verification_token: string | null
          email_verified: boolean
          id: string
          is_banned: boolean
          occupation: string | null
          show_age: boolean
          show_avatar: boolean
          show_bio: boolean
          show_city: boolean
          show_display_name: boolean
          show_linked_accounts: boolean
          show_occupation: boolean
          signup_order: number
          updated_at: string
          user_id: string
          username: string
          username_chosen: boolean
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email_verification_token?: string | null
          email_verified?: boolean
          id?: string
          is_banned?: boolean
          occupation?: string | null
          show_age?: boolean
          show_avatar?: boolean
          show_bio?: boolean
          show_city?: boolean
          show_display_name?: boolean
          show_linked_accounts?: boolean
          show_occupation?: boolean
          signup_order?: number
          updated_at?: string
          user_id: string
          username: string
          username_chosen?: boolean
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email_verification_token?: string | null
          email_verified?: boolean
          id?: string
          is_banned?: boolean
          occupation?: string | null
          show_age?: boolean
          show_avatar?: boolean
          show_bio?: boolean
          show_city?: boolean
          show_display_name?: boolean
          show_linked_accounts?: boolean
          show_occupation?: boolean
          signup_order?: number
          updated_at?: string
          user_id?: string
          username?: string
          username_chosen?: boolean
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      target_verifications: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_verifications_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      votes: {
        Row: {
          comment_id: string | null
          created_at: string
          entry_id: string | null
          id: string
          user_id: string
          value: number
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          entry_id?: string | null
          id?: string
          user_id: string
          value: number
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          entry_id?: string | null
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_email_by_username: { Args: { _username: string }; Returns: string }
      get_entries_feed: {
        Args: { _category?: string; _limit?: number; _search?: string }
        Returns: {
          avg_rating: number
          category: Database["public"]["Enums"]["entry_category"]
          comment_count: number
          created_at: string
          deleted_at: string
          deleted_by: string
          description: string
          id: string
          last_comment_excerpt: string
          my_vote: number
          profile_age: number
          profile_avatar_url: string
          profile_bio: string
          profile_city: string
          profile_display_name: string
          profile_occupation: string
          profile_show_age: boolean
          profile_show_avatar: boolean
          profile_show_bio: boolean
          profile_show_city: boolean
          profile_show_display_name: boolean
          profile_show_linked_accounts: boolean
          profile_show_occupation: boolean
          profile_signup_order: number
          profile_user_id: string
          profile_username: string
          rating: number
          target: string
          target_normalized: string
          user_id: string
          verified_target: boolean
          vote_score: number
        }[]
      }
      get_my_email_verification_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_banned: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_email_confirmed: { Args: { _user_id: string }; Returns: boolean }
      is_entry_target: {
        Args: { _entry_id: string; _user_id: string }
        Returns: boolean
      }
      is_mod_or_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      user_owns_entry_target: {
        Args: { _entry_id: string; _user_id: string }
        Returns: boolean
      }
      verify_email_with_token: { Args: { _token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      entry_category: "instagram" | "tiktok" | "twitter" | "phone" | "score"
      entry_status: "safe" | "suspicious" | "danger"
      media_status: "pending" | "approved" | "rejected"
      notification_kind:
        | "message"
        | "entry_comment"
        | "comment_reply"
        | "thread_comment"
      social_platform: "instagram" | "x" | "tiktok"
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
      app_role: ["admin", "moderator", "user"],
      entry_category: ["instagram", "tiktok", "twitter", "phone", "score"],
      entry_status: ["safe", "suspicious", "danger"],
      media_status: ["pending", "approved", "rejected"],
      notification_kind: [
        "message",
        "entry_comment",
        "comment_reply",
        "thread_comment",
      ],
      social_platform: ["instagram", "x", "tiktok"],
    },
  },
} as const
