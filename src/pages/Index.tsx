import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Settings, 
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Database,
  BarChart3,
  Calendar,
  User,
  LogOut,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { notificationService, UINotification } from '@/lib/notification-service';
import { autoRefreshService } from '@/lib/auto-refresh-service';
import { dashboardService } from '@/lib/dashboard-service';
import { DashboardStats } from '@/lib/types';
import NotificationsPanel from '@/components/NotificationsPanel';
import SettingsPanel from '@/components/SettingsPanel';
import SignOutDialog from '@/components/SignOutDialog';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';


// Import the individual modules
import BillScanner from '@/components/BillScanner';
import InvoiceManager from '@/components/InvoiceManager';
import TallyIntegration from '@/components/TallyIntegration';
import LeadCreation from '@/components/LeadCreation';
import OrderCreation from '@/components/OrderCreation';

const Index: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme, compactMode, setCompactMode, showAvatars, setShowAvatars, autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval } = useTheme();
  
  // Navigation state
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    try {
      await notificationService.requestPermission();
      
      // Force clear all notifications on startup to remove any fake ones
      notificationService.forceClearAll();
      
      const unsubscribe = notificationService.subscribe(() => {
        setNotifications(notificationService.getNotifications());
        setUnreadCount(notificationService.getUnreadCount());
      });

      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());

      // Only start real-time updates for actual events
      // No demo notifications - only real notifications will be shown

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      // For now, use a default organisation ID or skip stats
      const stats = await dashboardService.getDashboardStats('default');
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Initialize auto-refresh
  const initializeAutoRefresh = useCallback(() => {
    if (autoRefresh) {
      autoRefreshService.enable();
      autoRefreshService.setInterval(refreshInterval);
    } else {
      autoRefreshService.disable();
    }
  }, [autoRefresh, refreshInterval]);

  // Notification handlers
  const handleMarkAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const handleDeleteNotification = useCallback((id: string) => {
    notificationService.deleteNotification(id);
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    notificationService.forceClearAll();
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initNotifications = async () => {
      const unsubscribe = await initializeNotifications();
      if (unsubscribe) {
        return unsubscribe;
      }
    };
    
    initNotifications();
    initializeAutoRefresh();
    
    // Only fetch dashboard stats if user is authenticated
    if (user) {
      fetchDashboardStats();
    }

    return () => {
      autoRefreshService.destroy();
    };
  }, [initializeNotifications, initializeAutoRefresh, fetchDashboardStats, user]);

  // Update auto-refresh when settings change
  useEffect(() => {
    initializeAutoRefresh();
  }, [initializeAutoRefresh]);

  // Navigation modules
  const modules = [
    {
      id: 'lead-creation',
      title: 'Create Lead',
      description: 'Create and manage new leads',
      icon: User,
      color: 'bg-blue-500',
      component: LeadCreation
    },
    {
      id: 'bill-scanner',
      title: 'Bill Scanner',
      description: 'Upload and scan bills to extract data automatically',
      icon: Upload,
      color: 'bg-blue-500',
      component: BillScanner
    },
    {
      id: 'order-creation',
      title: 'Create Order',
      description: 'Create and manage customer orders with products and pricing',
      icon: ShoppingCart,
      color: 'bg-green-500',
      component: OrderCreation
    },
    {
      id: 'invoice-manager',
      title: 'Invoice Manager',
      description: 'Create and manage invoices from scanned bills',
      icon: FileText,
      color: 'bg-blue-500',
      component: InvoiceManager
    },
    {
      id: 'tally-integration',
      title: 'Tally Integration',
      description: 'Export data to Tally ERP for accounting',
      icon: Database,
      color: 'bg-purple-500',
      component: TallyIntegration
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'View detailed reports and analytics',
      icon: BarChart3,
      color: 'bg-orange-500',
      component: null // Placeholder
    },
    {
      id: 'customers',
      title: 'Customer Management',
      description: 'Manage customer information and relationships',
      icon: Users,
      color: 'bg-indigo-500',
      component: null // Placeholder
    },
    {
      id: 'calendar',
      title: 'Calendar & Events',
      description: 'Schedule and manage appointments',
      icon: Calendar,
      color: 'bg-pink-500',
      component: null // Placeholder
    }
  ];

  const handleModuleClick = (moduleId: string) => {
    setCurrentModule(moduleId);
  };

  const handleBackToDashboard = () => {
    setCurrentModule(null);
  };

  const getCurrentModule = () => {
    const module = modules.find(m => m.id === currentModule);
    return module;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a module is selected, show that module
  if (currentModule) {
    const module = getCurrentModule();
    if (module?.component) {
      const ModuleComponent = module.component;
      return (
        <div className="min-h-screen">
          {/* Module Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2"
                  >
                    ← Back to Dashboard
                  </Button>
                  <h1 className="text-xl font-bold">{module.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(true)}
                    className="relative"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-2">
                    {showAvatars && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSignOut(true)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Module Content */}
          <main className="container mx-auto px-4 py-6">
            <ModuleComponent />
          </main>
        </div>
      );
    }
  }

  // Main Dashboard
  return (
    <div className={`min-h-screen ${compactMode ? 'compact-mode' : ''}`}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">ScanBill to Tally</h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Professional CRM
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user?.name}</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  {user?.role || 'sales person'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSignOut(true)}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-muted-foreground">Manage your leads, orders, and bills efficiently.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ₹{dashboardStats?.total_revenue?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{dashboardStats?.growth_percentage || 12.5}% from last month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {dashboardStats?.active_customers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +2 new this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {dashboardStats?.pending_bills || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₹12,400 pending
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {dashboardStats?.recent_leads?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.recent_orders?.length || 0} orders placed
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        

        {/* Search Bar and Action Buttons */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search leads, orders, customers, or amounts..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={() => handleModuleClick('lead-creation')}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                + New Lead
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50 shadow-sm"
                onClick={() => handleModuleClick('order-creation')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Order
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50 shadow-sm"
                onClick={() => handleModuleClick('bill-scanner')}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan Bill
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50 shadow-sm"
                onClick={() => handleModuleClick('tally-integration')}
              >
                <Database className="h-4 w-4 mr-2" />
                Sync Tally
              </Button>
            </div>
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button className="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                Dashboard
              </button>
              <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                Leads
              </button>
              <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                Orders
              </button>
              <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                Users
              </button>
              <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                Organisations
              </button>
              <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                Reports
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Leads</CardTitle>
              <p className="text-sm text-muted-foreground">Latest lead entries and their status</p>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading recent leads...</div>
                </div>
              ) : dashboardStats?.recent_leads && dashboardStats.recent_leads.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.recent_leads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </div>
                      <Badge variant={lead.status === 'closed' ? 'default' : 'secondary'}>
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No recent leads found</div>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => handleModuleClick('lead-creation')}
                  >
                    Create your first lead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <SignOutDialog
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
      />

      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
};

export default Index;
