import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Calendar,
  BarChart3,
  FileText,
  Bell,
  User,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Payroll', path: '/admin/payroll', icon: Wallet },
    { name: 'Leaves', path: '/admin/leaves', icon: Calendar },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const employeeLinks = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Payslips', path: '/employee/payslips', icon: FileText },
    { name: 'My Leaves', path: '/employee/leaves', icon: Calendar },
    { name: 'Notifications', path: '/employee/notifications', icon: Bell },
    { name: 'Profile', path: '/employee/profile', icon: User },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <aside className="w-64 bg-card border-r min-h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b">
        <h1 className="text-2xl font-bold text-foreground">PayrollPro</h1>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      {/* <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <span className="text-muted-foreground font-semibold text-sm">
              {user?.personalInfo?.firstName?.[0]}
              {user?.personalInfo?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.personalInfo?.email}
            </p>
          </div>
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;