export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          tribe_name: string | null
          avatar_url: string | null
          status: 'pending' | 'active' | 'facilitator' | 'admin' | 'banned'
          vibe_status: 'flowing' | 'staccato' | 'chaos' | 'lyrical' | 'stillness' | 'open_to_dance' | 'mycelial' | 'offline'
          vouched_by_name: string | null
          mycelial_gifts: string | null
          bio: string | null
          pronouns: string | null
          location: string | null
          soundcloud_url: string | null
          website: string | null
          instagram_url: string | null
          facebook_url: string | null
          twitter_url: string | null
          tiktok_url: string | null
          spotify_url: string | null
          bandcamp_url: string | null
          linkedin_url: string | null
          public_key: string | null
          show_in_directory: boolean
          muted: boolean
          muted_at: string | null
          muted_by: string | null
          mute_reason: string | null
          is_demo: boolean
          total_posts: number
          total_storage_bytes: number
          last_post_at: string | null
          posts_this_week: number
          posts_this_month: number
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          tribe_name?: string | null
          avatar_url?: string | null
          status?: 'pending' | 'active' | 'facilitator' | 'admin' | 'banned'
          vibe_status?: 'flowing' | 'staccato' | 'chaos' | 'lyrical' | 'stillness' | 'open_to_dance' | 'mycelial' | 'offline'
          vouched_by_name?: string | null
          mycelial_gifts?: string | null
          bio?: string | null
          pronouns?: string | null
          location?: string | null
          soundcloud_url?: string | null
          website?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          spotify_url?: string | null
          bandcamp_url?: string | null
          linkedin_url?: string | null
          public_key?: string | null
          show_in_directory?: boolean
          muted?: boolean
          muted_at?: string | null
          muted_by?: string | null
          is_demo?: boolean
          mute_reason?: string | null
          total_posts?: number
          total_storage_bytes?: number
          last_post_at?: string | null
          posts_this_week?: number
          posts_this_month?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          tribe_name?: string | null
          avatar_url?: string | null
          status?: 'pending' | 'active' | 'facilitator' | 'admin' | 'banned'
          vibe_status?: 'flowing' | 'staccato' | 'chaos' | 'lyrical' | 'stillness' | 'open_to_dance' | 'mycelial' | 'offline'
          vouched_by_name?: string | null
          mycelial_gifts?: string | null
          bio?: string | null
          pronouns?: string | null
          location?: string | null
          soundcloud_url?: string | null
          website?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          spotify_url?: string | null
          muted?: boolean
          muted_at?: string | null
          muted_by?: string | null
          mute_reason?: string | null
          is_demo?: boolean
          total_posts?: number
          total_storage_bytes?: number
          last_post_at?: string | null
          posts_this_week?: number
          posts_this_month?: number
          bandcamp_url?: string | null
          linkedin_url?: string | null
          public_key?: string | null
          show_in_directory?: boolean
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          created_at: string
          title: string
          date: string
          location_name: string
          map_link: string | null
          description: string | null
          shifts: Json | null
          created_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          date: string
          location_name: string
          map_link?: string | null
          description?: string | null
          shifts?: Json | null
          created_by: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          date?: string
          location_name?: string
          map_link?: string | null
          description?: string | null
          shifts?: Json | null
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          author_id: string
          category: 'general' | 'mutual_aid_offer' | 'mutual_aid_request' | 'gratitude' | 'organizing'
          content: string
          image_url: string | null
          expires_at: string | null
          likes_count: number
          is_demo: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          author_id: string
          category: 'general' | 'mutual_aid_offer' | 'mutual_aid_request' | 'gratitude' | 'organizing'
          content: string
          image_url?: string | null
          expires_at?: string | null
          likes_count?: number
          is_demo?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          author_id?: string
          category?: 'general' | 'mutual_aid_offer' | 'mutual_aid_request' | 'gratitude' | 'organizing'
          content?: string
          image_url?: string | null
          expires_at?: string | null
          likes_count?: number
          is_demo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          created_at: string
          sender_id: string
          recipient_id: string
          encrypted_content: string
          is_read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          sender_id: string
          recipient_id: string
          encrypted_content: string
          is_read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          sender_id?: string
          recipient_id?: string
          encrypted_content?: string
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      music_sets: {
        Row: {
          id: string
          created_at: string
          dj_id: string
          title: string
          url: string
          vibe_tags: string[] | null
          tracklist: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          dj_id: string
          title: string
          url: string
          vibe_tags?: string[] | null
          tracklist?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          dj_id?: string
          title?: string
          url?: string
          vibe_tags?: string[] | null
          tracklist?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "music_sets_dj_id_fkey"
            columns: ["dj_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: 'bug' | 'feature' | 'gratitude'
          message: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          type: 'bug' | 'feature' | 'gratitude'
          message: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          type?: 'bug' | 'feature' | 'gratitude'
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      boards: {
        Row: {
          id: string
          created_at: string
          slug: string
          name: string
          description: string
          is_active: boolean
          is_featured: boolean
          sort_order: number
          post_count: number
          last_activity_at: string | null
          // Marketplace fields (Phase K)
          is_marketplace: boolean
          expires_in_days: number | null
          allow_bumps: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          slug: string
          name: string
          description: string
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          post_count?: number
          last_activity_at?: string | null
          // Marketplace fields (Phase K)
          is_marketplace?: boolean
          expires_in_days?: number | null
          allow_bumps?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          slug?: string
          name?: string
          description?: string
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          post_count?: number
          last_activity_at?: string | null
          // Marketplace fields (Phase K)
          is_marketplace?: boolean
          expires_in_days?: number | null
          allow_bumps?: boolean
        }
        Relationships: []
      }
      board_posts: {
        Row: {
          id: string
          created_at: string
          board_id: string
          author_id: string
          title: string
          content: string
          is_pinned: boolean
          reply_count: number
          last_activity_at: string
          // Marketplace & Expiration fields (Phase K)
          expires_at: string | null
          bump_count: number
          last_bumped_at: string | null
          max_bumps: number
          price: number | null
          is_free: boolean
          condition: string | null
          contact_preference: string
          status: string
          images: Json
        }
        Insert: {
          id?: string
          created_at?: string
          board_id: string
          author_id: string
          title: string
          content: string
          is_pinned?: boolean
          reply_count?: number
          last_activity_at?: string
          // Marketplace & Expiration fields (Phase K)
          expires_at?: string | null
          bump_count?: number
          last_bumped_at?: string | null
          max_bumps?: number
          price?: number | null
          is_free?: boolean
          condition?: string | null
          contact_preference?: string
          status?: string
          images?: Json
        }
        Update: {
          id?: string
          created_at?: string
          board_id?: string
          author_id?: string
          title?: string
          content?: string
          is_pinned?: boolean
          reply_count?: number
          last_activity_at?: string
          // Marketplace & Expiration fields (Phase K)
          expires_at?: string | null
          bump_count?: number
          last_bumped_at?: string | null
          max_bumps?: number
          price?: number | null
          is_free?: boolean
          condition?: string | null
          contact_preference?: string
          status?: string
          images?: Json
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      replies: {
        Row: {
          id: string
          created_at: string
          post_id: string
          author_id: string
          content: string
          parent_reply_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          post_id: string
          author_id: string
          content: string
          parent_reply_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_reply_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replies_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            referencedRelation: "replies"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          id: string
          freeze_mode: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          freeze_mode?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          freeze_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      altar_posts: {
        Row: {
          id: string
          created_at: string
          author_id: string
          image_url: string
          caption: string | null
          likes_count: number
          expires_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          author_id: string
          image_url: string
          caption?: string | null
          likes_count?: number
          expires_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          author_id?: string
          image_url?: string
          caption?: string | null
          likes_count?: number
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "altar_posts_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          subscription: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          subscription: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          subscription?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_usage_stats: {
        Args: {
          user_uuid: string
        }
        Returns: undefined
      }
      calculate_user_storage: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      log_user_daily_activity: {
        Args: {
          user_uuid: string
          activity_date: string
        }
        Returns: undefined
      }
    }
    Enums: {
      membership_status: 'pending' | 'active' | 'facilitator' | 'admin' | 'banned'
      vibe_status: 'flowing' | 'staccato' | 'chaos' | 'lyrical' | 'stillness' | 'open_to_dance' | 'mycelial' | 'offline'
      post_category: 'general' | 'mutual_aid_offer' | 'mutual_aid_request' | 'gratitude' | 'organizing'
      feedback_type: 'bug' | 'feature' | 'gratitude'
    }
  }
}
