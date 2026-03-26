import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

export type ThemeName = 'classic' | 'modern' | 'vibrant' | 'minimal';

interface ThemeContextType {
  theme: ThemeName;
  isDarkMode: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('app-theme') as ThemeName) || 'classic';
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('app-dark-mode') === 'true';
  });

  // Load theme from backend on user login
  useEffect(() => {
    if (user) {
      api.getUserTheme(user.id).then(data => {
        if (data && data.theme) {
          setThemeState(data.theme as ThemeName);
          setIsDarkMode(data.is_dark);
        }
      }).catch(err => console.error("Failed to load user theme:", err));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (user) {
      api.updateUserTheme(user.id, theme, isDarkMode).catch(err => console.error("Failed to sync theme:", err));
    }
  }, [theme, user, isDarkMode]);

  useEffect(() => {
    localStorage.setItem('app-dark-mode', String(isDarkMode));
    // Always force dark mode
    document.documentElement.classList.add('dark');
  }, [isDarkMode]);

  const setTheme = (newTheme: ThemeName) => setThemeState(newTheme);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
