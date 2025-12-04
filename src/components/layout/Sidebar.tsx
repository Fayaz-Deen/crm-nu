import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Share2,
  FileText,
  CheckSquare,
  Video,
  Tag,
  FolderOpen,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: Video, label: 'Calendar' },
  { to: '/meetings', icon: Calendar, label: 'Meetings' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/tags', icon: Tag, label: 'Tags' },
  { to: '/groups', icon: FolderOpen, label: 'Groups' },
  { to: '/shared', icon: Share2, label: 'Shared' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--card))] shadow-medium lg:hidden transition-transform hover:scale-105 active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-[hsl(var(--card))] shadow-strong transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-[hsl(var(--border))] px-6">
            <img src="/logo.gif" alt="Nu-Connect" className="h-11 w-11 rounded-xl object-contain" />
            <div>
              <span className="text-lg font-bold">Nu-Connect</span>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Manage your network</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navItems.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-md'
                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                    }`
                  }
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Theme toggle */}
          <div className="border-t border-[hsl(var(--border))] p-4">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
            >
              <div className="relative h-5 w-5">
                <Sun className={`absolute inset-0 h-5 w-5 transition-all ${resolvedTheme === 'dark' ? 'scale-0 rotate-90' : 'scale-100 rotate-0'}`} />
                <Moon className={`absolute inset-0 h-5 w-5 transition-all ${resolvedTheme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`} />
              </div>
              <span>{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>

          {/* User section */}
          <div className="border-t border-[hsl(var(--border))] p-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--accent))] p-3">
              <Avatar src={user?.profilePicture} name={user?.name || 'User'} size="md" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {user?.email || 'No email'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 transition-all hover:bg-[hsl(var(--destructive))]/20 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
