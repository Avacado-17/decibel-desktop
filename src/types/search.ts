import { Song } from '../store/playerStore';

export interface ArtistResult {
  id: string;
  name: string;
  imageUrl: string;
  genre?: string;
  monthlyListeners?: string;
  verified?: boolean;
  trackCount?: number;
  topTrackId?: string;
}

export interface AlbumResult {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year?: number | string;
  trackCount?: number;
  genre?: string;
  badge?: string;
}

export type TopResultType = 'artist' | 'album' | 'song';

export interface TopResultItem {
  type: TopResultType;
  data: ArtistResult | AlbumResult | Song;
}

export interface CategorizedSearchResponse {
  results: Song[];
  songs: Song[];
  artists: ArtistResult[];
  albums: AlbumResult[];
  topResult?: TopResultItem;
  source?: string;
  query?: string;
  note?: string;
}

export type SearchCategoryFilter = 'all' | 'songs' | 'artists' | 'albums';

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
  category?: string;
}
