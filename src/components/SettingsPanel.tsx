import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Database,
  Globe,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Key,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { autoRefreshService } from '@/lib/auto-refresh-service';
import { notificationService } from '@/lib/notification-service';
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}



const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { settings, updateSettings, updateNotificationSettings, updatePrivacySettings, updateAccessibilitySettings } = useSettings();
  const { theme, setTheme, compactMode, setCompactMode, showAvatars, setShowAvatars, autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval } = useTheme();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    organisation: '',
    role: 'sales_person'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd call the API to update profile
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, you'd call the API to change password
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully',
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    setIsLoading(true);
    try {
      // Settings are automatically saved via the context
      toast({
        title: t('settings.saved'),
        description: t('settings.savedDescription'),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: t('settings.saveError'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return "bg-red-100 text-red-800";
      case 'organisation_admin': return "bg-purple-100 text-purple-800";
      case 'manager': return "bg-blue-100 text-blue-800";
      case 'sales_person': return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-lg border border-gray-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('settings.title')}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-64 border-r border-gray-200 p-4">
                <TabsList className="flex flex-col h-auto w-full space-y-1">
                  <TabsTrigger value="profile" className="justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="justify-start">
                    <Palette className="h-4 w-4 mr-2" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy & Security
                  </TabsTrigger>
                  <TabsTrigger value="accessibility" className="justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    Accessibility
                  </TabsTrigger>
                                     <TabsTrigger value="advanced" className="justify-start">
                     <Database className="h-4 w-4 mr-2" />
                     Advanced
                   </TabsTrigger>
                   <TabsTrigger value="shortcuts" className="justify-start">
                     <Key className="h-4 w-4 mr-2" />
                     Shortcuts
                   </TabsTrigger>
                 </TabsList>
               </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>Profile Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              value={profileData.name}
                              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={profileData.email}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Role</Label>
                            <div className="flex items-center space-x-2">
                              <Badge className={getRoleColor(profileData.role)}>
                                {profileData.role.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            placeholder="Enter your address"
                          />
                        </div>
                        <Button onClick={handleProfileUpdate} disabled={isLoading}>
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Key className="h-5 w-5" />
                          <span>Change Password</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                placeholder="Enter current password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              placeholder="Enter new password"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                          />
                        </div>
                        <Button onClick={handlePasswordChange} disabled={isLoading}>
                          {isLoading ? 'Changing...' : 'Change Password'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Bell className="h-5 w-5" />
                        <span>Notification Preferences</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-gray-500">Receive notifications via email</p>
                          </div>
                          <Switch
                            checked={settings.notifications.email}
                            onCheckedChange={(checked) => {
                              updateNotificationSettings({ email: checked });
                              notificationService.updateSettings({ email: checked });
                            }}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                          </div>
                          <Switch
                            checked={settings.notifications.push}
                            onCheckedChange={(checked) => {
                              updateNotificationSettings({ push: checked });
                              notificationService.updateSettings({ push: checked });
                            }}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>SMS Notifications</Label>
                            <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                          </div>
                          <Switch
                            checked={settings.notifications.sms}
                            onCheckedChange={(checked) => {
                              updateNotificationSettings({ sms: checked });
                              notificationService.updateSettings({ sms: checked });
                            }}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Sound Notifications</Label>
                            <p className="text-sm text-gray-500">Play sound for notifications</p>
                          </div>
                          <Switch
                            checked={settings.notifications.sound}
                            onCheckedChange={(checked) => {
                              updateNotificationSettings({ sound: checked });
                              notificationService.updateSettings({ sound: checked });
                            }}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Desktop Notifications</Label>
                            <p className="text-sm text-gray-500">Show desktop notifications</p>
                          </div>
                          <Switch
                            checked={settings.notifications.desktop}
                            onCheckedChange={(checked) => {
                              updateNotificationSettings({ desktop: checked });
                              notificationService.updateSettings({ desktop: checked });
                            }}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Test Notifications</Label>
                            <p className="text-sm text-gray-500">Send a test notification to verify settings</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              notificationService.showNotification(
                                'Test Notification',
                                'This is a test notification to verify your settings are working correctly.',
                                'info'
                              );
                            }}
                          >
                            Send Test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Palette className="h-5 w-5" />
                        <span>{t('settings.appearance.title')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Theme</Label>
                          <Select
                            value={theme}
                            onValueChange={(value: 'light' | 'dark' | 'system') => 
                              setTheme(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">
                                <div className="flex items-center space-x-2">
                                  <Sun className="h-4 w-4" />
                                  <span>Light</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center space-x-2">
                                  <Moon className="h-4 w-4" />
                                  <span>Dark</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center space-x-2">
                                  <Monitor className="h-4 w-4" />
                                  <span>System</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Compact Mode</Label>
                            <p className="text-sm text-gray-500">Use compact layout</p>
                          </div>
                          <Switch
                            checked={compactMode}
                            onCheckedChange={(checked) => setCompactMode(checked)}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Avatars</Label>
                            <p className="text-sm text-gray-500">Display user avatars</p>
                          </div>
                          <Switch
                            checked={showAvatars}
                            onCheckedChange={(checked) => setShowAvatars(checked)}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto Refresh</Label>
                            <p className="text-sm text-gray-500">Automatically refresh data</p>
                          </div>
                          <Switch
                            checked={autoRefresh}
                            onCheckedChange={(checked) => {
                              setAutoRefresh(checked);
                              if (checked) {
                                autoRefreshService.enable();
                              } else {
                                autoRefreshService.disable();
                              }
                            }}
                          />
                        </div>
                        <Separator />
                        <div>
                          <Label>Refresh Interval (seconds)</Label>
                          <Input
                            type="number"
                            value={refreshInterval}
                            onChange={(e) => {
                              const newInterval = parseInt(e.target.value) || 30;
                              setRefreshInterval(newInterval);
                              autoRefreshService.setInterval(newInterval);
                            }}
                            min="10"
                            max="300"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Privacy & Security</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Profile Visibility</Label>
                          <Select
                            value={settings.privacy.profileVisibility}
                            onValueChange={(value: 'public' | 'private' | 'team') => 
                              updatePrivacySettings({ profileVisibility: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="team">Team Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Online Status</Label>
                            <p className="text-sm text-gray-500">Let others see when you're online</p>
                          </div>
                          <Switch
                            checked={settings.privacy.showOnlineStatus}
                            onCheckedChange={(checked) => updatePrivacySettings({ showOnlineStatus: checked })}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Allow Messages</Label>
                            <p className="text-sm text-gray-500">Allow others to send you messages</p>
                          </div>
                          <Switch
                            checked={settings.privacy.allowMessages}
                            onCheckedChange={(checked) => updatePrivacySettings({ allowMessages: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Accessibility Tab */}
                <TabsContent value="accessibility" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5" />
                        <span>Accessibility</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>High Contrast</Label>
                            <p className="text-sm text-gray-500">Use high contrast colors</p>
                          </div>
                          <Switch
                            checked={settings.accessibility.highContrast}
                            onCheckedChange={(checked) => updateAccessibilitySettings({ highContrast: checked })}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Large Text</Label>
                            <p className="text-sm text-gray-500">Use larger text size</p>
                          </div>
                          <Switch
                            checked={settings.accessibility.largeText}
                            onCheckedChange={(checked) => updateAccessibilitySettings({ largeText: checked })}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Reduce Motion</Label>
                            <p className="text-sm text-gray-500">Reduce animations and motion</p>
                          </div>
                          <Switch
                            checked={settings.accessibility.reduceMotion}
                            onCheckedChange={(checked) => updateAccessibilitySettings({ reduceMotion: checked })}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Screen Reader Support</Label>
                            <p className="text-sm text-gray-500">Enable screen reader optimizations</p>
                          </div>
                          <Switch
                            checked={settings.accessibility.screenReader}
                            onCheckedChange={(checked) => updateAccessibilitySettings({ screenReader: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5" />
                        <span>{t('settings.advanced.title')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                                <div>
          <Label>{t('settings.language.title')}</Label>
          <Select
            value={currentLanguage}
            onValueChange={(value: 'en' | 'hi' | 'ta' | 'te') =>
              changeLanguage(value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="ta">Tamil</SelectItem>
              <SelectItem value="te">Telugu</SelectItem>
            </SelectContent>
          </Select>
        </div>

                      </div>
                                         </CardContent>
                   </Card>
                 </TabsContent>

                 {/* Shortcuts Tab */}
                 <TabsContent value="shortcuts" className="space-y-6">
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center space-x-2">
                         <Key className="h-5 w-5" />
                         <span>Keyboard Shortcuts</span>
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div className="space-y-4">
                         <p className="text-sm text-gray-600">
                           Use keyboard shortcuts to navigate and perform actions quickly. 
                           Click the button below to view all available shortcuts.
                         </p>
                         <Button 
                           onClick={() => setShowKeyboardHelp(true)}
                           className="flex items-center space-x-2"
                         >
                           <Key className="h-4 w-4" />
                           <span>View All Shortcuts</span>
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>
               </div>
             </div>
           </Tabs>
         </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Changes will be applied immediately
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSettingsSave} disabled={isLoading}>
                {isLoading ? t('settings.saving') : t('settings.save')}
              </Button>
            </div>
          </div>
                 </div>
       </div>

       {/* Keyboard Shortcuts Help */}
       <KeyboardShortcutsHelp
         isOpen={showKeyboardHelp}
         onClose={() => setShowKeyboardHelp(false)}
       />
     </div>
   );
 };

export default SettingsPanel; 