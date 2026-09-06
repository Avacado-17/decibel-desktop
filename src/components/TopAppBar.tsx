import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { useUser } from '../store/userStore';

interface TopAppBarProps {
  onOpenSettings: () => void;
}

export default function TopAppBar({
  onOpenSettings,
}: TopAppBarProps) {
  const navigate = useNavigate();
  const { username } = useUser();

  return (
    <header className="hidden md:flex justify-between items-center h-16 px-8 bg-[#0a0a0c]/80 backdrop-blur-xl fixed top-0 right-0 left-16 md:left-64 z-30 border-b border-[#ff6600]/10 select-none">
      {/* Navigation Links */}
      <nav className="flex gap-7 items-center font-medium">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `transition-all relative flex items-center gap-1.5 text-sm ${
              isActive
                ? 'text-[#ff6600] font-semibold'
                : 'text-neutral-400 hover:text-[#ff7a1a]'
            }`
          }
        >
          Discover
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600] shadow-[0_0_8px_#ff6600]" />
        </NavLink>
      </nav>

      {/* Action Icons & User Profile */}
      <div className="flex items-center gap-3 text-neutral-400">
        <button
          onClick={() => navigate('/search')}
          className="hover:text-[#ff6600] hover:bg-[#ff6600]/10 transition-all p-2 rounded-full"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* User Profile Button with Name */}
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#ff6600]/15 border border-white/10 hover:border-[#ff6600]/40 transition-all cursor-pointer group shadow-sm ml-1"
          title="Edit Username"
        >
          <div className="w-5 h-5 rounded-full bg-[#ff6600]/15 text-[#ff6600] group-hover:bg-[#ff6600] group-hover:text-black flex items-center justify-center transition-colors">
            <User className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-neutral-200 group-hover:text-white max-w-[130px] truncate transition-colors">
            {username}
          </span>
        </button>
      </div>
    </header>
  );
}
