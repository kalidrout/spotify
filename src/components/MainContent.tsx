import { Playlist } from '../types';

interface MainContentProps {
  playlists: Playlist[];
}

export default function MainContent({ playlists }: MainContentProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Good evening</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="flex items-center bg-zinc-800/50 hover:bg-zinc-800 rounded overflow-hidden cursor-pointer"
          >
            <img
              src={playlist.coverImage}
              alt={playlist.name}
              className="w-20 h-20 object-cover"
            />
            <span className="text-white font-semibold px-4">{playlist.name}</span>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Made for you</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="bg-zinc-800/40 p-4 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
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
  );
}