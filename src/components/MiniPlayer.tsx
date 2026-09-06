import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Volume2, Volume1, VolumeX, Maximize2, Heart, ListMusic, Timer, 
  Mic2, Activity 
} from 'lucide-react';
import { usePlayer } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from './ProgressBar';
import { SleepTimerModal } from './SleepTimerModal';

export default function MiniPlayer() {
  const { 
    currentSong, 
    queue,
    isPlaying, 
    togglePlay, 
    progress, 
    duration, 
    volume, 
    seekTo, 
    setVolumeLevel, 
    playNext, 
    playPrevious,
    repeatMode,
    isShuffle,
    toggleRepeat,
    toggleShuffle,
    sleepTimerSeconds,
    isLiked,
    toggleLike
  } = usePlayer();

  const navigate = useNavigate();
  const [prevVolume, setPrevVolume] = useState(volume || 100);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const [mobileDragProgress, setMobileDragProgress] = useState(0);

  const songIsLiked = currentSong ? isLiked(currentSong.id) : false;

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSong) return;
    toggleLike(currentSong);
  };

  const handleVolumeMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (volume > 0) {
      setPrevVolume(volume);
      setVolumeLevel(0);
    } else {
      setVolumeLevel(prevVolume || 80);
    }
  };

  if (!currentSong) return null;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const activeProgress = isMobileDragging ? mobileDragProgress : progress;
  const progressPercent = duration > 0 ? (activeProgress / duration) * 100 : 0;

  const handleMobilePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsMobileDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setMobileDragProgress(p * duration);
  };

  const handleMobilePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobileDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setMobileDragProgress(p * duration);
    }
  };

  const handleMobilePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobileDragging) {
      setIsMobileDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetTime = p * duration;
      setMobileDragProgress(targetTime);
      seekTo(targetTime);
    }
  };

  return (
    <footer 
      id="persistent-miniplayer"
      className="fixed bottom-0 left-0 w-full h-[88px] z-50 bg-[#0c0c0f]/95 backdrop-blur-2xl border-t border-[#ff6600]/25 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] flex justify-between items-center px-4 md:px-6 select-none"
    >
      {/* Mobile top-edge progress line with drag & scrub support */}
      <div 
        className="absolute -top-1.5 left-0 right-0 h-4 md:hidden cursor-pointer flex items-start z-50"
        onPointerDown={handleMobilePointerDown}
        onPointerMove={handleMobilePointerMove}
        onPointerUp={handleMobilePointerUp}
        onPointerCancel={handleMobilePointerUp}
      >
        <div className="w-full h-1 bg-white/10 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] shadow-[0_0_8px_#ff6600] transition-none" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Now Playing Info (Left) */}
      <div className="flex items-center gap-3.5 w-auto sm:w-[30%] min-w-0 max-w-[280px]">
        <div 
          onClick={() => navigate('/player')}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 relative bg-[#16161a] border border-[#ff6600]/30 shadow-[0_0_12px_rgba(255,102,0,0.25)] cursor-pointer group"
          title="Expand Player"
        >
          <img 
            src={currentSong.coverUrl} 
            alt={currentSong.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div 
          className="flex flex-col justify-center min-w-0 cursor-pointer"
          onClick={() => navigate('/player')}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-white hover:text-[#ff7a1a] font-semibold text-[14px] leading-tight truncate">
              {currentSong.title}
            </span>
            {isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600] shadow-[0_0_6px_#ff6600] pulse-neon hidden sm:inline-block shrink-0" />
            )}
          </div>
          <span className="text-neutral-400 hover:text-neutral-200 text-[12px] leading-tight truncate mt-0.5">
            {currentSong.artist}
          </span>
        </div>

        <button 
          id="miniplayer-like-btn"
          onClick={handleToggleLike}
          className={`p-1.5 rounded-full transition-colors hidden sm:block ${
            songIsLiked 
              ? 'text-[#ff6600] drop-shadow-[0_0_6px_#ff6600]' 
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title={songIsLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
          <Heart className={`w-4 h-4 ${songIsLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Player Controls (Center) */}
      <div className="flex flex-col items-center flex-1 max-w-[580px] px-2">
        <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
          <button 
            className={`p-1 rounded-full transition-colors hidden sm:block ${
              isShuffle ? 'text-[#ff6600]' : 'text-neutral-400 hover:text-white'
            }`}
            onClick={toggleShuffle}
            title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button 
            className="text-neutral-400 hover:text-white transition-colors p-1"
            onClick={playPrevious}
            title="Previous song"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button 
            id="miniplayer-play-pause"
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-[0_0_16px_rgba(255,102,0,0.65)] font-bold"
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>

          <button 
            className="text-neutral-400 hover:text-white transition-colors p-1"
            onClick={() => playNext(true)}
            title="Next song"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button 
            className={`p-1 rounded-full transition-colors hidden sm:block ${
              repeatMode !== 'off' ? 'text-[#ff6600]' : 'text-neutral-400 hover:text-white'
            }`}
            onClick={toggleRepeat}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrubber visible on desktop */}
        <div className="w-full hidden md:block">
          <ProgressBar 
            progress={progress} 
            duration={duration} 
            onSeek={seekTo} 
            showHandles
          />
        </div>
      </div>

      {/* Extra Controls (Right) */}
      <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-auto sm:w-[30%] min-w-0 text-neutral-400">
        {/* Lyrics */}
        <button 
          id="miniplayer-lyrics-btn"
          onClick={() => navigate('/player?view=lyrics')}
          className="p-1.5 hover:text-[#ff6600] hover:bg-white/5 rounded-full transition-colors hidden lg:block"
          title="Open Synced Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Visualizer */}
        <button 
          id="miniplayer-visualizer-btn"
          onClick={() => navigate('/player?view=visualizer')}
          className="p-1.5 hover:text-[#ff6600] hover:bg-white/5 rounded-full transition-colors hidden sm:block"
          title="Open Audio Spectrum Visualizer"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Queue */}
        <button 
          onClick={() => navigate('/player?view=queue')}
          className="p-1.5 hover:text-[#ff6600] hover:bg-white/5 rounded-full transition-colors hidden lg:block"
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Sleep Timer */}
        <button 
          onClick={() => setShowSleepTimer(true)}
          className={`p-1.5 rounded-full transition-colors hidden lg:block ${
            sleepTimerSeconds !== null 
              ? 'text-[#ff6600] bg-[#ff6600]/15' 
              : 'hover:text-[#ff6600] hover:bg-white/5'
          }`}
          title="Sleep Timer"
        >
          <Timer className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 group w-24">
          <button 
            onClick={handleVolumeMute}
            className="hover:text-[#ff6600] transition-colors p-1"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className="w-4 h-4" />
          </button>
          <div 
            className="h-1 flex-grow bg-white/15 rounded-full overflow-hidden cursor-pointer relative py-1 -my-1 flex items-center"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setVolumeLevel(p * 100);
            }}
            title={`Volume: ${Math.round(volume)}%`}
          >
            <div className="h-1 w-full bg-white/15 rounded-full relative">
              <div 
                className="h-full bg-[#ff6600] group-hover:bg-[#ff8533] shadow-[0_0_6px_#ff6600] transition-colors rounded-full" 
                style={{ width: `${volume}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fullscreen Expand */}
        <button 
          id="miniplayer-expand-btn"
          onClick={() => navigate('/player')}
          className="p-1.5 hover:text-[#ff6600] hover:bg-white/5 rounded-full transition-colors ml-1"
          title="Expand to Full Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <SleepTimerModal 
        isOpen={showSleepTimer} 
        onClose={() => setShowSleepTimer(false)} 
      />
    </footer>
  );
}
