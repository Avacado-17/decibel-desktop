import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Mic2, RefreshCw, Search, Sliders, ChevronDown, Music, AlertCircle } from 'lucide-react';
import { Song } from '../store/playerStore';

export interface LyricLine {
  time: number;
  text: string;
}

interface LyricsViewProps {
  song: Song;
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
  isPlaying: boolean;
}

export function parseLrc(lrcContent: string): LyricLine[] {
  const lines = lrcContent.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2,}):(\d{2}(?:\.\d{1,3})?)\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      const text = trimmed.replace(timeRegex, '').trim();
      // Only include lines with text or instrumental placeholders
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        const totalSeconds = minutes * 60 + seconds;
        result.push({ time: totalSeconds, text });
      }
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.time - b.time);
  return result;
}

const LYRICS_CACHE_PREFIX = 'simp_lyrics_cache_';

export function LyricsView({ song, progress, duration, onSeek, isPlaying }: LyricsViewProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstrumental, setIsInstrumental] = useState(false);
  
  // Custom sync offset in seconds (to adjust for video audio offset)
  const [syncOffset, setSyncOffset] = useState<number>(0);
  const [showOffsetControls, setShowOffsetControls] = useState(false);
  
  // User manual scroll detection
  const [userScrolled, setUserScrolled] = useState(false);
  const userScrollTimeoutRef = useRef<number | null>(null);
  
  // Search correction mode
  const [showSearch, setShowSearch] = useState(false);
  const [customTitle, setCustomTitle] = useState(song.title);
  const [customArtist, setCustomArtist] = useState(song.artist);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Apply parsed data to state
  const applyLyricsData = (data: any) => {
    if (!data || !data.found) {
      setError('No lyrics found for this track.');
      setLyrics([]);
      setPlainLyrics(null);
      setIsSynced(false);
      setIsInstrumental(false);
    } else if (data.instrumental) {
      setIsInstrumental(true);
      setLyrics([]);
      setPlainLyrics(null);
      setIsSynced(false);
    } else if (data.synced && data.syncedLyrics) {
      const parsed = parseLrc(data.syncedLyrics);
      setLyrics(parsed);
      setIsSynced(true);
      setPlainLyrics(null);
      setIsInstrumental(false);
    } else if (data.plainLyrics) {
      setPlainLyrics(data.plainLyrics);
      setLyrics([]);
      setIsSynced(false);
      setIsInstrumental(false);
    } else {
      setError('No lyrics available.');
      setLyrics([]);
    }
  };

  // Fetch lyrics with local caching
  const fetchLyrics = async (titleOverride?: string, artistOverride?: string, forceRefresh = false) => {
    const qTitle = titleOverride ?? song.title;
    const qArtist = artistOverride ?? song.artist;
    const cacheKey = `${LYRICS_CACHE_PREFIX}${song.id}`;

    // Check local cache for instant load if not forcing refresh
    if (!titleOverride && !artistOverride && !forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cachedData = JSON.parse(cachedRaw);
          applyLyricsData(cachedData);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to read cached lyrics:', e);
      }
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get('/api/lyrics', {
        params: {
          title: qTitle,
          artist: qArtist,
          duration: duration > 0 ? Math.round(duration) : undefined,
        },
      });

      const data = resp.data;
      applyLyricsData(data);

      // Cache successful response locally
      if (data && data.found && !titleOverride && !artistOverride) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
          console.error('Failed to cache lyrics:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to load lyrics:', err);
      setError('Could not connect to lyrics service.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch whenever current song changes
  useEffect(() => {
    setCustomTitle(song.title);
    setCustomArtist(song.artist);
    setSyncOffset(0);
    setUserScrolled(false);
    setShowSearch(false);
    fetchLyrics();
  }, [song.id]);

  // Determine current active lyric index based on effective progress
  const effectiveProgress = Math.max(0, progress + syncOffset);

  const activeIndex = useMemo(() => {
    if (!isSynced || lyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= effectiveProgress) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [lyrics, isSynced, effectiveProgress]);

  // Smoothly auto-scroll to the active line when activeIndex changes
  useEffect(() => {
    if (userScrolled) return;
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, userScrolled]);

  // Detect when user manually scrolls
  const handleScroll = () => {
    setUserScrolled(true);
    if (userScrollTimeoutRef.current) {
      window.clearTimeout(userScrollTimeoutRef.current);
    }
    // Automatically re-engage auto-scroll after 4 seconds of idle
    userScrollTimeoutRef.current = window.setTimeout(() => {
      setUserScrolled(false);
    }, 4000);
  };

  const scrollToActive = () => {
    setUserScrolled(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 relative select-none">
      {/* Top Toolbar in Lyrics View */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 font-medium">
            <Mic2 className="w-3.5 h-3.5 text-primary" />
            {isSynced ? 'Synced Lyrics' : isInstrumental ? 'Instrumental' : 'Lyrics'}
          </span>
          {isSynced && (
            <span className="text-[11px] text-neutral-400 hidden sm:inline">
              Click line to jump
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Offset Toggle */}
          {isSynced && (
            <button
              id="lyrics-offset-btn"
              onClick={() => setShowOffsetControls(!showOffsetControls)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                showOffsetControls || syncOffset !== 0
                  ? 'bg-primary/20 text-primary'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
              title="Adjust timing synchronization offset"
            >
              <Sliders className="w-3.5 h-3.5" />
              {syncOffset !== 0 && (
                <span className="text-[10px] font-mono">
                  {syncOffset > 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
                </span>
              )}
            </button>
          )}

          {/* Search/Edit Song Details */}
          <button
            id="lyrics-search-toggle-btn"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSearch ? 'bg-primary/20 text-primary' : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Search different title or artist"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Reload Lyrics Button */}
          <button
            id="lyrics-refresh-btn"
            onClick={() => fetchLyrics(undefined, undefined, true)}
            disabled={loading}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Reload lyrics from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sync Timing Offset Controls Bar */}
      {showOffsetControls && isSynced && (
        <div className="flex items-center justify-between p-2 mb-3 rounded-lg bg-black/40 border border-white/10 text-xs shrink-0">
          <span className="text-neutral-400 text-[11px]">Sync Timing Offset:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSyncOffset((prev) => Math.max(-10, +(prev - 0.5).toFixed(1)))}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold transition-colors"
              title="Make lyrics appear 0.5s earlier"
            >
              -0.5s
            </button>
            <span className="font-mono text-primary font-bold min-w-[40px] text-center">
              {syncOffset > 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
            </span>
            <button
              onClick={() => setSyncOffset((prev) => Math.min(10, +(prev + 0.5).toFixed(1)))}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold transition-colors"
              title="Make lyrics appear 0.5s later"
            >
              +0.5s
            </button>
            {syncOffset !== 0 && (
              <button
                onClick={() => setSyncOffset(0)}
                className="text-[10px] text-neutral-400 hover:text-white underline ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Query Search Correction Bar */}
      {showSearch && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLyrics(customTitle, customArtist);
          }}
          className="flex flex-col sm:flex-row items-center gap-2 p-3 mb-3 rounded-lg bg-black/40 border border-white/10 text-xs shrink-0"
        >
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Song Title"
            className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            value={customArtist}
            onChange={(e) => setCustomArtist(e.target.value)}
            placeholder="Artist"
            className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-3 py-1.5 bg-primary text-black font-semibold rounded hover:bg-[#1ed760] transition-colors"
          >
            Find
          </button>
        </form>
      )}

      {/* Main Content Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-6 scroll-smooth hide-scrollbar py-6"
      >
        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-6 py-8 animate-pulse">
            <div className="h-8 bg-white/10 rounded-lg w-3/4 mx-auto" />
            <div className="h-9 bg-white/20 rounded-lg w-5/6 mx-auto" />
            <div className="h-8 bg-white/15 rounded-lg w-2/3 mx-auto" />
            <div className="h-8 bg-white/10 rounded-lg w-4/5 mx-auto" />
            <div className="h-8 bg-white/5 rounded-lg w-1/2 mx-auto" />
          </div>
        )}

        {/* Instrumental Track Notification */}
        {!loading && isInstrumental && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-400">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-primary">
              <Music className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Instrumental Track</h4>
            <p className="text-sm max-w-xs text-neutral-400">
              This track is recorded as an instrumental without vocal lyrics.
            </p>
          </div>
        )}

        {/* Error or Not Found State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <AlertCircle className="w-12 h-12 text-neutral-500 mb-3" />
            <h4 className="text-lg font-semibold text-white mb-1">{error}</h4>
            <p className="text-xs text-neutral-400 max-w-sm mb-6">
              Couldn&apos;t automatically find synchronized lyrics for &ldquo;{song.title}&rdquo;.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(true)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Search Manually
              </button>
              <button
                onClick={() => fetchLyrics()}
                className="px-4 py-2 rounded-full bg-primary text-black text-xs font-semibold hover:bg-[#1ed760] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Synced Lyrics Display */}
        {!loading && isSynced && lyrics.length > 0 && (
          <div className="flex flex-col space-y-5 pb-24 text-left">
            {lyrics.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <div
                  key={`${line.time}-${index}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.time)}
                  className={`cursor-pointer transition-all duration-300 rounded-lg p-2.5 -mx-2.5 group select-none ${
                    isActive
                      ? 'text-white text-2xl sm:text-3xl font-extrabold scale-[1.02] drop-shadow-[0_2px_12px_rgba(255,255,255,0.35)] bg-white/5'
                      : isPast
                      ? 'text-white/35 hover:text-white/70 text-lg sm:text-xl font-medium'
                      : 'text-white/45 hover:text-white/80 text-lg sm:text-xl font-medium'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="leading-snug tracking-tight">
                      {line.text || '♪'}
                    </span>
                    <span className="opacity-0 group-hover:opacity-60 text-xs font-mono shrink-0 transition-opacity text-primary">
                      {formatTimestamp(line.time)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Plain (Unsynced) Lyrics Display */}
        {!loading && !isSynced && plainLyrics && (
          <div className="py-4 pb-20 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 text-[11px] text-neutral-400 mb-6">
              Plain lyrics (Not time-synced)
            </div>
            <div className="whitespace-pre-line text-lg sm:text-xl text-neutral-200 leading-relaxed font-medium space-y-4">
              {plainLyrics}
            </div>
          </div>
        )}
      </div>

      {/* Floating 'Scroll to Current Lyric' button if user scrolled away */}
      {isSynced && userScrolled && activeIndex >= 0 && (
        <button
          id="lyrics-scroll-to-current-btn"
          onClick={scrollToActive}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-black font-semibold text-xs shadow-xl hover:scale-105 transition-transform flex items-center gap-1.5 z-20"
        >
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          Jump to Current Lyric
        </button>
      )}
    </div>
  );
}
