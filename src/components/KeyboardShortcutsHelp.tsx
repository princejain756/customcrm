import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Keyboard, 
  Bell, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  FileText, 
  Camera, 
  Database, 
  Receipt,
  X
} from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    {
      category: 'Navigation',
      shortcuts: [
        { key: 'Ctrl/Cmd + N', description: 'Open Notifications', icon: Bell },
        { key: 'Ctrl/Cmd + S', description: 'Open Settings', icon: Settings },
        { key: 'Ctrl/Cmd + Q', description: 'Sign Out', icon: LogOut },
        { key: 'Ctrl/Cmd + F', description: 'Focus Search', icon: Search },
      ]
    },
    {
      category: 'Quick Actions',
      shortcuts: [
        { key: 'Ctrl/Cmd + 1', description: 'New Lead', icon: Plus },
        { key: 'Ctrl/Cmd + 2', description: 'New Order', icon: FileText },
        { key: 'Ctrl/Cmd + 3', description: 'Scan Bill', icon: Camera },
        { key: 'Ctrl/Cmd + 4', description: 'Sync Tally', icon: Database },
        { key: 'Ctrl/Cmd + 5', description: 'Manage Invoices', icon: Receipt },
      ]
    },
    {
      category: 'Function Keys',
      shortcuts: [
        { key: 'F1', description: 'Open Notifications', icon: Bell },
        { key: 'F2', description: 'Open Settings', icon: Settings },
        { key: 'F3', description: 'Focus Search', icon: Search },
        { key: 'F4', description: 'New Lead', icon: Plus },
        { key: 'F5', description: 'New Order', icon: FileText },
        { key: 'F6', description: 'Scan Bill', icon: Camera },
        { key: 'F7', description: 'Sync Tally', icon: Database },
        { key: 'F8', description: 'Manage Invoices', icon: Receipt },
      ]
    }
  ];

  const getKeyDisplay = (key: string) => {
    if (key.includes('Ctrl/Cmd')) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? '⌘' : 'Ctrl';
      const actualKey = key.replace('Ctrl/Cmd + ', '');
      return (
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-xs">{modifier}</Badge>
          <span>+</span>
          <Badge variant="outline" className="text-xs">{actualKey}</Badge>
        </div>
      );
    }
    return <Badge variant="outline" className="text-xs">{key}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Keyboard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Use these keyboard shortcuts to navigate and perform actions quickly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                {category.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-gray-100 rounded">
                        <shortcut.icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {shortcut.description}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getKeyDisplay(shortcut.key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Tip: Shortcuts work when not typing in input fields
          </p>
          <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
            <X className="h-4 w-4" />
            <span>Close</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp; 