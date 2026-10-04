import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import api from '../../../services/api';

const getNotificationLink = (notification) => {
  if (notification?.link) return notification.link;
  if (notification?.data?.link) return notification.data.link;

  const type = String(notification?.type || '').toLowerCase();
  if (type === 'appointment' || type.startsWith('appointment_')) return '/nurse/appointments';
  if (type.startsWith('medicine_')) return '/nurse/medicines';
  if (type.startsWith('student_')) return '/nurse/students';
  if (type.startsWith('consultation_')) return '/nurse/consultation';
  return '/nurse/dashboard';
};

const NurseNotifications = () => {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/notifications');
      if (response.data.success) {
        setUnreadCount(Math.max(0, Number(response.data.unread_count) || 0));
        const data = response.data.data;
        const notifications = Array.isArray(data) ? data : (data?.data || []);
        setNotifs(notifications.map(n => ({
          id: n.id,
          title: n.title || n.type || 'Notification',
          message: n.message || n.text || n.description || '',
          time: formatTimeAgo(n.created_at),
          read: Boolean(n.read),
          type: n.type || 'info',
          data: n.data || {},
          link: getNotificationLink(n),
        })));
      }
    } catch (err) {
      console.error('Notifications error:', err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const syncUnreadCount = async () => {
    try {
      const response = await api.get('/notifications', { params: { limit: 1 } });
      const unreadCount = Number(response.data?.unread_count) || 0;
      setUnreadCount(unreadCount);
      window.dispatchEvent(new CustomEvent('carelink:nurse-notifications-updated', {
        detail: { unreadCount },
      }));
    } catch (err) {
      console.error('Unread notification count refresh failed:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      syncUnreadCount();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) await markAsRead(notification.id);
    navigate(notification.link);
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('carelink:nurse-notifications-updated', {
        detail: { unreadCount: 0 },
      }));
    } catch (err) {
      console.error('Mark all read error:', err);
      setError('Failed to mark notifications as read.');
    }
  };

  const deleteNotification = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const response = await api.delete(`/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
      const unreadCount = Number(response.data?.unread_count);
      if (Number.isFinite(unreadCount)) {
        setUnreadCount(Math.max(0, unreadCount));
        window.dispatchEvent(new CustomEvent('carelink:nurse-notifications-updated', {
          detail: { unreadCount },
        }));
      } else {
        await syncUnreadCount();
      }
    } catch (err) {
      console.error('Delete notification error:', err);
      setError('Failed to delete notification.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-maroon-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1.5 text-xs font-semibold text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 dark:hover:text-maroon-300 bg-maroon-50 dark:bg-maroon-900/20 px-3 py-1.5 rounded-xl transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm text-center">{error}</div>
      )}

      {notifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No Notifications</h3>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 transition hover:shadow-md flex items-start space-x-3 ${
                !n.read
                  ? 'border-l-4 border-l-maroon-800 bg-maroon-50/30 dark:bg-maroon-900/10'
                  : 'border-gray-100 dark:border-gray-700 opacity-75'
              }`}
            >
              <button
                type="button"
                onClick={() => handleNotificationClick(n)}
                className="flex flex-1 min-w-0 items-start space-x-3 text-left"
              >
                <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${n.read ? 'text-gray-400' : 'text-maroon-800 dark:text-maroon-400'}`} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between">
                    <span className={`text-sm ${n.read ? 'font-medium text-gray-500 dark:text-gray-400' : 'font-bold text-gray-900 dark:text-white'}`}>
                      {n.title}
                    </span>
                    {!n.read && <span className="w-2 h-2 bg-maroon-600 rounded-full flex-shrink-0 ml-2" />}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</span>
                  <span className="block text-xs text-gray-400 mt-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />{n.time}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteNotification(n.id)}
                disabled={deletingId === n.id}
                aria-label={`Delete ${n.title}`}
                title="Delete notification"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {deletingId === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseNotifications;
