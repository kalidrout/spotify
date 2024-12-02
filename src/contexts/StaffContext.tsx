import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface StaffMember {
  id: string
  discordId: string
  username: string
  avatarUrl: string | null
}

interface PendingSubmission {
  id: string
  title: string
  description: string | null
  audioUrl: string
  coverImage: string
  artistId: string
  artistName: string
  createdAt: string
}

interface StaffAction {
  id: string
  staffId: string
  submissionId: string
  action: 'approve' | 'reject'
  note: string | null
  createdAt: string
}

interface StaffContextType {
  isStaff: boolean
  staffMember: StaffMember | null
  pendingSubmissions: PendingSubmission[]
  recentActions: StaffAction[]
  loading: boolean
  error: string | null
  approveSubmission: (submissionId: string, note?: string) => Promise<void>
  rejectSubmission: (submissionId: string, note?: string) => Promise<void>
  refreshSubmissions: () => Promise<void>
}

const StaffContext = createContext<StaffContextType | undefined>(undefined)

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [isStaff, setIsStaff] = useState(false)
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null)
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [recentActions, setRecentActions] = useState<StaffAction[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.app_metadata?.provider === 'discord') {
      checkStaffStatus()
    } else {
      setIsStaff(false)
      setStaffMember(null)
    }
  }, [user])

  useEffect(() => {
    if (isStaff) {
      fetchPendingSubmissions()
      fetchRecentActions()
    }
  }, [isStaff])

  async function checkStaffStatus() {
    try {
      const discordId = user?.identities?.[0]?.id
      if (!discordId) return

      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .eq('discord_id', discordId)
        .single()

      if (staffError) throw staffError

      if (staffData) {
        setIsStaff(true)
        setStaffMember({
          id: staffData.id,
          discordId: staffData.discord_id,
          username: staffData.username,
          avatarUrl: staffData.avatar_url
        })
      }
    } catch (err) {
      console.error('Error checking staff status:', err)
      setError('Failed to verify staff status')
    }
  }

  async function fetchPendingSubmissions() {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          artists (
            id,
            name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPendingSubmissions(data.map(submission => ({
        id: submission.id,
        title: submission.title,
        description: submission.description,
        audioUrl: submission.audio_url,
        coverImage: submission.cover_image,
        artistId: submission.artists.id,
        artistName: submission.artists.name,
        createdAt: submission.created_at
      })))
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError('Failed to fetch pending submissions')
    }
  }

  async function fetchRecentActions() {
    try {
      const { data, error } = await supabase
        .from('staff_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setRecentActions(data.map(action => ({
        id: action.id,
        staffId: action.staff_id,
        submissionId: action.submission_id,
        action: action.action as 'approve' | 'reject',
        note: action.note,
        createdAt: action.created_at
      })))
    } catch (err) {
      console.error('Error fetching actions:', err)
      setError('Failed to fetch recent actions')
    }
  }

  async function approveSubmission(submissionId: string, note?: string) {
    if (!staffMember) return

    try {
      // Start a transaction
      const { error: updateError } = await supabase.rpc('approve_submission', {
        p_submission_id: submissionId,
        p_staff_id: staffMember.id,
        p_note: note || null
      })

      if (updateError) throw updateError

      // Refresh data
      await Promise.all([
        fetchPendingSubmissions(),
        fetchRecentActions()
      ])
    } catch (err) {
      console.error('Error approving submission:', err)
      throw new Error('Failed to approve submission')
    }
  }

  async function rejectSubmission(submissionId: string, note?: string) {
    if (!staffMember) return

    try {
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId)

      if (updateError) throw updateError

      const { error: actionError } = await supabase
        .from('staff_actions')
        .insert({
          staff_id: staffMember.id,
          submission_id: submissionId,
          action: 'reject',
          note: note || null
        })

      if (actionError) throw actionError

      // Refresh data
      await Promise.all([
        fetchPendingSubmissions(),
        fetchRecentActions()
      ])
    } catch (err) {
      console.error('Error rejecting submission:', err)
      throw new Error('Failed to reject submission')
    }
  }

  async function refreshSubmissions() {
    await fetchPendingSubmissions()
  }

  return (
    <StaffContext.Provider
      value={{
        isStaff,
        staffMember,
        pendingSubmissions,
        recentActions,
        loading: false,
        error,
        approveSubmission,
        rejectSubmission,
        refreshSubmissions
      }}
    >
      {children}
    </StaffContext.Provider>
  )
}

export function useStaff() {
  const context = useContext(StaffContext)
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider')
  }
  return context
}