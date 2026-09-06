import YouTube from 'react-youtube';
import { usePlayer } from '../store/playerStore';

export default function YouTubePlayer() {
  const { currentSong, onPlayerReady, onPlayerStateChange } = usePlayer();

  if (!currentSong) return null;

  const opts = {
    height: '1',
    width: '1',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="fixed -top-[9999px] -left-[9999px] w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden z-[-1]">
      <YouTube 
        videoId={currentSong.id} 
        opts={opts} 
        onReady={onPlayerReady} 
        onStateChange={onPlayerStateChange} 
      />
    </div>
  );
}
