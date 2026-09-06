import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import MiniPlayer from './MiniPlayer';
import UserProfileModal from './UserProfileModal';
import { usePlayer } from '../store/playerStore';

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { currentSong, playSong } = usePlayer();

  // Load initial track if none active
  useEffect(() => {
    let isMounted = true;

    // If no song loaded yet, initialize with default track
    if (!currentSong) {
      axios.get('/api/discover')
        .then((res) => {
          if (isMounted && res.data?.companionInitialTrack && !currentSong) {
            playSong(res.data.companionInitialTrack);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0c] text-white select-none relative font-sans">
      {/* Deep Onyx Ambience Glow Elements */}
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1c120c]/40 via-[#0a0a0c]/80 to-[#0a0a0c] pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <Sidebar 
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Header Bar */}
        <TopAppBar
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Main Content View with Top & Bottom padding */}
        <main className="flex-1 overflow-y-auto min-w-0 md:pt-16 pb-[100px] md:pb-[104px]">
          <Outlet />
        </main>
      </div>

      {/* Persistent Bottom MiniPlayer Bar */}
      <MiniPlayer />

      {/* User Profile & Username Modal */}
      <UserProfileModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
