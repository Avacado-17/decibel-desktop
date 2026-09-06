import React, { useState, useEffect } from 'react';
import { 
  X, User, Check, Heart, Clock, Music, 
  RotateCcw, Sparkles 
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { usePlayer } from '../store/playerStore';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const { username, updateUsername, resetProfile } = useUser();
  const { likedSongs, recentlyPlayed } = usePlayer();

  const [inputName, setInputName] = useState(username);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputName(username);
      setSavedFeedback(false);
    }
  }, [isOpen, username]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      updateUsername(inputName.trim());
      setSavedFeedback(true);
      setTimeout(() => {
        setSavedFeedback(false);
        onClose();
      }, 600);
    }
  };

  const handleReset = () => {
    resetProfile();
    setInputName('Music Explorer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        id="user-profile-modal"
        className="w-full max-w-md rounded-2xl bg-[#0e0e12] border border-[#ff6600]/30 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(255,102,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6600] to-[#ff3b00] flex items-center justify-center text-black font-bold shadow-[0_0_12px_rgba(255,102,0,0.5)]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">User Profile</h3>
              <p className="text-xs text-[#ff7a1a]">Customize your listener identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Active Profile Info Banner */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#14141a] border border-white/5">
            <div className="w-12 h-12 rounded-full bg-[#ff6600]/15 border border-[#ff6600]/40 text-[#ff6600] flex items-center justify-center shadow-[0_0_14px_rgba(255,102,0,0.25)] shrink-0">
              <User className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-white truncate">
                {inputName.trim() || 'Your Username'}
              </h4>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                Decibel Listener
              </p>
            </div>
          </div>

          {/* Username Input Field */}
          <div className="space-y-2">
            <label 
              htmlFor="username-input" 
              className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center justify-between"
            >
              <span>Username</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {inputName.length}/30 characters
              </span>
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#ff6600] transition-colors pointer-events-none" />
              <input
                id="username-input"
                type="text"
                value={inputName}
                maxLength={30}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter your listener username..."
                autoFocus
                className="w-full bg-[#14141a] hover:bg-[#181820] focus:bg-[#181820] rounded-xl py-3 pl-10 pr-10 text-sm font-medium outline-none text-white placeholder-neutral-500 border border-white/10 focus:border-[#ff6600] shadow-inner focus:shadow-[0_0_15px_rgba(255,102,0,0.25)] transition-all"
              />
              {inputName && (
                <button
                  type="button"
                  onClick={() => setInputName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  title="Clear username"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Music Profile Stats */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Listener Activity
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff6600]/15 flex items-center justify-center text-[#ff6600]">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Liked Songs</p>
                  <p className="text-sm font-bold text-white font-mono">{likedSongs.length}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Recent Plays</p>
                  <p className="text-sm font-bold text-white font-mono">{recentlyPlayed.length}</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141418] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            title="Reset to default profile"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!inputName.trim()}
              className="px-5 py-1.5 rounded-xl bg-[#ff6600] hover:bg-[#ff7a1a] text-black font-bold text-xs shadow-[0_0_14px_rgba(255,102,0,0.5)] transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

