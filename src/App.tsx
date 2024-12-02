import './index.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Player from './components/Player'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import LibraryPage from './pages/LibraryPage'
import PlaylistDetailsPage from './pages/PlaylistDetailsPage'
import ArtistsPage from './pages/ArtistsPage'
import StaffDashboardPage from './pages/StaffDashboardPage'
import { PlaylistProvider } from './contexts/PlaylistContext'
import { PlayerProvider } from './contexts/PlayerContext'
import { AuthProvider } from './contexts/AuthContext'
import { ArtistProvider } from './contexts/ArtistContext'
import { StaffProvider } from './contexts/StaffContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <PlayerProvider>
          <PlaylistProvider>
            <ArtistProvider>
              <StaffProvider>
                <Router>
                  <div className="h-screen flex flex-col bg-black">
                    <div className="flex-1 flex overflow-hidden">
                      <Sidebar />
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/artists" element={<ArtistsPage />} />
                        <Route path="/staff" element={<StaffDashboardPage />} />
                        <Route path="/StaffDashboardPage" element={<Navigate to="/staff" replace />} />
                        <Route path="/playlist/:playlistId" element={<PlaylistDetailsPage />} />
                      </Routes>
                    </div>
                    <Player />
                  </div>
                </Router>
              </StaffProvider>
            </ArtistProvider>
          </PlaylistProvider>
        </PlayerProvider>
      </SubscriptionProvider>
    </AuthProvider>
  )
}

export default App