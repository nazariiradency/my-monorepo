import { Link, Outlet } from '@tanstack/react-router';
import { CheckSquare, Menu } from 'lucide-react';
import { useAppStore } from '@/shared/stores';
import { Button } from '@/shared/ui';

function ProtectedLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200',
          'md:static md:translate-x-0 md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-200">
          <CheckSquare className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-zinc-900">Dashboard</span>
        </div>
        <nav className="flex-1 px-3 py-4">
          <Link
            to="/todo"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            onClick={() => {
              if (window.innerWidth < 768) toggleSidebar();
            }}
          >
            <CheckSquare className="h-4 w-4" />
            Todos
          </Link>
        </nav>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center px-4 gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-zinc-700">Dashboard</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { ProtectedLayout };
