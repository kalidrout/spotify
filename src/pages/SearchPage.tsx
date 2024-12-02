import { Search } from 'lucide-react'
import { useState } from 'react'
import { usePlaylist } from '../contexts/PlaylistContext'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { playlists, loading, searchPlaylists } = usePlaylist()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    searchPlaylists(query)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search for playlists..."
            className="w-full bg-zinc-800 text-white rounded-full py-3 px-12 outline-none focus:ring-2 focus:ring-white"
          />
          <Search className="w-6 h-6 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {loading ? (
          <div className="text-gray-400 mt-8">Loading...</div>
        ) : (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-zinc-800/40 p-4 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
                  onClick={() => window.location.href = `/playlist/${playlist.id}`}
                >
                  <img
                    src={playlist.coverImage}
                    alt={playlist.name}
                    className="w-full aspect-square object-cover rounded-md mb-4"
                  />
                  <h3 className="text-white font-semibold mb-2">{playlist.name}</h3>
                  <p className="text-sm text-gray-400">
                    {playlist.tracks.length} songs
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}