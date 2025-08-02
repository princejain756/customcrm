import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onNotifications?: () => void;
  onSettings?: () => void;
  onSignOut?: () => void;
  onSearch?: () => void;
  onNewLead?: () => void;
  onNewOrder?: () => void;
  onScanBill?: () => void;
  onSyncTally?: () => void;
  onManageInvoices?: () => void;
}

export const useKeyboardShortcuts = ({
  onNotifications,
  onSettings,
  onSignOut,
  onSearch,
  onNewLead,
  onNewOrder,
  onScanBill,
  onSyncTally,
  onManageInvoices
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            onNotifications?.();
            break;
          case 's':
            event.preventDefault();
            onSettings?.();
            break;
          case 'q':
            event.preventDefault();
            onSignOut?.();
            break;
          case 'f':
            event.preventDefault();
            onSearch?.();
            break;
          case '1':
            event.preventDefault();
            onNewLead?.();
            break;
          case '2':
            event.preventDefault();
            onNewOrder?.();
            break;
          case '3':
            event.preventDefault();
            onScanBill?.();
            break;
          case '4':
            event.preventDefault();
            onSyncTally?.();
            break;
          case '5':
            event.preventDefault();
            onManageInvoices?.();
            break;
        }
      }

      // Function keys
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          onNotifications?.();
          break;
        case 'F2':
          event.preventDefault();
          onSettings?.();
          break;
        case 'F3':
          event.preventDefault();
          onSearch?.();
          break;
        case 'F4':
          event.preventDefault();
          onNewLead?.();
          break;
        case 'F5':
          event.preventDefault();
          onNewOrder?.();
          break;
        case 'F6':
          event.preventDefault();
          onScanBill?.();
          break;
        case 'F7':
          event.preventDefault();
          onSyncTally?.();
          break;
        case 'F8':
          event.preventDefault();
          onManageInvoices?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNotifications, onSettings, onSignOut, onSearch, onNewLead, onNewOrder, onScanBill, onSyncTally, onManageInvoices]);
}; 