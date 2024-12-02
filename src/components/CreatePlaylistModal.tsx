import { useState } from 'react'
import { X } from 'lucide-react'
import { usePlaylist } from '../contexts/PlaylistContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import UpgradeModal from './UpgradeModal'

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreatePlaylistModal({ isOpen, onClose }: CreatePlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState('')
  const { createPlaylist } = usePlaylist()
  const { canCreatePlaylist } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreatePlaylist) {
      setShowUpgradeModal(true)
      return
    }
    if (playlistName.trim()) {
      createPlaylist(playlistName.trim())
      setPlaylistName('')
      onClose()
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Create Playlist</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full bg-zinc-800 text-white rounded py-2 px-3 mb-4 outline-none focus:ring-2 focus:ring-white"
            />
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-full hover:bg-green-600"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="playlists"
      />
    </>
  )
}