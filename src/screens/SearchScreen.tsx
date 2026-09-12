import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Plus, Clock, X, Trash2, Zap, Play, Pause, 
  Volume2, Mic2, Disc, Music, Check, Sparkles, User, 
  Radio, ChevronRight, ArrowUpRight, ListPlus 
} from 'lucide-react';
import axios from 'axios';
import { usePlayer, Song } from '../store/playerStore';
import { searchCuratedTracksLocally } from '../data/curatedTracks';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { 
  ArtistResult, 
  AlbumResult, 
  TopResultItem, 
  SearchCategoryFilter,
  SearchHistoryEntry
} from '../types/search';

const BROWSE_CATEGORIES = [
  { id: '1', name: 'Synthwave', color: 'from-[#2e1305] to-[#732a03]', border: '#ff6600', query: 'Synthwave' },
  { id: '2', name: 'Electronic', color: 'from-[#190f05] to-[#451e04]', border: '#ff6600', query: 'Electronic' },
  { id: '3', name: 'Chill & Lo-Fi', color: 'from-[#0b1419] to-[#122c38]', border: '#0ea5e9', query: 'Ambient Chill' },
  { id: '4', name: 'Classic Rock', color: 'from-[#260e0a] to-[#591e12]', border: '#ef4444', query: 'Rock' },
  { id: '5', name: 'Smooth Jazz', color: 'from-[#1f1708] to-[#47340b]', border: '#eab308', query: 'Jazz' },
  { id: '6', name: 'Neo-Classical', color: 'from-[#170e1c] to-[#3a1947]', border: '#a855f7', query: 'Classical' },
  { id: '7', name: 'Cyberpunk', color: 'from-[#1a0822] to-[#4d1066]', border: '#d946ef', query: 'Cyberpunk beats' },
];

const TRENDING_SEARCHES = [
  'Kavinsky', 'Daft Punk', 'The Midnight', 'OutRun Dreams', 
  'Neon Nights', 'Hans Zimmer', 'Tycho', 'Queen'
];

const SEARCH_HISTORY_KEY = 'decibel_search_history';
const SEARCH_CACHE_PREFIX = 'decibel_search_cache_';

function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return 'Recent';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SearchScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('all');
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Categorized predictive results
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [albums, setAlbums] = useState<AlbumResult[]>([]);
  const [topResult, setTopResult] = useState<TopResultItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [addedQueueId, setAddedQueueId] = useState<string | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);

  const { 
    playSong, 
    playPlaylist,
    addToQueue, 
    recentlyPlayed, 
    currentSong, 
    isPlaying, 
    togglePlay 
  } = usePlayer();

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized: SearchHistoryEntry[] = parsed.map((item: any, idx: number) => {
            if (typeof item === 'string') {
              return { 
                query: item, 
                timestamp: Date.now() - idx * 300000 
              };
            }
            return {
              query: item.query || '',
              timestamp: item.timestamp || Date.now() - idx * 300000,
              category: item.category
            };
          }).filter((item) => Boolean(item.query?.trim()));
          setSearchHistory(normalized);
        }
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  // Update URL if initial query provided
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const saveQueryToHistory = useCallback((q: string, category?: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
      const updated: SearchHistoryEntry[] = [
        { query: trimmed, timestamp: Date.now(), category },
        ...filtered
      ].slice(0, 15);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
      return updated;
    });
  }, []);

  const removeHistoryItem = (itemToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.query.toLowerCase() !== itemToRemove.toLowerCase());
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update search history:', err);
      }
      return updated;
    });
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    }
  };

  const handleSelectHistoryQuery = (targetQuery: string) => {
    setQuery(targetQuery);
    setSearchParams(targetQuery ? { q: targetQuery } : {});
    saveQueryToHistory(targetQuery);
  };

  // Instant local predictive fallback based on recently played & library tracks
  const localPredictiveMatches = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase().trim();

    const matchedSongs = recentlyPlayed.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );

    // Synthesize local artists from matching songs
    const matchedArtistsMap = new Map<string, ArtistResult>();
    for (const song of matchedSongs) {
      if (!song.artist) continue;
      const lower = song.artist.toLowerCase();
      if (!matchedArtistsMap.has(lower)) {
        matchedArtistsMap.set(lower, {
          id: `local-artist-${lower.replace(/[^a-z0-9]/g, '-')}`,
          name: song.artist,
          imageUrl: song.coverUrl,
          genre: 'Library Artist',
          monthlyListeners: 'Verified Artist',
          verified: true,
          trackCount: 1,
          topTrackId: song.id
        });
      }
    }

    return {
      songs: matchedSongs,
      artists: Array.from(matchedArtistsMap.values()),
    };
  }, [query, recentlyPlayed]);

  // Predictive search query runner as user types (with debouncing)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSongs([]);
      setArtists([]);
      setAlbums([]);
      setTopResult(null);
      setIsFromCache(false);
      setLoading(false);
      return;
    }

    const cacheKey = `${SEARCH_CACHE_PREFIX}${trimmed.toLowerCase()}`;
    let hadCachedResults = false;

    // Check localStorage cache for instantaneous prediction
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.songs?.length || parsed.results?.length)) {
          setSongs(parsed.songs || parsed.results || []);
          setArtists(parsed.artists || []);
          setAlbums(parsed.albums || []);
          setTopResult(parsed.topResult || null);
          setIsFromCache(true);
          hadCachedResults = true;
        }
      }
    } catch (e) {
      // Ignore cache read errors
    }

    if (!hadCachedResults) {
      setLoading(true);
      setIsFromCache(false);
    }

    // Debounce network request to backend predictive search with client-side fallback
    const timer = setTimeout(async () => {
      let fetchedSongs: Song[] = [];
      let fetchedArtists: ArtistResult[] = [];
      let fetchedAlbums: AlbumResult[] = [];
      let fetchedTopResult: TopResultItem | null = null;

      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = res.data;

        fetchedSongs = data.songs || data.results || [];
        fetchedArtists = data.artists || [];
        fetchedAlbums = data.albums || [];
        fetchedTopResult = data.topResult || null;
      } catch (error) {
        console.warn('Predictive search API unavailable, using client-side engine:', error);
      }

      // If backend search returned empty or failed (e.g. static deployed build on Vercel), fallback to local curated engine
      if (fetchedSongs.length === 0) {
        const local = searchCuratedTracksLocally(trimmed);
        fetchedSongs = local.songs;
        fetchedArtists = local.artists;
        fetchedAlbums = local.albums;
        fetchedTopResult = local.topResult;
      }

      setSongs(fetchedSongs);
      setArtists(fetchedArtists);
      setAlbums(fetchedAlbums);
      setTopResult(fetchedTopResult);
      setIsFromCache(false);

      // Cache the categorized predictive result
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          songs: fetchedSongs,
          artists: fetchedArtists,
          albums: fetchedAlbums,
          topResult: fetchedTopResult,
        }));
      } catch (e) {
        // Ignore cache write errors
      } finally {
        setLoading(false);
      }
    }, hadCachedResults ? 500 : 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle Enter keypress: save to history and play top result
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      saveQueryToHistory(query);
      if (topResult) {
        handlePlayTopResult();
      } else if (songs.length > 0) {
        playSong(songs[0]);
      }
    }
  };

  // Add to queue with feedback animation
  const handleAddToQueue = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
    setAddedQueueId(song.id);
    setTimeout(() => {
      setAddedQueueId(null);
    }, 1500);
  };

  // Play top result depending on whether it's an artist, album, or song
  const handlePlayTopResult = () => {
    if (!topResult) {
      if (songs.length > 0) playSong(songs[0]);
      return;
    }

    if (topResult.type === 'song') {
      playSong(topResult.data as Song);
      saveQueryToHistory(query);
    } else if (topResult.type === 'artist') {
      const artist = topResult.data as ArtistResult;
      // Find track by artist or play first matching song
      const artistTrack = songs.find(s => s.artist.toLowerCase().includes(artist.name.toLowerCase())) || songs[0];
      if (artistTrack) {
        playSong(artistTrack);
      }
      saveQueryToHistory(artist.name);
    } else if (topResult.type === 'album') {
      const album = topResult.data as AlbumResult;
      const albumTracks = songs.filter(s => 
        (s as any).album?.toLowerCase() === album.title.toLowerCase() || 
        s.artist.toLowerCase() === album.artist.toLowerCase()
      );
      if (albumTracks.length > 0) {
        playSong(albumTracks[0]);
        for (let i = 1; i < albumTracks.length; i++) {
          addToQueue(albumTracks[i]);
        }
      } else if (songs.length > 0) {
        playSong(songs[0]);
      }
      saveQueryToHistory(album.title);
    }
  };

  // Play an album's tracks
  const handlePlayAlbum = (album: AlbumResult, e: React.MouseEvent) => {
    e.stopPropagation();
    saveQueryToHistory(album.title);
    const albumTracks = songs.filter(s => 
      (s as any).album?.toLowerCase() === album.title.toLowerCase() ||
      s.artist.toLowerCase().includes(album.artist.toLowerCase())
    );
    if (albumTracks.length > 0) {
      playSong(albumTracks[0]);
      for (let i = 1; i < albumTracks.length; i++) {
        addToQueue(albumTracks[i]);
      }
    } else {
      // Filter search to this album title
      setQuery(album.title);
    }
  };

  // Click an artist: filter query or play top track
  const handleSelectArtist = (artist: ArtistResult) => {
    saveQueryToHistory(artist.name);
    const artistTrack = songs.find(s => s.artist.toLowerCase().includes(artist.name.toLowerCase()));
    if (artistTrack) {
      playSong(artistTrack);
    } else {
      setQuery(artist.name);
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '3:24';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalResultsCount = songs.length + artists.length + albums.length;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto select-none font-sans">
      {/* Search Input Bar */}
      <div className="relative max-w-2xl mb-5 group z-30">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#ff6600] transition-colors pointer-events-none z-10" />
          <input 
            id="search-input"
            type="text" 
            placeholder="Search songs, artists, or albums..." 
            value={query}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              // Delay slightly so clicks on history dropdown items register
              setTimeout(() => setIsInputFocused(false), 200);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchParams(e.target.value ? { q: e.target.value } : {});
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-[#121216]/95 hover:bg-[#16161b] focus:bg-[#16161b] transition-all rounded-full py-3.5 pl-12 pr-28 text-sm font-medium outline-none text-white placeholder-neutral-500 border border-[#ff6600]/25 focus:border-[#ff6600] shadow-[0_0_20px_rgba(0,0,0,0.5)] focus:shadow-[0_0_25px_rgba(255,102,0,0.25)]"
          />

          {/* Action Indicators (Right of Input) */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
            {loading && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#ff7a1a] font-mono bg-[#ff6600]/10 px-2 py-0.5 rounded-full border border-[#ff6600]/25 animate-pulse">
                <Sparkles className="w-3 h-3 text-[#ff6600]" />
                Predicting...
              </span>
            )}

            {isFromCache && !loading && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-[#ff6600]" />
                Instant
              </span>
            )}

            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Search History Dropdown (When focused and has history) */}
        {isInputFocused && searchHistory.length > 0 && !query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121216]/98 backdrop-blur-2xl border border-[#ff6600]/30 rounded-2xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.9)] z-40 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-white/10 text-xs">
              <span className="font-semibold text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ff6600]" />
                Recent Discovery Queries
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  clearAllHistory();
                }}
                className="text-[11px] text-neutral-400 hover:text-[#ff7a1a] transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto scrollbar-none">
              {searchHistory.slice(0, 6).map((item, idx) => (
                <div
                  key={`dropdown-${item.query}-${idx}`}
                  onMouseDown={() => handleSelectHistoryQuery(item.query)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#ff6600]/10 hover:border hover:border-[#ff6600]/25 transition-all cursor-pointer group text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Clock className="w-4 h-4 text-neutral-500 group-hover:text-[#ff6600] shrink-0 transition-colors" />
                    <span className="text-neutral-200 group-hover:text-white font-medium truncate">
                      {item.query}
                    </span>
                    {item.category && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-neutral-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        removeHistoryItem(item.query, e);
                      }}
                      className="text-neutral-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Predictive Category Filter Tabs (When typing/query is present) */}
      {query.trim() && (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            id="filter-category-all"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.45)]'
                : 'bg-[#141418] text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <span>All Categories</span>
            {totalResultsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400'
              }`}>
                {totalResultsCount}
              </span>
            )}
          </button>

          <button
            id="filter-category-songs"
            onClick={() => setActiveCategory('songs')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'songs'
                ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.45)]'
                : 'bg-[#141418] text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Songs</span>
            {songs.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'songs' ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400'
              }`}>
                {songs.length}
              </span>
            )}
          </button>

          <button
            id="filter-category-artists"
            onClick={() => setActiveCategory('artists')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'artists'
                ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.45)]'
                : 'bg-[#141418] text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Artists</span>
            {artists.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'artists' ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400'
              }`}>
                {artists.length}
              </span>
            )}
          </button>

          <button
            id="filter-category-albums"
            onClick={() => setActiveCategory('albums')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'albums'
                ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.45)]'
                : 'bg-[#141418] text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Albums</span>
            {albums.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeCategory === 'albums' ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400'
              }`}>
                {albums.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Main Results Display */}
      {query.trim() ? (
        <div>
          {/* Top Result + Top Songs Layout (Shown in 'all' view) */}
          {activeCategory === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
              {/* Top Result Spotlight Card */}
              {topResult && (
                <div 
                  id="predictive-top-result"
                  className="lg:col-span-5 bg-[#121216]/90 border border-[#ff6600]/30 hover:border-[#ff6600]/60 rounded-2xl p-6 relative group transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.6)] cursor-pointer overflow-hidden"
                  onClick={handlePlayTopResult}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#ff6600] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Top Result
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-white/5 text-neutral-300 border border-white/10">
                      {topResult.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-5 mb-5">
                    {/* Media Artwork with dynamic shape */}
                    <div className={`relative shrink-0 overflow-hidden shadow-2xl bg-[#16161a] border border-[#ff6600]/25 ${
                      topResult.type === 'artist' 
                        ? 'w-24 h-24 rounded-full' 
                        : 'w-24 h-24 rounded-xl'
                    }`}>
                      <img 
                        src={
                          topResult.type === 'artist' 
                            ? (topResult.data as ArtistResult).imageUrl 
                            : topResult.type === 'album'
                            ? (topResult.data as AlbumResult).coverUrl
                            : (topResult.data as Song).coverUrl
                        } 
                        alt="Top Match" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl font-black text-white truncate group-hover:text-[#ff7a1a] transition-colors">
                        {topResult.type === 'artist' 
                          ? (topResult.data as ArtistResult).name 
                          : topResult.type === 'album'
                          ? (topResult.data as AlbumResult).title
                          : (topResult.data as Song).title}
                      </h3>
                      <p className="text-neutral-400 text-sm truncate mt-1">
                        {topResult.type === 'artist' 
                          ? `${(topResult.data as ArtistResult).monthlyListeners || 'Verified'} • ${(topResult.data as ArtistResult).genre || 'Artist'}`
                          : topResult.type === 'album'
                          ? `Album • ${(topResult.data as AlbumResult).artist} • ${(topResult.data as AlbumResult).year || 2024}`
                          : `Song • ${(topResult.data as Song).artist}`}
                      </p>
                    </div>
                  </div>

                  {/* Play Action Row */}
                  <div className="flex items-center justify-end pt-3 border-t border-white/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTopResult();
                      }}
                      className="w-11 h-11 rounded-full bg-[#ff6600] hover:bg-[#ff7a1a] text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,102,0,0.6)] transform group-hover:scale-105 transition-all"
                      title="Play"
                    >
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Top Songs Quick List (Next to Top Result) */}
              <div className={topResult ? "lg:col-span-7" : "lg:col-span-12"}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#ff6600]" />
                    Songs
                  </h4>
                  {songs.length > 4 && (
                    <button 
                      onClick={() => setActiveCategory('songs')}
                      className="text-xs font-semibold text-[#ff6600] hover:text-[#ff9e59] flex items-center gap-0.5"
                    >
                      See all {songs.length}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  {songs.slice(0, 4).map((song, sIdx) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isCurrentlyPlaying = isCurrent && isPlaying;

                    return (
                      <div
                        key={`top-song-${song.id}-${sIdx}`}
                        onClick={() => {
                          saveQueryToHistory(query);
                          if (isCurrent) {
                            togglePlay();
                          } else {
                            playPlaylist(songs, sIdx);
                          }
                        }}
                        className={`flex items-center gap-3.5 p-2 rounded-xl group cursor-pointer transition-all ${
                          isCurrent 
                            ? 'bg-[#ff6600]/15 border border-[#ff6600]/40' 
                            : 'bg-[#121216]/60 hover:bg-[#16161c] border border-transparent hover:border-white/5'
                        }`}
                      >
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#16161a]">
                          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                            isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            {isCurrentlyPlaying ? (
                              <Volume2 className="w-5 h-5 text-[#ff6600] animate-pulse" />
                            ) : (
                              <Play className="w-5 h-5 fill-[#ff6600] text-[#ff6600] ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-[#ff7a1a]' : 'text-white group-hover:text-[#ff7a1a]'
                          }`}>
                            {song.title}
                          </span>
                          <span className="text-xs text-neutral-400 truncate">
                            {song.artist}
                          </span>
                        </div>

                        {(song as any).badge && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/25">
                            {(song as any).badge}
                          </span>
                        )}

                        <span className="text-xs text-neutral-500 font-mono hidden md:inline-block">
                          {formatDuration((song as any).duration)}
                        </span>

                        <button
                          onClick={(e) => handleAddToQueue(song, e)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Add to queue"
                        >
                          {addedQueueId === song.id ? (
                            <Check className="w-4 h-4 text-[#ff6600]" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Artists Category Section */}
          {(activeCategory === 'all' || activeCategory === 'artists') && artists.length > 0 && (
            <div id="predictive-artists-section" className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-[#ff6600]" />
                  Artists
                  <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {artists.length}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artists.map((artist, aIdx) => (
                  <div
                    key={`artist-${artist.id}-${aIdx}`}
                    id={`artist-card-${artist.id}`}
                    onClick={() => handleSelectArtist(artist)}
                    className="p-4 rounded-2xl bg-[#121216]/80 hover:bg-[#18181f] border border-white/5 hover:border-[#ff6600]/40 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center shadow-lg"
                  >
                    <div className="relative w-28 h-28 rounded-full overflow-hidden mb-3.5 border-2 border-transparent group-hover:border-[#ff6600] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                      <img 
                        src={artist.imageUrl} 
                        alt={artist.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-[#ff6600] flex items-center justify-center shadow-[0_0_12px_#ff6600]">
                          <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-white group-hover:text-[#ff7a1a] transition-colors truncate w-full flex items-center justify-center gap-1">
                      {artist.name}
                      {artist.verified && (
                        <Check className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />
                      )}
                    </h4>

                    <span className="text-[11px] text-neutral-400 mt-1 uppercase tracking-wider font-mono">
                      Artist
                    </span>

                    {artist.monthlyListeners && (
                      <span className="text-[11px] text-neutral-500 truncate w-full mt-0.5">
                        {artist.monthlyListeners}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Category Section */}
          {(activeCategory === 'all' || activeCategory === 'albums') && albums.length > 0 && (
            <div id="predictive-albums-section" className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Disc className="w-5 h-5 text-[#ff6600]" />
                  Albums
                  <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {albums.length}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albums.map((album, abIdx) => (
                  <div
                    key={`album-${album.id}-${abIdx}`}
                    id={`album-card-${album.id}`}
                    onClick={(e) => handlePlayAlbum(album, e)}
                    className="p-3.5 rounded-2xl bg-[#121216]/80 hover:bg-[#18181f] border border-white/5 hover:border-[#ff6600]/40 transition-all duration-300 cursor-pointer group flex flex-col shadow-lg"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-[#16161a] shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                      <img 
                        src={album.coverUrl} 
                        alt={album.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />

                      {/* Vinyl Record overlay accent */}
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full border border-white/30 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Disc className="w-4 h-4 text-white/70 animate-spin-slow" />
                      </div>

                      {/* Floating Play Button */}
                      <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#ff6600] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-[0_0_12px_#ff6600]">
                        <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-white group-hover:text-[#ff7a1a] transition-colors truncate mb-0.5">
                      {album.title}
                    </h4>

                    <p className="text-xs text-neutral-400 truncate">
                      {album.artist}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-neutral-500 font-mono">
                      <span>{album.year || 2024}</span>
                      <span>•</span>
                      <span>{album.trackCount || 8} tracks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dedicated Songs List (Shown if 'songs' category selected or all) */}
          {(activeCategory === 'songs' || (activeCategory === 'all' && songs.length > 4)) && (
            <div id="predictive-songs-section" className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-[#ff6600]" />
                  {activeCategory === 'songs' ? 'All Songs' : 'More Songs'}
                  <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {songs.length}
                  </span>
                </h3>
              </div>

              <div className="flex flex-col gap-1.5">
                {(activeCategory === 'songs' ? songs : songs.slice(4)).map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentlyPlaying = isCurrent && isPlaying;
                  const actualIdx = activeCategory === 'songs' ? index : index + 4;

                  return (
                    <div
                      key={`song-item-${song.id}-${index}`}
                      id={`song-item-${song.id}`}
                      onClick={() => {
                        saveQueryToHistory(query);
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playPlaylist(songs, actualIdx);
                        }
                      }}
                      className={`flex items-center gap-4 p-2.5 rounded-xl group cursor-pointer transition-all ${
                        isCurrent 
                          ? 'bg-[#ff6600]/15 border border-[#ff6600]/40 shadow-[0_0_15px_rgba(255,102,0,0.15)]' 
                          : 'bg-[#121216]/60 hover:bg-[#16161c] border border-transparent hover:border-white/5'
                      }`}
                    >
                      {/* Track index / Play Indicator */}
                      <span className="w-6 text-center text-xs font-mono text-neutral-500 group-hover:text-white">
                        {isCurrentlyPlaying ? (
                          <Volume2 className="w-4 h-4 text-[#ff6600] animate-pulse inline" />
                        ) : (
                          index + 1
                        )}
                      </span>

                      {/* Cover Art */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#16161a] shadow-sm">
                        <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {isCurrentlyPlaying ? (
                            <Pause className="w-5 h-5 fill-[#ff6600] text-[#ff6600]" />
                          ) : (
                            <Play className="w-5 h-5 fill-[#ff6600] text-[#ff6600] ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Song Title & Artist */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-[#ff7a1a]' : 'text-white group-hover:text-[#ff7a1a]'
                        }`}>
                          {song.title}
                        </span>
                        <span className="text-xs text-neutral-400 truncate">
                          {song.artist}
                        </span>
                      </div>

                      {/* Album */}
                      {(song as any).album && (
                        <span className="text-xs text-neutral-400 truncate max-w-[180px] hidden md:inline-block">
                          {(song as any).album}
                        </span>
                      )}

                      {/* Format Badge */}
                      {(song as any).badge && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/25">
                          {(song as any).badge}
                        </span>
                      )}

                      {/* Duration */}
                      <span className="text-xs text-neutral-500 font-mono hidden sm:inline-block">
                        {formatDuration((song as any).duration)}
                      </span>

                      {/* Add to Playlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSongToAddToPlaylist(song);
                        }}
                        className="p-2 text-neutral-400 hover:text-[#ff7a1a] rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Add to playlist"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>

                      {/* Add to Queue Button */}
                      <button
                        onClick={(e) => handleAddToQueue(song, e)}
                        className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Add to queue"
                      >
                        {addedQueueId === song.id ? (
                          <Check className="w-4 h-4 text-[#ff6600]" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Results State */}
          {totalResultsCount === 0 && !loading && (
            <div className="py-16 text-center text-neutral-400 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-neutral-500">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No matches found for &ldquo;{query}&rdquo;
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
                Try searching for a different artist, album name, or browse our trending categories below.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TRENDING_SEARCHES.slice(0, 4).map((trend) => (
                  <button
                    key={trend}
                    onClick={() => setQuery(trend)}
                    className="px-3 py-1 rounded-full text-xs bg-[#ff6600]/10 text-[#ff7a1a] border border-[#ff6600]/30 hover:bg-[#ff6600]/20 transition-all"
                  >
                    {trend}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Recent Searches Section (Prominently placed at the top if user has history) */}
          {searchHistory.length > 0 && (
            <div id="recent-searches-discovery" className="mb-10 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#ff6600]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                      Recent Searches
                      <span className="text-[11px] font-mono font-medium text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {searchHistory.length} {searchHistory.length === 1 ? 'path' : 'paths'}
                      </span>
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={clearAllHistory}
                  className="text-xs font-semibold text-neutral-400 hover:text-[#ff7a1a] transition-colors flex items-center gap-1.5 hover:underline cursor-pointer"
                  title="Clear all recent searches"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </button>
              </div>

              {/* Discovery Path Cards (Top 3 recent) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3.5">
                {searchHistory.slice(0, 3).map((item) => (
                  <div
                    key={`card-${item.query}`}
                    onClick={() => handleSelectHistoryQuery(item.query)}
                    className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-[#121216]/90 hover:bg-[#181822] border border-[#ff6600]/15 hover:border-[#ff6600]/50 hover:shadow-[0_4px_20px_rgba(255,102,0,0.15)] transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#1a1a24] group-hover:bg-[#ff6600]/20 flex items-center justify-center shrink-0 transition-colors border border-white/5 group-hover:border-[#ff6600]/30">
                        <Search className="w-4 h-4 text-neutral-400 group-hover:text-[#ff6600] transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-white group-hover:text-[#ff7a1a] transition-colors truncate">
                          {item.query}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-neutral-500">
                            {formatTimeAgo(item.timestamp)}
                          </span>
                          {item.category && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-neutral-400 border border-white/10">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistoryItem(item.query, e);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title={`Remove "${item.query}" from history`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* All History Pills Cloud */}
              <div className="flex flex-wrap gap-2 pt-1">
                {searchHistory.map((item) => (
                  <div 
                    key={`pill-${item.query}`}
                    onClick={() => handleSelectHistoryQuery(item.query)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141418] hover:bg-[#1a1a24] text-xs font-medium text-neutral-300 hover:text-white cursor-pointer transition-all border border-white/5 hover:border-[#ff6600]/40 group select-none shadow-sm"
                  >
                    <Clock className="w-3 h-3 text-neutral-500 group-hover:text-[#ff6600] transition-colors" />
                    <span>{item.query}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHistoryItem(item.query, e);
                      }}
                      className="text-neutral-500 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors ml-0.5"
                      title={`Remove "${item.query}" from history`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches Row */}
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
              Trending on Decibel
            </h4>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSelectHistoryQuery(term)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#141418] hover:bg-[#1c1c24] text-neutral-300 hover:text-[#ff7a1a] border border-white/5 hover:border-[#ff6600]/30 transition-all cursor-pointer"
                >
                  <ArrowUpRight className="w-3 h-3 text-[#ff6600]" />
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Jump Back In (Cached Tracks) */}
          {recentlyPlayed.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2 text-white">
                  <Zap className="w-4 h-4 text-[#ff6600]" />
                  Jump Back In
                </h3>
                <span className="text-xs font-mono text-neutral-400">
                  {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'track' : 'tracks'} cached
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {recentlyPlayed.slice(0, 6).map((song, srIdx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentlyPlaying = isCurrent && isPlaying;

                  return (
                    <div
                      key={`search-recent-${song.id}-${srIdx}`}
                      onClick={() => playSong(song)}
                      className="group p-2.5 rounded-xl bg-[#121216]/80 hover:bg-[#16161d] transition-all cursor-pointer border border-white/5 hover:border-[#ff6600]/30 flex flex-col shadow-sm card-hover"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-neutral-900">
                        <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {isCurrentlyPlaying ? (
                            <Volume2 className="w-6 h-6 text-[#ff6600] animate-pulse" />
                          ) : (
                            <Play className="w-6 h-6 fill-[#ff6600] text-[#ff6600] ml-0.5" />
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold truncate ${
                        isCurrent ? 'text-[#ff7a1a]' : 'text-white group-hover:text-[#ff7a1a]'
                      }`}>
                        {song.title}
                      </span>
                      <span className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {song.artist}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Browse Categories */}
          <h3 className="text-xl font-bold mb-5 tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#ff6600]" />
            Browse Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BROWSE_CATEGORIES.map((category) => (
              <div 
                key={category.id} 
                onClick={() => handleSelectHistoryQuery(category.query)}
                className={`rounded-xl p-5 aspect-[16/10] relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg border border-[#ff6600]/25 hover:border-[#ff6600] hover:shadow-[0_0_20px_rgba(255,102,0,0.3)] group bg-gradient-to-br ${category.color}`}
              >
                <h4 className="font-bold text-lg text-white group-hover:text-[#ff7a1a] transition-colors relative z-10">
                  {category.name}
                </h4>
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-[#ff6600]/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Global Add to Playlist Modal */}
      <AddToPlaylistModal
        song={songToAddToPlaylist}
        isOpen={Boolean(songToAddToPlaylist)}
        onClose={() => setSongToAddToPlaylist(null)}
      />
    </div>
  );
}
