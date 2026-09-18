import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Megaphone, Check, Trash2, Calendar, CheckCircle, AlertCircle, Clock, XCircle, Heart, GraduationCap, Siren, Loader2, RefreshCw } from 'lucide-react';
import api from '../../../services/api';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`} />
);

const Alerts = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [notifRes, announceRes] = await Promise.all([
        api.get('/notifications', { headers }),
        api.get('/announcements?limit=20', { headers }),
      ]);

      if (notifRes.data.success) {
        const data = notifRes.data.data;
        const items = Array.isArray(data) ? data : (data?.data || []);
        setNotifications(items.map(n => ({
          id: n.id,
          title: n.title || n.type || 'Notification',
          message: n.message || n.text || n.description || '',
          type: n.type || (n.read ? 'info' : 'warning'),
          date: n.created_at || new Date().toISOString(),
          read: n.read || false,
          link: n.link || null,
          category: n.category || 'general',
        })));
      }

      if (announceRes.data.success) {
        const data = announceRes.data.data;
        const items = Array.isArray(data) ? data : (data?.data || []);
        setAnnouncements(items.map(a => ({
          id: a.id,
          title: a.title || 'Announcement',
          content: a.content || a.description || '',
          category: a.category || 'General',
          date: a.created_at || new Date().toISOString(),
        })));
      }
    } catch (err) {
      console.log('Alerts error:', err);
      setError('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000); // Changed to 60s
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        const token = localStorage.getItem('token');
        await api.patch(`/notifications/${notif.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      } catch (err) {
        console.log('Mark read error:', err);
      }
    }
    if (notif.link) navigate(notif.link);
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.log('Mark read error:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.patch('/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.log('Mark all error:', err);
    }
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const typeIcons = {
    success: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
    info: <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    warning: <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    reminder: <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />,
    appointment: <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />,
  };

  const categoryIcons = {
    'Clinic Advisory': <Heart className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    'Health Advisory': <Heart className="w-4 h-4 text-green-500 flex-shrink-0" />,
    'School Events': <GraduationCap className="w-4 h-4 text-purple-500 flex-shrink-0" />,
    'Emergency': <Siren className="w-4 h-4 text-red-500 flex-shrink-0" />,
    'General': <Megaphone className="w-4 h-4 text-gray-500 flex-shrink-0" />,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ==================== SKELETON LOADING ====================
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-20 mb-1.5" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5 pb-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Alerts</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {tab === 'notifications' 
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` 
              : `${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={fetchAll} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm text-center">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('notifications')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'notifications' ? 'bg-maroon-800 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}>
          <Bell className="w-4 h-4" />
          <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
        </button>
        <button onClick={() => setTab('announcements')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'announcements' ? 'bg-maroon-800 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}>
          <Megaphone className="w-4 h-4" />
          <span>Announcements</span>
        </button>
      </div>

      {/* Rest of the component stays the same */}
      {tab === 'notifications' && (
        <div className="space-y-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="w-full py-2.5 bg-maroon-50 dark:bg-maroon-900/10 text-maroon-700 dark:text-maroon-400 rounded-2xl text-sm font-semibold hover:bg-maroon-100 dark:hover:bg-maroon-900/20 transition flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Mark All as Read
            </button>
          )}

          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left bg-white dark:bg-gray-800 rounded-2xl border p-4 transition hover:shadow-md ${
                  !notif.read 
                    ? 'border-l-4 border-l-maroon-800 bg-maroon-50/30 dark:bg-maroon-900/10' 
                    : 'border-gray-100 dark:border-gray-700'
                }`}>
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {typeIcons[notif.type] || <Bell className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm ${notif.read ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-white'}`}>
                        {notif.title}
                      </h3>
                      {!notif.read && <span className="w-2 h-2 bg-maroon-600 rounded-full flex-shrink-0 ml-2" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(notif.date)}</p>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!notif.read && (
                      <button onClick={(e) => markAsRead(notif.id, e)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-green-500" title="Mark as read">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={(e) => deleteNotif(notif.id, e)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {tab === 'announcements' && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No announcements</p>
            </div>
          ) : (
            announcements.map(ann => (
              <div key={ann.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {categoryIcons[ann.category] || <Megaphone className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{ann.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-3">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">{formatDate(ann.date)}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                        {ann.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default Alerts;