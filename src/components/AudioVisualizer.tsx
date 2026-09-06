import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Activity, 
  BarChart2, 
  Waves, 
  Radio, 
  Sparkles, 
  Mic, 
  MicOff, 
  Sliders, 
  Maximize2, 
  Minimize2,
  Volume2
} from 'lucide-react';
import { Song } from '../store/playerStore';

export type VisualizerMode = 'bars' | 'wave' | 'circular' | 'particles';
export type VisualizerColorTheme = 'emerald' | 'cyan' | 'purple' | 'sunset';

interface AudioVisualizerProps {
  song: Song | null;
  isPlaying: boolean;
  volume: number; // 0 to 100
  progress: number; // in seconds
  variant?: 'full' | 'inline';
  onExpand?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  bandIndex: number;
}

export function AudioVisualizer({
  song,
  isPlaying,
  volume,
  progress,
  variant = 'full',
  onExpand,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Configuration state with persistence
  const [mode, setMode] = useState<VisualizerMode>(() => {
    try {
      const saved = localStorage.getItem('decibel_visualizer_mode');
      return (saved as VisualizerMode) || 'bars';
    } catch { return 'bars'; }
  });
  const [theme, setTheme] = useState<VisualizerColorTheme>(() => {
    try {
      const saved = localStorage.getItem('decibel_visualizer_theme');
      return (saved as VisualizerColorTheme) || 'sunset';
    } catch { return 'sunset'; }
  });
  const [sensitivity, setSensitivity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('decibel_visualizer_sensitivity');
      return saved ? parseFloat(saved) : 1.2;
    } catch { return 1.2; }
  });

  useEffect(() => {
    try { localStorage.setItem('decibel_visualizer_mode', mode); } catch {}
  }, [mode]);

  useEffect(() => {
    try { localStorage.setItem('decibel_visualizer_theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('decibel_visualizer_sensitivity', sensitivity.toString()); } catch {}
  }, [sensitivity]);

  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState<boolean>(false);


  // Web Audio API refs for real microphone/audio input
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Simulated frequency spectrum state
  const frequencyBandsCount = variant === 'inline' ? 32 : 64;
  const currentFrequenciesRef = useRef<Float32Array>(new Float32Array(frequencyBandsCount));
  const peakFrequenciesRef = useRef<Float32Array>(new Float32Array(frequencyBandsCount));
  const peakDecaySpeedRef = useRef<Float32Array>(new Float32Array(frequencyBandsCount));
  const particlesRef = useRef<Particle[]>([]);

  // Song tempo & harmonic seed derived from song ID
  const songSeed = useRef<number>(120);
  useEffect(() => {
    if (song?.id) {
      let hash = 0;
      for (let i = 0; i < song.id.length; i++) {
        hash = (hash << 5) - hash + song.id.charCodeAt(i);
        hash |= 0;
      }
      // BPM between 95 and 140
      songSeed.current = 95 + (Math.abs(hash) % 45);
    }
  }, [song?.id]);

  // Cleanup Web Audio stream on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Toggle Live Microphone / Audio capture
  const toggleMicrophoneInput = async () => {
    if (isMicActive) {
      // Disconnect
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setIsMicActive(false);
      setMicError(null);
    } else {
      // Connect
      setMicError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        setIsMicActive(true);
      } catch (err: any) {
        console.warn('Microphone access denied or unavailable:', err);
        setMicError('Microphone permission required for direct hardware capture.');
        setIsMicActive(false);
      }
    }
  };

  // Theme color maps
  const getThemeGradients = useCallback(
    (ctx: CanvasRenderingContext2D, height: number) => {
      let grad = ctx.createLinearGradient(0, height, 0, 0);
      switch (theme) {
        case 'cyan':
          grad.addColorStop(0, '#0284c7');
          grad.addColorStop(0.5, '#06b6d4');
          grad.addColorStop(1, '#67e8f9');
          return {
            main: grad,
            stroke: '#22d3ee',
            peak: '#a5f3fc',
            glow: 'rgba(6, 182, 212, 0.4)',
            particleColors: ['#0284c7', '#06b6d4', '#22d3ee', '#67e8f9'],
          };
        case 'purple':
          grad.addColorStop(0, '#7e22ce');
          grad.addColorStop(0.5, '#a855f7');
          grad.addColorStop(1, '#f472b6');
          return {
            main: grad,
            stroke: '#c084fc',
            peak: '#fbcfe8',
            glow: 'rgba(168, 85, 247, 0.4)',
            particleColors: ['#7e22ce', '#a855f7', '#c084fc', '#f472b6'],
          };
        case 'sunset':
          grad.addColorStop(0, '#ea580c');
          grad.addColorStop(0.5, '#f97316');
          grad.addColorStop(1, '#fde047');
          return {
            main: grad,
            stroke: '#fb923c',
            peak: '#fef08a',
            glow: 'rgba(249, 115, 22, 0.4)',
            particleColors: ['#ea580c', '#f97316', '#fb923c', '#fde047'],
          };
        case 'emerald':
        default:
          grad.addColorStop(0, '#059669');
          grad.addColorStop(0.5, '#10b981');
          grad.addColorStop(1, '#34d399');
          return {
            main: grad,
            stroke: '#10b981',
            peak: '#a7f3d0',
            glow: 'rgba(16, 185, 129, 0.4)',
            particleColors: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
          };
      }
    },
    [theme]
  );

  // Initialize particles
  const initParticles = useCallback(
    (width: number, height: number, colors: string[]) => {
      const particles: Particle[] = [];
      const count = variant === 'inline' ? 24 : 48;
      for (let i = 0; i < count; i++) {
        const radius = Math.random() * 3 + 2;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius,
          baseRadius: radius,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.6 + 0.2,
          bandIndex: Math.floor(Math.random() * frequencyBandsCount),
        });
      }
      particlesRef.current = particles;
    },
    [frequencyBandsCount, variant]
  );

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const themeConfig = getThemeGradients(ctx, height);
    initParticles(width, height, themeConfig.particleColors);

    // Audio frequency buffer
    const rawData = new Uint8Array(frequencyBandsCount);
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      const effectiveVolume = isPlaying ? volume / 100 : 0;
      const bpm = songSeed.current;
      const bps = bpm / 60;
      const beatProgress = (progress * bps) % 1; // 0 to 1 on beat
      const kickIntensity = Math.max(0, Math.sin(beatProgress * Math.PI) ** 3);

      // Read real hardware frequencies if mic is active, otherwise generate real-time physics spectrum
      if (isMicActive && analyserRef.current) {
        const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(buffer);
        // Map buffer to frequencyBandsCount
        for (let i = 0; i < frequencyBandsCount; i++) {
          const bufferIndex = Math.floor((i / frequencyBandsCount) * buffer.length);
          const rawVal = buffer[bufferIndex] / 255;
          const target = Math.min(1, rawVal * sensitivity);
          currentFrequenciesRef.current[i] += (target - currentFrequenciesRef.current[i]) * 0.25;
        }
      } else {
        // Smart dynamic audio synthesizer simulation
        for (let i = 0; i < frequencyBandsCount; i++) {
          let bandValue = 0;
          if (isPlaying && effectiveVolume > 0.02) {
            const normalizedBand = i / frequencyBandsCount; // 0 = sub-bass, 1 = high treble
            
            // Bass bands (0 - 15%): respond intensely to beat & kick
            if (normalizedBand < 0.2) {
              const bassOsc = Math.sin(time * 0.008 + i * 0.3) * 0.2 + 0.8;
              bandValue = (kickIntensity * 0.75 + bassOsc * 0.25) * (1 - normalizedBand * 1.5);
            } 
            // Midrange bands (20% - 60%): vocals and melodic rhythm
            else if (normalizedBand < 0.6) {
              const midWave1 = Math.sin(time * 0.006 + i * 0.4) * 0.3;
              const midWave2 = Math.cos(time * 0.01 + i * 0.2) * 0.25;
              const midRhythm = Math.sin((progress * bps * 2 + i * 0.2) * Math.PI) * 0.2;
              bandValue = 0.35 + midWave1 + midWave2 + midRhythm;
            } 
            // Treble / Highs (60% - 100%): quick shimmers, hi-hats
            else {
              const trebleFlicker = Math.sin(time * 0.015 + i * 0.7) * 0.25;
              const hiHatSnap = ((progress * bps * 4) % 1 < 0.25) ? 0.3 : 0.05;
              bandValue = (0.2 + trebleFlicker + hiHatSnap) * (1.2 - normalizedBand * 0.4);
            }

            // Modulate with sensitivity, volume, and natural noise variation
            const jitter = (Math.sin(time * 0.02 + i * 1.7) * 0.08);
            bandValue = Math.max(0.04, Math.min(1, (bandValue + jitter) * effectiveVolume * sensitivity));
          } else {
            // Smoothly drop to zero when paused
            bandValue = 0;
          }

          // Smooth frequency transition with spring damping
          const current = currentFrequenciesRef.current[i];
          const target = bandValue;
          currentFrequenciesRef.current[i] += (target - current) * (target > current ? 0.35 : 0.18);

          // Update peaks with realistic gravity and hold
          if (currentFrequenciesRef.current[i] > peakFrequenciesRef.current[i]) {
            peakFrequenciesRef.current[i] = currentFrequenciesRef.current[i];
            peakDecaySpeedRef.current[i] = 0;
          } else {
            peakDecaySpeedRef.current[i] += 0.8 * dt;
            peakFrequenciesRef.current[i] = Math.max(
              0,
              peakFrequenciesRef.current[i] - peakDecaySpeedRef.current[i] * dt * 0.6
            );
          }
        }
      }

      const colors = getThemeGradients(ctx, height);

      // --- RENDERING MODES ---
      if (mode === 'bars') {
        // --- 1. FREQUENCY SPECTRUM BARS ---
        const totalBars = frequencyBandsCount;
        const gap = variant === 'inline' ? 2 : 3;
        const barWidth = Math.max(2, (width - (totalBars - 1) * gap) / totalBars);
        const maxHeight = height * 0.88;

        for (let i = 0; i < totalBars; i++) {
          const val = currentFrequenciesRef.current[i];
          const peakVal = peakFrequenciesRef.current[i];
          const barHeight = Math.max(4, val * maxHeight);
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          // Ambient bar glow
          if (val > 0.4 && variant === 'full') {
            ctx.shadowColor = colors.glow;
            ctx.shadowBlur = 10 * val;
          } else {
            ctx.shadowBlur = 0;
          }

          // Draw main bar with rounded top
          ctx.fillStyle = colors.main;
          ctx.beginPath();
          const radius = Math.min(barWidth / 2, 4);
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
          ctx.fill();

          // Draw peak floating cap
          if (peakVal > 0.05 && variant === 'full') {
            const peakY = height - Math.max(4, peakVal * maxHeight) - 3;
            ctx.fillStyle = colors.peak;
            ctx.shadowColor = colors.peak;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(x, peakY, barWidth, 2, [1, 1, 1, 1]);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      } else if (mode === 'wave') {
        // --- 2. SMOOTH OSCILLOSCOPE WAVE ---
        ctx.lineWidth = variant === 'inline' ? 2.5 : 3.5;
        ctx.strokeStyle = colors.stroke;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 12;

        const centerY = height / 2;
        const sliceWidth = width / (frequencyBandsCount - 1);

        ctx.beginPath();
        for (let i = 0; i < frequencyBandsCount; i++) {
          const val = currentFrequenciesRef.current[i];
          const x = i * sliceWidth;
          const amp = val * (height * 0.42);
          const wavePhase = Math.sin(time * 0.005 + i * 0.2);
          const y = centerY + wavePhase * amp;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = (i - 1) * sliceWidth;
            const prevVal = currentFrequenciesRef.current[i - 1];
            const prevAmp = prevVal * (height * 0.42);
            const prevY = centerY + Math.sin(time * 0.005 + (i - 1) * 0.2) * prevAmp;
            const xc = (prevX + x) / 2;
            const yc = (prevY + y) / 2;
            ctx.quadraticCurveTo(prevX, prevY, xc, yc);
          }
        }
        ctx.stroke();

        // Mirrored wave with lower opacity
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = colors.peak;
        for (let i = 0; i < frequencyBandsCount; i++) {
          const val = currentFrequenciesRef.current[i];
          const x = i * sliceWidth;
          const amp = val * (height * 0.25);
          const wavePhase = Math.cos(time * 0.004 + i * 0.25);
          const y = centerY - wavePhase * amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (mode === 'circular') {
        // --- 3. CIRCULAR RADIAL PULSE ---
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;
        const maxSpike = Math.min(width, height) * 0.24;

        // Central glowing core
        const avgEnergy =
          currentFrequenciesRef.current.reduce((a, b) => a + b, 0) / frequencyBandsCount;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * (0.95 + avgEnergy * 0.15), 0, Math.PI * 2);
        ctx.fillStyle = colors.glow;
        ctx.fill();

        const points = frequencyBandsCount;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 3;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
          const val = currentFrequenciesRef.current[i];
          const r = baseRadius + val * maxSpike;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Radiating rays
        for (let i = 0; i < points; i += 2) {
          const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
          const val = currentFrequenciesRef.current[i];
          if (val > 0.1) {
            const innerX = centerX + Math.cos(angle) * (baseRadius + 2);
            const innerY = centerY + Math.sin(angle) * (baseRadius + 2);
            const outerX = centerX + Math.cos(angle) * (baseRadius + val * maxSpike * 1.15);
            const outerY = centerY + Math.sin(angle) * (baseRadius + val * maxSpike * 1.15);

            ctx.beginPath();
            ctx.moveTo(innerX, innerY);
            ctx.lineTo(outerX, outerY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = colors.peak;
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
      } else if (mode === 'particles') {
        // --- 4. BOUNCING DANCING PARTICLES ---
        const particles = particlesRef.current;
        const avgEnergy =
          currentFrequenciesRef.current.reduce((a, b) => a + b, 0) / frequencyBandsCount;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const bandEnergy = currentFrequenciesRef.current[p.bandIndex] || avgEnergy;

          // Speed reacts dynamically to sound frequency
          const speedMultiplier = 1 + bandEnergy * 3.5;
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          // Bounce off bounds
          if (p.x < 0) {
            p.x = 0;
            p.vx *= -1;
          } else if (p.x > width) {
            p.x = width;
            p.vx *= -1;
          }
          if (p.y < 0) {
            p.y = 0;
            p.vy *= -1;
          } else if (p.y > height) {
            p.y = height;
            p.vy *= -1;
          }

          p.radius = p.baseRadius * (1 + bandEnergy * 2);

          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, p.alpha * (0.6 + bandEnergy * 0.8));
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8 * bandEnergy;
          ctx.fill();

          // Connect adjacent particles with subtle lines
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 70) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = p.color;
              ctx.globalAlpha = (1 - dist / 70) * 0.3 * (0.5 + bandEnergy);
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [
    mode,
    theme,
    sensitivity,
    isPlaying,
    volume,
    progress,
    isMicActive,
    frequencyBandsCount,
    getThemeGradients,
    initParticles,
    variant,
  ]);

  // Inline Variant (Sleek Spectrum Bar below Artwork)
  if (variant === 'inline') {
    return (
      <div 
        id="inline-audio-visualizer"
        className="w-full relative group rounded-xl overflow-hidden bg-black/40 border border-white/10 p-3 shadow-lg flex flex-col gap-2 transition-all hover:border-primary/40"
      >
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-primary opacity-75' : 'bg-neutral-600 opacity-20'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-primary' : 'bg-neutral-600'}`}></span>
            </span>
            <span className="font-semibold tracking-wide uppercase text-[10px] text-neutral-300">
              Live Spectrum
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onExpand && (
              <button
                onClick={onExpand}
                className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                title="Expand full visualizer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visualizer View</span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full h-16 relative" ref={containerRef}>
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>
    );
  }

  // Full Screen / Dedicated Visualizer View
  return (
    <div 
      id="full-audio-visualizer-container"
      className="w-full h-full flex flex-col items-center justify-between relative select-none"
    >
      {/* Visualizer Top Control Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 mb-4 z-20 shadow-xl">
        {/* Modes Switcher */}
        <div className="flex items-center gap-1">
          <button
            id="viz-mode-bars-btn"
            onClick={() => setMode('bars')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'bars' ? 'bg-white/20 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
            title="Frequency Spectrum Bars"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bars</span>
          </button>

          <button
            id="viz-mode-wave-btn"
            onClick={() => setMode('wave')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'wave' ? 'bg-white/20 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
            title="Oscilloscope Waveform"
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wave</span>
          </button>

          <button
            id="viz-mode-circular-btn"
            onClick={() => setMode('circular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'circular' ? 'bg-white/20 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
            title="Circular Radial Pulse"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radial</span>
          </button>

          <button
            id="viz-mode-particles-btn"
            onClick={() => setMode('particles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'particles' ? 'bg-white/20 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
            title="Floating Bouncing Particles"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Particles</span>
          </button>
        </div>

        {/* Action controls right side */}
        <div className="flex items-center gap-2">
          {/* Live Mic / Audio Input Toggle */}
          <button
            id="viz-mic-toggle-btn"
            onClick={toggleMicrophoneInput}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isMicActive
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title={isMicActive ? 'Disable Microphone Input' : 'Enable Real Microphone / Tab Audio Capture'}
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isMicActive ? 'Mic Active' : 'Live Mic'}</span>
          </button>

          {/* Quick Settings Drawer Toggle */}
          <button
            id="viz-settings-toggle-btn"
            onClick={() => setShowControls((prev) => !prev)}
            className={`p-1.5 rounded-xl text-xs transition-colors border ${
              showControls
                ? 'bg-primary text-black border-primary font-semibold'
                : 'text-neutral-400 hover:text-white bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            title="Visualizer Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Settings Drawer */}
      {showControls && (
        <div className="w-full bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-4 z-20 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Color Palette Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Palette:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTheme('emerald')}
                  className={`w-6 h-6 rounded-full bg-emerald-500 transition-transform ${
                    theme === 'emerald' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Emerald Green"
                />
                <button
                  onClick={() => setTheme('cyan')}
                  className={`w-6 h-6 rounded-full bg-cyan-500 transition-transform ${
                    theme === 'cyan' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Cyber Cyan"
                />
                <button
                  onClick={() => setTheme('purple')}
                  className={`w-6 h-6 rounded-full bg-purple-500 transition-transform ${
                    theme === 'purple' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Neon Purple"
                />
                <button
                  onClick={() => setTheme('sunset')}
                  className={`w-6 h-6 rounded-full bg-orange-500 transition-transform ${
                    theme === 'sunset' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'
                  }`}
                  title="Sunset Gold"
                />
              </div>
            </div>

            {/* Sensitivity Slider */}
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                Gain ({sensitivity.toFixed(1)}x):
              </span>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full accent-primary h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {micError && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              {micError}
            </p>
          )}
        </div>
      )}

      {/* Main Visualizer Stage */}
      <div 
        className="w-full flex-1 relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl flex items-center justify-center p-4 min-h-[260px] pointer-events-none"
        ref={containerRef}
      >
        <canvas ref={canvasRef} className="w-full h-full block pointer-events-none absolute inset-0 z-0" />

        {/* Ambient Center Song Badge for Circular mode */}
        {mode === 'circular' && song && (
          <div className="relative z-10 pointer-events-none flex flex-col items-center justify-center text-center max-w-[150px] p-2">
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-16 h-16 rounded-full object-cover shadow-xl border border-white/20 mb-2 animate-spin-slow"
              style={{
                animationPlayState: isPlaying ? 'running' : 'paused',
                animationDuration: '24s',
              }}
            />
            <span className="text-xs font-bold text-white truncate max-w-full drop-shadow">
              {song.title}
            </span>
          </div>
        )}

        {/* Playback status hint */}
        {!isPlaying && (
          <div className="absolute bottom-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-neutral-400 flex items-center gap-1.5 pointer-events-none z-10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Playback paused - Visualizer idling
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full flex items-center justify-between text-xs text-neutral-400 pt-3 px-2">
        <span className="flex items-center gap-1.5 font-medium">
          <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
          Real-time 60 FPS Frequency Analysis
        </span>
        <span className="text-[11px] text-neutral-500">
          Mode: <span className="text-neutral-300 capitalize">{mode}</span> • 64 Frequency Bands
        </span>
      </div>
    </div>
  );
}
