interface AutoRefreshSettings {
  enabled: boolean;
  interval: number; // in seconds
}

class AutoRefreshService {
  private settings: AutoRefreshSettings = {
    enabled: false,
    interval: 30
  };
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.autoRefresh !== undefined) this.settings.enabled = settings.autoRefresh;
        if (settings.refreshInterval !== undefined) this.settings.interval = settings.refreshInterval;
      }
    } catch (error) {
      console.error('Failed to load auto-refresh settings:', error);
    }
  }

  private saveSettings() {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        settings.autoRefresh = this.settings.enabled;
        settings.refreshInterval = this.settings.interval;
        localStorage.setItem('appSettings', JSON.stringify(settings));
      } else {
        // Create new settings object if it doesn't exist
        const settings = {
          autoRefresh: this.settings.enabled,
          refreshInterval: this.settings.interval
        };
        localStorage.setItem('appSettings', JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Failed to save auto-refresh settings:', error);
    }
  }

  updateSettings(newSettings: Partial<AutoRefreshSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.restartInterval();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private restartInterval() {
    this.stopInterval();
    if (this.settings.enabled) {
      this.startInterval();
    }
  }

  private startInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      console.log('🔄 Auto-refresh: Refreshing data...');
      this.notifyListeners();
    }, this.settings.interval * 1000);
  }

  private stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  enable() {
    this.settings.enabled = true;
    this.saveSettings();
    this.startInterval();
  }

  disable() {
    this.settings.enabled = false;
    this.saveSettings();
    this.stopInterval();
  }

  setInterval(seconds: number) {
    this.settings.interval = Math.max(10, Math.min(300, seconds)); // Between 10 and 300 seconds
    this.saveSettings();
    this.restartInterval();
  }

  getSettings(): AutoRefreshSettings {
    return { ...this.settings };
  }

  isEnabled(): boolean {
    return this.settings.enabled;
  }

  getInterval(): number {
    return this.settings.interval;
  }

  // Manual refresh trigger
  refresh() {
    console.log('🔄 Manual refresh triggered');
    this.notifyListeners();
  }

  // Cleanup
  destroy() {
    this.stopInterval();
    this.listeners = [];
  }
}

export const autoRefreshService = new AutoRefreshService(); 