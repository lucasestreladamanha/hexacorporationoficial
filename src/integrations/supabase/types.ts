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
      deposits: {
        Row: {
          amount_brl: number
          amount_btc: number
          btc_rate_brl: number
          created_at: string
          id: string
          is_first_deposit: boolean
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount_brl: number
          amount_btc: number
          btc_rate_brl: number
          created_at?: string
          id?: string
          is_first_deposit?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
          wallet_address: string
        }
        Update: {
          amount_brl?: number
          amount_btc?: number
          btc_rate_brl?: number
          created_at?: string
          id?: string
          is_first_deposit?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          balance_btc: number
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string
          first_deposit_done: boolean
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          name: string
          phone: string | null
          state: string | null
          total_deposit_btc: number
          zip: string | null
        }
        Insert: {
          address?: string | null
          balance_btc?: number
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          first_deposit_done?: boolean
          id: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          name: string
          phone?: string | null
          state?: string | null
          total_deposit_btc?: number
          zip?: string | null
        }
        Update: {
          address?: string | null
          balance_btc?: number
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          first_deposit_done?: boolean
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          name?: string
          phone?: string | null
          state?: string | null
          total_deposit_btc?: number
          zip?: string | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount_brl: number
          amount_btc: number
          created_at: string
          destination_wallet: string
          id: string
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          amount_brl: number
          amount_btc: number
          created_at?: string
          destination_wallet: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          amount_brl?: number
          amount_btc?: number
          created_at?: string
          destination_wallet?: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
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
      admin_list: { Args: { p_password: string }; Returns: Json }
      admin_set_deposit: {
        Args: {
          p_deposit: string
          p_password: string
          p_status: Database["public"]["Enums"]["request_status"]
        }
        Returns: undefined
      }
      admin_set_kyc: {
        Args: {
          p_password: string
          p_status: Database["public"]["Enums"]["kyc_status"]
          p_user: string
        }
        Returns: undefined
      }
      admin_set_withdraw: {
        Args: {
          p_password: string
          p_status: Database["public"]["Enums"]["request_status"]
          p_withdraw: string
        }
        Returns: undefined
      }
      create_deposit: {
        Args: { p_amount_brl: number; p_amount_btc: number; p_rate: number }
        Returns: {
          amount_brl: number
          amount_btc: number
          btc_rate_brl: number
          created_at: string
          id: string
          is_first_deposit: boolean
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
          wallet_address: string
        }
        SetofOptions: {
          from: "*"
          to: "deposits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_withdraw: {
        Args: { p_amount_brl: number; p_amount_btc: number; p_dest: string }
        Returns: {
          amount_brl: number
          amount_btc: number
          created_at: string
          destination_wallet: string
          id: string
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      kyc_status: "none" | "pending" | "approved" | "rejected"
      request_status: "pending" | "approved" | "rejected"
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
      kyc_status: ["none", "pending", "approved", "rejected"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
