import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    {
      key: 'k',
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector('[data-global-search]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus global search',
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('[data-global-search]') as HTMLInputElement;
        if (searchInput && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          searchInput.focus();
        }
      },
      description: 'Focus search (when not in input)',
    },
    {
      key: 'h',
      ctrl: true,
      action: () => navigate('/dashboard'),
      description: 'Go to Dashboard',
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      action: () => navigate('/contacts'),
      description: 'Go to Contacts',
    },
    {
      key: 't',
      ctrl: true,
      shift: true,
      action: () => navigate('/tasks'),
      description: 'Go to Tasks',
    },
    {
      key: 'e',
      ctrl: true,
      shift: true,
      action: () => navigate('/calendar'),
      description: 'Go to Calendar',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals by triggering escape event on document
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }
      },
      description: 'Close modal / blur input',
    },
    {
      key: '?',
      shift: true,
      action: () => {
        // Toggle keyboard shortcuts help modal
        const event = new CustomEvent('toggle-shortcuts-help');
        window.dispatchEvent(event);
      },
      description: 'Show keyboard shortcuts',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs (except for specific ones)
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey || shortcut.key === '/';
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      // Special handling for certain shortcuts that should work in inputs
      const allowInInput = shortcut.key === 'Escape' || (shortcut.ctrl && shortcut.key === 'k');

      if (keyMatch && (ctrlMatch || shortcut.ctrl) && shiftMatch) {
        if (isInput && !allowInInput) continue;

        // For ctrl/cmd shortcuts, check the modifier
        if (shortcut.ctrl && !(event.ctrlKey || event.metaKey)) continue;

        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Export shortcuts list for help modal
export const keyboardShortcutsList = [
  { keys: ['Ctrl', 'K'], description: 'Focus global search' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['Ctrl', 'H'], description: 'Go to Dashboard' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Go to Contacts' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Go to Tasks' },
  { keys: ['Ctrl', 'Shift', 'E'], description: 'Go to Calendar' },
  { keys: ['Esc'], description: 'Close modal / blur' },
  { keys: ['Shift', '?'], description: 'Show shortcuts help' },
];
