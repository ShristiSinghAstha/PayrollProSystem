import { cn } from '@/lib/utils';
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
          <span className={cn(
            "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
            isRead
              ? "bg-gray-50 text-gray-700 border-gray-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            {isRead ? 'Read' : 'Unread'}
          </span>
          <p className="text-xs text-gray-500">{formatRelativeTime(notification.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
