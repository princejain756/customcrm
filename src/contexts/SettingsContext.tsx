import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserSettings {
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    sound: boolean;
    desktop: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'team';
    showOnlineStatus: boolean;
    allowMessages: boolean;
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
    telemetry: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

const defaultSettings: UserSettings = {
  language: 'en',
  notifications: {
    email: true,
    push: true,
    sms: false,
    sound: true,
    desktop: true
  },
  privacy: {
    profileVisibility: 'private',
    showOnlineStatus: true,
    allowMessages: true,
    dataCollection: true,
    analytics: true,
    crashReporting: false,
    telemetry: false
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false
  }
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateNotificationSettings: (newSettings: Partial<UserSettings['notifications']>) => void;
  updatePrivacySettings: (newSettings: Partial<UserSettings['privacy']>) => void;
  updateAccessibilitySettings: (newSettings: Partial<UserSettings['accessibility']>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  }, [settings]);

  // Apply accessibility classes
  useEffect(() => {
    // High contrast
    if (settings.accessibility.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Large text
    if (settings.accessibility.largeText) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }

    // Reduce motion
    if (settings.accessibility.reduceMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }

    // Screen reader support
    if (settings.accessibility.screenReader) {
      document.body.setAttribute('aria-live', 'polite');
    } else {
      document.body.removeAttribute('aria-live');
    }
  }, [settings.accessibility]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateNotificationSettings = (newSettings: Partial<UserSettings['notifications']>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...newSettings }
    }));
  };

  const updatePrivacySettings = (newSettings: Partial<UserSettings['privacy']>) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, ...newSettings }
    }));
  };

  const updateAccessibilitySettings = (newSettings: Partial<UserSettings['accessibility']>) => {
    setSettings(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, ...newSettings }
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAccessibilitySettings,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 