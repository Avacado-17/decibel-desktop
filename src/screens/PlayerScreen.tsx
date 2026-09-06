import { useState } from 'react';
import { 
  ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Volume2, Mic2, ListMusic, MonitorSpeaker, Timer, X, Heart, Activity 
} from 'lucide-react';
import { usePlayer } from '../store/playerStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { SleepTimerModal } from '../components/SleepTimerModal';
import { LyricsView } from '../components/LyricsView';
import { AudioVisualizer } from '../components/AudioVisualizer';

export default function PlayerScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view') as 'song' | 'visualizer' | 'lyrics' | 'queue' | null;
  const [viewMode, setViewModeState] = useState<'song' | 'visualizer' | 'lyrics' | 'queue'>(
    requestedView === 'visualizer' || requestedView === 'lyrics' || requestedView === 'queue' ? requestedView : 'song'
  );
  const [showSleepTimer, setShowSleepTimer] = useState(false);

  const setViewMode = (mode: 'song' | 'visualizer' | 'lyrics' | 'queue') => {
    setViewModeState(mode);
    setSearchParams(mode === 'song' ? {} : { view: mode }, { replace: true });
  };
  const { 
    currentSong, queue, isPlaying, togglePlay, progress, duration, volume, 
    seekTo, setVolumeLevel, playNext, playPrevious, removeFromQueue, 
    repeatMode, isShuffle, toggleRepeat, toggleShuffle, sleepTimerSeconds,
    isLiked, toggleLike 
  } = usePlayer();
  const navigate = useNavigate();

  if (!currentSong) {
    navigate('/');
    return null;
  }

  const formatRemainingMinutes = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-neutral-800 to-black p-8 relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-30 blur-[100px] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, var(--color-primary), transparent 70%)`
        }}
      />
      
      <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors shrink-0"
          title="Back"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg">
          <button
            id="player-tab-song"
            onClick={() => setViewMode('song')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'song'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Song
          </button>
          <button
            id="player-tab-visualizer"
            onClick={() => setViewMode('visualizer')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'visualizer'
                ? 'bg-primary text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Audio Visualizer"
          >
            <Activity className="w-3.5 h-3.5" />
            Visualizer
          </button>
          <button
            id="player-tab-lyrics"
            onClick={() => setViewMode('lyrics')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'lyrics'
                ? 'bg-primary text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            Lyrics
          </button>
          <button
            id="player-tab-queue"
            onClick={() => setViewMode('queue')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'queue'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Queue {queue.length > 0 && `(${queue.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            id="player-sleep-timer-btn"
            onClick={() => setShowSleepTimer(true)}
            className={`h-10 px-3 flex items-center gap-1.5 rounded-full transition-all text-xs font-semibold ${
              sleepTimerSeconds !== null 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-black/20 hover:bg-black/40 text-neutral-300'
            }`}
            title="Set Sleep Timer"
          >
            <Timer className="w-4 h-4" />
            {sleepTimerSeconds !== null && (
              <span>{formatRemainingMinutes(sleepTimerSeconds)}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full relative z-10 min-h-0">
        {viewMode === 'queue' ? (
          <div className="w-full flex-1 overflow-y-auto mb-6 flex flex-col gap-2 min-h-0 hide-scrollbar">
            <h3 className="text-xl font-bold mb-4 sticky top-0 bg-black/50 backdrop-blur-md p-2 rounded-lg z-10">Up Next</h3>
            {queue.length === 0 ? (
              <p className="text-neutral-400 text-center mt-10">No upcoming songs in queue.</p>
            ) : (
              queue.map((song, index) => (
                <div key={`${song.id}-${index}`} className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group">
                   <img src={song.coverUrl} className="w-12 h-12 rounded object-cover shadow-md" alt={song.title} />
                   <div className="flex flex-col flex-1 min-w-0">
                     <span className="font-semibold text-sm truncate">{song.title}</span>
                     <span className="text-xs text-neutral-400 truncate">{song.artist}</span>
                   </div>
                   <button 
                     onClick={() => removeFromQueue(index)} 
                     className="text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-2"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>
              ))
            )}
          </div>
        ) : viewMode === 'lyrics' ? (
          <div className="w-full flex-1 flex flex-col min-h-0 mb-4">
            <LyricsView 
              song={currentSong} 
              progress={progress} 
              duration={duration} 
              onSeek={seekTo} 
              isPlaying={isPlaying} 
            />
          </div>
        ) : viewMode === 'visualizer' ? (
          <div className="w-full flex-1 flex flex-col min-h-0 mb-4">
            <AudioVisualizer
              song={currentSong}
              isPlaying={isPlaying}
              volume={volume}
              progress={progress}
              variant="full"
            />
          </div>
        ) : (
          <>
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              className="w-full aspect-square object-cover rounded-xl shadow-2xl mb-4 sm:mb-6 shrink max-h-[260px] sm:max-h-[300px]"
            />
            
            <div className="w-full flex items-center justify-between mb-3 shrink-0">
              <div className="flex flex-col min-w-0 pr-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 line-clamp-1">{currentSong.title}</h2>
                <p className="text-base sm:text-lg text-neutral-400 truncate">{currentSong.artist}</p>
              </div>
              <button
                id="player-like-btn"
                onClick={() => toggleLike(currentSong)}
                className={`p-3 rounded-full transition-all duration-200 shrink-0 ${
                  isLiked(currentSong.id)
                    ? 'text-primary hover:scale-110 bg-primary/10'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
                title={isLiked(currentSong.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              >
                <Heart className={`w-7 h-7 ${isLiked(currentSong.id) ? 'fill-primary stroke-primary' : ''}`} />
              </button>
            </div>

            {/* Inline Reactive Spectrum Visualizer */}
            <div className="w-full mb-3 shrink-0">
              <AudioVisualizer
                song={currentSong}
                isPlaying={isPlaying}
                volume={volume}
                progress={progress}
                variant="inline"
                onExpand={() => setViewMode('visualizer')}
              />
            </div>
          </>
        )}

        <div className="w-full mb-8 shrink-0 mt-auto">
          <ProgressBar 
            progress={progress} 
            duration={duration} 
            onSeek={seekTo} 
            showHandles 
          />
        </div>

        <div className="w-full flex items-center justify-between shrink-0 mb-4">
          <button 
            className={`transition-colors ${isShuffle ? 'text-primary' : 'text-neutral-400 hover:text-white'}`}
            onClick={toggleShuffle}
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button 
            className="text-white hover:text-neutral-300 transition-colors"
            onClick={playPrevious}
          >
            <SkipBack className="w-8 h-8 fill-current" />
          </button>
          <button 
            className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>
          <button 
            className="text-white hover:text-neutral-300 transition-colors"
            onClick={() => playNext(true)}
          >
            <SkipForward className="w-8 h-8 fill-current" />
          </button>
          <button 
            className={`transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-neutral-400 hover:text-white'}`}
            onClick={toggleRepeat}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-4 relative z-10 border-t border-white/10">
         <div className="flex items-center gap-4 text-neutral-400">
           <button 
             id="player-footer-like-btn"
             onClick={() => toggleLike(currentSong)}
             className={`hover:text-white transition-colors flex items-center gap-1 ${isLiked(currentSong.id) ? 'text-primary' : ''}`}
             title={isLiked(currentSong.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
           >
             <Heart className={`w-5 h-5 ${isLiked(currentSong.id) ? 'fill-primary stroke-primary' : ''}`} />
           </button>
           <button 
             id="player-footer-sleep-timer-btn"
             onClick={() => setShowSleepTimer(true)}
             className={`hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
               sleepTimerSeconds !== null 
                 ? 'bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30 font-bold' 
                 : ''
             }`}
             title="Set Sleep Timer"
           >
             <Timer className="w-5 h-5" />
             {sleepTimerSeconds !== null && (
               <span>{formatRemainingMinutes(sleepTimerSeconds)}</span>
             )}
           </button>
           <button 
             id="player-footer-visualizer-btn"
             onClick={() => setViewMode(viewMode === 'visualizer' ? 'song' : 'visualizer')}
             className={`hover:text-white transition-colors flex items-center gap-1 ${viewMode === 'visualizer' ? 'text-primary' : ''}`}
             title={viewMode === 'visualizer' ? 'Hide Visualizer' : 'Show Audio Visualizer'}
           >
             <Activity className="w-5 h-5" />
           </button>
           <button 
             id="player-footer-lyrics-btn"
             onClick={() => setViewMode(viewMode === 'lyrics' ? 'song' : 'lyrics')}
             className={`hover:text-white transition-colors flex items-center gap-1 ${viewMode === 'lyrics' ? 'text-primary' : ''}`}
             title={viewMode === 'lyrics' ? 'Hide Lyrics' : 'Show Synced Lyrics'}
           >
             <Mic2 className="w-5 h-5" />
           </button>
           <button 
             id="player-footer-queue-btn"
             onClick={() => setViewMode(viewMode === 'queue' ? 'song' : 'queue')}
             className={`hover:text-white transition-colors flex items-center gap-1 ${viewMode === 'queue' ? 'text-primary' : ''}`}
             title={viewMode === 'queue' ? 'Hide Queue' : 'Show Queue'}
           >
             <ListMusic className="w-5 h-5" />
           </button>
           <button className="hover:text-white transition-colors"><MonitorSpeaker className="w-5 h-5" /></button>
         </div>
         <div className="flex items-center gap-2 group w-32">
            <Volume2 className="w-5 h-5 text-neutral-400" />
            <div 
              className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const p = (e.clientX - rect.left) / rect.width;
                setVolumeLevel(p * 100);
              }}
            >
              <div 
                className="h-full bg-white group-hover:bg-primary rounded-full"
                style={{ width: `${volume}%` }}
              />
            </div>
         </div>
      </div>

      <SleepTimerModal 
        isOpen={showSleepTimer} 
        onClose={() => setShowSleepTimer(false)} 
      />
    </div>
  );
}
