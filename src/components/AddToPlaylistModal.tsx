import React, { useState } from 'react';
import { X, Plus, Check, ListPlus, Music } from 'lucide-react';
import { usePlayer, Song } from '../store/playerStore';

interface AddToPlaylistModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToPlaylistModal({ song, isOpen, onClose }: AddToPlaylistModalProps) {
  const { userPlaylists = [], createPlaylist, addSongToPlaylist, isSongInPlaylist } = usePlayer();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen || !song) return null;

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = createPlaylist(newPlaylistName.trim());
    addSongToPlaylist(created.id, song);
    setNewPlaylistName('');
    setIsCreating(false);
    showFeedback(`Added to "${created.name}"`);
  };

  const handleTogglePlaylist = (playlistId: string, playlistName: string) => {
    const success = addSongToPlaylist(playlistId, song);
    if (success) {
      showFeedback(`Added to "${playlistName}"`);
    } else {
      showFeedback(`Already in "${playlistName}"`);
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-md bg-[#121216] border border-[#ff6600]/30 rounded-2xl shadow-2xl p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-[#ff6600]" />
            <h3 className="text-lg font-bold">Add to Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Song Preview */}
        <div className="flex items-center gap-3 my-4 p-2.5 rounded-xl bg-white/5 border border-white/5">
          <img 
            src={song.coverUrl} 
            alt={song.title} 
            className="w-12 h-12 rounded-lg object-cover shrink-0 shadow-md"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{song.title}</span>
            <span className="text-xs text-neutral-400 truncate">{song.artist}</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-[#ff6600]/20 border border-[#ff6600]/40 text-[#ff7a1a] text-xs font-semibold text-center animate-fade-in">
            {feedbackMsg}
          </div>
        )}

        {/* Playlists List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-none my-2">
          {userPlaylists.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">No custom playlists created yet.</p>
          ) : (
            userPlaylists.map((pl) => {
              const inPl = isSongInPlaylist(pl.id, song.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => handleTogglePlaylist(pl.id, pl.name)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                    inPl 
                      ? 'bg-[#ff6600]/15 border-[#ff6600]/40 text-white' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">{pl.name}</span>
                      <span className="text-xs text-neutral-400">{pl.songs.length} songs</span>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    inPl ? 'bg-[#ff6600] text-black' : 'bg-white/10 text-neutral-400 group-hover:text-white'
                  }`}>
                    {inPl ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Playlist Form / Button */}
        <div className="mt-4 pt-3 border-t border-white/10">
          {isCreating ? (
            <form onSubmit={handleCreateAndAdd} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-[#ff6600]/40 text-sm focus:outline-none focus:border-[#ff6600] text-white"
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 rounded-xl bg-[#ff6600] text-black font-semibold text-sm disabled:opacity-50 hover:bg-[#ff7a1a] transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 rounded-xl bg-white/5 text-neutral-400 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-[#ff6600]/15 border border-dashed border-white/20 hover:border-[#ff6600]/40 text-neutral-300 hover:text-[#ff7a1a] font-medium text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Create New Playlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
