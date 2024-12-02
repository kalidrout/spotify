import { Home, Search, Library, Plus, LogOut, Mic2, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { usePlaylist } from '../contexts/PlaylistContext'
import { useAuth } from '../contexts/AuthContext'
import { useStaff } from '../contexts/StaffContext'
import CreatePlaylistModal from './CreatePlaylistModal'
import AuthModal from './AuthModal'

export default function Sidebar() {
  const { playlists } = usePlaylist()
  const { user, signOut } = useAuth()
  const { isStaff } = useStaff()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <div className="w-64 bg-black h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-white text-2xl font-bold mb-8">SoundStream</h1>
        
        <nav className="space-y-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`
            }
          >
            <Home className="w-6 h-6 mr-4" />
            Home
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex items-center ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`
            }
          >
            <Search className="w-6 h-6 mr-4" />
            Search
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `flex items-center ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`
            }
          >
            <Library className="w-6 h-6 mr-4" />
            Your Library
          </NavLink>
          <NavLink
            to="/artists"
            className={({ isActive }) =>
              `flex items-center ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`
            }
          >
            <Mic2 className="w-6 h-6 mr-4" />
            For Artists
          </NavLink>
          {isStaff && (
            <NavLink
              to="/staff"
              className={({ isActive }) =>
                `flex items-center ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`
              }
            >
              <Shield className="w-6 h-6 mr-4" />
              Staff Dashboard
            </NavLink>
          )}
        </nav>

        {user ? (
          <>
            <div className="mt-8">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center text-gray-300 hover:text-white"
              >
                <Plus className="w-5 h-5 mr-4" />
                Create Playlist
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={() => signOut()}
                className="flex items-center text-gray-300 hover:text-white"
              >
                <LogOut className="w-5 h-5 mr-4" />
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="mt-8">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center text-gray-300 hover:text-white"
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      <div className="px-2 mt-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <NavLink
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              className={({ isActive }) =>
                `text-gray-300 hover:text-white px-4 py-2 text-sm block ${
                  isActive ? 'bg-zinc-800 rounded' : ''
                }`
              }
            >
              {playlist.name}
            </NavLink>
          ))}
        </div>
      </div>

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}