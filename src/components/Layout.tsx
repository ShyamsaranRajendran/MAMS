import React, { useState } from 'react';
import { 
  Shield, 
  Menu, 
  X, 
  Home, 
  Package, 
  ShoppingCart, 
  ArrowLeftRight, 
  Users, 
  FileText,
  Building,
  LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const currentPage = window.location.pathname.slice(1) || 'dashboard';

  const handlePageChange = (page: string) => {
    window.history.pushState({}, '', `/${page}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setSidebarOpen(false);
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, roles: ['Admin', 'Base Commander', 'Logistics Officer'] },
    { id: 'assets', name: 'Assets', icon: Package, roles: ['Admin', 'Base Commander', 'Logistics Officer'] },
    { id: 'purchases', name: 'Purchases', icon: ShoppingCart, roles: ['Admin', 'Logistics Officer'] },
    { id: 'transfers', name: 'Transfers', icon: ArrowLeftRight, roles: ['Admin', 'Base Commander'] },
    { id: 'assignments', name: 'Assignments', icon: Users, roles: ['Admin', 'Base Commander'] },
    { id: 'bases', name: 'Bases', icon: Building, roles: ['Admin'] },
    { id: 'audit', name: 'Audit Logs', icon: FileText, roles: ['Admin', 'Base Commander'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-blue-900 text-white transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 bg-blue-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8" />
            <span className="text-xl font-bold tracking-wide">MAMS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-blue-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-blue-700">
          <div className="text-white font-semibold">{user?.username}</div>
          <div className="text-sm text-blue-200">{user?.role}</div>
          {user?.base && <div className="text-sm text-blue-300">{user.base.name}</div>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`
                  group flex items-center px-3 py-2 rounded-md w-full text-left transition-colors
                  ${isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'}
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-5 py-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 rounded-md text-blue-100 hover:bg-blue-800 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
<div className="flex-1 flex flex-col overflow-auto">
  {/* Top Bar */}
  <header className="w-full h-16 bg-white shadow flex items-center justify-between px-6 border-b border-gray-200">
    <button
      onClick={() => setSidebarOpen(true)}
      className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
    >
      <Menu className="h-6 w-6" />
    </button>

    <h1 className="text-xl font-semibold text-gray-900 capitalize">
      {currentPage === 'dashboard' ? 'Command Center' : currentPage}
    </h1>

    <div className="text-sm text-gray-600">
      {new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </div>
  </header>

  {/* Page Content */}
  <main className="flex-1 p-6 bg-gray-50">
    {children}
  </main>
</div>

    </div>
  );
};

export default Layout;
