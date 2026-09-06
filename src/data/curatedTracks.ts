import { Song } from '../store/playerStore';
import { ArtistResult, AlbumResult, TopResultItem } from '../types/search';

export interface CuratedTrack extends Song {
  album?: string;
  duration?: number;
  genre?: string;
  badge?: string;
}

export const CURATED_TRACKS: CuratedTrack[] = [];

export const DEFAULT_INITIAL_TRACK: Song | null = null;

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
    return queryTokens.some(token => fullText.includes(token));
  });

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
