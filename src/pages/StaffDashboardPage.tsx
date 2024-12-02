import { useState } from 'react'
import { Music, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { useStaff } from '../contexts/StaffContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function StaffDashboardPage() {
  const { isStaff, staffMember, pendingSubmissions, recentActions, approveSubmission, rejectSubmission, refreshSubmissions } = useStaff()
  const { user } = useAuth()
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
        <button
          onClick={() => supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
              redirectTo: `${window.location.origin}/staff`
            }
          })}
          className="bg-[#5865F2] text-white px-6 py-3 rounded-full hover:bg-[#4752C4] flex items-center gap-2"
        >
          <img src="/discord-mark-white.svg" alt="Discord" className="w-6 h-6" />
          Sign in with Discord
        </button>
      </div>
    )
  }

  if (!isStaff) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access the staff dashboard.</p>
        </div>
      </div>
    )
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedSubmission) return

    setLoading(true)
    try {
      if (action === 'approve') {
        await approveSubmission(selectedSubmission, note)
      } else {
        await rejectSubmission(selectedSubmission, note)
      }
      setSelectedSubmission(null)
      setNote('')
    } catch (err) {
      console.error(`Error ${action}ing submission:`, err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Staff Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Logged in as {staffMember?.username}
            </p>
          </div>
          <button
            onClick={() => refreshSubmissions()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Pending Submissions</h2>
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`bg-zinc-800/40 rounded-lg p-4 ${
                    selectedSubmission === submission.id ? 'ring-2 ring-white' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={submission.coverImage}
                        alt={submission.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{submission.title}</h3>
                      <p className="text-gray-400 text-sm">by {submission.artistName}</p>
                      {submission.description && (
                        <p className="text-gray-400 text-sm mt-2">{submission.description}</p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setSelectedSubmission(submission.id)}
                          className="text-sm text-gray-300 hover:text-white"
                        >
                          Review
                        </button>
                        <a
                          href={submission.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-300 hover:text-white"
                        >
                          Listen
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {pendingSubmissions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Music className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  No pending submissions
                </div>
              )}
            </div>
          </div>

          <div>
            {selectedSubmission ? (
              <div className="bg-zinc-800/40 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Review Submission</h2>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  className="w-full bg-zinc-700 text-white rounded p-3 mb-4 h-32"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Recent Actions</h2>
                <div className="space-y-2">
                  {recentActions.map((action) => (
                    <div
                      key={action.id}
                      className="bg-zinc-800/40 rounded p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {action.action === 'approve' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-white">
                          {action.action === 'approve' ? 'Approved' : 'Rejected'} submission
                        </span>
                        <span className="text-gray-400 ml-auto">
                          {new Date(action.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {action.note && (
                        <p className="text-gray-400 mt-1 ml-6">{action.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}