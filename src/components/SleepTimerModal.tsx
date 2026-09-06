import { useState, useEffect } from 'react';
import { Timer, X, Check } from 'lucide-react';
import { usePlayer } from '../store/playerStore';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMER_PRESETS = [
  { label: '5 minutes', minutes: 5 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: 'End of current song', minutes: -1 },
];

export function SleepTimerModal({ isOpen, onClose }: SleepTimerModalProps) {
  const { 
    sleepTimerSeconds, 
    setSleepTimer, 
    cancelSleepTimer, 
    duration, 
    progress 
  } = usePlayer();

  const [customMinutes, setCustomMinutes] = useState('');

  // Close on Escape key
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

  const handleSelectPreset = (minutes: number) => {
    if (minutes === -1) {
      // End of current song: calculate remaining duration in minutes
      const remainingSeconds = Math.max(10, duration - progress);
      setSleepTimer(remainingSeconds / 60);
    } else {
      setSleepTimer(minutes);
    }
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customMinutes);
    if (!isNaN(val) && val > 0) {
      setSleepTimer(val);
      setCustomMinutes('');
      onClose();
    }
  };

  const formatRemaining = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Timer className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Sleep Timer</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timer Banner */}
        {sleepTimerSeconds !== null && (
          <div className="mt-4 p-3.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Audio stops in</p>
              <p className="text-xl font-bold text-primary font-mono mt-0.5">
                {formatRemaining(sleepTimerSeconds)}
              </p>
            </div>
            <button
              onClick={() => {
                cancelSleepTimer();
                onClose();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
            >
              Turn off
            </button>
          </div>
        )}

        {/* Preset Options */}
        <div className="mt-4 space-y-1.5">
          <p className="text-xs text-neutral-400 font-semibold px-1 pb-1">
            {sleepTimerSeconds !== null ? 'Change duration:' : 'Stop audio after:'}
          </p>
          {TIMER_PRESETS.map((preset) => {
            return (
              <button
                key={preset.label}
                onClick={() => handleSelectPreset(preset.minutes)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-200 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between group"
              >
                <span>{preset.label}</span>
                <span className="text-neutral-500 group-hover:text-primary transition-colors text-xs">Select</span>
              </button>
            );
          })}
        </div>

        {/* Custom duration form */}
        <form onSubmit={handleApplyCustom} className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
          <input 
            type="number" 
            min="1" 
            max="720"
            placeholder="Custom mins (e.g. 20)" 
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!customMinutes || parseFloat(customMinutes) <= 0}
            className="px-4 py-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
}
