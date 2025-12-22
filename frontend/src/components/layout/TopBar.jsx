import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, ChevronDown, LogOut } from 'lucide-react';

const TopBar = ({ title }) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b fixed top-0 right-0 left-64 z-10 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Page Title */}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications Icon */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {/* Badge for unread */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span> */}
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center">
                <span className="font-semibold text-sm">
                  {user?.personalInfo?.firstName?.[0]}
                  {user?.personalInfo?.lastName?.[0]}
                </span>
              </div>
              <span className="text-sm font-medium">{user?.personalInfo?.firstName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {/* Dropdown */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.personalInfo?.email}</p>
                    <p className="text-xs text-gray-600 mt-1 capitalize font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">
                      {user?.role}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;