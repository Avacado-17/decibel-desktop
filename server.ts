import express from "express";
import path from "path";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Curated Decibel Tracks matching the high-fidelity UI design
const CURATED_TRACKS = [
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
    artist: "Neon Dreamers",
    album: "Hurry Up We're Dreaming",
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

// Curated Artists Catalog for Predictive Search
const ARTISTS_DATABASE = [
  {
    id: "kavinsky",
    name: "Kavinsky",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=300",
    genre: "Synthwave / OutRun",
    monthlyListeners: "2,420,000",
    verified: true,
    trackCount: 14,
    topTrackId: "MV_3Dpw-BRY"
  },
  {
    id: "the-midnight",
    name: "The Midnight",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=300",
    genre: "Retrowave / Synth-Pop",
    monthlyListeners: "1,890,000",
    verified: true,
    trackCount: 28,
    topTrackId: "Sunset-Midnight"
  },
  {
    id: "daft-punk",
    name: "Daft Punk",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300",
    genre: "Electronic / French House",
    monthlyListeners: "24,800,000",
    verified: true,
    trackCount: 42,
    topTrackId: "FGBhQbmMxH8"
  },
  {
    id: "synthwave-mix",
    name: "Synthwave Mix",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=300",
    genre: "Electronic / Cyberpunk",
    monthlyListeners: "940,000",
    verified: true,
    trackCount: 18,
    topTrackId: "4xDzrJKXOOY"
  },
  {
    id: "ambient-chill",
    name: "Ambient & Chill",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=300",
    genre: "Lo-Fi / Ambient Beats",
    monthlyListeners: "1,520,000",
    verified: true,
    trackCount: 36,
    topTrackId: "jfKfPfyJRdk"
  },
  {
    id: "queen",
    name: "Queen",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300",
    genre: "Classic Rock",
    monthlyListeners: "49,300,000",
    verified: true,
    trackCount: 120,
    topTrackId: "fJ9rUzIMcZQ"
  },
  {
    id: "eagles",
    name: "Eagles",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300",
    genre: "Classic Rock",
    monthlyListeners: "28,100,000",
    verified: true,
    trackCount: 65,
    topTrackId: "EqPtz5qN7HM"
  },
  {
    id: "smooth-jazz-collective",
    name: "Smooth Jazz Collective",
    imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=300",
    genre: "Contemporary Jazz",
    monthlyListeners: "680,000",
    verified: false,
    trackCount: 22,
    topTrackId: "DWcJPE8jVaI"
  },
  {
    id: "minimalist-piano",
    name: "Minimalist Piano Ensemble",
    imageUrl: "https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&q=80&w=300",
    genre: "Neo-Classical",
    monthlyListeners: "540,000",
    verified: false,
    trackCount: 16,
    topTrackId: "kgx4WGK0oNU"
  },
  {
    id: "hans-zimmer",
    name: "Hans Zimmer",
    imageUrl: "https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&q=80&w=300",
    genre: "Cinematic / Orchestral",
    monthlyListeners: "14,200,000",
    verified: true,
    trackCount: 88,
    topTrackId: "Time-Inception"
  },
  {
    id: "miles-davis",
    name: "Miles Davis",
    imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=300",
    genre: "Modal Jazz",
    monthlyListeners: "4,600,000",
    verified: true,
    trackCount: 95,
    topTrackId: "SoWhat-Miles"
  },
  {
    id: "tycho",
    name: "Tycho",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=300",
    genre: "Chillwave / Ambient",
    monthlyListeners: "1,750,000",
    verified: true,
    trackCount: 30,
    topTrackId: "A-Walk-Tycho"
  },
  {
    id: "neon-dreamers",
    name: "Neon Dreamers",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=300",
    genre: "Synth-Pop",
    monthlyListeners: "1,340,000",
    verified: true,
    trackCount: 15,
    topTrackId: "dX3k_QDnzHE"
  },
  {
    id: "dark-electronic-arts",
    name: "Dark Electronic Arts",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300",
    genre: "Cyberpunk / Industrial",
    monthlyListeners: "890,000",
    verified: false,
    trackCount: 12,
    topTrackId: "5qap5aO4i9A"
  }
];

// Curated Albums Catalog for Predictive Search
const ALBUMS_DATABASE = [
  {
    id: "outrun-dreams",
    title: "OutRun Dreams",
    artist: "Kavinsky & The Midnight",
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400",
    year: 2024,
    trackCount: 8,
    genre: "Synthwave",
    badge: "DOLBY ATMOS"
  },
  {
    id: "retro-wave",
    title: "Retro Wave",
    artist: "Synthwave Mix",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400",
    year: 2023,
    trackCount: 10,
    genre: "Electronic",
    badge: "24-BIT"
  },
  {
    id: "discovery",
    title: "Discovery",
    artist: "Daft Punk",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400",
    year: 2001,
    trackCount: 14,
    genre: "Electronic",
    badge: "MASTER"
  },
  {
    id: "random-access-memories",
    title: "Random Access Memories",
    artist: "Daft Punk",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    year: 2013,
    trackCount: 13,
    genre: "Funk / Electronic",
    badge: "DOLBY ATMOS"
  },
  {
    id: "endless-summer",
    title: "Endless Summer",
    artist: "The Midnight",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400",
    year: 2016,
    trackCount: 12,
    genre: "Synthwave",
    badge: "HI-RES"
  },
  {
    id: "days-of-thunder",
    title: "Days of Thunder",
    artist: "The Midnight",
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400",
    year: 2014,
    trackCount: 6,
    genre: "Synthwave",
    badge: "MASTER"
  },
  {
    id: "study-beats",
    title: "Study Beats",
    artist: "Ambient & Chill",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=400",
    year: 2024,
    trackCount: 12,
    genre: "Ambient",
    badge: "MASTER"
  },
  {
    id: "a-night-at-the-opera",
    title: "A Night at the Opera",
    artist: "Queen",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    year: 1975,
    trackCount: 12,
    genre: "Rock",
    badge: "HI-RES"
  },
  {
    id: "hotel-california",
    title: "Hotel California",
    artist: "Eagles",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400",
    year: 1976,
    trackCount: 9,
    genre: "Rock",
    badge: "24-BIT"
  },
  {
    id: "blue-note-sessions",
    title: "Blue Note Sessions",
    artist: "Smooth Jazz Collective",
    coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
    year: 2022,
    trackCount: 7,
    genre: "Jazz",
    badge: "HI-RES"
  },
  {
    id: "kind-of-blue",
    title: "Kind of Blue",
    artist: "Miles Davis",
    coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
    year: 1959,
    trackCount: 5,
    genre: "Jazz",
    badge: "HI-RES"
  },
  {
    id: "dive",
    title: "Dive",
    artist: "Tycho",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=400",
    year: 2011,
    trackCount: 10,
    genre: "Ambient",
    badge: "24-BIT"
  },
  {
    id: "neon-dystopia",
    title: "Neon Dystopia",
    artist: "Dark Electronic Arts",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    year: 2024,
    trackCount: 8,
    genre: "Cyberpunk",
    badge: "MASTER"
  }
];

const GENRES_LIST = [
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Status endpoint indicating API key connectivity
  app.get("/api/config", (req, res) => {
    res.json({
      youtubeConfigured: Boolean(process.env.YOUTUBE_API_KEY),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      lrclibConfigured: true,
      service: "Decibel Audio Engine",
      version: "2.5.0",
      audioHiResSupport: true
    });
  });

  // Discover & Home Feed endpoint
  app.get("/api/discover", async (req, res) => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      let trendingItems: any[] = [];

      if (apiKey) {
        try {
          const ytResp = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
              part: "snippet",
              chart: "mostPopular",
              videoCategoryId: "10",
              maxResults: 10,
              key: apiKey,
            },
            timeout: 5000,
          });

          trendingItems = ytResp.data.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            coverUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            badge: "TRENDING"
          }));
        } catch (e) {
          console.warn("Could not fetch YouTube trending chart, using curated items.");
        }
      }

      res.json({
        recents: CURATED_TRACKS.slice(0, 6),
        suggested: trendingItems.length > 0 ? trendingItems.slice(0, 5) : CURATED_TRACKS.slice(0, 5),
        genres: GENRES_LIST,
        companionInitialTrack: CURATED_TRACKS[6], // Neon Horizons
        playlists: []
      });
    } catch (err: any) {
      console.error("Discover API error:", err.message);
      res.status(500).json({ error: "Failed to load discover feed" });
    }
  });

  // Genres endpoint
  app.get("/api/genres", (req, res) => {
    res.json({ genres: GENRES_LIST });
  });

  // Genre tracks endpoint
  app.get("/api/genres/:genreId", async (req, res) => {
    try {
      const { genreId } = req.params;
      const genre = GENRES_LIST.find((g) => g.id.toLowerCase() === genreId.toLowerCase());
      const query = genre ? genre.query : `${genreId} music`;

      const apiKey = process.env.YOUTUBE_API_KEY;
      if (apiKey) {
        try {
          const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
              part: "snippet",
              q: query,
              type: "video",
              videoCategoryId: "10",
              maxResults: 12,
              key: apiKey,
            },
            timeout: 5000,
          });

          const items = response.data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            coverUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            genre: genre?.name || genreId,
            badge: "24-BIT"
          }));

          res.json({ genre: genre || { id: genreId, name: genreId }, tracks: items });
          return;
        } catch (ytErr) {
          console.warn("YouTube genre search failed, falling back to curated list");
        }
      }

      // Filter or return curated tracks matching or generic
      const matched = CURATED_TRACKS.filter(
        (t) => t.genre.toLowerCase() === genreId.toLowerCase()
      );
      res.json({
        genre: genre || { id: genreId, name: genreId },
        tracks: matched.length > 0 ? matched : CURATED_TRACKS,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load genre tracks" });
    }
  });

  // Helper to compute categorized search & topResult (Artists, Albums, Songs)
  function categorizeSearch(queryString: string, songItems: any[]) {
    // 1. Matched artists
    const matchingArtists = ARTISTS_DATABASE.filter((a) =>
      a.name.toLowerCase().includes(queryString) ||
      a.genre.toLowerCase().includes(queryString)
    );

    // If songs provided, also dynamically aggregate artists
    const dynamicArtistsMap = new Map();
    for (const s of songItems) {
      if (!s.artist) continue;
      const cleanArtist = s.artist.replace(/ - Topic$/i, '').trim();
      if (cleanArtist.toLowerCase().includes(queryString) && !matchingArtists.some(a => a.name.toLowerCase() === cleanArtist.toLowerCase())) {
        if (!dynamicArtistsMap.has(cleanArtist.toLowerCase())) {
          dynamicArtistsMap.set(cleanArtist.toLowerCase(), {
            id: `artist-${cleanArtist.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name: cleanArtist,
            imageUrl: s.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300",
            genre: s.genre || "Music",
            monthlyListeners: "1,200,000",
            verified: true,
            trackCount: 12,
            topTrackId: s.id
          });
        }
      }
    }
    const allMatchingArtists = [...matchingArtists, ...Array.from(dynamicArtistsMap.values())];

    // 2. Matched albums
    const matchingAlbums = ALBUMS_DATABASE.filter((alb) =>
      alb.title.toLowerCase().includes(queryString) ||
      alb.artist.toLowerCase().includes(queryString) ||
      alb.genre.toLowerCase().includes(queryString)
    );

    // Also extract albums from song items if song.album matches
    const dynamicAlbumsMap = new Map();
    for (const s of songItems) {
      if (s.album && s.album.toLowerCase().includes(queryString) && !matchingAlbums.some(a => a.title.toLowerCase() === s.album.toLowerCase())) {
        if (!dynamicAlbumsMap.has(s.album.toLowerCase())) {
          dynamicAlbumsMap.set(s.album.toLowerCase(), {
            id: `album-${s.album.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            title: s.album,
            artist: s.artist,
            coverUrl: s.coverUrl,
            year: 2024,
            trackCount: 8,
            genre: s.genre || "Audio",
            badge: s.badge || "HI-RES"
          });
        }
      }
    }
    const allMatchingAlbums = [...matchingAlbums, ...Array.from(dynamicAlbumsMap.values())];

    // 3. Top Result logic
    let topResult: any = null;
    const exactArtist = allMatchingArtists.find(a => a.name.toLowerCase() === queryString || a.name.toLowerCase().startsWith(queryString));
    if (exactArtist) {
      topResult = { type: 'artist', data: exactArtist };
    } else {
      const exactAlbum = allMatchingAlbums.find(a => a.title.toLowerCase() === queryString || a.title.toLowerCase().startsWith(queryString));
      if (exactAlbum) {
        topResult = { type: 'album', data: exactAlbum };
      } else if (songItems.length > 0) {
        topResult = { type: 'song', data: songItems[0] };
      } else if (allMatchingArtists.length > 0) {
        topResult = { type: 'artist', data: allMatchingArtists[0] };
      } else if (allMatchingAlbums.length > 0) {
        topResult = { type: 'album', data: allMatchingAlbums[0] };
      }
    }

    return {
      songs: songItems,
      artists: allMatchingArtists,
      albums: allMatchingAlbums,
      topResult
    };
  }

  // Helper: Live global search using iTunes Catalog + YouTube Scraper fallback
  async function searchYouTubeScraper(queryStr: string) {
    const items: any[] = [];
    
    // 1. Try iTunes Search API for comprehensive global song metadata
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(queryStr)}&entity=song&limit=15`;
      const itunesResp = await axios.get(itunesUrl, { timeout: 4000 });
      if (itunesResp.data && itunesResp.data.results) {
        for (const track of itunesResp.data.results) {
          const title = track.trackName || "Track";
          const artist = track.artistName || "Artist";
          const album = track.collectionName || "Single";
          const artwork = track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : undefined;
          
          // Map to a deterministic or curated YouTube video ID based on track title & artist
          // We can use a stable hash or search mapping, or match against curated tracks if available
          const matchedCurated = CURATED_TRACKS.find(c => 
            c.title.toLowerCase().includes(title.toLowerCase()) || 
            c.artist.toLowerCase().includes(artist.toLowerCase())
          );
          
          const videoId = matchedCurated ? matchedCurated.id : (
            // Generate a stable pseudorandom or searchable ID or fallback to a popular default
            track.trackId ? `itunes_${track.trackId}` : "MV_3Dpw-BRY"
          );

          items.push({
            id: videoId,
            title,
            artist,
            album,
            coverUrl: artwork || matchedCurated?.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400",
            badge: "HI-RES"
          });
        }
      }
    } catch (e: any) {
      console.warn("iTunes search API fallback warning:", e.message);
    }

    if (items.length > 0) return items;

    // 2. Try YouTube HTML results scraping
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryStr + ' song')}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 5000
      });
      const html = response.data;
      const initialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
      if (!initialDataMatch) return [];

      const data = JSON.parse(initialDataMatch[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

      for (const item of contents) {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          const videoId = v.videoId;
          if (!videoId) continue;

          let rawTitle = v.title?.runs?.[0]?.text || "Track";
          let rawArtist = v.ownerText?.runs?.[0]?.text || "Artist";

          const cleanTitle = rawTitle
            .replace(/[\(\[\{].*?(official|lyrics|lyrical|video|audio|hd|4k|ost|visualizer).*?[\)\]\}]/gi, '')
            .replace(/\|.*/, '')
            .replace(/ - Topic$/i, '')
            .trim();

          const cleanArtist = rawArtist.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();
          const coverUrl = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          items.push({
            id: videoId,
            title: cleanTitle || rawTitle,
            artist: cleanArtist || rawArtist,
            album: "Single",
            coverUrl,
            badge: "HI-RES"
          });
        }
      }
      return items;
    } catch (e: any) {
      console.warn("YouTube scraper fallback error:", e.message);
      return [];
    }
  }

  // API Route to proxy YouTube Data API requests securely with predictive categorization
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        res.status(400).json({ error: "Query parameter 'q' is required" });
        return;
      }

      const queryString = String(q).trim().toLowerCase();
      const apiKey = process.env.YOUTUBE_API_KEY;

      // 1. Try Official YouTube API if Key is Available
      if (apiKey) {
        try {
          const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
              part: "snippet",
              q: queryString,
              type: "video",
              maxResults: 20,
              key: apiKey,
            },
          });

          const items = (response.data.items || []).map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"),
            artist: item.snippet.channelTitle,
            album: "Single",
            coverUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            badge: "DOLBY ATMOS"
          })).filter((i: any) => i.id);

          if (items.length > 0) {
            const categorized = categorizeSearch(queryString, items);

            res.json({ 
              results: items, 
              songs: items,
              artists: categorized.artists,
              albums: categorized.albums,
              topResult: categorized.topResult,
              source: "youtube",
              query: queryString
            });
            return;
          }
        } catch (ytError: any) {
          console.warn("YouTube API search warning:", ytError.response?.data?.error?.message || ytError.message);
          // Fall through to YouTube web scraper
        }
      }

      // 2. Try Live YouTube Web Scraper
      const scrapedItems = await searchYouTubeScraper(queryString);
      if (scrapedItems.length > 0) {
        const categorized = categorizeSearch(queryString, scrapedItems);
        res.json({
          results: scrapedItems,
          songs: scrapedItems,
          artists: categorized.artists,
          albums: categorized.albums,
          topResult: categorized.topResult,
          source: "youtube-live",
          query: queryString
        });
        return;
      }

      // 3. Curated Decibel database fallback with tokenized query matching
      const queryTokens = queryString.split(/\s+/).filter(Boolean);
      const localMatches = CURATED_TRACKS.filter((t) => {
        const fullText = `${t.title} ${t.artist} ${t.album || ''} ${t.genre} ${t.badge || ''}`.toLowerCase();
        return queryTokens.some(token => fullText.includes(token));
      });

      const finalSongs = localMatches;
      const categorized = categorizeSearch(queryString, finalSongs);

      res.json({ 
        results: finalSongs, 
        songs: finalSongs,
        artists: categorized.artists,
        albums: categorized.albums,
        topResult: categorized.topResult,
        source: "curated", 
        query: queryString,
        note: "High-fidelity Decibel database" 
      });
    } catch (error: any) {
      console.error("Search API Error:", error.message);
      res.status(500).json({ error: "Failed to perform search" });
    }
  });

  // AI Gemini Smart Mix Generator Endpoint
  app.post("/api/ai/mix", async (req, res) => {
    try {
      const { prompt, currentTrack } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback curated mix based on prompt
        const selected = CURATED_TRACKS.slice(0, 4);
        res.json({
          title: `Decibel Mix: ${prompt || "Neon Night Drive"}`,
          description: "Curated ambient sonic soundscape calibrated for high-fidelity listening.",
          tracks: selected,
          source: "curated"
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an audio engineer and curator for Decibel, an onyx-and-neon high-fidelity music streaming app.
        The user wants an audio mix for: "${prompt || currentTrack?.title || 'ambient electronic synthwave'}".
        Suggest 4 song concepts with title, artist, genre (Electronic, Synthwave, Ambient, Jazz, Rock, or Classical), and a short 1-line vibe description.
        Output ONLY valid JSON in this structure:
        {
          "title": "Mix Title",
          "description": "Short description",
          "recommendations": [
            { "title": "Song Title", "artist": "Artist", "genre": "Electronic", "vibe": "Description" }
          ]
        }`,
      });

      let parsed: any = null;
      try {
        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn("Failed to parse Gemini output as JSON");
      }

      const recommendations = parsed?.recommendations || [];
      const tracks = recommendations.map((rec: any, idx: number) => ({
        id: CURATED_TRACKS[idx % CURATED_TRACKS.length].id,
        title: rec.title || "Decibel Horizon",
        artist: rec.artist || "Decibel Collective",
        coverUrl: CURATED_TRACKS[idx % CURATED_TRACKS.length].coverUrl,
        genre: rec.genre || "Electronic",
        badge: "MASTER"
      }));

      res.json({
        title: parsed?.title || "Decibel AI Mix",
        description: parsed?.description || "Dynamic AI-curated listening session.",
        tracks: tracks.length > 0 ? tracks : CURATED_TRACKS.slice(0, 4),
        source: "gemini"
      });
    } catch (err: any) {
      console.error("AI Mix error:", err.message);
      res.json({
        title: "Decibel Ambient Mix",
        description: "Curated high-res session.",
        tracks: CURATED_TRACKS.slice(0, 4),
        source: "curated"
      });
    }
  });

  // Helper to clean song titles and artist names for accurate lyrics matching
  function cleanSongQuery(title: string, artist?: string) {
    let t = title || "";
    let a = artist || "";

    if (t.includes(" - ")) {
      const parts = t.split(" - ");
      if (!a || /vevo|records|official|topic/i.test(a)) {
        a = parts[0].trim();
      }
      t = parts.slice(1).join(" - ").trim();
    }

    t = t.replace(/\s*[\(\[].*?(official|remaster|video|audio|lyric|live|visualizer|hd|4k).*?[\)\]]/gi, "").trim();
    t = t.replace(/\s*(ft\.|feat\.|featuring)\s+[^\(\)\[\]]+/gi, "").trim();

    a = a.replace(/\s*-\s*Topic$/i, "");
    a = a.replace(/VEVO$/i, "");
    a = a.replace(/\s*[\(\[].*?[\)\]]/g, "").trim();

    return { cleanTitle: t, cleanArtist: a };
  }

  // API Route to fetch synced or plain lyrics via LRCLIB
  app.get("/api/lyrics", async (req, res) => {
    try {
      const rawTitle = (req.query.title as string) || "";
      const rawArtist = (req.query.artist as string) || "";
      const duration = req.query.duration ? Number(req.query.duration) : undefined;

      if (!rawTitle) {
        res.status(400).json({ error: "Query parameter 'title' is required" });
        return;
      }

      const { cleanTitle, cleanArtist } = cleanSongQuery(rawTitle, rawArtist);

      const client = axios.create({
        baseURL: "https://lrclib.net/api",
        headers: { "User-Agent": "Decibel/2.0" },
        timeout: 6000,
      });

      let lyricData: any = null;

      // Strategy 1: Exact match with track_name and artist_name
      if (cleanArtist) {
        try {
          const getParams: any = { track_name: cleanTitle, artist_name: cleanArtist };
          if (duration) getParams.duration = Math.round(duration);
          const resp = await client.get("/get", { params: getParams });
          if (resp.data && (resp.data.syncedLyrics || resp.data.plainLyrics)) {
            lyricData = resp.data;
          }
        } catch {
          // Fallback to query without duration
        }

        if (!lyricData && duration) {
          try {
            const resp = await client.get("/get", { params: { track_name: cleanTitle, artist_name: cleanArtist } });
            if (resp.data && (resp.data.syncedLyrics || resp.data.plainLyrics)) {
              lyricData = resp.data;
            }
          } catch {}
        }
      }

      // Strategy 2: Search with cleaned title and artist
      if (!lyricData) {
        try {
          const queryTerm = `${cleanTitle} ${cleanArtist}`.trim();
          const searchResp = await client.get("/search", { params: { q: queryTerm } });
          const items = searchResp.data;
          if (Array.isArray(items) && items.length > 0) {
            const withSynced = items.find((it: any) => it.syncedLyrics);
            lyricData = withSynced || items[0];
          }
        } catch {}
      }

      // Strategy 3: Search with raw title as last resort
      if (!lyricData && rawTitle !== cleanTitle) {
        try {
          const searchResp = await client.get("/search", { params: { q: rawTitle } });
          const items = searchResp.data;
          if (Array.isArray(items) && items.length > 0) {
            const withSynced = items.find((it: any) => it.syncedLyrics);
            lyricData = withSynced || items[0];
          }
        } catch {}
      }

      if (!lyricData || (!lyricData.syncedLyrics && !lyricData.plainLyrics)) {
        res.json({ found: false, synced: false, syncedLyrics: null, plainLyrics: null });
        return;
      }

      res.json({
        found: true,
        synced: Boolean(lyricData.syncedLyrics),
        syncedLyrics: lyricData.syncedLyrics || null,
        plainLyrics: lyricData.plainLyrics || null,
        trackName: lyricData.trackName || lyricData.name,
        artistName: lyricData.artistName,
        albumName: lyricData.albumName,
        instrumental: Boolean(lyricData.instrumental),
      });
    } catch (error: any) {
      console.error("Lyrics fetch error:", error.message);
      res.status(500).json({ error: "Failed to fetch lyrics" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Decibel Server running on port ${PORT}`);
  });
}

startServer();

