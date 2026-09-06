import { useState, useMemo } from 'react';
import { 
  Plus, List, Play, Pause, Heart, ArrowLeft, Search, 
  Shuffle, Clock, Music, Trash2, Volume2, Edit3, Check, ListPlus 
} from 'lucide-react';
import { usePlayer, Song, Playlist } from '../store/playerStore';
import { useUser } from '../store/userStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

export default function LibraryScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'library';
  const selectedPlaylistId = searchParams.get('playlistId');
  const { username } = useUser();
  
  const { 
    likedSongs, 
    clearLikedSongs,
    recentlyPlayed,
    clearRecentlyPlayed,
    removeRecentlyPlayed,
    userPlaylists = [],
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    currentSong, 
    isPlaying, 
    playSong,
    togglePlay, 
    playPlaylist, 
    addToQueue, 
    toggleLike,
    isLiked 
  } = usePlayer();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist'>('recent');
  const [filterType, setFilterType] = useState<'all' | 'playlists' | 'recents' | 'artists'>(
    activeView === 'playlists' ? 'playlists' : 'all'
  );

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);

  // Edit Playlist Name State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const selectedPlaylist = useMemo(() => {
    if (!selectedPlaylistId) return null;
    return userPlaylists.find(p => p.id === selectedPlaylistId) || null;
  }, [selectedPlaylistId, userPlaylists]);

  const filteredLikedSongs = useMemo(() => {
    let result = [...likedSongs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'artist') {
      result.sort((a, b) => a.artist.localeCompare(b.artist));
    }
    return result;
  }, [likedSongs, searchQuery, sortBy]);

  const filteredRecentSongs = useMemo(() => {
    let result = [...recentlyPlayed];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'artist') {
      result.sort((a, b) => a.artist.localeCompare(b.artist));
    }
    return result;
  }, [recentlyPlayed, searchQuery, sortBy]);

  const isLikedPlaying = useMemo(() => {
    if (!isPlaying || !currentSong) return false;
    return likedSongs.some((s) => s.id === currentSong.id);
  }, [isPlaying, currentSong, likedSongs]);

  const isRecentPlaying = useMemo(() => {
    if (!isPlaying || !currentSong) return false;
    return recentlyPlayed.some((s) => s.id === currentSong.id);
  }, [isPlaying, currentSong, recentlyPlayed]);

  const handlePlayLikedAll = () => {
    if (likedSongs.length === 0) return;
    if (isLikedPlaying) {
      togglePlay();
    } else {
      playPlaylist(filteredLikedSongs.length > 0 ? filteredLikedSongs : likedSongs, 0);
    }
  };

  const handleShuffleLikedAll = () => {
    if (likedSongs.length === 0) return;
    const shuffled = [...likedSongs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    playPlaylist(shuffled, 0);
  };

  const handlePlayRecentAll = () => {
    if (recentlyPlayed.length === 0) return;
    if (isRecentPlaying) {
      togglePlay();
    } else {
      playPlaylist(filteredRecentSongs.length > 0 ? filteredRecentSongs : recentlyPlayed, 0);
    }
  };

  const handleShuffleRecentAll = () => {
    if (recentlyPlayed.length === 0) return;
    const shuffled = [...recentlyPlayed];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    playPlaylist(shuffled, 0);
  };

  // Render Dedicated Liked Songs Playlist View
  if (activeView === 'liked') {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
        {/* Back Navigation Button */}
        <button
          id="back-to-library-btn"
          onClick={() => setSearchParams({})}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Library
        </button>

        {/* Dedicated Playlist Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 bg-gradient-to-b from-primary/15 to-transparent p-6 rounded-2xl border border-white/5">
          {/* Liked Songs Artwork Badge */}
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 flex items-center justify-center shadow-2xl shrink-0 relative group">
            <Heart className="w-20 h-20 text-white fill-white drop-shadow-md" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">Favorites</span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-400 mb-1">
              Public Playlist
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
              Liked Songs
            </h1>
            <p className="text-neutral-400 text-sm mb-2">
              All your favorite tracks saved in one place for instant streaming.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium">
              <span className="text-white font-semibold">{username}</span>
              <span>•</span>
              <span className="text-primary font-semibold">{likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              id="liked-play-all-btn"
              disabled={likedSongs.length === 0}
              onClick={handlePlayLikedAll}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                likedSongs.length === 0
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-primary hover:bg-[#1ed760] text-black hover:scale-105 active:scale-95'
              }`}
              title={isLikedPlaying ? 'Pause' : 'Play all liked songs'}
            >
              {isLikedPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            <button
              id="liked-shuffle-btn"
              disabled={likedSongs.length === 0}
              onClick={handleShuffleLikedAll}
              className={`p-3 rounded-full border border-white/10 transition-colors ${
                likedSongs.length === 0
                  ? 'text-neutral-600 cursor-not-allowed'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
              title="Shuffle liked songs"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {likedSongs.length > 0 && (
              <button
                id="liked-clear-all-btn"
                onClick={clearLikedSongs}
                className="p-3 rounded-full border border-white/10 text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                title="Clear all liked songs"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search filter in liked songs */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in Liked Songs"
                className="w-full bg-neutral-900 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-900 border border-white/10 text-neutral-300 text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="artist">Artist (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Songs List */}
        {likedSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-2xl bg-surface/30">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-neutral-400">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Songs you like will appear here</h3>
            <p className="text-neutral-400 text-sm max-w-sm mb-6">
              Save songs by tapping the heart icon on the player screen or miniplayer while listening.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform"
            >
              Discover Music
            </button>
          </div>
        ) : filteredLikedSongs.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            No liked songs matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <div className="space-y-1">
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 border-b border-white/10 uppercase tracking-wider">
              <div className="w-8 text-center">#</div>
              <div>Title</div>
              <div className="hidden sm:block">Artist</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Song rows */}
            {filteredLikedSongs.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              const isCurrentlyPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={song.id}
                  onClick={() => playPlaylist(filteredLikedSongs, index)}
                  className={`group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${
                    isCurrent ? 'bg-white/5' : ''
                  }`}
                >
                  {/* Track Index or Play Icon */}
                  <div className="w-8 text-center text-sm font-medium text-neutral-400 flex items-center justify-center">
                    <span className="group-hover:hidden">
                      {isCurrentlyPlaying ? (
                        <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <button className="hidden group-hover:block text-white">
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Song Title & Thumbnail */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded object-cover shadow-sm shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-primary' : 'text-white'
                      }`}>
                        {song.title}
                      </span>
                      <span className="text-xs text-neutral-400 truncate sm:hidden">
                        {song.artist}
                      </span>
                    </div>
                  </div>

                  {/* Artist (Desktop) */}
                  <div className="hidden sm:block text-sm text-neutral-300 truncate">
                    {song.artist}
                  </div>

                  {/* Actions: Unlike, Add to Queue */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      id={`unlike-btn-${song.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className="p-2 text-primary hover:text-red-400 transition-colors"
                      title="Remove from Liked Songs"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      id={`queue-btn-${song.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(song);
                      }}
                      className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render Dedicated Recently Played View
  if (activeView === 'recents') {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
        {/* Back Navigation Button */}
        <button
          id="back-to-library-from-recents-btn"
          onClick={() => setSearchParams({})}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Library
        </button>

        {/* Dedicated Playlist Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent p-6 rounded-2xl border border-white/5">
          {/* Recently Played Artwork Badge */}
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 flex items-center justify-center shadow-2xl shrink-0 relative group">
            <Clock className="w-20 h-20 text-white drop-shadow-md" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">Local Cache</span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-400 mb-1">
              Local Cache
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
              Recently Played
            </h1>
            <p className="text-neutral-400 text-sm mb-2 max-w-xl">
              Previously heard content cached locally in browser storage for instantaneous load and fast playback.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium">
              <span className="text-white font-semibold">{username}</span>
              <span>•</span>
              <span className="text-primary font-semibold">{recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'track' : 'tracks'} cached</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              id="recents-play-all-btn"
              disabled={recentlyPlayed.length === 0}
              onClick={handlePlayRecentAll}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl disabled:opacity-50 disabled:hover:scale-100"
              title={isRecentPlaying ? 'Pause' : 'Play all recent tracks'}
            >
              {isRecentPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            <button
              id="recents-shuffle-btn"
              disabled={recentlyPlayed.length === 0}
              onClick={handleShuffleRecentAll}
              className="p-3 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
              title="Shuffle recent tracks"
            >
              <Shuffle className="w-6 h-6" />
            </button>

            {recentlyPlayed.length > 0 && (
              <button
                id="recents-clear-all-btn"
                onClick={clearRecentlyPlayed}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/30 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors"
                title="Clear recently played cache"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cache
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Filter inside Recents */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in recent tracks..."
                className="w-full bg-surface-hover/80 text-sm text-white pl-9 pr-4 py-2 rounded-full border border-white/10 focus:outline-none focus:border-primary transition-colors placeholder:text-neutral-500"
              />
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface-hover/80 text-xs text-neutral-300 px-3 py-2 rounded-full border border-white/10 focus:outline-none cursor-pointer"
            >
              <option value="recent">Recents First</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
            </select>
          </div>
        </div>

        {/* Songs List */}
        {filteredRecentSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-2xl">
            <Clock className="w-12 h-12 text-neutral-600 mb-3" />
            <p className="text-lg font-semibold text-neutral-300 mb-1">
              {searchQuery ? 'No matching recent tracks' : 'No recently played tracks yet'}
            </p>
            <p className="text-sm text-neutral-500 max-w-sm">
              {searchQuery 
                ? 'Try a different search keyword.' 
                : 'As you listen to songs, they are automatically cached here for fast re-listening.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* List Header */}
            <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] items-center px-4 py-2 text-xs font-semibold text-neutral-400 border-b border-white/10 mb-2">
              <span className="w-8 text-center">#</span>
              <span>Title</span>
              <span className="hidden sm:block">Artist</span>
              <span className="w-20 text-right">Actions</span>
            </div>

            {/* Song Rows */}
            {filteredRecentSongs.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              const isCurrentlyPlaying = isCurrent && isPlaying;
              const liked = isLiked(song.id);

              return (
                <div
                  key={`${song.id}-${index}`}
                  id={`recent-row-${song.id}`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playSong(song);
                    }
                  }}
                  className={`group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] items-center px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    isCurrent 
                      ? 'bg-white/10 hover:bg-white/15' 
                      : 'hover:bg-surface-hover'
                  }`}
                >
                  {/* Track Number / Play Indicator */}
                  <div className="w-8 text-center text-sm text-neutral-400 font-medium mr-2">
                    <span className="group-hover:hidden">
                      {isCurrentlyPlaying ? (
                        <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <button className="hidden group-hover:block text-white">
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Song Title & Thumbnail */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded object-cover shadow-sm shrink-0"
                      loading="lazy"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-primary' : 'text-white'
                      }`}>
                        {song.title}
                      </span>
                      <span className="text-xs text-neutral-400 truncate sm:hidden">
                        {song.artist}
                      </span>
                    </div>
                  </div>

                  {/* Artist (Desktop) */}
                  <div className="hidden sm:block text-sm text-neutral-300 truncate">
                    {song.artist}
                  </div>

                  {/* Actions: Like, Add to Queue, Remove from Recents */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      id={`recents-like-btn-${song.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className={`p-2 transition-colors ${
                        liked ? 'text-primary' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      id={`recents-queue-btn-${song.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(song);
                      }}
                      className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      id={`recents-remove-btn-${song.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentlyPlayed(song.id);
                      }}
                      className="p-2 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove from recently played"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render Selected Custom Playlist View
  if (selectedPlaylist) {
    const isPlaylistPlaying = isPlaying && currentSong && selectedPlaylist.songs.some(s => s.id === currentSong.id);

    const handlePlayAllCustom = () => {
      if (selectedPlaylist.songs.length === 0) return;
      if (isPlaylistPlaying) {
        togglePlay();
      } else {
        playPlaylist(selectedPlaylist.songs, 0);
      }
    };

    const handleShuffleCustom = () => {
      if (selectedPlaylist.songs.length === 0) return;
      const shuffled = [...selectedPlaylist.songs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      playPlaylist(shuffled, 0);
    };

    const handleSaveTitle = () => {
      if (editedTitle.trim()) {
        renamePlaylist(selectedPlaylist.id, editedTitle.trim());
      }
      setIsEditingTitle(false);
    };

    const handleDelete = () => {
      if (window.confirm(`Are you sure you want to delete the playlist "${selectedPlaylist.name}"?`)) {
        deletePlaylist(selectedPlaylist.id);
        setSearchParams({});
      }
    };

    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32 animate-fade-in select-none">
        {/* Back Button */}
        <button
          onClick={() => setSearchParams({ view: 'playlists' })}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Library
        </button>

        {/* Playlist Banner Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-r from-[#241308] via-[#120d0a] to-[#0a0a0c] border border-[#ff6600]/20 shadow-xl">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl bg-black/60 flex items-center justify-center shrink-0 border border-white/10 shadow-2xl overflow-hidden">
            {selectedPlaylist.coverUrl || selectedPlaylist.songs[0]?.coverUrl ? (
              <img 
                src={selectedPlaylist.coverUrl || selectedPlaylist.songs[0]?.coverUrl} 
                alt={selectedPlaylist.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <Music className="w-16 h-16 text-[#ff6600]" />
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff6600] mb-1">
              User Playlist
            </span>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 my-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="px-3 py-1 rounded-lg bg-black/60 border border-[#ff6600] text-xl font-bold text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2 rounded-lg bg-[#ff6600] text-black hover:bg-[#ff7a1a] transition-colors"
                  title="Save"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight truncate">
                  {selectedPlaylist.name}
                </h1>
                <button
                  onClick={() => {
                    setEditedTitle(selectedPlaylist.name);
                    setIsEditingTitle(true);
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Rename Playlist"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-sm text-neutral-400 mt-1">
              Created by {username} • {selectedPlaylist.songs.length} {selectedPlaylist.songs.length === 1 ? 'song' : 'songs'}
            </p>

            {/* Controls Header */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handlePlayAllCustom}
                disabled={selectedPlaylist.songs.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff6600] hover:bg-[#ff7a1a] text-black font-bold text-sm shadow-lg shadow-[#ff6600]/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                {isPlaylistPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    Play All
                  </>
                )}
              </button>

              <button
                onClick={handleShuffleCustom}
                disabled={selectedPlaylist.songs.length === 0}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                title="Shuffle Playlist"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={handleDelete}
                className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all ml-auto"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4 text-white">Tracks</h3>
          {selectedPlaylist.songs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5">
              <Music className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
              <p className="text-white font-semibold">This playlist is currently empty.</p>
              <p className="text-sm text-neutral-400 mt-1">Add tracks from below or search for new songs to add!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedPlaylist.songs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                const isCurrentlyPlaying = isCurrent && isPlaying;
                const liked = isLiked(song.id);

                return (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => {
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playSong(song);
                      }
                    }}
                    className={`group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] items-center px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isCurrent ? 'bg-white/10 border border-[#ff6600]/30' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Index / Volume Icon */}
                    <div className="w-8 text-center text-sm text-neutral-400 font-medium mr-2">
                      <span className="group-hover:hidden">
                        {isCurrentlyPlaying ? (
                          <Volume2 className="w-4 h-4 text-[#ff6600] animate-pulse" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <button className="hidden group-hover:block text-white">
                        {isCurrentlyPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Song Cover & Meta */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover shrink-0 shadow-sm"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-[#ff6600]' : 'text-white'
                        }`}>
                          {song.title}
                        </span>
                        <span className="text-xs text-neutral-400 truncate sm:hidden">
                          {song.artist}
                        </span>
                      </div>
                    </div>

                    {/* Artist */}
                    <div className="hidden sm:block text-sm text-neutral-300 truncate">
                      {song.artist}
                    </div>

                    {/* Track Actions */}
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        className={`p-2 transition-colors ${
                          liked ? 'text-[#ff6600]' : 'text-neutral-400 hover:text-white'
                        }`}
                        title={liked ? 'Unlike' : 'Like'}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(song);
                        }}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Add to queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSongFromPlaylist(selectedPlaylist.id, song.id);
                        }}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suggested Quick Add Songs */}
        <div className="pt-6 border-t border-white/10">
          <h3 className="text-[#ff6600] font-bold text-sm uppercase tracking-wider mb-3">
            Suggested Songs to Add
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...likedSongs, ...recentlyPlayed]
              .filter((song, idx, arr) => 
                !selectedPlaylist.songs.some(s => s.id === song.id) &&
                arr.findIndex(t => t.id === song.id) === idx
              )
              .slice(0, 6)
              .map((song) => (
                <div
                  key={`suggested-${song.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={song.coverUrl} alt={song.title} className="w-10 h-10 rounded object-cover shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate">{song.title}</span>
                      <span className="text-xs text-neutral-400 truncate">{song.artist}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addSongToPlaylist(selectedPlaylist.id, song)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff6600]/20 hover:bg-[#ff6600] text-[#ff7a1a] hover:text-black font-semibold text-xs transition-all border border-[#ff6600]/30 shrink-0 ml-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Render General Library Screen Overview
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32 select-none">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">Your Library</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#ff6600] hover:bg-[#ff7a1a] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
            title="Create playlist"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Playlist
          </button>
          <button 
            id="library-recents-header-btn"
            onClick={() => setSearchParams({ view: 'recents' })}
            className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            title="View Recently Played"
          >
            Recents
            <Clock className="w-4 h-4 text-[#ff6600]" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => setFilterType('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === 'all' ? 'bg-[#ff6600] text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setFilterType('playlists')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === 'playlists' ? 'bg-[#ff6600] text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Playlists
        </button>
        <button 
          id="library-filter-recents-tab"
          onClick={() => setFilterType('recents')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === 'recents' ? 'bg-[#ff6600] text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Recents
        </button>
        <button 
          onClick={() => setFilterType('artists')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === 'artists' ? 'bg-[#ff6600] text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Artists
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Dedicated Liked Songs Playlist Row/Card */}
        {(filterType === 'all' || filterType === 'playlists') && (
          <div
            id="library-liked-songs-card"
            onClick={() => setSearchParams({ view: 'liked' })}
            className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#ff6600]/30 transition-all cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                <Heart className="w-8 h-8 text-white fill-white" />
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayLikedAll();
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  title="Play liked songs"
                >
                  {isLikedPlaying ? (
                    <Pause className="w-6 h-6 fill-white text-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                  )}
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base truncate">Liked Songs</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30">
                    Featured
                  </span>
                </div>
                <span className="text-sm text-neutral-400 font-medium">
                  Playlist • {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayLikedAll();
                }}
                className="w-10 h-10 rounded-full bg-[#ff6600] flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-md mr-2"
                title="Play playlist"
              >
                {isLikedPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Recently Played Playlist Row/Card */}
        {(filterType === 'all' || filterType === 'recents') && (
          <div
            id="library-recents-card"
            onClick={() => setSearchParams({ view: 'recents' })}
            className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                <Clock className="w-8 h-8 text-white" />
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayRecentAll();
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  title="Play recent tracks"
                >
                  {isRecentPlaying ? (
                    <Pause className="w-6 h-6 fill-white text-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                  )}
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base truncate">Recently Played</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Cached
                  </span>
                </div>
                <span className="text-sm text-neutral-400 font-medium">
                  Local Cache • {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'song' : 'songs'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayRecentAll();
                }}
                className="w-10 h-10 rounded-full bg-[#ff6600] flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-md mr-2"
                title="Play recently played tracks"
              >
                {isRecentPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Custom User Playlists */}
        {(filterType === 'all' || filterType === 'playlists') && userPlaylists.map((playlist) => {
          const isPlPlaying = isPlaying && currentSong && playlist.songs.some(s => s.id === currentSong.id);

          return (
            <div 
              key={playlist.id} 
              className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#ff6600]/30 transition-all cursor-pointer"
              onClick={() => setSearchParams({ playlistId: playlist.id })}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-16 h-16 rounded-lg bg-black/40 border border-white/10 overflow-hidden shadow-md shrink-0 flex items-center justify-center">
                  {playlist.coverUrl || playlist.songs[0]?.coverUrl ? (
                    <img 
                      src={playlist.coverUrl || playlist.songs[0]?.coverUrl} 
                      alt={playlist.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Music className="w-7 h-7 text-[#ff6600]" />
                  )}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (playlist.songs.length > 0) {
                        playPlaylist(playlist.songs, 0);
                      }
                    }}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    {isPlPlaying ? (
                      <Pause className="w-6 h-6 fill-white text-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-white truncate text-base">{playlist.name}</span>
                  <span className="text-sm text-neutral-400 font-medium">
                    Playlist • {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (playlist.songs.length > 0) {
                      playPlaylist(playlist.songs, 0);
                    }
                  }}
                  disabled={playlist.songs.length === 0}
                  className="w-10 h-10 rounded-full bg-[#ff6600] flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-md disabled:opacity-30"
                  title="Play playlist"
                >
                  {isPlPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Modal: Create Playlist */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div 
            className="relative w-full max-w-sm bg-[#121216] border border-[#ff6600]/30 rounded-2xl shadow-2xl p-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Create New Playlist</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newPlaylistTitle.trim()) {
                const created = createPlaylist(newPlaylistTitle.trim());
                setNewPlaylistTitle('');
                setIsCreateModalOpen(false);
                setSearchParams({ playlistId: created.id });
              }
            }}>
              <input
                type="text"
                autoFocus
                placeholder="Playlist name..."
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[#ff6600]/40 text-sm font-medium text-white focus:outline-none focus:border-[#ff6600] mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-neutral-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#ff6600] hover:bg-[#ff7a1a] text-black font-bold text-sm transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
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

