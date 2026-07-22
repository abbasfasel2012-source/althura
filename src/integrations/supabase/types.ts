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
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          pinned: boolean
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pinned?: boolean
          title?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          file_url: string
          grade: string | null
          id: string
          subject: string | null
          title: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          file_url: string
          grade?: string | null
          id?: string
          subject?: string | null
          title: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          file_url?: string
          grade?: string | null
          id?: string
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      dm_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          location: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          location?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          location?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          exam_date: string
          id: string
          subject: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_date: string
          id?: string
          subject: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_date?: string
          id?: string
          subject?: string
          title?: string
        }
        Relationships: []
      }
      grades_records: {
        Row: {
          created_at: string
          id: string
          score: number
          student_id: string
          subject: string
          term: string
        }
        Insert: {
          created_at?: string
          id?: string
          score: number
          student_id: string
          subject: string
          term?: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          student_id?: string
          subject?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          allow_media: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_private: boolean
          name: string
          updated_at: string
        }
        Insert: {
          allow_media?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          allow_media?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      homework: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          subject: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          subject: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          subject?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      pending_registrations: {
        Row: {
          created_at: string
          full_name: string
          grade: string
          id: string
          password_hash: string
          rejection_reason: string | null
          reviewed_at: string | null
          section: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          grade: string
          id?: string
          password_hash: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          section?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          grade?: string
          id?: string
          password_hash?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          section?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_label: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          grade: string
          id: string
          is_teacher: boolean
          phone: string | null
          section: string | null
          student_id: string | null
          teaching_grade: string | null
          teaching_section: string | null
          teaching_subject: string | null
          updated_at: string
        }
        Insert: {
          admin_label?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          grade?: string
          id: string
          is_teacher?: boolean
          phone?: string | null
          section?: string | null
          student_id?: string | null
          teaching_grade?: string | null
          teaching_section?: string | null
          teaching_subject?: string | null
          updated_at?: string
        }
        Update: {
          admin_label?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          grade?: string
          id?: string
          is_teacher?: boolean
          phone?: string | null
          section?: string | null
          student_id?: string | null
          teaching_grade?: string | null
          teaching_section?: string | null
          teaching_subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          ai_feedback: string | null
          answer: string | null
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          points_awarded: number | null
          question_id: string
        }
        Insert: {
          ai_feedback?: string | null
          answer?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id: string
        }
        Update: {
          ai_feedback?: string | null
          answer?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          max_score: number | null
          quiz_id: string
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          max_score?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          max_score?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          options: Json | null
          points: number
          position: number
          question: string
          quiz_id: string
          type: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          position?: number
          question: string
          quiz_id: string
          type: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          position?: number
          question?: string
          quiz_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          grade: string | null
          id: string
          is_published: boolean
          section: string | null
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade?: string | null
          id?: string
          is_published?: boolean
          section?: string | null
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade?: string | null
          id?: string
          is_published?: boolean
          section?: string | null
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_periods: {
        Row: {
          created_at: string
          day_id: string
          id: string
          period_number: number
          room: string | null
          start_time: string
          subject: string
          teacher: string | null
        }
        Insert: {
          created_at?: string
          day_id: string
          id?: string
          period_number: number
          room?: string | null
          start_time: string
          subject: string
          teacher?: string | null
        }
        Update: {
          created_at?: string
          day_id?: string
          id?: string
          period_number?: number
          room?: string | null
          start_time?: string
          subject?: string
          teacher?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_periods_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "weekly_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      site_images: {
        Row: {
          id: string
          slot: string
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          id?: string
          slot: string
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          id?: string
          slot?: string
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          subject: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          subject: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          subject?: string
          years_experience?: number | null
        }
        Relationships: []
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
      videos: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          grade: string | null
          id: string
          section: string | null
          subject: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade?: string | null
          id?: string
          section?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade?: string | null
          id?: string
          section?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      weekly_schedule: {
        Row: {
          created_at: string
          day_index: number
          day_name: string
          holiday_label: string | null
          id: string
          is_holiday: boolean
        }
        Insert: {
          created_at?: string
          day_index: number
          day_name: string
          holiday_label?: string | null
          id?: string
          is_holiday?: boolean
        }
        Update: {
          created_at?: string
          day_index?: number
          day_name?: string
          holiday_label?: string | null
          id?: string
          is_holiday?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_grade_section: {
        Args: { _grade: string; _section: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
