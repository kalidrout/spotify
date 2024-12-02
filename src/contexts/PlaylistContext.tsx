import { createContext, useContext, useState, useEffect } from 'react'
import { Playlist, Track } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface PlaylistContextType {
  playlists: Playlist[]
  loading: boolean
  error: string | null
  createPlaylist: (name: string) => Promise<void>
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
  searchPlaylists: (query: string) => Promise<void>
  updatePlaylistCover: (playlistId: string, coverImage: string) => Promise<void>
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined)

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPlaylists()
    } else {
      setPlaylists([])
    }
  }, [user])

  async function fetchPlaylists() {
    try {
      setLoading(true)
      
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (playlistsError) throw playlistsError

      if (!playlistsData) {
        setPlaylists([])
        return
      }

      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .in('playlist_id', playlistsData.map(p => p.id))

      if (tracksError) throw tracksError

      const formattedPlaylists: Playlist[] = playlistsData.map(p => ({
        id: p.id,
        name: p.name,
        coverImage: p.cover_image,
        tracks: (tracksData || [])
          .filter(t => t.playlist_id === p.id)
          .map(t => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
            albumArt: t.album_art,
            audioUrl: t.audio_url
          }))
      }))

      setPlaylists(formattedPlaylists)
    } catch (err) {
      console.error('Error in fetchPlaylists:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching playlists')
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async (name: string) => {
    try {
      if (!user) throw new Error('User must be logged in to create a playlist')
      if (!name.trim()) throw new Error('Playlist name cannot be empty')

      const newPlaylist = {
        name: name.trim(),
        user_id: user.id,
        cover_image: '/default-playlist.jpg', // You should add a default cover image
        created_at: new Date().toISOString()
      }

      const { data: createdPlaylist, error: createError } = await supabase
        .from('playlists')
        .insert([newPlaylist])
        .select()
        .single()

      if (createError) throw createError
      if (!createdPlaylist) throw new Error('Failed to create playlist: No data returned')

      const newFormattedPlaylist: Playlist = {
        id: createdPlaylist.id,
        name: createdPlaylist.name,
        coverImage: createdPlaylist.cover_image,
        tracks: []
      }

      setPlaylists(prev => [...prev, newFormattedPlaylist])
    } catch (err) {
      console.error('Error creating playlist:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating playlist'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    try {
      if (!user) throw new Error('User must be logged in to add tracks')

      const { error } = await supabase
        .from('tracks')
        .insert({
          playlist_id: playlistId,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          album_art: track.albumArt,
          audio_url: track.audioUrl
        })

      if (error) throw error

      await fetchPlaylists()
    } catch (err) {
      console.error('Error in addTrackToPlaylist:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while adding track')
      throw err
    }
  }

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      if (!user) throw new Error('User must be logged in to remove tracks')

      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId)
        .eq('playlist_id', playlistId)

      if (error) throw error

      // Also delete the file from storage if it exists
      const track = playlists
        .find(p => p.id === playlistId)
        ?.tracks.find(t => t.id === trackId)

      if (track?.audioUrl) {
        const audioPath = track.audioUrl.split('/').pop()
        if (audioPath) {
          await supabase.storage
            .from('media')
            .remove([`songs/${audioPath}`])
        }
      }

      await fetchPlaylists()
    } catch (err) {
      console.error('Error in removeTrackFromPlaylist:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while removing track')
      throw err
    }
  }

  const updatePlaylistCover = async (playlistId: string, coverImage: string) => {
    try {
      if (!user) throw new Error('User must be logged in to update playlist')

      const { error } = await supabase
        .from('playlists')
        .update({ cover_image: coverImage })
        .eq('id', playlistId)

      if (error) throw error

      setPlaylists(prev =>
        prev.map(playlist =>
          playlist.id === playlistId
            ? { ...playlist, coverImage }
            : playlist
        )
      )
    } catch (err) {
      console.error('Error updating playlist cover:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while updating playlist cover')
      throw err
    }
  }

  const searchPlaylists = async (query: string) => {
    try {
      setLoading(true)
      
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user?.id)
        .ilike('name', `%${query}%`)

      if (playlistsError) throw playlistsError

      if (!playlistsData) {
        setPlaylists([])
        return
      }

      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .in('playlist_id', playlistsData.map(p => p.id))

      if (tracksError) throw tracksError

      const formattedPlaylists: Playlist[] = playlistsData.map(p => ({
        id: p.id,
        name: p.name,
        coverImage: p.cover_image,
        tracks: (tracksData || [])
          .filter(t => t.playlist_id === p.id)
          .map(t => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
            albumArt: t.album_art,
            audioUrl: t.audio_url
          }))
      }))

      setPlaylists(formattedPlaylists)
    } catch (err) {
      console.error('Error in searchPlaylists:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        loading,
        error,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        searchPlaylists,
        updatePlaylistCover
      }}
    >
      {children}
    </PlaylistContext.Provider>
  )
}

export function usePlaylist() {
  const context = useContext(PlaylistContext)
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider')
  }
  return context
}