import { useState, useEffect, useRef, useCallback } from 'react';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
  className?: string;
  showHandles?: boolean;
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function ProgressBar({ 
  progress, 
  duration, 
  onSeek, 
  className = "", 
  showHandles = true 
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Synchronize local progress with external player progress when not actively dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  // Compute position percentage (0 to 1) from PointerEvent
  const getPercentageFromEvent = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const clientX = e.clientX;
    const p = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, p));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Capture pointer to continue scrubbing even if dragged outside track bounds
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if capture not supported
    }

    const percentage = getPercentageFromEvent(e);
    const targetSeconds = percentage * duration;
    setLocalProgress(targetSeconds);
    setHoverPosition(percentage);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const percentage = getPercentageFromEvent(e);
    
    if (isDragging) {
      const targetSeconds = percentage * duration;
      setLocalProgress(targetSeconds);
      setHoverPosition(percentage);
    } else {
      setHoverPosition(percentage);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe ignore
      }
      
      const percentage = getPercentageFromEvent(e);
      const targetSeconds = percentage * duration;
      setLocalProgress(targetSeconds);
      onSeek(targetSeconds);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe ignore
      }
      onSeek(localProgress);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    let delta = 0;
    if (e.key === 'ArrowRight') delta = e.shiftKey ? 15 : 5;
    else if (e.key === 'ArrowLeft') delta = e.shiftKey ? -15 : -5;
    else if (e.key === 'Home') delta = -localProgress;
    else if (e.key === 'End') delta = duration - localProgress;

    if (delta !== 0) {
      e.preventDefault();
      const nextProgress = Math.max(0, Math.min(duration, localProgress + delta));
      setLocalProgress(nextProgress);
      onSeek(nextProgress);
    }
  };

  const currentPercent = duration > 0 ? (localProgress / duration) * 100 : 0;
  const hoverPercent = hoverPosition !== null ? hoverPosition * 100 : null;
  const hoverSeconds = hoverPosition !== null ? hoverPosition * duration : 0;

  return (
    <div className={`w-full flex items-center justify-between text-xs font-mono select-none gap-3 ${className}`}>
      {/* Elapsed Time */}
      <span className="text-neutral-400 text-[11px] w-9 text-left tabular-nums shrink-0">
        {formatTime(localProgress)}
      </span>

      {/* Progress Track Container */}
      <div 
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Audio scrubber"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(localProgress)}
        aria-valuetext={`${formatTime(localProgress)} of ${formatTime(duration)}`}
        className="flex-1 relative cursor-pointer py-3 -my-3 flex items-center group focus:outline-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isDragging) {
            setIsHovered(false);
            setHoverPosition(null);
          }
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Hover Timestamp Tooltip */}
        {(isHovered || isDragging) && hoverPosition !== null && duration > 0 && (
          <div 
            className="absolute bottom-full mb-2 pointer-events-none transform -translate-x-1/2 z-30 transition-opacity duration-150"
            style={{ 
              left: `${Math.max(4, Math.min(96, hoverPercent || 0))}%` 
            }}
          >
            <div className="bg-[#121216]/95 backdrop-blur-md border border-[#ff6600]/40 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center gap-1">
              <span className="text-[#ff6600]">▶</span>
              <span>{formatTime(hoverSeconds)}</span>
            </div>
            {/* Tiny tooltip arrow */}
            <div className="w-1.5 h-1.5 bg-[#121216] border-r border-b border-[#ff6600]/40 rotate-45 mx-auto -mt-0.5" />
          </div>
        )}

        {/* Background Track */}
        <div className="w-full h-1.5 group-hover:h-2 bg-white/10 group-hover:bg-white/15 rounded-full relative overflow-hidden transition-all duration-200">
          {/* Hover preview fill */}
          {hoverPercent !== null && (isHovered || isDragging) && (
            <div 
              className="absolute left-0 top-0 h-full bg-white/10 rounded-full transition-none pointer-events-none"
              style={{ width: `${hoverPercent}%` }}
            />
          )}

          {/* Active Played Track Fill */}
          <div 
            className="h-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] rounded-full relative shadow-[0_0_8px_rgba(255,102,0,0.6)] transition-none"
            style={{ width: `${currentPercent}%` }}
          />
        </div>

        {/* Scrubber Thumb / Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-none"
          style={{ left: `${currentPercent}%` }}
        >
          <div 
            className={`-translate-x-1/2 rounded-full bg-white border-2 border-[#ff6600] shadow-[0_0_12px_#ff6600] transition-transform duration-150 ${
              isDragging 
                ? 'w-4 h-4 scale-125 opacity-100' 
                : showHandles 
                  ? 'w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:scale-110' 
                  : 'w-3 h-3 opacity-0 group-hover:opacity-100'
            }`}
          >
            {/* Center neon dot */}
            <div className="w-1 h-1 bg-[#ff6600] rounded-full m-auto absolute inset-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

