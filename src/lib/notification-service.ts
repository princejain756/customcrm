import { toast } from 'sonner';

export interface UINotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  sound: boolean;
  desktop: boolean;
}

class NotificationService {
  private notifications: UINotification[] = [];
  private listeners: Array<() => void> = [];
  private unreadCount: number = 0;
  private settings: NotificationSettings = {
    email: true,
    push: true,
    sms: false,
    sound: true,
    desktop: true
  };

  constructor() {
    this.loadSettings();
    // Force clear all notifications on startup to remove any fake ones
    this.forceClearAll();
    
    // Also clear any fake notifications that might be in localStorage
    setTimeout(() => {
      this.removeFakeNotifications();
    }, 100);
  }

  // Settings management
  private loadSettings() {
    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Notification list management
  private loadNotifications() {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        const loadedNotifications = JSON.parse(saved).map((n: { timestamp: string; [key: string]: unknown }) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        
        // Filter out fake notifications
        this.notifications = loadedNotifications.filter((notification: UINotification) => {
          // Remove notifications with generic titles or fake content
          return !notification.title.includes('System Update') && 
                 !notification.message.includes('Storage optimization') &&
                 !notification.message.includes('Tally integration completed') &&
                 !notification.message.includes('Data backup completed') &&
                 !notification.message.includes('System update available') &&
                 !notification.message.includes('New bill scanned successfully');
        });
        
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Public API
  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getNotifications(): UINotification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.unreadCount;
  }

  addNotification(notification: Omit<UINotification, 'id' | 'timestamp' | 'read'>): void {
    // Check if this is a fake notification and prevent it
    if (this.isFakeNotification(notification)) {
      console.log('Preventing fake notification:', notification);
      return;
    }

    const newNotification: UINotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.updateUnreadCount();
    this.saveNotifications();
    this.notifyListeners();

    // Show notification based on settings
    this.showNotification(newNotification.title, newNotification.message, newNotification.type);
  }

  // Check if a notification is fake
  private isFakeNotification(notification: Omit<UINotification, 'id' | 'timestamp' | 'read'>): boolean {
    const fakeTitles = ['System Update', 'Welcome to ScanBill!', 'New Feature Available'];
    const fakeMessages = [
      'Storage optimization completed',
      'Tally integration completed',
      'Data backup completed',
      'System update available',
      'New bill scanned successfully',
      'Your bill scanning and Tally integration is ready to use',
      'Auto-refresh functionality has been added to keep your data up to date',
      'You have 85% of your storage space remaining'
    ];

    return fakeTitles.includes(notification.title) || 
           fakeMessages.some(msg => notification.message.includes(msg));
  }

  // Remove any fake notifications that might exist
  private removeFakeNotifications(): void {
    const currentNotifications = this.getNotifications();
    const realNotifications = currentNotifications.filter(notification => !this.isFakeNotification(notification));
    
    if (currentNotifications.length !== realNotifications.length) {
      this.notifications = realNotifications;
      this.updateUnreadCount();
      this.saveNotifications();
      this.notifyListeners();
      console.log('Fake notifications removed');
    }
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.updateUnreadCount();
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.updateUnreadCount();
    this.saveNotifications();
    this.notifyListeners();
  }

  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.updateUnreadCount();
    this.saveNotifications();
    this.notifyListeners();
  }

  clearAll(): void {
    this.notifications = [];
    this.updateUnreadCount();
    this.saveNotifications();
    this.notifyListeners();
  }

  // Force clear all notifications and prevent fake ones
  forceClearAll(): void {
    // Clear from localStorage
    localStorage.removeItem('notifications');
    // Clear from memory
    this.notifications = [];
    this.unreadCount = 0;
    // Notify listeners
    this.notifyListeners();
    console.log('All notifications cleared - fake notifications removed');
  }

  // Real notifications only - no demo notifications
  addRealNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    // Only add notifications with real titles (not generic "System Update")
    if (title !== 'System Update' && !title.includes('demo') && !title.includes('fake')) {
      this.addNotification({
        title,
        message,
        type
      });
    }
  }

  // Real-time updates for actual events
  startRealTimeUpdates(): void {
    // Only start real-time updates if there are actual events to listen for
    // This will be called when real events occur (lead creation, bill scanning, etc.)
    console.log('Real-time notification updates started');
  }

  stopRealTimeUpdates(): void {
    // Stop any real-time update intervals
    console.log('Real-time notification updates stopped');
  }

  // Permission management
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Enhanced notification display
  showNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    // Toast notification (always shown)
    toast[type](message, {
      description: title,
      duration: 5000
    });

    // Desktop notification (if enabled and permitted)
    if (this.settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: 'scanbill-notification'
      });
    }

    // Sound notification (if enabled)
    if (this.settings.sound) {
      this.playNotificationSound();
    }

    // Push notification (if enabled)
    if (this.settings.push) {
      this.sendPushNotification(title, message);
    }

    // Email notification (if enabled)
    if (this.settings.email) {
      this.sendEmailNotification(title, message);
    }

    // SMS notification (if enabled)
    if (this.settings.sms) {
      this.sendSMSNotification(title, message);
    }
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback: create a simple beep sound
        const context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  private sendPushNotification(title: string, message: string): void {
    // Simulate push notification
    console.log('Push notification sent:', { title, message });
  }

  private sendEmailNotification(title: string, message: string): void {
    // Simulate email notification
    console.log('Email notification sent:', { title, message });
  }

  private sendSMSNotification(title: string, message: string): void {
    // Simulate SMS notification
    console.log('SMS notification sent:', { title, message });
  }
}

export const notificationService = new NotificationService(); 