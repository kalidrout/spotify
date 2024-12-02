import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Repeat, Shuffle } from 'lucide-react'
import { usePlayer } from '../contexts/PlayerContext'
import { formatTime } from '../utils/formatTime'

export default function Player() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    togglePlayPause,
    setVolume,
    seek,
    playNextTrack,
    playPreviousTrack
  } = usePlayer()

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    seek(newTime)
  }

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX />
    if (volume < 0.5) return <Volume1 />
    return <Volume2 />
  }

  if (!currentTrack) {
    return (
      <div className="h-20 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center justify-between text-gray-400">
        Select a track to play
      </div>
    )
  }

  return (
    <div className="h-20 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4 w-72">
        <img
          src={currentTrack.albumArt}
          alt="Album cover"
          className="w-14 h-14 rounded"
        />
        <div>
          <h3 className="text-sm text-white">{currentTrack.title}</h3>
          <p className="text-xs text-gray-400">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 flex-1">
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white">
            <Shuffle className="w-4 h-4" />
          </button>
          <button 
            onClick={playPreviousTrack}
            className="text-gray-400 hover:text-white"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button 
            onClick={playNextTrack}
            className="text-gray-400 hover:text-white"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white">
            <Repeat className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full max-w-md flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 flex-1 accent-white bg-zinc-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <span className="text-xs text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="w-72 flex items-center justify-end gap-2">
        <button className="text-gray-400 hover:text-white">
          {getVolumeIcon()}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 accent-white bg-zinc-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
      </div>
    </div>
  )
}