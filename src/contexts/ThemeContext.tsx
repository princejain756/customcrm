import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
  showAvatars: boolean;
  setShowAvatars: (enabled: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState('system');
  const [compactMode, setCompactMode] = useState(false);
  const [showAvatars, setShowAvatars] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // 30 seconds

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.theme) setThemeState(settings.theme);
        if (settings.compactMode !== undefined) setCompactMode(settings.compactMode);
        if (settings.showAvatars !== undefined) setShowAvatars(settings.showAvatars);
        if (settings.autoRefresh !== undefined) setAutoRefresh(settings.autoRefresh);
        if (settings.refreshInterval !== undefined) setRefreshInterval(settings.refreshInterval);
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      const settings = {
        theme,
        compactMode,
        showAvatars,
        autoRefresh,
        refreshInterval
      };
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  }, [theme, compactMode, showAvatars, autoRefresh, refreshInterval]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Apply the selected theme
    if (theme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Apply compact mode class
  useEffect(() => {
    if (compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [compactMode]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    compactMode,
    setCompactMode,
    showAvatars,
    setShowAvatars,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 