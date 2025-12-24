import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Bell, ChevronDown, LogOut, Calendar, FileText, DollarSign, Info, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useNotifications';
import { getMyNotifications, markAsRead } from '@/api/notificationApi';
import { notification as antNotification } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const TopBar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const { count: unreadCount, refetch: refetchCount } = useUnreadCount();

  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (showNotifications && !loadingNotifs) {
      fetchRecentNotifications();
    }
  }, [showNotifications]);

  // Socket listener for new EMPLOYEE notifications with toast
  useEffect(() => {
    if (socket?.socket) {
      const handleNewNotification = (notification) => {
        console.log('🔔 New notification received:', notification);

        // Update badge count
        refetchCount();

        // Show visual toast notification
        antNotification.open({
          message: notification.title || 'New Notification',
          description: notification.message,
          icon: getNotificationIconElement(notification.type),
          placement: 'topRight',
          duration: 6,
          style: {
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            cursor: 'pointer'
          },
          onClick: () => {
            navigate('/employee/notifications');
          }
        });

        // Play notification sound (optional)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKV1O+XZyYGKoPL6+KNWA0bZrfr5ZdSEA1MoeTvwmwxBjyU1fHEaiwHPZfd8NmELAc8kNXwvGosBziLzvB8SgsZP4rV6rBPCBNKq+vtzl0iCTea1++5YyMGQ5vV8KdPFw0+ktXyt3AzCEea2u/Da0AHNYrT8LFUEAw6lNn0s14qCTqN0u66ViMJRZ/a8sBMFRBDn9vyv1oaCTOL0/C8ZSQJSJvY8stPFQ5Ant3xymAjCTqY2fLOWiAKQZXT8cdTEQo9mdjxzlwcCz6U0vLEaBwHOZTZ87VQFAtDo9vxz2koCDaU2vPMWiQKQ5vd88dWGA9AnNryvGQlCkaY2vK7bRwKOp3c8cxPFxBAnNrxtlwkC0Sa3PC8VSgKPZj…');
          audio.volume = 0.15;
          audio.play().catch(() => { });
        } catch (e) { }
      };

      socket.socket.on('notification:new', handleNewNotification);

      return () => {
        socket.socket.off('notification:new', handleNewNotification);
      };
    }
  }, [socket, refetchCount, navigate]);

  // Socket listener for ADMIN notifications
  useEffect(() => {
    if (socket?.socket && user?.role === 'admin') {
      const handleAdminNotification = (notif) => {
        console.log('👑 Admin notification received:', notif);

        // Show prominent admin toast
        antNotification.warning({
          message: `⚡ ${notif.title}`,
          description: notif.message,
          placement: 'topRight',
          duration: 10,
          style: {
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            cursor: 'pointer'
          },
          onClick: () => {
            // Navigate based on type
            if (notif.type === 'leave') navigate('/admin/leaves');
            else if (notif.type === 'payroll') navigate('/admin/payroll');
            else if (notif.type === 'employee') navigate('/admin/employees');
          }
        });
      };

      socket.socket.on('admin:notification', handleAdminNotification);

      return () => {
        socket.socket.off('admin:notification', handleAdminNotification);
      };
    }
  }, [socket, user, navigate]);

  const fetchRecentNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const response = await getMyNotifications({ limit: 5, sort: '-createdAt' });
      setRecentNotifications(response.data.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
        refetchCount(); // Update badge
        fetchRecentNotifications(); // Refresh list
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    setShowNotifications(false);
  };

  const getNotificationIcon = (type) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'payslip': return <FileText className={iconClass} />;
      case 'leave': return <Calendar className={iconClass} />;
      case 'payment': return <DollarSign className={iconClass} />;
      default: return <Info className={iconClass} />;
    }
  };

  const getNotificationIconElement = (type) => {
    switch (type) {
      case 'payslip': return <FileText style={{ color: '#3b82f6' }} />;
      case 'leave': return <Calendar style={{ color: '#10b981' }} />;
      case 'payment': return <DollarSign style={{ color: '#f59e0b' }} />;
      default: return <Bell style={{ color: '#0ea5e9' }} />;
    }
  };

  return (
    <header className="h-16 bg-white border-b fixed top-0 right-0 left-64 z-10 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Page Title */}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {/* Badge for unread count - LIVE UPDATES */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-20 max-h-[500px] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto flex-1">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-sm">Loading...</p>
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No notifications</p>
                        <p className="text-xs mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <button
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50' : ''
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${!notif.isRead ? 'text-blue-600' : 'text-gray-400'}`}>
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {dayjs(notif.createdAt).fromNow()}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/employee/notifications');
                      }}
                      className="w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      View All Notifications
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

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