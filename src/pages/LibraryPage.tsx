import { ListMusic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePlaylist } from '../contexts/PlaylistContext'

export default function LibraryPage() {
  const { playlists } = usePlaylist()
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Your Library</h2>
      </div>

      <div className="grid gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="flex items-center gap-4 bg-zinc-800/40 p-4 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
            onClick={() => navigate(`/playlist/${playlist.id}`)}
          >
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h3 className="text-white font-semibold">{playlist.name}</h3>
              <p className="text-sm text-gray-400">
                Playlist • {playlist.tracks.length} songs
              </p>
            </div>
            <div className="ml-auto">
              <ListMusic className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}