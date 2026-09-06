import { Song } from '../store/playerStore';
import { ArtistResult, AlbumResult, TopResultItem } from '../types/search';

export interface CuratedTrack extends Song {
  album?: string;
  duration?: number;
  genre?: string;
  badge?: string;
}

export const CURATED_TRACKS: CuratedTrack[] = [
  {
    id: "MV_3Dpw-BRY",
    title: "Nightcall",
    artist: "Kavinsky",
    album: "OutRun Dreams",
    duration: 259,
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400",
    genre: "Synthwave",
    badge: "24-BIT"
  },
  {
    id: "xZVSggLl9vo",
    title: "Mein",
    artist: "Asim Azhar",
    album: "Mein OST",
    duration: 250,
    coverUrl: "https://i.ytimg.com/vi/xZVSggLl9vo/hq720.jpg",
    genre: "Pop / OST",
    badge: "DOLBY ATMOS"
  },
  {
    id: "6CXKtmRjOto",
    title: "Inaam",
    artist: "Jasleen Royal ft. Badshah",
    album: "Inaam - Single",
    duration: 210,
    coverUrl: "https://i.ytimg.com/vi/6CXKtmRjOto/hq720.jpg",
    genre: "Indie Pop",
    badge: "HI-RES"
  },
  {
    id: "TWSyoaUZAP4",
    title: "Inaam",
    artist: "Anuv Jain",
    album: "Inaam",
    duration: 205,
    coverUrl: "https://i.ytimg.com/vi/TWSyoaUZAP4/hq720.jpg",
    genre: "Indie Pop",
    badge: "HI-RES"
  },
  {
    id: "Z1iN-RJOI5Y",
    title: "Thaam Lo",
    artist: "Atif Aslam",
    album: "Parwaaz Hai Junoon",
    duration: 300,
    coverUrl: "https://i.ytimg.com/vi/Z1iN-RJOI5Y/hq720.jpg",
    genre: "Bollywood / Pop",
    badge: "DOLBY ATMOS"
  },
  {
    id: "tvcaYU7uofY",
    title: "Hum",
    artist: "Murtaza Qizilbash",
    album: "Hum - Single",
    duration: 220,
    coverUrl: "https://i.ytimg.com/vi/tvcaYU7uofY/hq720.jpg",
    genre: "Indie Pop",
    badge: "MASTER"
  },
  {
    id: "XYmTfNiAqW8",
    title: "Har Baar",
    artist: "Murtaza Qizilbash ft. Samar Jafri",
    album: "Har Baar - Single",
    duration: 235,
    coverUrl: "https://i.ytimg.com/vi/XYmTfNiAqW8/hq720.jpg",
    genre: "Indie Pop",
    badge: "DOLBY ATMOS"
  },
  {
    id: "NVMa86cxU-k",
    title: "Zulfein",
    artist: "Mehul Mahesh & DJ Aynik",
    album: "Zulfein",
    duration: 195,
    coverUrl: "https://i.ytimg.com/vi/NVMa86cxU-k/hq720.jpg",
    genre: "Indie Pop",
    badge: "HI-RES"
  },
  {
    id: "jfKfPfyJRdk",
    title: "Deep Focus",
    artist: "Ambient & Chill",
    album: "Study Beats",
    duration: 184,
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=400",
    genre: "Ambient",
    badge: "MASTER"
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: 354,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    genre: "Rock",
    badge: "HI-RES"
  },
  {
    id: "EqPtz5qN7HM",
    title: "Hotel California",
    artist: "Eagles",
    album: "Hotel California",
    duration: 391,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400",
    genre: "Rock",
    badge: "24-BIT"
  },
  {
    id: "DWcJPE8jVaI",
    title: "Midnight Quartet",
    artist: "Smooth Jazz Collective",
    album: "Blue Note Sessions",
    duration: 242,
    coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
    genre: "Jazz",
    badge: "HI-RES"
  },
  {
    id: "kgx4WGK0oNU",
    title: "Echoes of Silence",
    artist: "Minimalist Piano Ensemble",
    album: "Nocturne Solos",
    duration: 198,
    coverUrl: "https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&q=80&w=400",
    genre: "Classical",
    badge: "DSD"
  },
  {
    id: "5qap5aO4i9A",
    title: "Cyber City Vibes",
    artist: "Dark Electronic Arts",
    album: "Neon Dystopia",
    duration: 215,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    genre: "Electronic",
    badge: "MASTER"
  },
  {
    id: "dX3k_QDnzHE",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    duration: 244,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400",
    genre: "Electronic",
    badge: "24-BIT"
  },
  {
    id: "FGBhQbmMxH8",
    title: "One More Time",
    artist: "Daft Punk",
    album: "Discovery",
    duration: 320,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400",
    genre: "Electronic",
    badge: "MASTER"
  },
  {
    id: "gAjR4_CbPpQ",
    title: "Harder, Better, Faster, Stronger",
    artist: "Daft Punk",
    album: "Discovery",
    duration: 224,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400",
    genre: "Electronic",
    badge: "HI-RES"
  },
  {
    id: "5NV6Rdv1a3I",
    title: "Get Lucky",
    artist: "Daft Punk ft. Pharrell Williams",
    album: "Random Access Memories",
    duration: 248,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    genre: "Electronic",
    badge: "DOLBY ATMOS"
  },
  {
    id: "rDBbaGCCIhk",
    title: "Sunset",
    artist: "The Midnight",
    album: "Endless Summer",
    duration: 326,
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400",
    genre: "Synthwave",
    badge: "DOLBY ATMOS"
  },
  {
    id: "RxabLA7UQ9U",
    title: "Time",
    artist: "Hans Zimmer",
    album: "Inception OST",
    duration: 275,
    coverUrl: "https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&q=80&w=400",
    genre: "Classical",
    badge: "DSD"
  },
  {
    id: "ylXk1LBvIqU",
    title: "So What",
    artist: "Miles Davis",
    album: "Kind of Blue",
    duration: 562,
    coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
    genre: "Jazz",
    badge: "HI-RES"
  },
  {
    id: "mehLx_Fjh_c",
    title: "A Walk",
    artist: "Tycho",
    album: "Dive",
    duration: 316,
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=400",
    genre: "Ambient",
    badge: "24-BIT"
  }
];

export const DEFAULT_INITIAL_TRACK: Song = CURATED_TRACKS[0];

export function searchCuratedTracksLocally(query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return {
      songs: CURATED_TRACKS,
      artists: [],
      albums: [],
      topResult: null
    };
  }

  const queryTokens = trimmed.split(/\s+/).filter(Boolean);

  let matchedSongs = CURATED_TRACKS.filter((t) => {
    const fullText = `${t.title} ${t.artist} ${t.album || ''} ${t.genre || ''} ${t.badge || ''}`.toLowerCase();
    return queryTokens.every(token => fullText.includes(token)) || queryTokens.some(token => fullText.includes(token));
  });

  // Fail-safe: if no exact token matches found, return all curated tracks
  if (matchedSongs.length === 0) {
    matchedSongs = CURATED_TRACKS;
  }

  // Synthesize artists from matches
  const artistsMap = new Map<string, ArtistResult>();
  for (const song of matchedSongs) {
    if (!song.artist) continue;
    const lower = song.artist.toLowerCase();
    if (!artistsMap.has(lower)) {
      artistsMap.set(lower, {
        id: `artist-${lower.replace(/[^a-z0-9]/g, '-')}`,
        name: song.artist,
        imageUrl: song.coverUrl,
        genre: song.genre || 'Verified Artist',
        monthlyListeners: 'Decibel Verified',
        verified: true,
        trackCount: matchedSongs.filter(s => s.artist.toLowerCase() === lower).length,
        topTrackId: song.id
      });
    }
  }

  // Synthesize topResult
  const topSong = matchedSongs[0];
  const topResult: TopResultItem | null = topSong ? {
    type: 'song',
    id: topSong.id,
    title: topSong.title,
    subtitle: `${topSong.artist} • ${topSong.album || 'Single'}`,
    imageUrl: topSong.coverUrl,
    badge: topSong.badge || '24-BIT',
    duration: topSong.duration ? `${Math.floor(topSong.duration / 60)}:${(topSong.duration % 60).toString().padStart(2, '0')}` : undefined,
    data: topSong
  } : null;

  return {
    songs: matchedSongs,
    artists: Array.from(artistsMap.values()),
    albums: [],
    topResult
  };
}
