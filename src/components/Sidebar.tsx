import { NavLink } from 'react-router-dom';
import { 
  Home, Search, Library, ListMusic, User, Music 
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { usePlayer } from '../store/playerStore';

interface SidebarProps {
  onOpenSettings?: () => void;
  onSelectPlaylist?: (playlistName: string) => void;
}

export default function Sidebar({ onOpenSettings }: SidebarProps) {
  const { username } = useUser();
  const { userPlaylists = [] } = usePlayer();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/library', icon: Library, label: 'Your Library' },
  ];

  return (
    <aside className="w-16 md:w-64 bg-[#0c0c0f]/90 backdrop-blur-2xl flex flex-col p-4 md:p-6 h-full border-r border-[#ff6600]/15 shadow-[4px_0_24px_rgba(0,0,0,0.8)] shrink-0 select-none z-40">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 md:pl-2">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-black border border-[#ff6600]/40 shadow-[0_0_18px_rgba(255,102,0,0.5)]">
          <img 
            src="/decibel-cover.jpg" 
            alt="Decibel Cover" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden md:block">
          <h1 className="text-white font-black text-[22px] tracking-wider leading-none flex items-center gap-1 font-sans">
            DECI<span className="text-[#ff6600] drop-shadow-[0_0_12px_rgba(255,102,0,0.8)]">BEL</span>
          </h1>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto scrollbar-none">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-3 md:px-4 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'text-white font-semibold bg-gradient-to-r from-[#ff6600]/20 to-transparent border-l-4 border-[#ff6600] shadow-[inset_1px_0_8px_rgba(255,102,0,0.2)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0 group-hover:text-[#ff7a1a] transition-colors" />
            <span className="hidden md:inline">{item.label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/library?view=playlists"
          className={({ isActive }) =>
            `flex items-center gap-4 px-3 md:px-4 py-2.5 rounded-lg text-sm transition-all group mt-2 ${
              isActive
                ? 'text-white font-semibold bg-gradient-to-r from-[#ff6600]/20 to-transparent border-l-4 border-[#ff6600]'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <ListMusic className="w-5 h-5 shrink-0 group-hover:text-[#ff7a1a] transition-colors" />
          <span className="hidden md:inline">Playlists</span>
        </NavLink>

        {/* User Playlists List in Sidebar */}
        <div className="hidden md:flex flex-col gap-1 mt-3 pt-3 border-t border-white/10">
          <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Your Playlists
          </span>
          {userPlaylists.length === 0 ? (
            <span className="px-4 text-xs text-neutral-500 italic">No playlists yet</span>
          ) : (
            userPlaylists.map((pl) => (
              <NavLink
                key={pl.id}
                to={`/library?playlistId=${pl.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-xs truncate transition-colors ${
                    isActive ? 'text-[#ff6600] font-semibold bg-white/5' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Music className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{pl.name}</span>
              </NavLink>
            ))
          )}
        </div>
      </nav>

      {/* User Profile & Settings button */}
      <div className="pt-4 border-t border-white/10 md:border-t-0">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3 px-3 md:px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-white/5 w-full transition-colors group"
          title="User Profile & Preferences"
        >
          <div className="w-5 h-5 rounded-full bg-[#ff6600]/15 text-[#ff6600] group-hover:bg-[#ff6600] group-hover:text-black flex items-center justify-center shrink-0 transition-colors">
            <User className="w-3 h-3" />
          </div>
          <span className="hidden md:inline truncate font-medium">{username}</span>
        </button>
      </div>
    </aside>
  );
}
