import Badge from '@/components/common/Badge';
import { formatRelativeTime } from '@/utils/formatters';

const NotificationItem = ({ notification, onClick }) => {
  const isRead = notification.read;
  const containerClasses = isRead
    ? 'bg-white border-gray-100'
    : 'bg-primary-50 border-primary-100';

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`border rounded-lg p-4 cursor-pointer hover:shadow-sm transition ${containerClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={isRead ? 'default' : 'info'} size="sm">
            {isRead ? 'Read' : 'Unread'}
          </Badge>
          <p className="text-xs text-gray-500">{formatRelativeTime(notification.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
