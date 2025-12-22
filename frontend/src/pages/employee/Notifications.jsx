import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SkeletonCard from '@/components/common/SkeletonCard';
import LottieEmptyState from '@/components/common/LottieEmptyState';
import PageContainer from '@/components/layout/PageContainer';
import NotificationItem from '@/components/domain/NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import { markAsRead, markAllAsRead } from '@/api/notificationApi';
import { message } from 'antd';

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
      window.open(notification.link, '_blank');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      message.success('All notifications marked as read');
      refetch();
    } catch (error) {
      message.error('Failed to mark all as read');
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Your payroll alerts</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" onClick={handleMarkAll}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="border">
        <CardContent className="pt-6">
          {loading ? (
            <div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} style={{ marginBottom: 12 }}>
                  <SkeletonCard rows={2} hasTitle={false} hasAvatar={true} height={16} />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <LottieEmptyState
              title="All Caught Up!"
              description="You have no new notifications. We'll notify you when something important happens."
            />
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
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Notifications;
