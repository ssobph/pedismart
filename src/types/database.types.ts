export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      driver_status_logs: {
        Row: {
          changed_at: string
          created_at: string
          driver_id: string
          id: string
          status: string
        }
        Insert: {
          changed_at?: string
          created_at?: string
          driver_id: string
          id?: string
          status: string
        }
        Update: {
          changed_at?: string
          created_at?: string
          driver_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_status_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          current_location: unknown | null
          plate_number: string
          profile_id: string
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          vehicle_details: string | null
        }
        Insert: {
          created_at?: string
          current_location?: unknown | null
          plate_number: string
          profile_id: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          vehicle_details?: string | null
        }
        Update: {
          created_at?: string
          current_location?: unknown | null
          plate_number?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          vehicle_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          ratee_id: string
          rater_id: string
          rating: number
          trip_id: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: never
          ratee_id: string
          rater_id: string
          rating: number
          trip_id: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: never
          ratee_id?: string
          rater_id?: string
          rating?: number
          trip_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ratee_id_fkey"
            columns: ["ratee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_passengers: {
        Row: {
          id: number
          inserted_at: string
          passenger_id: string
          status: string
          trip_id: number
        }
        Insert: {
          id?: number
          inserted_at?: string
          passenger_id: string
          status?: string
          trip_id: number
        }
        Update: {
          id?: number
          inserted_at?: string
          passenger_id?: string
          status?: string
          trip_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_passengers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_waypoints: {
        Row: {
          address: string | null
          completed_at: string | null
          id: number
          kind: string | null
          location: unknown
          order_index: number | null
          passenger_id: string
          sequence_order: number
          status: Database["public"]["Enums"]["waypoint_status"]
          trip_id: number
          type: Database["public"]["Enums"]["waypoint_type"]
        }
        Insert: {
          address?: string | null
          completed_at?: string | null
          id?: never
          kind?: string | null
          location: unknown
          order_index?: number | null
          passenger_id: string
          sequence_order: number
          status?: Database["public"]["Enums"]["waypoint_status"]
          trip_id: number
          type: Database["public"]["Enums"]["waypoint_type"]
        }
        Update: {
          address?: string | null
          completed_at?: string | null
          id?: never
          kind?: string | null
          location?: unknown
          order_index?: number | null
          passenger_id?: string
          sequence_order?: number
          status?: Database["public"]["Enums"]["waypoint_status"]
          trip_id?: number
          type?: Database["public"]["Enums"]["waypoint_type"]
        }
        Relationships: [
          {
            foreignKeyName: "trip_waypoints_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_waypoints_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          completed_at: string | null
          driver_id: string | null
          id: number
          passenger_id: string | null
          requested_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          driver_id?: string | null
          id?: never
          passenger_id?: string | null
          requested_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          driver_id?: string | null
          id?: never
          passenger_id?: string | null
          requested_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trips_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_ride_request: {
        Args: {
          p_dropoff_location: Json
          p_passenger_id: string
          p_pickup_location: Json
        }
        Returns: {
          accepted_at: string
          cancelled_at: string
          completed_at: string
          driver_id: string
          id: number
          passenger_id: string
          requested_at: string
          started_at: string
          status: Database["public"]["Enums"]["trip_status"]
        }[]
      }
      get_driver_stats: {
        Args: { p_driver_id: string; p_tz?: string }
        Returns: {
          average_rating: number
          hours_online: number
          trips_completed: number
        }[]
      }
      get_nearby_requests: {
        Args: {
          driver_lat: number
          driver_lng: number
          radius_m: number
          since?: string
        }
        Returns: {
          accepted_at: string
          cancelled_at: string
          completed_at: string
          distance_meters: number
          driver_id: string
          dropoff_location: Json
          id: number
          passenger_id: string
          pickup_location: Json
          requested_at: string
          started_at: string
          status: Database["public"]["Enums"]["trip_status"]
        }[]
      }
      nearby_drivers: {
        Args: { lat: number; long: number; radius_meters: number }
        Returns: {
          current_location: unknown
          distance_meters: number
          full_name: string
          plate_number: string
          profile_id: string
        }[]
      }
      nearby_passengers: {
        Args: { lat: number; long: number; radius_meters: number }
        Returns: {
          distance_meters: number
          passenger_id: string
          passenger_name: string
          pickup_address: string
          pickup_location: unknown
          requested_at: string
          trip_id: number
        }[]
      }
    }
    Enums: {
      driver_status: "online" | "offline" | "on_trip"
      trip_status:
        | "requested"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "offered"
        | "declined"
      user_role: "passenger" | "driver"
      waypoint_status: "pending" | "completed"
      waypoint_type: "pickup" | "dropoff"
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
    Enums: {
      driver_status: ["online", "offline", "on_trip"],
      trip_status: [
        "requested",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
        "offered",
        "declined",
      ],
      user_role: ["passenger", "driver"],
      waypoint_status: ["pending", "completed"],
      waypoint_type: ["pickup", "dropoff"],
    },
  },
} as const

