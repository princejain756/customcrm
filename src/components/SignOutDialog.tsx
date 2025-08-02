import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, 
  AlertTriangle, 
  Shield, 
  Trash2, 
  Clock,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SignOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignOutDialog: React.FC<SignOutDialogProps> = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [clearData, setClearData] = useState(false);
  const [clearNotifications, setClearNotifications] = useState(false);
  const [clearSettings, setClearSettings] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      // Clear selected data based on user choices
      if (clearData) {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      if (clearNotifications) {
        localStorage.removeItem('notifications');
      }
      
      if (clearSettings) {
        localStorage.removeItem('userSettings');
      }

      // Perform sign out
      await logout();
      
      toast({
        title: 'Signed Out Successfully',
        description: 'You have been signed out and your session has been cleared.',
      });

      onClose();
    } catch (error) {
      console.error('Error during sign out:', error);
      toast({
        title: 'Sign Out Error',
        description: 'There was an error during sign out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form state
    setClearData(false);
    setClearNotifications(false);
    setClearSettings(false);
    onClose();
  };

  const getSessionInfo = () => {
    const loginTime = localStorage.getItem('login_time');
    const sessionDuration = loginTime 
      ? Math.floor((Date.now() - parseInt(loginTime)) / 1000 / 60) 
      : 0;
    
    return {
      loginTime: loginTime ? new Date(parseInt(loginTime)).toLocaleString() : 'Unknown',
      duration: sessionDuration,
      userAgent: navigator.userAgent,
      lastActivity: new Date().toLocaleString()
    };
  };

  const sessionInfo = getSessionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-full">
              <LogOut className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Sign Out</DialogTitle>
              <DialogDescription>
                Are you sure you want to sign out of your account?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {user?.name || 'User'}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.email || 'No email'}
                </p>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Session Information</span>
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Login Time: {sessionInfo.loginTime}</p>
              <p>Session Duration: {sessionInfo.duration} minutes</p>
              <p>Last Activity: {sessionInfo.lastActivity}</p>
            </div>
          </div>

          <Separator />

          {/* Cleanup Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Cleanup Options</span>
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clear-notifications"
                  checked={clearNotifications}
                  onCheckedChange={(checked) => setClearNotifications(checked as boolean)}
                />
                <Label htmlFor="clear-notifications" className="text-sm">
                  Clear all notifications
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clear-settings"
                  checked={clearSettings}
                  onCheckedChange={(checked) => setClearSettings(checked as boolean)}
                />
                <Label htmlFor="clear-settings" className="text-sm">
                  Clear user settings and preferences
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clear-all-data"
                  checked={clearData}
                  onCheckedChange={(checked) => setClearData(checked as boolean)}
                />
                <Label htmlFor="clear-all-data" className="text-sm text-red-600">
                  Clear all local data (this cannot be undone)
                </Label>
              </div>
            </div>
          </div>

          {/* Warning */}
          {clearData && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Warning</p>
                  <p className="text-red-700">
                    Clearing all data will remove all local storage including settings, 
                    notifications, and cached data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignOutDialog; 