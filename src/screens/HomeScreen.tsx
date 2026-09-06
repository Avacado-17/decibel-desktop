import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Heart, ChevronRight, Activity, 
  Volume2, Disc, Compass, Radio 
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { usePlayer, Song } from '../store/playerStore';
import { CURATED_TRACKS } from '../data/curatedTracks';
import { useUser } from '../store/userStore';

interface GenreItem {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  coverUrl: string;
  query: string;
}

interface DiscoverData {
  recents: Song[];
  suggested: Song[];
  genres: GenreItem[];
  playlists: { id: string; name: string; trackCount: number; coverUrl: string }[];
}

const DEFAULT_CURATED_SONGS: Song[] = CURATED_TRACKS;

const DEFAULT_RECENT_SONG: Song = {
  id: 'nightcall-default',
  title: 'Nightcall',
  artist: 'Kavinsky',
  coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=85&w=320',
  audioUrl: '',
};

const DEFAULT_GENRES: GenreItem[] = [
  {
    id: "electronic",
    name: "Electronic",
    color: "from-[#1e110b] to-[#3d1b06]",
    borderColor: "#ff6600",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300",
    query: "electronic synthwave music"
  },
  {
    id: "jazz",
    name: "Jazz",
    color: "from-[#1a0d0a] to-[#4a1209]",
    borderColor: "#ff6600",
    coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=300",
    query: "smooth jazz coffee"
  },
  {
    id: "hip-hop",
    name: "Hip-Hop",
    color: "from-[#13140e] to-[#2f280a]",
    borderColor: "#ff6600",
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=300",
    query: "hip hop instrumental beats"
  },
  {
    id: "classical",
    name: "Classical",
    color: "from-[#161118] to-[#301729]",
    borderColor: "#ff6600",
    coverUrl: "https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&q=80&w=300",
    query: "classical piano masterwork"
  },
  {
    id: "rock",
    name: "Rock",
    color: "from-[#220c04] to-[#541905]",
    borderColor: "#ff6600",
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=300",
    query: "modern rock anthems"
  },
  {
    id: "ambient",
    name: "Ambient",
    color: "from-[#0e1216] to-[#1e2632]",
    borderColor: "#ff6600",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=300",
    query: "ambient deep space soundscape"
  }
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { username } = useUser();
  const { 
    currentSong, 
    isPlaying, 
    playSong, 
    playPlaylist,
    togglePlay, 
    toggleLike, 
    isLiked,
    recentlyPlayed 
  } = usePlayer();

  const [discoverData, setDiscoverData] = useState<DiscoverData | null>(null);

  // Dynamic time-of-day greeting synced to the user's local time
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  // Keep the local time updated in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 30000); // check every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    let baseGreeting = 'Good Morning';
    let isNight = false;

    // 00:00 to 11:59 am (0 - 11) -> Good Morning
    // 12:00 to 2:59 pm (12 - 14) -> Good Afternoon
    // 3:00 to 7:59 pm (15 - 19) -> Good Evening
    // 8:00 to 11:59 pm (20 - 23) -> Silent Night ...?
    if (currentHour >= 0 && currentHour < 12) {
      baseGreeting = 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 15) {
      baseGreeting = 'Good Afternoon';
    } else if (currentHour >= 15 && currentHour < 20) {
      baseGreeting = 'Good Evening';
    } else {
      baseGreeting = 'Silent Night';
      isNight = true;
    }

    const trimmedUsername = username?.trim();
    if (!trimmedUsername) {
      return isNight ? `${baseGreeting}?` : baseGreeting;
    }

    return isNight 
      ? `${baseGreeting} ${trimmedUsername}?` 
      : `${baseGreeting} ${trimmedUsername}`;
  }, [username, currentHour]);

  // Fetch discover feed from API endpoint
  useEffect(() => {
    let mounted = true;
    axios.get('/api/discover')
      .then((res) => {
        if (mounted) {
          setDiscoverData(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load discover data:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Keep the home layout stable even when the API or local history is empty.
  const recentItems = useMemo(() => {
    const apiRecent = discoverData?.recents?.[0];
    return [recentlyPlayed[0] || apiRecent || DEFAULT_RECENT_SONG];
  }, [discoverData, recentlyPlayed]);

  const suggestedTracks = useMemo(() => {
    if (discoverData?.suggested && discoverData.suggested.length > 0) {
      return discoverData.suggested;
    }
    return DEFAULT_CURATED_SONGS;
  }, [discoverData]);

  const genreItems = useMemo(() => {
    if (discoverData?.genres && discoverData.genres.length > 0) {
      return discoverData.genres;
    }
    return DEFAULT_GENRES;
  }, [discoverData]);

  const handleGenreClick = (genre: GenreItem) => {
    navigate(`/search?q=${encodeURIComponent(genre.name)}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 select-none">
      {/* Hero / Greeting Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight">
            {greeting}
          </h2>
        </div>

        {/* Recent Activity Grid */}
        {recentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-[332px]">
            {recentItems.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              const isCurrentlyPlaying = isCurrent && isPlaying;
              const liked = isLiked(song.id);

              return (
                <div
                  key={`recent-${song.id}-${idx}`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playPlaylist(recentItems, idx);
                    }
                  }}
                  className={`glass-panel rounded-lg overflow-hidden flex items-center group cursor-pointer card-hover pr-4 h-16 relative ${
                    isCurrent ? 'active-glow border-[#ff6600]/45' : ''
                  }`}
                >
                  {/* Album Art Container */}
                  <div className="w-16 h-16 shrink-0 relative bg-[#111114]">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                      isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      {isCurrentlyPlaying ? (
                        <Volume2 className="w-6 h-6 text-[#ff6600] drop-shadow-[0_0_8px_#ff6600] animate-pulse" />
                      ) : (
                        <Play className="w-6 h-6 text-[#ff6600] fill-[#ff6600] drop-shadow-[0_0_8px_#ff6600] ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Track Title & Subtitle */}
                  <div className="pl-4 flex-grow truncate">
                    <h3 className={`font-semibold text-[15px] truncate flex items-center gap-1.5 ${
                      isCurrent ? 'text-[#ff7a1a]' : 'text-white'
                    }`}>
                      {song.title}
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-[#ff6600] shadow-[0_0_6px_#ff6600] pulse-neon" />
                      )}
                    </h3>
                    <p className="text-neutral-400 text-[13px] truncate">
                      {song.artist}
                    </p>
                  </div>

                  {/* Heart Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      liked 
                        ? 'text-[#ff6600] drop-shadow-[0_0_6px_#ff6600]' 
                        : 'text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                    title={liked ? "Unlike" : "Like"}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-[#ff6600]' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 sm:p-6 rounded-xl bg-[#121215]/80 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Your recent activity will appear here</h3>
                <p className="text-neutral-400 text-xs mt-0.5">Search for your favorite songs, artists, or genres to start listening.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2 rounded-lg bg-[#ff6600] text-black font-bold text-xs hover:bg-[#ff7a1a] transition-colors shrink-0 shadow-md"
            >
              Explore Music
            </button>
          </div>
        )}
      </section>

      {/* Suggested for You Section */}
      <section className="mb-14">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-[24px] font-bold text-white hover:text-[#ff7a1a] transition-colors flex items-center gap-2">
            Suggested for You
          </h2>
          <button
            onClick={() => navigate('/search')}
            className="text-xs font-bold uppercase tracking-widest text-[#ff6600] hover:text-[#ff9e59] transition-colors flex items-center gap-1"
          >
            Show All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {suggestedTracks.map((track, idx) => {
            const isCurrent = currentSong?.id === track.id;
            const isCurrentlyPlaying = isCurrent && isPlaying;

            return (
              <div
                key={`suggested-${track.id}-${idx}`}
                onClick={() => {
                  if (isCurrent) {
                    togglePlay();
                  } else {
                    playPlaylist(suggestedTracks, idx);
                  }
                }}
                className="group cursor-pointer bg-[#121215]/80 p-3 rounded-xl border border-white/5 hover:border-[#ff6600]/40 transition-all card-hover"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 shadow-lg bg-[#111114]">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Glowing Floating Play Button */}
                  <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#ff6600] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 play-btn-glow z-10 font-bold hover:scale-110">
                    {isCurrentlyPlaying ? (
                      <Pause className="w-5 h-5 fill-black" />
                    ) : (
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-white text-[15px] truncate mb-0.5 group-hover:text-[#ff7a1a] transition-colors">
                  {track.title}
                </h3>
                <p className="text-neutral-400 text-[13px] truncate">
                  {track.artist}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Browse All (Genres) Section */}
      <section className="mb-10">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-[24px] font-bold text-white hover:text-[#ff7a1a] transition-colors">
            Browse All
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {genreItems.map((genre) => (
            <div
              key={genre.id}
              onClick={() => handleGenreClick(genre)}
              className={`relative rounded-xl overflow-hidden aspect-video group cursor-pointer border border-[#ff6600]/25 hover:border-[#ff6600] hover:shadow-[0_0_20px_rgba(255,102,0,0.35)] transition-all duration-300 bg-gradient-to-br ${genre.color}`}
            >
              <h3 className="absolute top-3 left-3 text-white font-bold text-[17px] z-10 tracking-tight group-hover:text-[#ff6600] transition-colors">
                {genre.name}
              </h3>
              <img
                src={genre.coverUrl}
                alt={genre.name}
                className="absolute -right-4 -bottom-4 w-20 h-20 object-cover rotate-[25deg] shadow-2xl group-hover:scale-110 transition-transform duration-300 rounded-md"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
