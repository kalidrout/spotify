import { useParams } from 'react-router-dom'
import { Plus, Trash2, Play, Pause, Image as ImageIcon, Music, X } from 'lucide-react'
import { usePlaylist } from '../contexts/PlaylistContext'
import { usePlayer } from '../contexts/PlayerContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { Track } from '../types'
import FileUpload from '../components/FileUpload'
import UpgradeModal from '../components/UpgradeModal'
import { useState } from 'react'

export default function PlaylistDetailsPage() {
  const { playlistId } = useParams()
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist, updatePlaylistCover } = usePlaylist()
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer()
  const { canAddSong } = useSubscription()
  const [showAddTrack, setShowAddTrack] = useState(false)
  const [showUploadCover, setShowUploadCover] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [newTrack, setNewTrack] = useState({
    title: '',
    artist: '',
    audioUrl: '',
    albumArt: ''
  })

  const playlist = playlists.find(p => p.id === playlistId)

  if (!playlist) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Playlist not found</h2>
          <p className="text-gray-400">The playlist you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const handleAddTrack = async () => {
    if (!canAddSong) {
      setShowUpgradeModal(true)
      return
    }

    if (!newTrack.title || !newTrack.artist || !newTrack.audioUrl) return

    const track: Track = {
      id: crypto.randomUUID(),
      title: newTrack.title,
      artist: newTrack.artist,
      duration: '0:00', // This would normally be calculated from the audio file
      albumArt: newTrack.albumArt || '/default-album-art.jpg',
      audioUrl: newTrack.audioUrl
    }

    try {
      await addTrackToPlaylist(playlist.id, track)
      setShowAddTrack(false)
      setNewTrack({ title: '', artist: '', audioUrl: '', albumArt: '' })
    } catch (err) {
      console.error('Failed to add track:', err)
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await removeTrackFromPlaylist(playlist.id, trackId)
    } catch (err) {
      console.error('Failed to remove track:', err)
    }
  }

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause()
    } else {
      playTrack(track)
    }
  }

  const handleCoverUpdate = async (url: string) => {
    try {
      await updatePlaylistCover(playlist.id, url)
      setShowUploadCover(false)
    } catch (err) {
      console.error('Failed to update cover:', err)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900">
      <div className="relative h-80 bg-gradient-to-b from-zinc-700/50 to-zinc-900">
        <img
          src={playlist.coverImage}
          alt={playlist.name}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
        <div className="absolute bottom-6 left-8">
          <button
            onClick={() => setShowUploadCover(true)}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <h1 className="text-5xl font-bold text-white mb-4">{playlist.name}</h1>
          <p className="text-gray-400">{playlist.tracks.length} songs</p>
        </div>
      </div>

      <div className="p-8">
        <button
          onClick={() => setShowAddTrack(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 mb-8"
        >
          <Plus className="w-5 h-5" />
          Add Track
        </button>

        <div className="space-y-2">
          {playlist.tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-4 p-2 rounded group hover:bg-zinc-800/50"
            >
              <button
                onClick={() => handlePlayTrack(track)}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                )}
              </button>
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-10 h-10 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{track.title}</h3>
                <p className="text-gray-400 text-sm truncate">{track.artist}</p>
              </div>
              <span className="text-gray-400">{track.duration}</span>
              <button
                onClick={() => handleRemoveTrack(track.id)}
                className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showAddTrack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add Track</h2>
              <button
                onClick={() => setShowAddTrack(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Track title"
                value={newTrack.title}
                onChange={(e) => setNewTrack(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-zinc-800 text-white rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Artist name"
                value={newTrack.artist}
                onChange={(e) => setNewTrack(prev => ({ ...prev, artist: e.target.value }))}
                className="w-full bg-zinc-800 text-white rounded px-3 py-2"
              />
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Audio File
                </label>
                <FileUpload
                  accept="audio/*"
                  onUploadComplete={(url) => setNewTrack(prev => ({ ...prev, audioUrl: url }))}
                  maxSize={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Album Art (optional)
                </label>
                <FileUpload
                  accept="image/*"
                  onUploadComplete={(url) => setNewTrack(prev => ({ ...prev, albumArt: url }))}
                  maxSize={5}
                />
              </div>
              <button
                onClick={handleAddTrack}
                disabled={!newTrack.title || !newTrack.artist || !newTrack.audioUrl}
                className="w-full bg-white text-black rounded-full py-2 px-4 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Track
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadCover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Update Cover Image</h2>
              <button
                onClick={() => setShowUploadCover(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <FileUpload
              accept="image/*"
              onUploadComplete={handleCoverUpdate}
              maxSize={5}
            />
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="songs"
      />
    </div>
  )
}