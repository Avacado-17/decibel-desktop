import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const USERNAME_KEY = 'decibel_user_username';
const USER_CHANGE_EVENT = 'decibel:user-profile-change';
const DEFAULT_USERNAME = 'Music Explorer';

interface UserContextType {
  username: string;
  updateUsername: (name: string) => void;
  resetProfile: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(USERNAME_KEY);
      return saved && saved.trim() ? saved.trim() : DEFAULT_USERNAME;
    } catch {
      return DEFAULT_USERNAME;
    }
  });

  // Listen to cross-tab storage events or internal change events for consistency
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USERNAME_KEY && e.newValue) {
        setUsername(e.newValue);
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ username?: string }>;
      if (customEvent.detail?.username) {
        setUsername(customEvent.detail.username);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(USER_CHANGE_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(USER_CHANGE_EVENT, handleCustomChange);
    };
  }, []);

  const updateUsername = (name: string) => {
    const trimmed = name.trim() || 'Music Explorer';
    setUsername(trimmed);
    try {
      localStorage.setItem(USERNAME_KEY, trimmed);
      window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT, { detail: { username: trimmed } }));
    } catch (e) {
      console.error('Failed to save username in localStorage:', e);
    }
  };

  const resetProfile = () => {
    setUsername(DEFAULT_USERNAME);
    try {
      localStorage.removeItem(USERNAME_KEY);
      window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT, { 
        detail: { username: DEFAULT_USERNAME } 
      }));
    } catch (e) {
      console.error('Failed to reset profile in localStorage:', e);
    }
  };

  return (
    <UserContext.Provider
      value={{
        username,
        updateUsername,
        resetProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

