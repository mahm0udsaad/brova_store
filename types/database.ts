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
      admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      ai_access_contract: {
        Row: {
          created_at: string | null
          guaranteed_fields: string[]
          id: number
          notes: string | null
          prohibited_actions: string[]
          required_filters: string[]
          view_name: string
        }
        Insert: {
          created_at?: string | null
          guaranteed_fields: string[]
          id?: number
          notes?: string | null
          prohibited_actions: string[]
          required_filters: string[]
          view_name: string
        }
        Update: {
          created_at?: string | null
          guaranteed_fields?: string[]
          id?: number
          notes?: string | null
          prohibited_actions?: string[]
          required_filters?: string[]
          view_name?: string
        }
        Relationships: []
      }
      ai_actions_log: {
        Row: {
          action_type: string
          agent_name: string | null
          conversation_id: string | null
          created_at: string | null
          duration_ms: number | null
          error: string | null
          id: string
          input: Json | null
          merchant_id: string
          output: Json | null
          status: string
          store_id: string | null
          tool_name: string | null
        }
        Insert: {
          action_type: string
          agent_name?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          merchant_id: string
          output?: Json | null
          status: string
          store_id?: string | null
          tool_name?: string | null
        }
        Update: {
          action_type?: string
          agent_name?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          merchant_id?: string
          output?: Json | null
          status?: string
          store_id?: string | null
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_actions_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_actions_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_actions_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_actions_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          merchant_id: string
          metadata: Json | null
          store_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          merchant_id: string
          metadata?: Json | null
          store_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          merchant_id?: string
          metadata?: Json | null
          store_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory_snapshots: {
        Row: {
          conversation_id: string
          created_at: string | null
          entities: Json | null
          id: string
          merchant_id: string
          message_count: number
          snapshot_type: string
          store_id: string | null
          summary: string
          token_count: number
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          entities?: Json | null
          id?: string
          merchant_id: string
          message_count?: number
          snapshot_type: string
          store_id?: string | null
          summary: string
          token_count?: number
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          entities?: Json | null
          id?: string
          merchant_id?: string
          message_count?: number
          snapshot_type?: string
          store_id?: string | null
          summary?: string
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_memory_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_memory_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_memory_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          images: string[] | null
          metadata: Json | null
          role: string
          steps: Json | null
          thinking: boolean | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          role: string
          steps?: Json | null
          thinking?: boolean | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          role?: string
          steps?: Json | null
          thinking?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tasks: {
        Row: {
          agent: string
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          input: Json | null
          merchant_id: string | null
          metadata: Json | null
          output: Json | null
          parent_task_id: string | null
          started_at: string | null
          status: string
          store_id: string | null
          task_type: string
        }
        Insert: {
          agent: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          input?: Json | null
          merchant_id?: string | null
          metadata?: Json | null
          output?: Json | null
          parent_task_id?: string | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          task_type: string
        }
        Update: {
          agent?: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          input?: Json | null
          merchant_id?: string | null
          metadata?: Json | null
          output?: Json | null
          parent_task_id?: string | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          cost_estimate: number | null
          count: number | null
          created_at: string | null
          date: string
          id: string
          merchant_id: string | null
          operation: string
          store_id: string | null
          tokens_used: number | null
        }
        Insert: {
          cost_estimate?: number | null
          count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          merchant_id?: string | null
          operation: string
          store_id?: string | null
          tokens_used?: number | null
        }
        Update: {
          cost_estimate?: number | null
          count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          merchant_id?: string | null
          operation?: string
          store_id?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_usage_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_usage_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_usage_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          cost: number
          created_at: string
          id: string
          input_tokens: number
          latency_ms: number
          merchant_id: string
          metadata: Json | null
          model: string
          operation: string
          output_tokens: number
          provider: string
          store_id: string
          timestamp: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          merchant_id: string
          metadata?: Json | null
          model: string
          operation: string
          output_tokens?: number
          provider: string
          store_id: string
          timestamp?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          merchant_id?: string
          metadata?: Json | null
          model?: string
          operation?: string
          output_tokens?: number
          provider?: string
          store_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflow_state: {
        Row: {
          completed_at: string | null
          conversation_id: string
          created_at: string | null
          current_stage: number
          id: string
          merchant_id: string
          stage_data: Json | null
          status: string
          store_id: string | null
          total_stages: number
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          conversation_id: string
          created_at?: string | null
          current_stage?: number
          id?: string
          merchant_id: string
          stage_data?: Json | null
          status: string
          store_id?: string | null
          total_stages: number
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          completed_at?: string | null
          conversation_id?: string
          created_at?: string | null
          current_stage?: number
          id?: string
          merchant_id?: string
          stage_data?: Json | null
          status?: string
          store_id?: string | null
          total_stages?: number
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflow_state_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_workflow_state_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_workflow_state_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_workflow_state_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "ai_workflow_state_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_items: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          index: number
          input_data: Json
          output_data: Json | null
          status: string | null
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          index: number
          input_data: Json
          output_data?: Json | null
          status?: string | null
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          index?: number
          input_data?: Json
          output_data?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_operations: {
        Row: {
          created_at: string | null
          id: string
          session_id: string | null
          status: string | null
          store_id: string
          total_count: number
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          store_id: string
          total_count: number
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          store_id?: string
          total_count?: number
          type?: string
        }
        Relationships: []
      }
      bulk_ai_operations: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          failed_count: number | null
          id: string
          options: Json | null
          processed_items: number | null
          results: Json | null
          started_at: string | null
          status: string
          store_id: string
          success_count: number | null
          total_items: number
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          failed_count?: number | null
          id?: string
          options?: Json | null
          processed_items?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          store_id: string
          success_count?: number | null
          total_items: number
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          failed_count?: number | null
          id?: string
          options?: Json | null
          processed_items?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          store_id?: string
          success_count?: number | null
          total_items?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_ai_operations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "bulk_ai_operations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "bulk_ai_operations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "bulk_ai_operations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_deal_batches: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string | null
          current_product: string | null
          error_log: Json | null
          failed_count: number | null
          id: string
          merchant_id: string | null
          name: string
          processed_count: number | null
          product_groups: Json | null
          source_urls: string[] | null
          status: string
          store_id: string | null
          total_images: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          current_product?: string | null
          error_log?: Json | null
          failed_count?: number | null
          id?: string
          merchant_id?: string | null
          name: string
          processed_count?: number | null
          product_groups?: Json | null
          source_urls?: string[] | null
          status?: string
          store_id?: string | null
          total_images?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          current_product?: string | null
          error_log?: Json | null
          failed_count?: number | null
          id?: string
          merchant_id?: string | null
          name?: string
          processed_count?: number | null
          product_groups?: Json | null
          source_urls?: string[] | null
          status?: string
          store_id?: string | null
          total_images?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_deal_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "bulk_deal_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "bulk_deal_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "bulk_deal_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_deal_images: {
        Row: {
          batch_id: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          id: string
          original_url: string | null
          processed_url: string | null
          processing_data: Json | null
          status: string | null
          storage_id: string
          updated_at: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          id?: string
          original_url?: string | null
          processed_url?: string | null
          processing_data?: Json | null
          status?: string | null
          storage_id: string
          updated_at?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          id?: string
          original_url?: string | null
          processed_url?: string | null
          processing_data?: Json | null
          status?: string | null
          storage_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_deal_images_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "bulk_deal_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          merchant_id: string | null
          metrics: Json | null
          name: string
          products: string[] | null
          published_at: string | null
          schedule: Json | null
          status: string
          store_id: string | null
          target: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          metrics?: Json | null
          name: string
          products?: string[] | null
          published_at?: string | null
          schedule?: Json | null
          status?: string
          store_id?: string | null
          target?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          metrics?: Json | null
          name?: string
          products?: string[] | null
          published_at?: string | null
          schedule?: Json | null
          status?: string
          store_id?: string | null
          target?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          color: string | null
          created_at: string | null
          custom_options: Json | null
          id: string
          product_id: string
          product_snapshot: Json | null
          product_variant_id: string | null
          quantity: number
          size: string | null
          subtotal: number | null
          total_price: number | null
          unit_price: number
          updated_at: string | null
          variant_id: string | null
          variant_options: Json | null
        }
        Insert: {
          cart_id: string
          color?: string | null
          created_at?: string | null
          custom_options?: Json | null
          id?: string
          product_id: string
          product_snapshot?: Json | null
          product_variant_id?: string | null
          quantity?: number
          size?: string | null
          subtotal?: number | null
          total_price?: number | null
          unit_price: number
          updated_at?: string | null
          variant_id?: string | null
          variant_options?: Json | null
        }
        Update: {
          cart_id?: string
          color?: string | null
          created_at?: string | null
          custom_options?: Json | null
          id?: string
          product_id?: string
          product_snapshot?: Json | null
          product_variant_id?: string | null
          quantity?: number
          size?: string | null
          subtotal?: number | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string | null
          variant_id?: string | null
          variant_options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cart_items_variant_id"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          abandoned_at: string | null
          channel: string | null
          converted_at: string | null
          converted_to_order_id: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          discount_amount: number | null
          expires_at: string | null
          id: string
          items_count: number | null
          last_activity_at: string | null
          session_id: string | null
          shipping_amount: number | null
          status: string | null
          store_id: string | null
          subtotal: number | null
          tax_amount: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          channel?: string | null
          converted_at?: string | null
          converted_to_order_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          expires_at?: string | null
          id?: string
          items_count?: number | null
          last_activity_at?: string | null
          session_id?: string | null
          shipping_amount?: number | null
          status?: string | null
          store_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          channel?: string | null
          converted_at?: string | null
          converted_to_order_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          expires_at?: string | null
          id?: string
          items_count?: number | null
          last_activity_at?: string | null
          session_id?: string | null
          shipping_amount?: number | null
          status?: string | null
          store_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_converted_to_order_id_fkey"
            columns: ["converted_to_order_id"]
            isOneToOne: false
            referencedRelation: "ai_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "carts_converted_to_order_id_fkey"
            columns: ["converted_to_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          product_count: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          image_url?: string | null
          name: string
          product_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          product_count?: number | null
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          auto_rules: Json | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          name_ar: string | null
          slug: string
          sort_order: number | null
          store_id: string
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          auto_rules?: Json | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          name_ar?: string | null
          slug: string
          sort_order?: number | null
          store_id: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          auto_rules?: Json | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          name_ar?: string | null
          slug?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          accepts_marketing: boolean | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          store_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepts_marketing?: boolean | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          store_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepts_marketing?: boolean | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          store_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          expires_at: string | null
          generated_url: string
          id: string
          merchant_id: string | null
          metadata: Json | null
          product_id: string | null
          prompt: string | null
          source_url: string | null
          store_id: string | null
          task_id: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          expires_at?: string | null
          generated_url: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
          product_id?: string | null
          prompt?: string | null
          source_url?: string | null
          store_id?: string | null
          task_id?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          expires_at?: string | null
          generated_url?: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
          product_id?: string | null
          prompt?: string | null
          source_url?: string | null
          store_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_assets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "generated_assets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "generated_assets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "generated_assets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_assets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_post_drafts: {
        Row: {
          copy_text: Json
          created_at: string
          id: string
          media_assets: Json
          merchant_id: string | null
          platform: string
          product_ids: string[] | null
          published_at: string | null
          status: string
          store_id: string | null
          ui_structure: Json
          updated_at: string
          version: number
        }
        Insert: {
          copy_text?: Json
          created_at?: string
          id?: string
          media_assets?: Json
          merchant_id?: string | null
          platform: string
          product_ids?: string[] | null
          published_at?: string | null
          status?: string
          store_id?: string | null
          ui_structure?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          copy_text?: Json
          created_at?: string
          id?: string
          media_assets?: Json
          merchant_id?: string | null
          platform?: string
          product_ids?: string[] | null
          published_at?: string | null
          status?: string
          store_id?: string | null
          ui_structure?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_post_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "marketing_post_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "marketing_post_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "marketing_post_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_ai_config: {
        Row: {
          created_at: string
          daily_cost_limit: number | null
          daily_token_limit: number | null
          enable_shopping_assistant: boolean | null
          enable_video: boolean | null
          enable_voice: boolean | null
          encrypted_api_keys: Json | null
          id: string
          monthly_cost_limit: number | null
          monthly_token_limit: number | null
          prefer_local_models: boolean | null
          preferred_model: string | null
          store_id: string
          updated_at: string
          use_byok: boolean | null
        }
        Insert: {
          created_at?: string
          daily_cost_limit?: number | null
          daily_token_limit?: number | null
          enable_shopping_assistant?: boolean | null
          enable_video?: boolean | null
          enable_voice?: boolean | null
          encrypted_api_keys?: Json | null
          id?: string
          monthly_cost_limit?: number | null
          monthly_token_limit?: number | null
          prefer_local_models?: boolean | null
          preferred_model?: string | null
          store_id: string
          updated_at?: string
          use_byok?: boolean | null
        }
        Update: {
          created_at?: string
          daily_cost_limit?: number | null
          daily_token_limit?: number | null
          enable_shopping_assistant?: boolean | null
          enable_video?: boolean | null
          enable_voice?: boolean | null
          encrypted_api_keys?: Json | null
          id?: string
          monthly_cost_limit?: number | null
          monthly_token_limit?: number | null
          prefer_local_models?: boolean | null
          preferred_model?: string | null
          store_id?: string
          updated_at?: string
          use_byok?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_ai_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "merchant_ai_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "merchant_ai_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "merchant_ai_config_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_ar: string | null
          metadata: Json | null
          priority: string
          read_at: string | null
          store_id: string
          title: string
          title_ar: string | null
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_ar?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          store_id: string
          title: string
          title_ar?: string | null
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_ar?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          store_id?: string
          title?: string
          title_ar?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_intent: {
        Row: {
          created_at: string | null
          id: string
          store_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          store_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          store_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number | null
          product_brand: string | null
          product_id: string | null
          product_name: string | null
          product_snapshot: Json | null
          quantity: number
          store_id: string | null
          total: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price?: number | null
          product_brand?: string | null
          product_id?: string | null
          product_name?: string | null
          product_snapshot?: Json | null
          quantity?: number
          store_id?: string | null
          total?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number | null
          product_brand?: string | null
          product_id?: string | null
          product_name?: string | null
          product_snapshot?: Json | null
          quantity?: number
          store_id?: string | null
          total?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_id: string
          status: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          channel: string | null
          city: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          first_name: string | null
          full_name: string | null
          id: string
          items: Json | null
          last_name: string | null
          order_number: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string | null
          phone: string
          postal_code: string | null
          shipping_cost: number | null
          shipping_fee: number | null
          shipping_zone_id: string | null
          status: string | null
          store_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          tax_amount: number | null
          total: number | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          address: string
          channel?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          items?: Json | null
          last_name?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          phone: string
          postal_code?: string | null
          shipping_cost?: number | null
          shipping_fee?: number | null
          shipping_zone_id?: string | null
          status?: string | null
          store_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          address?: string
          channel?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          items?: Json | null
          last_name?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          phone?: string
          postal_code?: string | null
          shipping_cost?: number | null
          shipping_fee?: number | null
          shipping_zone_id?: string | null
          status?: string | null
          store_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          slug: string
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_interval: string | null
          subscription_period_end: string | null
          subscription_plan: string | null
          subscription_status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          slug: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_interval?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_interval?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_message: string | null
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          status: string
          store_id: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "payout_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "payout_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "payout_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["id"]
          },
        ]
      }
      product_drafts: {
        Row: {
          ai_confidence: string | null
          batch_id: string | null
          category: string | null
          category_ar: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          group_index: number | null
          id: string
          image_urls: string[] | null
          merchant_id: string
          metadata: Json | null
          name: string | null
          name_ar: string | null
          primary_image_url: string | null
          status: string
          store_id: string
          suggested_price: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: string | null
          batch_id?: string | null
          category?: string | null
          category_ar?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          group_index?: number | null
          id?: string
          image_urls?: string[] | null
          merchant_id: string
          metadata?: Json | null
          name?: string | null
          name_ar?: string | null
          primary_image_url?: string | null
          status?: string
          store_id: string
          suggested_price?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: string | null
          batch_id?: string | null
          category?: string | null
          category_ar?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          group_index?: number | null
          id?: string
          image_urls?: string[] | null
          merchant_id?: string
          metadata?: Json | null
          name?: string | null
          name_ar?: string | null
          primary_image_url?: string | null
          status?: string
          store_id?: string
          suggested_price?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_drafts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "bulk_deal_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_drafts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          ai_asset_id: string | null
          ai_generated: boolean | null
          alt_text: string | null
          alt_text_ar: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
          store_id: string
          updated_at: string | null
          url: string
          variant_id: string | null
        }
        Insert: {
          ai_asset_id?: string | null
          ai_generated?: boolean | null
          alt_text?: string | null
          alt_text_ar?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
          store_id: string
          updated_at?: string | null
          url: string
          variant_id?: string | null
        }
        Update: {
          ai_asset_id?: string | null
          ai_generated?: boolean | null
          alt_text?: string | null
          alt_text_ar?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string | null
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_ai_asset_id_fkey"
            columns: ["ai_asset_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          available: boolean | null
          compare_at_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          inventory_policy: string | null
          inventory_quantity: number | null
          options: Json
          price: number | null
          product_id: string
          sku: string | null
          store_id: string
          updated_at: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          available?: boolean | null
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          inventory_policy?: string | null
          inventory_quantity?: number | null
          options?: Json
          price?: number | null
          product_id: string
          sku?: string | null
          store_id: string
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          available?: boolean | null
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          inventory_policy?: string | null
          inventory_quantity?: number | null
          options?: Json
          price?: number | null
          product_id?: string
          sku?: string | null
          store_id?: string
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          gender: string | null
          id: string
          image_url: string | null
          images: string[] | null
          name: string
          price: number | null
          published: boolean | null
          sizes: string[] | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id: string
          image_url?: string | null
          images?: string[] | null
          name: string
          price?: number | null
          published?: boolean | null
          sizes?: string[] | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name?: string
          price?: number | null
          published?: boolean | null
          sizes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          phone: string | null
          try_on_credits: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          phone?: string | null
          try_on_credits?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          phone?: string | null
          try_on_credits?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      social_media_connections: {
        Row: {
          access_token: string
          account_id: string
          account_name: string
          connected_at: string
          created_at: string
          id: string
          is_active: boolean | null
          last_error: string | null
          last_sync_at: string | null
          platform: string
          refresh_token: string | null
          scopes: string[] | null
          store_id: string
          token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          account_id: string
          account_name: string
          connected_at?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          platform: string
          refresh_token?: string | null
          scopes?: string[] | null
          store_id: string
          token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string
          connected_at?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          platform?: string
          refresh_token?: string | null
          scopes?: string[] | null
          store_id?: string
          token_expires_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "social_media_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "social_media_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "social_media_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          caption: string
          caption_ar: string | null
          clicks: number | null
          comments: number | null
          connection_id: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          engagement: number | null
          error: string | null
          hashtags: string[] | null
          id: string
          last_metrics_fetch_at: string | null
          likes: number | null
          media_type: string | null
          media_urls: string[] | null
          platform: string
          platform_post_id: string | null
          platform_url: string | null
          published_at: string | null
          reach: number | null
          scheduled_at: string | null
          shares: number | null
          status: string
          store_id: string
          updated_at: string
          views: number | null
        }
        Insert: {
          caption: string
          caption_ar?: string | null
          clicks?: number | null
          comments?: number | null
          connection_id: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          engagement?: number | null
          error?: string | null
          hashtags?: string[] | null
          id?: string
          last_metrics_fetch_at?: string | null
          likes?: number | null
          media_type?: string | null
          media_urls?: string[] | null
          platform: string
          platform_post_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          reach?: number | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string
          store_id: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          caption?: string
          caption_ar?: string | null
          clicks?: number | null
          comments?: number | null
          connection_id?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          engagement?: number | null
          error?: string | null
          hashtags?: string[] | null
          id?: string
          last_metrics_fetch_at?: string | null
          likes?: number | null
          media_type?: string | null
          media_urls?: string[] | null
          platform?: string
          platform_post_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          reach?: number | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string
          store_id?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "social_media_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_posts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "social_media_posts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "social_media_posts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "social_media_posts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_banners: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_target: string | null
          link_type: string | null
          link_url: string | null
          position: string | null
          sort_order: number | null
          starts_at: string | null
          store_id: string
          title: string | null
          title_ar: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_target?: string | null
          link_type?: string | null
          link_url?: string | null
          position?: string | null
          sort_order?: number | null
          starts_at?: string | null
          store_id: string
          title?: string | null
          title_ar?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_target?: string | null
          link_type?: string | null
          link_url?: string | null
          position?: string | null
          sort_order?: number | null
          starts_at?: string | null
          store_id?: string
          title?: string | null
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          name_ar: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          name_ar?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_components: {
        Row: {
          component_type: string
          config: Json
          created_at: string | null
          id: string
          position: number
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          component_type: string
          config?: Json
          created_at?: string | null
          id?: string
          position?: number
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          component_type?: string
          config?: Json
          created_at?: string | null
          id?: string
          position?: number
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_contact: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          postal_code: string | null
          region: string | null
          store_id: string
          store_name: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          store_id: string
          store_name?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          store_id?: string
          store_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_contact_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_contact_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_contact_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_contact_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_primary: boolean
          status: Database["public"]["Enums"]["domain_status"]
          store_id: string
          updated_at: string
          verification_token: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_primary?: boolean
          status?: Database["public"]["Enums"]["domain_status"]
          store_id: string
          updated_at?: string
          verification_token?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_primary?: boolean
          status?: Database["public"]["Enums"]["domain_status"]
          store_id?: string
          updated_at?: string
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_migration_tasks: {
        Row: {
          categories_imported: number | null
          completed_at: string | null
          created_at: string
          current_item: number | null
          current_stage: string | null
          errors: Json | null
          id: string
          images_imported: number | null
          message: string | null
          message_ar: string | null
          options: Json | null
          products_imported: number | null
          source_platform: string | null
          source_url: string
          started_at: string | null
          status: string
          store_id: string
          total_items: number | null
        }
        Insert: {
          categories_imported?: number | null
          completed_at?: string | null
          created_at?: string
          current_item?: number | null
          current_stage?: string | null
          errors?: Json | null
          id?: string
          images_imported?: number | null
          message?: string | null
          message_ar?: string | null
          options?: Json | null
          products_imported?: number | null
          source_platform?: string | null
          source_url: string
          started_at?: string | null
          status?: string
          store_id: string
          total_items?: number | null
        }
        Update: {
          categories_imported?: number | null
          completed_at?: string | null
          created_at?: string
          current_item?: number | null
          current_stage?: string | null
          errors?: Json | null
          id?: string
          images_imported?: number | null
          message?: string | null
          message_ar?: string | null
          options?: Json | null
          products_imported?: number | null
          source_platform?: string | null
          source_url?: string
          started_at?: string | null
          status?: string
          store_id?: string
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_migration_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_migration_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_migration_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_migration_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_preview_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          store_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          store_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          store_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_preview_tokens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_preview_tokens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_preview_tokens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_preview_tokens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          ai_confidence: string | null
          ai_generated: boolean | null
          category: string | null
          category_ar: string | null
          category_id: string | null
          colors: string[] | null
          created_at: string
          currency: string | null
          description: string | null
          description_ar: string | null
          gender: string | null
          id: string
          image_url: string | null
          images: string[] | null
          inventory: number
          legacy_product_id: string | null
          name: string
          name_ar: string | null
          price: number
          published_at: string | null
          sizes: string[] | null
          sku: string | null
          slug: string
          status: string
          stock_quantity: number | null
          store_id: string
          tags: string[] | null
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          ai_confidence?: string | null
          ai_generated?: boolean | null
          category?: string | null
          category_ar?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          inventory?: number
          legacy_product_id?: string | null
          name: string
          name_ar?: string | null
          price: number
          published_at?: string | null
          sizes?: string[] | null
          sku?: string | null
          slug: string
          status?: string
          stock_quantity?: number | null
          store_id: string
          tags?: string[] | null
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          ai_confidence?: string | null
          ai_generated?: boolean | null
          category?: string | null
          category_ar?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          inventory?: number
          legacy_product_id?: string | null
          name?: string
          name_ar?: string | null
          price?: number
          published_at?: string | null
          sizes?: string[] | null
          sku?: string | null
          slug?: string
          status?: string
          stock_quantity?: number | null
          store_id?: string
          tags?: string[] | null
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          ai_preferences: Json | null
          appearance: Json | null
          id: string
          merchant_id: string | null
          notifications: Json | null
          shipping: Json | null
          store_id: string
          theme_config: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_preferences?: Json | null
          appearance?: Json | null
          id?: string
          merchant_id?: string | null
          notifications?: Json | null
          shipping?: Json | null
          store_id: string
          theme_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_preferences?: Json | null
          appearance?: Json | null
          id?: string
          merchant_id?: string | null
          notifications?: Json | null
          shipping?: Json | null
          store_id?: string
          theme_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          default_locale: string | null
          id: string
          name: string
          onboarding_completed: string | null
          organization_id: string
          published_at: string | null
          slug: string | null
          status: string
          store_type: string | null
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          default_locale?: string | null
          id?: string
          name: string
          onboarding_completed?: string | null
          organization_id: string
          published_at?: string | null
          slug?: string | null
          status?: string
          store_type?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          default_locale?: string | null
          id?: string
          name?: string
          onboarding_completed?: string | null
          organization_id?: string
          published_at?: string | null
          slug?: string | null
          status?: string
          store_type?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "ai_products"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "ai_store_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_ai_generations: number | null
          max_products: number | null
          max_team_members: number | null
          monthly_price_id: string
          monthly_price_usd: number
          name: string
          name_ar: string | null
          sort_order: number | null
          transaction_fee_percent: number | null
          yearly_price_id: string
          yearly_price_usd: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          max_ai_generations?: number | null
          max_products?: number | null
          max_team_members?: number | null
          monthly_price_id: string
          monthly_price_usd: number
          name: string
          name_ar?: string | null
          sort_order?: number | null
          transaction_fee_percent?: number | null
          yearly_price_id: string
          yearly_price_usd: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_ai_generations?: number | null
          max_products?: number | null
          max_team_members?: number | null
          monthly_price_id?: string
          monthly_price_usd?: number
          name?: string
          name_ar?: string | null
          sort_order?: number | null
          transaction_fee_percent?: number | null
          yearly_price_id?: string
          yearly_price_usd?: number
        }
        Relationships: []
      }
      theme_configurations: {
        Row: {
          ai_conversation_id: string | null
          ai_generated: boolean | null
          colors: Json
          components: Json
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          published_at: string | null
          store_id: string
          template_id: string | null
          typography: Json
          updated_at: string
        }
        Insert: {
          ai_conversation_id?: string | null
          ai_generated?: boolean | null
          colors?: Json
          components?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          published_at?: string | null
          store_id: string
          template_id?: string | null
          typography?: Json
          updated_at?: string
        }
        Update: {
          ai_conversation_id?: string | null
          ai_generated?: boolean | null
          colors?: Json
          components?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          published_at?: string | null
          store_id?: string
          template_id?: string | null
          typography?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "theme_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "theme_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "theme_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      try_on_history: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          product_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "try_on_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "try_on_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "try_on_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      video_generation_tasks: {
        Row: {
          aspect_ratio: string
          completed_at: string | null
          created_at: string
          duration: number
          error: string | null
          expires_at: string | null
          id: string
          model: string
          progress: number | null
          prompt: string
          prompt_ar: string | null
          provider: string
          provider_job_id: string | null
          provider_metadata: Json | null
          result_url: string | null
          source_image: string | null
          started_at: string | null
          status: string
          store_id: string
          style: string | null
          text_overlay: Json | null
          thumbnail_url: string | null
          type: string
        }
        Insert: {
          aspect_ratio: string
          completed_at?: string | null
          created_at?: string
          duration: number
          error?: string | null
          expires_at?: string | null
          id?: string
          model: string
          progress?: number | null
          prompt: string
          prompt_ar?: string | null
          provider: string
          provider_job_id?: string | null
          provider_metadata?: Json | null
          result_url?: string | null
          source_image?: string | null
          started_at?: string | null
          status?: string
          store_id: string
          style?: string | null
          text_overlay?: Json | null
          thumbnail_url?: string | null
          type: string
        }
        Update: {
          aspect_ratio?: string
          completed_at?: string | null
          created_at?: string
          duration?: number
          error?: string | null
          expires_at?: string | null
          id?: string
          model?: string
          progress?: number | null
          prompt?: string
          prompt_ar?: string | null
          provider?: string
          provider_job_id?: string | null
          provider_metadata?: Json | null
          result_url?: string | null
          source_image?: string | null
          started_at?: string | null
          status?: string
          store_id?: string
          style?: string | null
          text_overlay?: Json | null
          thumbnail_url?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_generation_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "video_generation_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "video_generation_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "video_generation_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          avg_confidence: number | null
          created_at: string
          customer_id: string | null
          customer_session_id: string | null
          detected_dialect: string | null
          id: string
          is_active: boolean | null
          language: string
          last_interaction_at: string | null
          messages: Json | null
          store_id: string
          total_duration_seconds: number | null
          total_interactions: number | null
          tts_voice_id: string | null
          updated_at: string
        }
        Insert: {
          avg_confidence?: number | null
          created_at?: string
          customer_id?: string | null
          customer_session_id?: string | null
          detected_dialect?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          last_interaction_at?: string | null
          messages?: Json | null
          store_id: string
          total_duration_seconds?: number | null
          total_interactions?: number | null
          tts_voice_id?: string | null
          updated_at?: string
        }
        Update: {
          avg_confidence?: number | null
          created_at?: string
          customer_id?: string | null
          customer_session_id?: string | null
          detected_dialect?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          last_interaction_at?: string | null
          messages?: Json | null
          store_id?: string
          total_duration_seconds?: number | null
          total_interactions?: number | null
          tts_voice_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "voice_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "voice_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "voice_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          available_balance: number
          created_at: string
          currency: string
          id: string
          pending_balance: number
          store_id: string
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_connected: boolean | null
          stripe_onboarding_complete: boolean | null
          total_earned: number
          total_withdrawn: number | null
          updated_at: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          currency?: string
          id?: string
          pending_balance?: number
          store_id: string
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_connected?: boolean | null
          stripe_onboarding_complete?: boolean | null
          total_earned?: number
          total_withdrawn?: number | null
          updated_at?: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          currency?: string
          id?: string
          pending_balance?: number
          store_id?: string
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_connected?: boolean | null
          stripe_onboarding_complete?: boolean | null
          total_earned?: number
          total_withdrawn?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_balances_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "wallet_balances_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "wallet_balances_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "wallet_balances_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          status: string
          store_id: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          status?: string
          store_id: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          status?: string
          store_id?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "wallet_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "wallet_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "wallet_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_catalog_stats: {
        Row: {
          active_count: number | null
          avg_price: number | null
          category_id: string | null
          max_price: number | null
          min_price: number | null
          organization_id: string | null
          organization_slug: string | null
          product_count: number | null
          store_id: string | null
          store_name: string | null
          total_inventory: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_orders: {
        Row: {
          customer_name: string | null
          days_since_order: number | null
          item_count: number | null
          order_date: string | null
          order_id: string | null
          order_status: string | null
          shipping_fee: number | null
          store_id: string | null
          subtotal: number | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          customer_name?: string | null
          days_since_order?: never
          item_count?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: string | null
          shipping_fee?: number | null
          store_id?: string | null
          subtotal?: number | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          customer_name?: string | null
          days_since_order?: never
          item_count?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: string | null
          shipping_fee?: number | null
          store_id?: string | null
          subtotal?: number | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          gender: string | null
          image_count: number | null
          inventory: number | null
          legacy_product_id: string | null
          organization_id: string | null
          organization_slug: string | null
          price: number | null
          primary_image_url: string | null
          product_id: string | null
          product_name: string | null
          sizes: string[] | null
          status: string | null
          store_id: string | null
          store_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_store_summary: {
        Row: {
          active_products: number | null
          avg_product_price: number | null
          draft_products: number | null
          organization_created_at: string | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          organization_type: string | null
          store_created_at: string | null
          store_id: string | null
          store_name: string | null
          store_status: string | null
          total_inventory: number | null
          total_products: number | null
        }
        Relationships: []
      }
      platform_products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          gender: string | null
          id: string | null
          image_url: string | null
          images: string[] | null
          inventory: number | null
          legacy_created_at: string | null
          legacy_product_id: string | null
          name: string | null
          price: number | null
          published: boolean | null
          sizes: string[] | null
          status: string | null
          store_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_catalog_stats"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_products"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "ai_store_summary"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_usage_limit: {
        Args: { p_limit: number; p_merchant_id: string; p_operation: string }
        Returns: boolean
      }
      create_organization_from_intent: {
        Args: never
        Returns: {
          already_existed: boolean
          organization_id: string
          store_id: string
        }[]
      }
      generate_collection_slug: {
        Args: { p_name: string; p_store_id: string }
        Returns: string
      }
      generate_order_number: { Args: never; Returns: string }
      generate_product_slug: {
        Args: { p_name: string; p_store_id: string }
        Returns: string
      }
      get_current_organization_id: { Args: never; Returns: string }
      get_or_create_cart: {
        Args: {
          p_customer_id?: string
          p_session_id: string
          p_store_id: string
        }
        Returns: string
      }
      get_store_by_domain: {
        Args: { lookup_domain: string }
        Returns: {
          created_at: string
          default_locale: string | null
          id: string
          name: string
          onboarding_completed: string | null
          organization_id: string
          published_at: string | null
          slug: string | null
          status: string
          store_type: string | null
          theme_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "stores"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_store_contact: {
        Args: { p_store_id: string }
        Returns: {
          address_line1: string
          address_line2: string
          city: string
          country: string
          email: string
          phone: string
          postal_code: string
          region: string
          store_name: string
        }[]
      }
      get_tenant_slug_by_domain: {
        Args: { domain_name: string }
        Returns: string
      }
      get_user_organization: {
        Args: never
        Returns: {
          onboarding_completed: string
          organization_id: string
          organization_slug: string
          store_id: string
          store_slug: string
          store_status: string
          store_type: string
          theme_id: string
        }[]
      }
      increment_ai_usage: {
        Args: {
          p_cost?: number
          p_count?: number
          p_merchant_id: string
          p_operation: string
          p_tokens?: number
        }
        Returns: undefined
      }
      increment_wallet_balance: {
        Args: { p_amount: number; p_store_id: string }
        Returns: undefined
      }
      migrate_text_categories_for_store: {
        Args: { p_store_id: string }
        Returns: number
      }
      refund_try_on_credit: { Args: { p_history_id: string }; Returns: number }
      spend_try_on_credit: {
        Args: { p_product_id: string }
        Returns: {
          history_id: string
          new_credits: number
        }[]
      }
    }
    Enums: {
      domain_status: "pending" | "verified" | "active"
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
      domain_status: ["pending", "verified", "active"],
    },
  },
} as const

