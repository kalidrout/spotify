import { useState } from 'react'
import { Music, Upload } from 'lucide-react'
import { useArtist } from '../contexts/ArtistContext'
import FileUpload from '../components/FileUpload'

export default function ArtistsPage() {
  const { userArtist, submissions, createArtistProfile, submitSong } = useArtist()
  const [showProfileForm, setShowProfileForm] = useState(!userArtist)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', bio: '' })
  const [submissionForm, setSubmissionForm] = useState({ title: '', description: '' })
  const [audioUrl, setAudioUrl] = useState('')
  const [coverImage, setCoverImage] = useState('')

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createArtistProfile(profileForm.name, profileForm.bio)
      setShowProfileForm(false)
    } catch (err) {
      console.error('Failed to create profile:', err)
    }
  }

  const handleSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioUrl || !coverImage) return

    try {
      await submitSong(
        submissionForm.title,
        audioUrl,
        coverImage,
        submissionForm.description
      )
      setShowSubmissionForm(false)
      setSubmissionForm({ title: '', description: '' })
      setAudioUrl('')
      setCoverImage('')
    } catch (err) {
      console.error('Failed to submit song:', err)
    }
  }

  if (!userArtist || showProfileForm) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Create Artist Profile</h1>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Artist Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-zinc-800 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Bio
              </label>
              <textarea
                value={profileForm.bio}
                onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full bg-zinc-800 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-white h-32"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white rounded-full py-2 px-4 hover:bg-green-600"
            >
              Create Profile
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{userArtist.name}</h1>
            {userArtist.bio && (
              <p className="text-gray-400 mt-2">{userArtist.bio}</p>
            )}
          </div>
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600"
          >
            <Upload className="w-5 h-5" />
            Submit New Song
          </button>
        </div>

        {showSubmissionForm && (
          <div className="bg-zinc-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Submit New Song</h2>
            <form onSubmit={handleSongSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Song Title
                </label>
                <input
                  type="text"
                  value={submissionForm.title}
                  onChange={e => setSubmissionForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-700 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  value={submissionForm.description}
                  onChange={e => setSubmissionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-zinc-700 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-white h-32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Audio File
                </label>
                <FileUpload
                  onUploadComplete={setAudioUrl}
                  accept="audio/*"
                  maxSize={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Cover Image
                </label>
                <FileUpload
                  onUploadComplete={setCoverImage}
                  accept="image/*"
                  maxSize={5}
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowSubmissionForm(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!audioUrl || !coverImage}
                  className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-6">Your Submissions</h2>
        <div className="space-y-4">
          {submissions.map(submission => (
            <div
              key={submission.id}
              className="bg-zinc-800/40 rounded-lg p-4 flex items-center gap-4"
            >
              <div className="flex-shrink-0">
                <Music className="w-12 h-12 text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{submission.title}</h3>
                <p className="text-sm text-gray-400">
                  Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className={`
                  px-3 py-1 rounded-full text-sm
                  ${submission.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                    submission.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                    'bg-yellow-500/10 text-yellow-500'}
                `}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No submissions yet. Submit your first song!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}