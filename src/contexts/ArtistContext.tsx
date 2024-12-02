import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface Artist {
  id: string
  name: string
  bio: string | null
  profileImage: string | null
  verified: boolean
}

interface Submission {
  id: string
  title: string
  description: string | null
  audioUrl: string
  coverImage: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface ApprovedSong {
  id: string
  title: string
  artistId: string
  artistName: string
  audioUrl: string
  coverImage: string
}

interface ArtistContextType {
  userArtist: Artist | null
  submissions: Submission[]
  error: string | null
  createArtistProfile: (name: string, bio?: string, profileImage?: string) => Promise<void>
  updateArtistProfile: (updates: Partial<Artist>) => Promise<void>
  submitSong: (title: string, audioUrl: string, coverImage: string, description?: string) => Promise<void>
  searchApprovedSongs: (query: string) => Promise<ApprovedSong[]>
}

const ArtistContext = createContext<ArtistContextType | undefined>(undefined)

export function ArtistProvider({ children }: { children: React.ReactNode }) {
  const [userArtist, setUserArtist] = useState<Artist | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUserArtistProfile()
      fetchSubmissions()
    }
  }, [user])

  async function fetchUserArtistProfile() {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error

      if (data) {
        setUserArtist({
          id: data.id,
          name: data.name,
          bio: data.bio,
          profileImage: data.profile_image,
          verified: data.verified
        })
      }
    } catch (err) {
      console.error('Error fetching artist profile:', err)
      setError('Failed to fetch artist profile')
    }
  }

  async function fetchSubmissions() {
    if (!userArtist) return

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('artist_id', userArtist.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSubmissions(data.map(submission => ({
        id: submission.id,
        title: submission.title,
        description: submission.description,
        audioUrl: submission.audio_url,
        coverImage: submission.cover_image,
        status: submission.status,
        createdAt: submission.created_at
      })))
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError('Failed to fetch submissions')
    }
  }

  async function createArtistProfile(name: string, bio?: string, profileImage?: string) {
    try {
      const { data, error } = await supabase
        .from('artists')
        .insert({
          user_id: user?.id,
          name,
          bio,
          profile_image: profileImage
        })
        .select()
        .single()

      if (error) throw error

      setUserArtist({
        id: data.id,
        name: data.name,
        bio: data.bio,
        profileImage: data.profile_image,
        verified: data.verified
      })
    } catch (err) {
      console.error('Error creating artist profile:', err)
      throw new Error('Failed to create artist profile')
    }
  }

  async function updateArtistProfile(updates: Partial<Artist>) {
    if (!userArtist) return

    try {
      const { error } = await supabase
        .from('artists')
        .update({
          name: updates.name,
          bio: updates.bio,
          profile_image: updates.profileImage
        })
        .eq('id', userArtist.id)

      if (error) throw error

      setUserArtist(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      console.error('Error updating artist profile:', err)
      throw new Error('Failed to update artist profile')
    }
  }

  async function submitSong(
    title: string,
    audioUrl: string,
    coverImage: string,
    description?: string
  ) {
    if (!userArtist) throw new Error('Artist profile required')

    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          artist_id: userArtist.id,
          title,
          description,
          audio_url: audioUrl,
          cover_image: coverImage
        })

      if (error) throw error

      await fetchSubmissions()
    } catch (err) {
      console.error('Error submitting song:', err)
      throw new Error('Failed to submit song')
    }
  }

  async function searchApprovedSongs(query: string): Promise<ApprovedSong[]> {
    try {
      const { data, error } = await supabase
        .from('approved_songs')
        .select(`
          *,
          artists (
            name
          )
        `)
        .ilike('title', `%${query}%`)
        .limit(20)

      if (error) throw error

      return data.map(song => ({
        id: song.id,
        title: song.title,
        artistId: song.artist_id,
        artistName: song.artists.name,
        audioUrl: song.audio_url,
        coverImage: song.cover_image
      }))
    } catch (err) {
      console.error('Error searching songs:', err)
      throw new Error('Failed to search songs')
    }
  }

  return (
    <ArtistContext.Provider
      value={{
        userArtist,
        submissions,
        error,
        createArtistProfile,
        updateArtistProfile,
        submitSong,
        searchApprovedSongs
      }}
    >
      {children}
    </ArtistContext.Provider>
  )
}

export function useArtist() {
  const context = useContext(ArtistContext)
  if (context === undefined) {
    throw new Error('useArtist must be used within an ArtistProvider')
  }
  return context
}