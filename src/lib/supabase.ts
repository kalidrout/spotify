import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export type Database = {
  public: {
    Tables: {
      playlists: {
        Row: {
          id: string
          name: string
          cover_image: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          cover_image: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          cover_image?: string
          user_id?: string
          created_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          title: string
          artist: string
          duration: string
          album_art: string
          audio_url: string
          playlist_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          artist: string
          duration: string
          album_art: string
          audio_url: string
          playlist_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist?: string
          duration?: string
          album_art?: string
          audio_url?: string
          playlist_id?: string
          created_at?: string
        }
      }
    }
    Storage: {
      Buckets: {
        media: {
          public: true
          allowedMimeTypes: ['audio/*', 'image/*']
          maxFileSize: 20971520 // 20MB
        }
      }
    }
  }
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
)

export async function recordPlay(songId: string) {
  const { error } = await supabase
    .from('plays')
    .insert([
      {
        song_id: songId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }
    ])
  
  if (error) {
    console.error('Error recording play:', error)
  }
}