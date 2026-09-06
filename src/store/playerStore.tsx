import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

export interface Song {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  coverUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songs: Song[];
  createdAt: number;
}

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  likedSongs: Song[];
  recentlyPlayed: Song[];
  userPlaylists: Playlist[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  sleepTimerSeconds: number | null; // Remaining seconds, or null if inactive
  playerRef: React.MutableRefObject<any>;
  playSong: (song: Song) => void;
  playPlaylist: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (level: number) => void;
  onPlayerReady: (event: any) => void;
  onPlayerStateChange: (event: any) => void;
  playNext: (forceSkip?: boolean) => void;
  playPrevious: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setSleepTimer: (minutes: number | null) => void;
  cancelSleepTimer: () => void;
  isLiked: (songId: string) => boolean;
  toggleLike: (song: Song) => void;
  clearLikedSongs: () => void;
  clearRecentlyPlayed: () => void;
  removeRecentlyPlayed: (songId: string) => void;
  getCachedTrack: (songId: string) => Song | null;
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, newName: string, description?: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => boolean;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  isSongInPlaylist: (playlistId: string, songId: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const DEFAULT_LIKED_SONGS: Song[] = [];

const LIKED_SONGS_KEY = 'decibel_liked_songs';
const RECENTLY_PLAYED_KEY = 'simp_recently_played_tracks';
const TRACK_METADATA_CACHE_KEY = 'simp_track_metadata_cache';
const PLAYLISTS_STORAGE_KEY = 'decibel_user_playlists';

const DEFAULT_PLAYLISTS: Playlist[] = [];

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>(() => {
    try {
      localStorage.removeItem(LIKED_SONGS_KEY);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('liked_')) {
          localStorage.removeItem(key);
        }
      });
      return [];
    } catch {
      return [];
    }
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() => {
    try {
      const stored = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy dummy playlists if present
          const filtered = parsed.filter((p: Playlist) => p.id !== 'pl-late-night' && p.id !== 'pl-focus');
          return filtered;
        }
      }
    } catch (e) {
      console.error('Failed to parse user playlists from localStorage:', e);
    }
    return DEFAULT_PLAYLISTS;
  });

  const savePlaylists = (updated: Playlist[]) => {
    setUserPlaylists(updated);
    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save user playlists:', err);
    }
  };

  const createPlaylist = (name: string, description?: string): Playlist => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || 'My Playlist',
      description: description?.trim() || '',
      songs: [],
      createdAt: Date.now()
    };
    const updated = [newPl, ...userPlaylists];
    savePlaylists(updated);
    return newPl;
  };

  const deletePlaylist = (playlistId: string) => {
    const updated = userPlaylists.filter(p => p.id !== playlistId);
    savePlaylists(updated);
  };

  const renamePlaylist = (playlistId: string, newName: string, description?: string) => {
    const updated = userPlaylists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          name: newName.trim() || p.name,
          description: description !== undefined ? description.trim() : p.description
        };
      }
      return p;
    });
    savePlaylists(updated);
  };

  const addSongToPlaylist = (playlistId: string, song: Song): boolean => {
    let added = false;
    const updated = userPlaylists.map(p => {
      if (p.id === playlistId) {
        const exists = p.songs.some(s => s.id === song.id);
        if (!exists) {
          added = true;
          return {
            ...p,
            songs: [song, ...p.songs],
            coverUrl: p.coverUrl || song.coverUrl
          };
        }
      }
      return p;
    });
    if (added) {
      savePlaylists(updated);
    }
    return added;
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    const updated = userPlaylists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          songs: p.songs.filter(s => s.id !== songId)
        };
      }
      return p;
    });
    savePlaylists(updated);
  };

  const isSongInPlaylist = (playlistId: string, songId: string) => {
    const pl = userPlaylists.find(p => p.id === playlistId);
    return pl ? pl.songs.some(s => s.id === songId) : false;
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  
  const playerRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const sleepTimerIntervalRef = useRef<number | null>(null);
  
  // Use a ref to always access the latest playNext function in YouTube event callbacks
  const playNextRef = useRef<(forceSkip?: boolean) => void>(() => {});

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setProgress(playerRef.current.getCurrentTime());
      }
    }, 250);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerIntervalRef.current) {
      clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = null;
    }
    setSleepTimerSeconds(null);
  };

  const pause = () => {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  };

  const setSleepTimer = (minutes: number | null) => {
    cancelSleepTimer();
    if (minutes === null || minutes <= 0) {
      return;
    }

    const totalSeconds = Math.round(minutes * 60);
    setSleepTimerSeconds(totalSeconds);

    sleepTimerIntervalRef.current = window.setInterval(() => {
      setSleepTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          // Timer finished: pause playback and clear interval
          if (sleepTimerIntervalRef.current) {
            clearInterval(sleepTimerIntervalRef.current);
            sleepTimerIntervalRef.current = null;
          }
          if (playerRef.current?.pauseVideo) {
            playerRef.current.pauseVideo();
          }
          setIsPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    };
  }, []);

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
    if (!isShuffle) { // Switching to true, so shuffle current queue
      setQueue(prev => {
        const shuffled = [...prev];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      });
    }
  };

  const playNext = (forceSkip?: boolean | any) => {
    const isManualSkip = forceSkip === true;
    
    // Repeat one logic (only auto-loops if it wasn't a manual skip)
    if (!isManualSkip && repeatMode === 'one' && currentSong) {
      seekTo(0);
      if (playerRef.current) playerRef.current.playVideo();
      setIsPlaying(true);
      return;
    }

    if (queue.length > 0) {
      if (currentSong) {
        setHistory(prev => [...prev, currentSong]);
      }
      const nextSong = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentSong(nextSong);
      setIsPlaying(true);
      setProgress(0);
    } else if (repeatMode === 'all' && currentSong) {
      // Replay entire history + current song queue
      const fullList = [...history, currentSong];
      if (fullList.length > 1) {
        const nextSong = fullList[0];
        setQueue(fullList.slice(1));
        setHistory([]);
        setCurrentSong(nextSong);
        setIsPlaying(true);
        setProgress(0);
      } else {
        seekTo(0);
        if (playerRef.current) playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else if (currentSong) {
      // Intelligently pick next track from recentlyPlayed, likedSongs, or default catalogue
      const candidatePool = [
        ...recentlyPlayed,
        ...likedSongs,
        ...DEFAULT_RECENTLY_PLAYED,
      ].filter(s => s.id !== currentSong.id);

      // Deduplicate candidate pool by song ID
      const uniqueCandidates = candidatePool.filter(
        (song, index, self) => index === self.findIndex(t => t.id === song.id)
      );

      if (uniqueCandidates.length > 0) {
        // Pick next candidate or loop back
        const nextSong = isShuffle
          ? uniqueCandidates[Math.floor(Math.random() * uniqueCandidates.length)]
          : uniqueCandidates[0];

        setHistory(prev => [...prev, currentSong]);
        // Also queue up the rest so continuous skips keep playing
        const remaining = uniqueCandidates.filter(s => s.id !== nextSong.id);
        setQueue(remaining);
        setCurrentSong(nextSong);
        setIsPlaying(true);
        setProgress(0);
      } else {
        seekTo(0);
        if (playerRef.current) playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(false);
      setProgress(0);
      if (playerRef.current) {
        playerRef.current.stopVideo();
      }
    }
  };

  const playPrevious = () => {
    // If progress is > 3 seconds, restart current song
    if (progress > 3) {
      seekTo(0);
      if (playerRef.current) playerRef.current.playVideo();
      setIsPlaying(true);
      return;
    }

    if (history.length > 0) {
      if (currentSong) {
        setQueue(prev => [currentSong, ...prev]);
      }
      const prevSong = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentSong(prevSong);
      setIsPlaying(true);
      setProgress(0);
    } else if (currentSong) {
      // If no explicit history, cycle backwards through available catalogue
      const pool = [
        ...recentlyPlayed,
        ...likedSongs,
        ...DEFAULT_RECENTLY_PLAYED,
      ];
      const uniquePool = pool.filter(
        (song, index, self) => index === self.findIndex(t => t.id === song.id)
      );
      const currentIndex = uniquePool.findIndex(s => s.id === currentSong.id);

      if (uniquePool.length > 1) {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : uniquePool.length - 1;
        const prevSong = uniquePool[prevIndex];
        if (prevSong && prevSong.id !== currentSong.id) {
          setQueue(prev => [currentSong, ...prev]);
          setCurrentSong(prevSong);
          setIsPlaying(true);
          setProgress(0);
          return;
        }
      }
      seekTo(0);
    } else {
      seekTo(0);
    }
  };

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext, queue, history, currentSong, repeatMode]);

  const addToQueue = (song: Song) => {
    setQueue(prev => {
      // If shuffle is active and queue isn't empty, inject at a random spot or just at end
      // Normal behavior is usually just add to end anyway.
      return [...prev, song];
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
  };

  const playSong = (song: Song) => {
    if (currentSong?.id === song.id && playerRef.current) {
      playerRef.current.playVideo();
      setIsPlaying(true);
      return;
    }
    if (currentSong) {
      setHistory(prev => [...prev, currentSong]);
    }
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      setProgress(seconds);
    }
  };

  const setVolumeLevel = (level: number) => {
    setVolume(level);
    if (playerRef.current) {
      playerRef.current.setVolume(level);
    }
  };

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume);
    if (isPlaying) {
      playerRef.current.playVideo();
    }
  };

  const onPlayerStateChange = (event: any) => {
    // 1 = playing, 2 = paused, 0 = ended
    if (event.data === 1) {
      setIsPlaying(true);
      setDuration(playerRef.current.getDuration());
      startTimer();
    } else if (event.data === 2) {
      setIsPlaying(false);
      stopTimer();
    } else if (event.data === 0) {
      setIsPlaying(false);
      stopTimer();
      setProgress(duration);
      if (playNextRef.current) {
        playNextRef.current(false);
      }
    }
  };

  const isLiked = (songId: string) => {
    return likedSongs.some(s => s.id === songId);
  };

  const toggleLike = (song: Song) => {
    setLikedSongs(prev => {
      const exists = prev.some(s => s.id === song.id);
      let updated: Song[];
      if (exists) {
        updated = prev.filter(s => s.id !== song.id);
        try {
          localStorage.setItem(`liked_${song.id}`, 'false');
        } catch {}
      } else {
        updated = [song, ...prev];
        try {
          localStorage.setItem(`liked_${song.id}`, 'true');
        } catch {}
      }
      try {
        localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save liked songs:', err);
      }
      return updated;
    });
  };

  const playPlaylist = (songs: Song[], startIndex: number = 0) => {
    if (!songs || songs.length === 0) return;
    const actualIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
    const selected = songs[actualIndex];
    const remaining = songs.slice(actualIndex + 1);
    if (currentSong) {
      setHistory(prev => [...prev, currentSong]);
    }
    setCurrentSong(selected);
    setQueue(remaining);
    setIsPlaying(true);
    setProgress(0);
    if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }
  };

  const cacheTrackAndRecordPlay = (song: Song) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 40);
      try {
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save recently played tracks:', err);
      }
      return updated;
    });

    try {
      const cacheStr = localStorage.getItem(TRACK_METADATA_CACHE_KEY);
      const cacheMap: Record<string, Song> = cacheStr ? JSON.parse(cacheStr) : {};
      cacheMap[song.id] = song;
      localStorage.setItem(TRACK_METADATA_CACHE_KEY, JSON.stringify(cacheMap));
    } catch (err) {
      console.error('Failed to update track metadata cache:', err);
    }
  };

  // Automatically record and cache track whenever currentSong changes
  useEffect(() => {
    if (currentSong) {
      cacheTrackAndRecordPlay(currentSong);
    }
  }, [currentSong?.id]);

  const clearLikedSongs = () => {
    setLikedSongs([]);
    try {
      localStorage.removeItem(LIKED_SONGS_KEY);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('liked_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.error('Failed to clear liked songs:', err);
    }
  };

  const clearRecentlyPlayed = () => {
    setRecentlyPlayed([]);
    try {
      localStorage.removeItem(RECENTLY_PLAYED_KEY);
    } catch (err) {
      console.error('Failed to clear recently played:', err);
    }
  };

  const removeRecentlyPlayed = (songId: string) => {
    setRecentlyPlayed(prev => {
      const updated = prev.filter(s => s.id !== songId);
      try {
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update recently played:', err);
      }
      return updated;
    });
  };

  const getCachedTrack = (songId: string): Song | null => {
    try {
      const cacheStr = localStorage.getItem(TRACK_METADATA_CACHE_KEY);
      if (cacheStr) {
        const cacheMap = JSON.parse(cacheStr);
        if (cacheMap[songId]) return cacheMap[songId];
      }
      const foundInRecent = recentlyPlayed.find(s => s.id === songId);
      if (foundInRecent) return foundInRecent;
      const foundInLiked = likedSongs.find(s => s.id === songId);
      if (foundInLiked) return foundInLiked;
    } catch {}
    return null;
  };

  return (
    <PlayerContext.Provider 
      value={{ 
        currentSong, queue, history, likedSongs, recentlyPlayed, userPlaylists, isPlaying, progress, duration, volume, playerRef,
        repeatMode, isShuffle, toggleRepeat, toggleShuffle,
        sleepTimerSeconds, setSleepTimer, cancelSleepTimer,
        isLiked, toggleLike, clearLikedSongs, playPlaylist,
        clearRecentlyPlayed, removeRecentlyPlayed, getCachedTrack,
        createPlaylist, deletePlaylist, renamePlaylist, addSongToPlaylist, removeSongFromPlaylist, isSongInPlaylist,
        playSong, togglePlay, pause, seekTo, setVolumeLevel, 
        onPlayerReady, onPlayerStateChange,
        playNext, playPrevious, addToQueue, removeFromQueue
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
