import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PageContainer from '@/components/layout/PageContainer';
import NotificationItem from '@/components/domain/NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import { markAsRead, markAllAsRead } from '@/api/notificationApi';
import toast from 'react-hot-toast';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, loading, refetch } = useNotifications();

  const handleClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
      refetch();
    }

    // Navigate based on notification type
    if (notification.type === 'PAYSLIP_READY' || notification.type === 'PAYMENT_SUCCESS') {
      navigate('/employee/payslips');
    } else if (notification.link) {
      // If notification has a custom link, open it
      window.open(notification.link, '_blank');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
      refetch();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Your payroll alerts</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" onClick={handleMarkAll}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You are all caught up." />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={handleClick}
              />
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default Notifications;