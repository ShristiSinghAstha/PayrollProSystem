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
  const { notifications, loading, refetch } = useNotifications();

  const handleClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
      refetch();
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    toast.success('All notifications marked as read');
    refetch();
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Your payroll alerts</p>
        </div>
        <Button variant="secondary" onClick={handleMarkAll}>
          Mark all as read
        </Button>
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
