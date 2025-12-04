import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { GlobalSearch } from '../GlobalSearch';

export function Layout() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />
      <main className="lg:ml-72 transition-[margin] duration-300">
        {/* Top Header with Global Search */}
        <header className="sticky top-0 z-30 hidden lg:flex items-center justify-between gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur px-8 py-3">
          <GlobalSearch />
        </header>
        <div className="min-h-screen p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
