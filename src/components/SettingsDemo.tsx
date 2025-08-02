import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SettingsDemo: React.FC = () => {
  const { theme, compactMode, showAvatars, autoRefresh, refreshInterval } = useTheme();
  const { settings } = useSettings();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Current Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Theme Settings</h4>
          <div className="space-y-2 text-sm">
            <div>Theme: <Badge variant="outline">{theme}</Badge></div>
            <div>Compact Mode: <Badge variant={compactMode ? "default" : "secondary"}>{compactMode ? "On" : "Off"}</Badge></div>
            <div>Show Avatars: <Badge variant={showAvatars ? "default" : "secondary"}>{showAvatars ? "On" : "Off"}</Badge></div>
            <div>Auto Refresh: <Badge variant={autoRefresh ? "default" : "secondary"}>{autoRefresh ? "On" : "Off"}</Badge></div>
            <div>Refresh Interval: <Badge variant="outline">{refreshInterval}s</Badge></div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Notification Settings</h4>
          <div className="space-y-2 text-sm">
            <div>Email: <Badge variant={settings.notifications.email ? "default" : "secondary"}>{settings.notifications.email ? "On" : "Off"}</Badge></div>
            <div>Push: <Badge variant={settings.notifications.push ? "default" : "secondary"}>{settings.notifications.push ? "On" : "Off"}</Badge></div>
            <div>SMS: <Badge variant={settings.notifications.sms ? "default" : "secondary"}>{settings.notifications.sms ? "On" : "Off"}</Badge></div>
            <div>Sound: <Badge variant={settings.notifications.sound ? "default" : "secondary"}>{settings.notifications.sound ? "On" : "Off"}</Badge></div>
            <div>Desktop: <Badge variant={settings.notifications.desktop ? "default" : "secondary"}>{settings.notifications.desktop ? "On" : "Off"}</Badge></div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Privacy Settings</h4>
          <div className="space-y-2 text-sm">
            <div>Profile Visibility: <Badge variant="outline">{settings.privacy.profileVisibility}</Badge></div>
            <div>Show Online Status: <Badge variant={settings.privacy.showOnlineStatus ? "default" : "secondary"}>{settings.privacy.showOnlineStatus ? "On" : "Off"}</Badge></div>
            <div>Allow Messages: <Badge variant={settings.privacy.allowMessages ? "default" : "secondary"}>{settings.privacy.allowMessages ? "On" : "Off"}</Badge></div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Accessibility Settings</h4>
          <div className="space-y-2 text-sm">
            <div>High Contrast: <Badge variant={settings.accessibility.highContrast ? "default" : "secondary"}>{settings.accessibility.highContrast ? "On" : "Off"}</Badge></div>
            <div>Large Text: <Badge variant={settings.accessibility.largeText ? "default" : "secondary"}>{settings.accessibility.largeText ? "On" : "Off"}</Badge></div>
            <div>Reduce Motion: <Badge variant={settings.accessibility.reduceMotion ? "default" : "secondary"}>{settings.accessibility.reduceMotion ? "On" : "Off"}</Badge></div>
            <div>Screen Reader: <Badge variant={settings.accessibility.screenReader ? "default" : "secondary"}>{settings.accessibility.screenReader ? "On" : "Off"}</Badge></div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Language</h4>
          <div className="text-sm">
            <Badge variant="outline">{settings.language.toUpperCase()}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsDemo; 