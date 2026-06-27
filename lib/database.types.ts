export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type GoalType = "weight_loss" | "muscle_gain" | "strength" | "sport_specific";
type ExecutionStyle = "reps" | "timed" | "failure" | "max_hold";
type ModeType = "dynamic" | "fixed_split" | "template";

export interface Database {
  public: {
    Tables: {
      body_sections: {
        Row: { id: string; name: string; display_name: string };
        Insert: { id?: string; name: string; display_name: string };
        Update: { id?: string; name?: string; display_name?: string };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          equipment_required: string[];
          goal_tags: string[];
          warm_up_required: boolean;
          execution_style: ExecutionStyle;
          target_reps: number | null;
          target_duration: number | null;
          easier_variant_id: string | null;
          harder_variant_id: string | null;
          demo_media_ref: string | null;
          difficulty_level: number;
          wger_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          equipment_required?: string[];
          goal_tags?: string[];
          warm_up_required?: boolean;
          execution_style: ExecutionStyle;
          target_reps?: number | null;
          target_duration?: number | null;
          easier_variant_id?: string | null;
          harder_variant_id?: string | null;
          demo_media_ref?: string | null;
          difficulty_level?: number;
          wger_id?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          equipment_required?: string[];
          goal_tags?: string[];
          warm_up_required?: boolean;
          execution_style?: ExecutionStyle;
          target_reps?: number | null;
          target_duration?: number | null;
          easier_variant_id?: string | null;
          harder_variant_id?: string | null;
          demo_media_ref?: string | null;
          difficulty_level?: number;
          wger_id?: number | null;
        };
        Relationships: [];
      };
      exercise_muscle_engagement: {
        Row: { exercise_id: string; body_section_id: string; engagement_level: number };
        Insert: { exercise_id: string; body_section_id: string; engagement_level: number };
        Update: { exercise_id?: string; body_section_id?: string; engagement_level?: number };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          height_cm: number | null;
          weight_kg: number | null;
          age: number | null;
          gender: string | null;
          goal: GoalType | null;
          mode_preference: ModeType;
          frequency_preference: number;
          intensity_preference: number;
          duration_preference: number;
          equipment: string[];
          onboarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          age?: number | null;
          gender?: string | null;
          goal?: GoalType | null;
          mode_preference?: ModeType;
          frequency_preference?: number;
          intensity_preference?: number;
          duration_preference?: number;
          equipment?: string[];
          onboarded_at?: string | null;
        };
        Update: {
          id?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          age?: number | null;
          gender?: string | null;
          goal?: GoalType | null;
          mode_preference?: ModeType;
          frequency_preference?: number;
          intensity_preference?: number;
          duration_preference?: number;
          equipment?: string[];
          onboarded_at?: string | null;
        };
        Relationships: [];
      };
      user_injury_states: {
        Row: {
          id: string;
          user_id: string;
          body_section_id: string;
          severity: number;
          reported_at: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          body_section_id: string;
          severity: number;
          reported_at?: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          body_section_id?: string;
          severity?: number;
          reported_at?: string;
          active?: boolean;
        };
        Relationships: [];
      };
      user_exercise_history: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          times_performed: number;
          last_performed_at: string | null;
          user_rating: number | null;
          is_excluded: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          times_performed?: number;
          last_performed_at?: string | null;
          user_rating?: number | null;
          is_excluded?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          times_performed?: number;
          last_performed_at?: string | null;
          user_rating?: number | null;
          is_excluded?: boolean;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mode_used: string;
          planned_duration: number | null;
          actual_duration: number | null;
          exercises_completed: Json;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          mode_used?: string;
          planned_duration?: number | null;
          actual_duration?: number | null;
          exercises_completed?: Json;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mode_used?: string;
          planned_duration?: number | null;
          actual_duration?: number | null;
          exercises_completed?: Json;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      performance_logs: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          session_id: string;
          date: string;
          result_value: number;
          is_personal_best: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          session_id: string;
          date?: string;
          result_value: number;
          is_personal_best?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          session_id?: string;
          date?: string;
          result_value?: number;
          is_personal_best?: boolean;
        };
        Relationships: [];
      };
      influencers: {
        Row: { id: string; name: string; social_link: string | null; created_at: string };
        Insert: { id?: string; name: string; social_link?: string | null };
        Update: { id?: string; name?: string; social_link?: string | null };
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          target_skill: string | null;
          created_by_influencer_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          target_skill?: string | null;
          created_by_influencer_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          target_skill?: string | null;
          created_by_influencer_id?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      program_exercises: {
        Row: {
          id: string;
          program_id: string;
          exercise_id: string;
          sequence_order: number;
          milestone_criteria: string | null;
        };
        Insert: {
          id?: string;
          program_id: string;
          exercise_id: string;
          sequence_order: number;
          milestone_criteria?: string | null;
        };
        Update: {
          id?: string;
          program_id?: string;
          exercise_id?: string;
          sequence_order?: number;
          milestone_criteria?: string | null;
        };
        Relationships: [];
      };
      user_program_enrollments: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          current_step: number;
          started_at: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id: string;
          current_step?: number;
          started_at?: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          program_id?: string;
          current_step?: number;
          started_at?: string;
          active?: boolean;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
